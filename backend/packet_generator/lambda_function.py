import base64
import json
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
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from commonmass_backend import (
    detect_bucket_region,
    get_authoritative_matches,
    load_catalog,
)

PACKETS_BUCKET = os.environ.get("PACKETS_BUCKET", "")
PACKETS_PREFIX = os.environ.get("PACKETS_PREFIX", "packets/")
URL_EXPIRES_SECONDS = int(os.environ.get("URL_EXPIRES_SECONDS", "300"))

RULES_BUCKET = os.environ.get("RULES_BUCKET", "")
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json")

REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret")
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "")

PROFILE_LABELS = {
    "student_status": "Student status",
    "citizen_status": "Citizen / eligible non-citizen",
    "residency_length": "Massachusetts residency status",
    "fafsa_completed": "FAFSA completed",
    "masfa_completed": "MASFA completed",
    "masfa_high_school_completer": "Massachusetts high school completer status",
    "masfa_documentation_ready": "Has MASFA document option",
    "dhe_affidavit_completed": "DHE Tuition Equity Form and Affidavit completed",
    "prior_bachelors_degree": "Already has bachelor's degree",
    "massgrant_plus_income_band": "MASSGrant Plus family income",
    "work_study": "Federal work-study",
    "household_sizes": "Household size",
    "household_size_exact": "Exact household size",
    "masshealth_income_under_limit": "Below MassHealth yearly threshold",
    "snap_income_under_limit": "Below SNAP monthly threshold",
    "school_name": "College or university",
}

PROFILE_VALUE_LABELS = {
    "student_status": {
        "full_time": "Yes, full-time",
        "part_time": "Yes, part-time",
        "future_full_time": "Will enroll full-time within the next year",
        "future_part_time": "Will enroll part-time within the next year",
        "no": "No",
    },
    "citizen_status": {
        "yes": "Yes",
        "no": "No",
    },
    "residency_length": {
        "not_ma_resident": "Not a Massachusetts resident",
        "under_12_months": "Less than 12 months",
        "one_to_five_years": "12 months or more",
        "over_five_years": "12 months or more",
    },
    "fafsa_completed": {
        "yes": "Yes",
        "no": "No",
    },
    "masfa_completed": {
        "yes": "Yes",
        "no": "No",
    },
    "masfa_high_school_completer": {
        "yes": "Yes",
        "no": "No",
    },
    "masfa_documentation_ready": {
        "yes": "Yes",
        "no": "No",
    },
    "dhe_affidavit_completed": {
        "yes": "Yes",
        "no": "No",
    },
    "prior_bachelors_degree": {
        "yes": "Yes",
        "no": "No",
    },
    "massgrant_plus_income_band": {
        "under_85k": "Less than $85,000 per year before taxes",
        "85k_to_100k": "$85,000 to $100,000 per year before taxes",
        "over_100k": "More than $100,000 per year before taxes",
    },
    "work_study": {
        "yes": "Yes",
        "no": "No",
    },
    "masshealth_income_under_limit": {
        "yes": "Yes",
        "no": "No",
    },
    "snap_income_under_limit": {
        "yes": "Yes",
        "no": "No",
    },
}


def _resolve_logo_path() -> Path | None:
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


def _get_header(event: dict, name: str) -> str | None:
    headers = event.get("headers") or {}

    for key, value in headers.items():
        if str(key).lower() == name.lower():
            return value

    return None


def _get_allowed_origin(event: dict) -> str | None:
    request_origin = _get_header(event or {}, "Origin")

    allowed_origins = {
        "https://commonmass.org",
        "https://www.commonmass.org",
        "http://localhost:5173",
    }

    if request_origin in allowed_origins:
        return request_origin

    return None


def _resp(
    status_code: int,
    body,
    event: dict | None = None,
    content_type: str = "application/json",
    extra_headers: dict | None = None,
):
    if body is None:
        body = ""

    if not isinstance(body, str):
        body = json.dumps(body)

    headers = {
        "Content-Type": content_type,
        "Cache-Control": "no-store",
    }

    allowed_origin = _get_allowed_origin(event or {})
    if allowed_origin:
        headers["Access-Control-Allow-Origin"] = allowed_origin
        headers["Vary"] = "Origin"
        headers["Access-Control-Allow-Headers"] = f"Content-Type,Authorization,{SHARED_SECRET_HEADER}"
        headers["Access-Control-Allow-Methods"] = "POST,OPTIONS"

    if extra_headers:
        headers.update(extra_headers)

    return {
        "statusCode": status_code,
        "headers": headers,
        "body": body,
    }


def _parse_payload(event) -> dict:
    if not isinstance(event, dict):
        return {}

    if "body" in event and event["body"] is not None:
        body = event["body"]

        if isinstance(body, str) and body.strip():
            try:
                return json.loads(body)
            except Exception:
                return {}

        if isinstance(body, dict):
            return body

    return event


def _get_http_method(event: dict) -> str:
    return (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or ""
    ).upper()


def _friendly_profile_value(key: str, value):
    if value is None:
        return ""

    mapping = PROFILE_VALUE_LABELS.get(key, {})
    return mapping.get(value, str(value))


