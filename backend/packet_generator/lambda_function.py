import base64
import os
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

from commonmass_backend import (
    PROFILE_LABELS,
    build_response,
    detect_bucket_region,
    friendly_profile_value,
    get_authoritative_matches,
    get_http_method,
    load_catalog,
    parse_json_payload,
    sanitize_profile,
    sanitize_selected_benefits,
    secret_is_valid,
    validate_json_request,
)

PACKETS_BUCKET = os.environ.get("PACKETS_BUCKET", "")
PACKETS_PREFIX = os.environ.get("PACKETS_PREFIX", "packets/")
URL_EXPIRES_SECONDS = int(os.environ.get("URL_EXPIRES_SECONDS", "300"))
PACKETS_KMS_KEY_ID = os.environ.get("PACKETS_KMS_KEY_ID", "").strip()
PDF_CONTENT_DISPOSITION = os.environ.get("PDF_CONTENT_DISPOSITION", "attachment").strip().lower()
MAX_BODY_BYTES = int(os.environ.get("MAX_BODY_BYTES", "65536"))

RULES_BUCKET = os.environ.get("RULES_BUCKET", "")
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json")

REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret")
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "")

ENABLE_PACKET_LOGO = os.environ.get("ENABLE_PACKET_LOGO", "false").lower() == "true"


def _resolve_logo_path() -> Path | None:
    if not ENABLE_PACKET_LOGO:
        return None

    candidates = [
        Path(__file__).with_name("Common.png"),
        Path(__file__).resolve().parents[2] / "src" / "assets" / "Common.png",
        Path(__file__).with_name("CommonDark.png"),
    ]

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return None


LOGO_PATH = _resolve_logo_path()


def _wrap_text(c, text: str, max_width: float, font_name="Helvetica", font_size=11) -> list[str]:
    c.setFont(font_name, font_size)

    words = (text or "").split()
    if not words:
        return []

    lines = []
    current = ""

    for word in words:
        test_line = (current + " " + word).strip()
        if c.stringWidth(test_line, font_name, font_size) <= max_width:
            current = test_line
        else:
            if current:
                lines.append(current)
            current = word

    if current:
        lines.append(current)

    return lines


def _new_page(c):
    c.showPage()


def _ensure_space(c, y, height, needed=50):
    if y < 0.9 * inch + needed:
        _new_page(c)
        _draw_header_band(c, letter[0], letter[1])
        return height - 1.15 * inch
    return y


def _draw_header_band(c, width, height):
    c.setFillColor(colors.HexColor("#1e3a5f"))
    c.rect(0, height - 0.85 * inch, width, 0.85 * inch, stroke=0, fill=1)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(0.75 * inch, height - 0.51 * inch, "CommonMASS Application Preparation Packet")

    if LOGO_PATH is not None:
        try:
            from reportlab.lib.utils import ImageReader

            logo = ImageReader(str(LOGO_PATH))
            image_width, image_height = logo.getSize()
            logo_height = 0.30 * inch
            logo_width = logo_height * (image_width / image_height)
            c.drawImage(
                logo,
                width - 0.75 * inch - logo_width,
                height - 0.68 * inch,
                width=logo_width,
                height=logo_height,
                mask="auto",
                preserveAspectRatio=True,
            )
        except Exception:
            pass

    c.setFillColor(colors.black)


def _draw_section_title(c, x, y, text):
    c.setFillColor(colors.HexColor("#1e3a5f"))
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x, y, text)
    c.setStrokeColor(colors.HexColor("#d9e2ec"))
    c.setLineWidth(1)
    c.line(x, y - 4, 7.75 * inch, y - 4)
    c.setFillColor(colors.black)
    return y - 18


def _draw_small_meta(c, x, y, left_text, right_text=None):
    c.setFont("Helvetica", 9)
    c.setFillColor(colors.HexColor("#4b5563"))
    c.drawString(x, y, left_text)

    if right_text:
        c.drawRightString(7.75 * inch, y, right_text)

    c.setFillColor(colors.black)
    return y - 12


def _draw_bullet_text(c, x, y, label, value, max_label_width=220):
    c.setFont("Helvetica-Bold", 10)
    label_text = f"{label}:"
    c.drawString(x, y, label_text)

    label_width = c.stringWidth(label_text, "Helvetica-Bold", 10)
    value_x = x + max(max_label_width, label_width + 12)

    c.setFont("Helvetica", 10)
    wrapped = _wrap_text(c, value, 7.75 * inch - value_x, font_size=10)

    if not wrapped:
        return y - 15

    c.drawString(value_x, y, wrapped[0])
    line_y = y - 12
    for line in wrapped[1:]:
        c.drawString(value_x, line_y, line)
        line_y -= 12

    return line_y - 3


def _draw_status_pill(c, x, y, text, good=False):
    pad_x = 6
    pill_height = 14

    c.setFont("Helvetica", 8)
    text_width = c.stringWidth(text, "Helvetica", 8)
    pill_width = text_width + (pad_x * 2)

    if good:
        fill = colors.HexColor("#dcfce7")
        stroke = colors.HexColor("#86efac")
        text_color = colors.HexColor("#166534")
    else:
        fill = colors.HexColor("#dbeafe")
        stroke = colors.HexColor("#93c5fd")
        text_color = colors.HexColor("#1d4ed8")

    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(x, y - 10, pill_width, pill_height, 4, stroke=1, fill=1)

    c.setFillColor(text_color)
    c.drawString(x + pad_x, y - 6, text)

    c.setFillColor(colors.black)
    c.setStrokeColor(colors.black)


def _draw_checkbox(c, x, y, checked: bool):
    size = 10

    if checked:
        c.setFillColor(colors.HexColor("#1e3a5f"))
        c.setStrokeColor(colors.HexColor("#1e3a5f"))
        c.rect(x, y - size, size, size, stroke=1, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 2, y - 8, "X")
        c.setFillColor(colors.black)
    else:
        c.setStrokeColor(colors.HexColor("#6b7280"))
        c.rect(x, y - size, size, size, stroke=1, fill=0)

    c.setStrokeColor(colors.black)


def _normalize_checklist_progress(checklist_progress: dict, matches: list[dict]) -> dict[str, list[bool]]:
    normalized = {}
    incoming = checklist_progress if isinstance(checklist_progress, dict) else {}

    for match in matches:
        benefit_id = match["id"]
        checklist = match.get("checklist") or []
        raw_progress = incoming.get(benefit_id, [])

        if not isinstance(raw_progress, list):
            raw_progress = []

        normalized[benefit_id] = [
            bool(raw_progress[index]) if index < len(raw_progress) else False
            for index in range(len(checklist))
        ]

    return normalized


def _get_ordered_checklist_items(checklist: list[str], progress: list[bool]) -> list[tuple[str, bool]]:
    ordered_items = [
        {
            "item": item,
            "checked": progress[index] if index < len(progress) else False,
            "original_index": index,
        }
        for index, item in enumerate(checklist)
    ]

    ordered_items.sort(key=lambda item: (bool(item["checked"]), item["original_index"]))
    return [(item["item"], bool(item["checked"])) for item in ordered_items]