def _wrap_text(c, text: str, max_width: float, font_name="Helvetica", font_size=11) -> list[str]:
    c.setFont(font_name, font_size)

    words = (text or "").split()
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

    logo_x = 0.75 * inch
    title_right_x = width - (0.75 * inch)
    logo_baseline_y = height - 0.66 * inch
    logo_height = 0.34 * inch

    if LOGO_PATH is not None:
        try:
            logo = ImageReader(str(LOGO_PATH))
            image_width, image_height = logo.getSize()
            rendered_logo_width = logo_height * (image_width / image_height)

            c.drawImage(
                logo,
                logo_x,
                logo_baseline_y,
                width=rendered_logo_width,
                height=logo_height,
                mask="auto",
                preserveAspectRatio=True,
            )

        except Exception:
            pass

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(title_right_x, height - 0.51 * inch, "Application Preparation Checklist Packet")
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


def _draw_bullet_text(c, x, y, label, value, max_label_width=205):
    c.setFont("Helvetica-Bold", 10)
    label_text = f"{label}:"
    c.drawString(x, y, label_text)

    label_width = c.stringWidth(label_text, "Helvetica-Bold", 10)
    value_x = x + max(max_label_width, label_width + 12)

    c.setFont("Helvetica", 10)
    c.drawString(value_x, y, value)

    return y - 15


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


def _build_pdf_bytes(
    run_id: str,
    profile: dict,
    matches: list[dict],
    checklist_progress: dict[str, list[bool]],
) -> bytes:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

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
            y = _ensure_space(c, y, height, 22)
            label = PROFILE_LABELS.get(key, key)
            value = _friendly_profile_value(key, profile.get(key))
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

            y = _ensure_space(c, y, height, 82)

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

            c.setFont("Helvetica", 9)
            c.setFillColor(colors.HexColor("#374151"))
            for line in _wrap_text(c, description, width - 2 * margin_x - 12, font_size=9):
                c.drawString(margin_x + 12, y, line)
                y -= 12

            for extra_status in action_statuses[1:]:
                y = _ensure_space(c, y, height, 18)
                c.setFont("Helvetica-Oblique", 8)
                c.setFillColor(colors.HexColor("#4b5563"))
                c.drawString(margin_x + 12, y, f"- {extra_status}")
                y -= 10

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

    c.setTitle("Application Preparation Checklist Packet")
    c.save()

    return buffer.getvalue()


def lambda_handler(event, context):
    method = _get_http_method(event or {})

    if method == "OPTIONS":
        return _resp(200, "", event=event, content_type="text/plain")

    if REQUIRE_SHARED_SECRET:
        header_value = _get_header(event or {}, SHARED_SECRET_HEADER)
        if not SHARED_SECRET_VALUE or header_value != SHARED_SECRET_VALUE:
            return _resp(403, {"error": "Forbidden"}, event=event)

    payload = _parse_payload(event)

    profile = payload.get("profile") or {}
    selected = payload.get("selectedBenefits") or payload.get("selected_benefits") or []
    checklist_progress = payload.get("checklistProgress") or payload.get("checklist_progress") or {}

    if not isinstance(profile, dict):
        return _resp(400, {"error": "profile must be an object"}, event=event)

    if selected is not None and not isinstance(selected, list):
        return _resp(400, {"error": "selectedBenefits must be a list if provided"}, event=event)

    if checklist_progress is not None and not isinstance(checklist_progress, dict):
        return _resp(400, {"error": "checklistProgress must be an object if provided"}, event=event)

    region_source_bucket = PACKETS_BUCKET or RULES_BUCKET
    region = detect_bucket_region(region_source_bucket)

    s3 = None
    if PACKETS_BUCKET or RULES_BUCKET:
        s3 = boto3.client(
            "s3",
            region_name=region,
            config=Config(signature_version="s3v4", retries={"max_attempts": 2}),
        )

    catalog = load_catalog(s3, RULES_BUCKET, BENEFITS_CATALOG_KEY)

    matches = get_authoritative_matches(
        profile=profile,
        catalog=catalog,
        selected_benefit_ids=selected,
    )

    normalized_progress = _normalize_checklist_progress(checklist_progress, matches)

    run_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    key = f"{PACKETS_PREFIX}{timestamp}-{run_id}.pdf"

    pdf_bytes = _build_pdf_bytes(
        run_id=run_id,
        profile=profile,
        matches=matches,
        checklist_progress=normalized_progress,
    )

    if not PACKETS_BUCKET:
        return _resp(
            200,
            {
                "run_id": run_id,
                "expires_in": URL_EXPIRES_SECONDS,
                "bucket_region_used": region,
                "matched_benefits": matches,
                "filename": "CommonMASS-Packet.pdf",
                "pdf_base64": base64.b64encode(pdf_bytes).decode("ascii"),
            },
            event=event,
        )

    try:
        s3.put_object(
            Bucket=PACKETS_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            CacheControl="no-store",
            ServerSideEncryption="AES256",
        )
    except ClientError:
        return _resp(
            200,
            {
                "run_id": run_id,
                "expires_in": URL_EXPIRES_SECONDS,
                "bucket_region_used": region,
                "matched_benefits": matches,
                "filename": "CommonMASS-Packet.pdf",
                "pdf_base64": base64.b64encode(pdf_bytes).decode("ascii"),
            },
            event=event,
        )

    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": PACKETS_BUCKET,
            "Key": key,
            "ResponseContentType": "application/pdf",
            "ResponseContentDisposition": 'inline; filename="CommonMASS-Packet.pdf"',
        },
        ExpiresIn=URL_EXPIRES_SECONDS,
    )

    return _resp(
        200,
        {
            "run_id": run_id,
            "s3_key": key,
            "expires_in": URL_EXPIRES_SECONDS,
            "bucket_region_used": region,
            "matched_benefits": matches,
            "download_url": presigned_url,
        },
        event=event,
    )