def _build_accessible_packet_data(
    run_id: str,
    profile: dict,
    matches: list[dict],
    checklist_progress: dict[str, list[bool]],
) -> dict:
    ordered_keys = [
        "student_status",
        "citizen_status",
        "school_name",
        "residency_length",
        "fafsa_completed",
        "masfa_completed",
        "masfa_high_school_completer",
        "masfa_documentation_ready",
        "dhe_affidavit_completed",
        "work_study",
        "household_sizes",
        "household_size_exact",
        "masshealth_income_under_limit",
        "snap_income_under_limit",
        "massgrant_plus_income_band",
        "prior_bachelors_degree",
    ]

    profile_summary = []
    for key in ordered_keys:
        if key in profile:
            profile_summary.append(
                {
                    "key": key,
                    "label": PROFILE_LABELS.get(key, key),
                    "value": friendly_profile_value(key, profile.get(key)),
                }
            )

    checklist_sections = []
    for match in matches:
        checklist = match.get("checklist") or []
        progress = checklist_progress.get(match["id"], [False] * len(checklist))
        ordered_items = _get_ordered_checklist_items(checklist, progress)
        checklist_sections.append(
            {
                "id": match["id"],
                "title": match.get("title", match["id"]),
                "completedCount": sum(1 for item in progress if item),
                "totalCount": len(checklist),
                "items": [
                    {"text": item_text, "checked": checked}
                    for item_text, checked in ordered_items
                ],
            }
        )

    matched_benefits = []
    for match in matches:
        matched_benefits.append(
            {
                "id": match["id"],
                "title": match.get("title", match["id"]),
                "description": match.get("description", ""),
                "actionStatuses": match.get("actionStatuses") or [],
                "officialUrl": match.get("officialUrl", ""),
                "officialButtonLabel": match.get("officialButtonLabel", ""),
            }
        )

    return {
        "runId": run_id,
        "generatedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "profileSummary": profile_summary,
        "matchedBenefits": matched_benefits,
        "checklists": checklist_sections,
    }


def _build_pdf_bytes(
    run_id: str,
    profile: dict,
    matches: list[dict],
    checklist_progress: dict[str, list[bool]],
) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    c.setTitle("CommonMASS Application Preparation Packet")
    c.setAuthor("CommonMASS")
    c.setSubject("Application preparation checklist packet")
    c.setCreator("CommonMASS packet generator")
    c.setKeywords("CommonMASS, benefits, checklist, Massachusetts")

    margin_x = 0.75 * inch

    _draw_header_band(c, width, height)
    y = height - 1.15 * inch

    y = _draw_small_meta(
        c,
        margin_x,
        y,
        f"Run ID: {run_id}",
        f"UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}",
    )

    y -= 8
    y = _draw_section_title(c, margin_x, y, "Profile Summary")

    ordered_keys = [
        "student_status",
        "citizen_status",
        "school_name",
        "residency_length",
        "fafsa_completed",
        "masfa_completed",
        "masfa_high_school_completer",
        "masfa_documentation_ready",
        "dhe_affidavit_completed",
        "work_study",
        "household_sizes",
        "household_size_exact",
        "masshealth_income_under_limit",
        "snap_income_under_limit",
        "massgrant_plus_income_band",
        "prior_bachelors_degree",
    ]

    for key in ordered_keys:
        if key in profile:
            y = _ensure_space(c, y, height, 32)
            label = PROFILE_LABELS.get(key, key)
            value = friendly_profile_value(key, profile.get(key))
            y = _draw_bullet_text(c, margin_x, y, label, value)

    y -= 14
    y = _draw_section_title(c, margin_x, y, "Matched Benefits")

    if not matches:
        c.setFont("Helvetica", 10)
        c.drawString(margin_x, y, "No matched benefits based on the submitted profile.")
        y -= 14
    else:
        for match in matches:
            title = match.get("title", match["id"])
            description = match.get("description", "")
            action_statuses = match.get("actionStatuses") or []
            primary_action = action_statuses[0] if action_statuses else ""

            y = _ensure_space(c, y, height, 96)

            c.setFont("Helvetica-Bold", 11)
            c.setFillColor(colors.HexColor("#111827"))
            c.drawString(margin_x, y, title)

            if primary_action:
                pill_x = margin_x + 170
                max_pill_width = width - margin_x - pill_x
                shortened_action = primary_action

                if c.stringWidth(shortened_action, "Helvetica", 8) + 12 > max_pill_width:
                    words = shortened_action.split()
                    truncated = ""

                    for word in words:
                        candidate = (truncated + " " + word).strip()
                        if c.stringWidth(candidate + "...", "Helvetica", 8) + 12 <= max_pill_width:
                            truncated = candidate
                        else:
                            break

                    if truncated and truncated != shortened_action:
                        shortened_action = truncated + "..."

                _draw_status_pill(
                    c,
                    pill_x,
                    y + 7,
                    shortened_action,
                    good=("No action needed" in primary_action or "Already Completed" in primary_action),
                )

            y -= 17

            c.setFont("Helvetica", 10)
            c.setFillColor(colors.HexColor("#374151"))
            wrapped_description = _wrap_text(c, description, width - 2 * margin_x - 12, font_size=10)
            for line in wrapped_description:
                c.drawString(margin_x + 12, y, line)
                y -= 13

            for extra_status in action_statuses[1:]:
                y = _ensure_space(c, y, height, 20)
                c.setFont("Helvetica-Oblique", 9)
                c.setFillColor(colors.HexColor("#4b5563"))
                c.drawString(margin_x + 12, y, f"- {extra_status}")
                y -= 12

            y -= 10

    _new_page(c)
    _draw_header_band(c, width, height)
    y = height - 1.15 * inch
    y = _draw_section_title(c, margin_x, y, "Application Checklists")

    if not matches:
        c.setFont("Helvetica", 10)
        c.drawString(margin_x, y, "No checklist items available.")
    else:
        for match in matches:
            benefit_id = match["id"]
            title = match.get("title", benefit_id)
            checklist = match.get("checklist") or []
            progress = checklist_progress.get(benefit_id, [False] * len(checklist))

            if not checklist:
                continue

            completed = sum(1 for item in progress if item)
            total = len(checklist)

            y = _ensure_space(c, y, height, 80)

            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(colors.HexColor("#111827"))
            c.drawString(margin_x, y, title)
            _draw_status_pill(
                c,
                margin_x + 220,
                y + 2,
                f"{completed}/{total} complete",
                good=(completed == total),
            )
            y -= 20

            for step, checked in _get_ordered_checklist_items(checklist, progress):
                wrapped = _wrap_text(c, step, width - 2 * margin_x - 24, font_size=10)
                needed_height = max(18, len(wrapped) * 12) + 8
                y = _ensure_space(c, y, height, needed_height + 18)

                _draw_checkbox(c, margin_x, y, checked)

                text_y = y - 8
                c.setFillColor(colors.HexColor("#6b7280") if checked else colors.HexColor("#111827"))
                c.setFont("Helvetica", 10)

                for line in wrapped:
                    c.drawString(margin_x + 18, text_y, line)
                    text_y -= 12

                y = text_y - 5

            y -= 14

    c.save()
    return buffer.getvalue()


def lambda_handler(event, context):
    method = get_http_method(event or {})

    if method == "OPTIONS":
        return build_response(200, "", event=event, content_type="text/plain; charset=utf-8")

    if method != "POST":
        return build_response(405, {"error": "Method not allowed"}, event=event)

    content_error = validate_json_request(event or {})
    if content_error:
        return build_response(415, {"error": content_error}, event=event)

    if REQUIRE_SHARED_SECRET:
        if not SHARED_SECRET_VALUE:
            return build_response(500, {"error": "Server configuration error"}, event=event)

        if not secret_is_valid(event or {}, SHARED_SECRET_HEADER, SHARED_SECRET_VALUE):
            return build_response(403, {"error": "Forbidden"}, event=event)

    try:
        payload = parse_json_payload(event, MAX_BODY_BYTES)
    except ValueError as error:
        message = str(error)
        status_code = 413 if "too large" in message.lower() else 400
        return build_response(status_code, {"error": message}, event=event)

    profile = payload.get("profile") or {}
    selected = payload.get("selectedBenefits") or payload.get("selected_benefits") or []
    checklist_progress = payload.get("checklistProgress") or payload.get("checklist_progress") or {}

    if not isinstance(profile, dict):
        return build_response(400, {"error": "profile must be an object"}, event=event)

    if selected is not None and not isinstance(selected, list):
        return build_response(400, {"error": "selectedBenefits must be a list if provided"}, event=event)

    if checklist_progress is not None and not isinstance(checklist_progress, dict):
        return build_response(400, {"error": "checklistProgress must be an object if provided"}, event=event)

    safe_profile = sanitize_profile(profile)

    region_source_bucket = PACKETS_BUCKET or RULES_BUCKET
    region = detect_bucket_region(region_source_bucket)

    s3 = None
    if PACKETS_BUCKET or RULES_BUCKET:
        s3 = boto3.client(
            "s3",
            region_name=region,
            config=Config(
                signature_version="s3v4",
                connect_timeout=5,
                read_timeout=10,
                retries={"max_attempts": 2},
            ),
        )

    catalog = load_catalog(s3, RULES_BUCKET, BENEFITS_CATALOG_KEY)
    safe_selected = sanitize_selected_benefits(selected, catalog)

    matches = get_authoritative_matches(
        profile=safe_profile,
        catalog=catalog,
        selected_benefit_ids=safe_selected,
    )

    normalized_progress = _normalize_checklist_progress(checklist_progress, matches)

    run_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    key = f"{PACKETS_PREFIX}{timestamp}-{run_id}.pdf"

    pdf_bytes = _build_pdf_bytes(
        run_id=run_id,
        profile=safe_profile,
        matches=matches,
        checklist_progress=normalized_progress,
    )

    packet_data = _build_accessible_packet_data(
        run_id=run_id,
        profile=safe_profile,
        matches=matches,
        checklist_progress=normalized_progress,
    )

    extra_headers = {}
    if context and getattr(context, "aws_request_id", None):
        extra_headers["X-Request-Id"] = context.aws_request_id

    if not PACKETS_BUCKET:
        return build_response(
            200,
            {
                "run_id": run_id,
                "expires_in": URL_EXPIRES_SECONDS,
                "bucket_region_used": region,
                "matched_benefits": matches,
                "filename": "CommonMASS-Packet.pdf",
                "packet_data": packet_data,
                "pdf_base64": base64.b64encode(pdf_bytes).decode("ascii"),
            },
            event=event,
            extra_headers=extra_headers,
        )

    put_object_kwargs = {
        "Bucket": PACKETS_BUCKET,
        "Key": key,
        "Body": pdf_bytes,
        "ContentType": "application/pdf",
        "CacheControl": "no-store",
        "Metadata": {
            "run-id": run_id,
            "created-at-utc": timestamp,
        },
    }

    if PACKETS_KMS_KEY_ID:
        put_object_kwargs["ServerSideEncryption"] = "aws:kms"
        put_object_kwargs["SSEKMSKeyId"] = PACKETS_KMS_KEY_ID
        put_object_kwargs["BucketKeyEnabled"] = True
    else:
        put_object_kwargs["ServerSideEncryption"] = "AES256"

    try:
        s3.put_object(**put_object_kwargs)
    except ClientError:
        return build_response(
            200,
            {
                "run_id": run_id,
                "expires_in": URL_EXPIRES_SECONDS,
                "bucket_region_used": region,
                "matched_benefits": matches,
                "filename": "CommonMASS-Packet.pdf",
                "packet_data": packet_data,
                "pdf_base64": base64.b64encode(pdf_bytes).decode("ascii"),
            },
            event=event,
            extra_headers=extra_headers,
        )

    disposition = "attachment"
    if PDF_CONTENT_DISPOSITION in {"attachment", "inline"}:
        disposition = PDF_CONTENT_DISPOSITION

    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": PACKETS_BUCKET,
            "Key": key,
            "ResponseContentType": "application/pdf",
            "ResponseContentDisposition": f'{disposition}; filename="CommonMASS-Packet.pdf"',
        },
        ExpiresIn=URL_EXPIRES_SECONDS,
    )

    return build_response(
        200,
        {
            "run_id": run_id,
            "expires_in": URL_EXPIRES_SECONDS,
            "bucket_region_used": region,
            "matched_benefits": matches,
            "packet_data": packet_data,
            "download_url": presigned_url,
        },
        event=event,
        extra_headers=extra_headers,
    )