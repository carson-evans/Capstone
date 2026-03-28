import base64
import os
import re
import uuid
from datetime import datetime, timezone
from io import BytesIO
from xml.sax.saxutils import escape

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from rlextra.rml2pdf import rml2pdf

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
PDF_CONTENT_DISPOSITION = os.environ.get("PDF_CONTENT_DISPOSITION", "inline").strip().lower()
MAX_BODY_BYTES = int(os.environ.get("MAX_BODY_BYTES", "65536"))

RULES_BUCKET = os.environ.get("RULES_BUCKET", "")
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json")

REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").strip().lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret").strip()
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "").strip()

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
        "not_enrolled_next_year": "Not enrolling next academic year",
    },
    "masfa_completed": {
        "yes": "Yes",
        "no": "No",
        "not_enrolled_next_year": "Not enrolling next academic year",
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

NOT_ENROLLED_NEXT_YEAR_VALUE = "not_enrolled_next_year"
MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM = "Attend a participating MASSGrant Plus school"


def _benefit_application_type(profile: dict, benefit_id: str) -> str | None:
    if benefit_id == "pell-grant":
        return "fafsa"

    if benefit_id in {"massgrant", "massgrant-plus"}:
        return "masfa" if profile.get("citizen_status") == "no" else "fafsa"

    return None


def _should_deprioritize_benefit(profile: dict, benefit_id: str) -> bool:
    application_type = _benefit_application_type(profile, benefit_id)

    if application_type == "masfa":
        status = profile.get("masfa_completed")
        return status in {"yes", NOT_ENROLLED_NEXT_YEAR_VALUE}

    if application_type == "fafsa":
        status = profile.get("fafsa_completed")
        return status in {"yes", NOT_ENROLLED_NEXT_YEAR_VALUE}

    return False


def _sort_matches_for_display(profile: dict, matches: list[dict]) -> list[dict]:
    enumerated_matches = list(enumerate(matches))
    enumerated_matches.sort(
        key=lambda item: (
            _should_deprioritize_benefit(profile, item[1].get("id", "")),
            item[0],
        )
    )
    return [match for _, match in enumerated_matches]


def _strip_state_aid_statuses_for_not_enrolling(profile: dict, matches: list[dict]) -> list[dict]:
    if not isinstance(profile, dict):
        return matches

    is_not_enrolling = (
        profile.get("fafsa_completed") == NOT_ENROLLED_NEXT_YEAR_VALUE
        or profile.get("masfa_completed") == NOT_ENROLLED_NEXT_YEAR_VALUE
    )

    if not is_not_enrolling:
        return matches

    target_ids = {"pell-grant", "massgrant", "massgrant-plus"}
    sanitized_matches: list[dict] = []

    for match in matches:
        if not isinstance(match, dict):
            sanitized_matches.append(match)
            continue

        if match.get("id") in target_ids:
            sanitized_matches.append(
                {
                    **match,
                    "actionStatuses": [],
                    "actionStatus": None,
                }
            )
            continue

        sanitized_matches.append(match)

    return sanitized_matches


def _markdown_links_to_plain_text(value: str) -> str:
    if not value:
        return ""

    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1 (\2)", value)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _xml_text(value: str | None) -> str:
    return escape((value or "").strip(), {'"': "&quot;", "'": "&apos;"})


def _profile_summary_items(profile: dict) -> list[tuple[str, str]]:
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

    rows: list[tuple[str, str]] = []
    for key in ordered_keys:
        if key in profile:
            rows.append(
                (
                    PROFILE_LABELS.get(key, key),
                    friendly_profile_value(key, profile.get(key)),
                )
            )
    return rows


def _should_default_checklist_item_to_checked(benefit_id: str, item: str) -> bool:
    return (
        benefit_id == "massgrant-plus"
        and item == MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM
    )


def _normalize_checklist_progress(
    checklist_progress: dict,
    matches: list[dict],
) -> dict[str, list[bool]]:
    normalized: dict[str, list[bool]] = {}
    incoming = checklist_progress if isinstance(checklist_progress, dict) else {}

    for match in matches:
        benefit_id = match["id"]
        checklist = match.get("checklist") or []
        raw_progress = incoming.get(benefit_id, [])

        if not isinstance(raw_progress, list):
            raw_progress = []

        normalized[benefit_id] = [
            bool(raw_progress[index])
            if index < len(raw_progress)
            else _should_default_checklist_item_to_checked(benefit_id, item)
            for index, item in enumerate(checklist)
        ]

    return normalized


def _get_ordered_checklist_items(
    checklist: list[str],
    progress: list[bool],
) -> list[tuple[str, bool]]:
    ordered_items = [
        {
            "item": item,
            "checked": progress[index] if index < len(progress) else False,
            "original_index": index,
        }
        for index, item in enumerate(checklist)
    ]

    ordered_items.sort(
        key=lambda item: (bool(item["checked"]), item["original_index"])
    )
    return [(item["item"], bool(item["checked"])) for item in ordered_items]


def _build_accessible_packet_data(
    run_id: str,
    profile: dict,
    matches: list[dict],
    checklist_progress: dict[str, list[bool]],
) -> dict:
    profile_summary = []
    for label, value in _profile_summary_items(profile):
        profile_summary.append(
            {
                "label": label,
                "value": value,
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


def _paragraph(text: str, style: str = "cmBody", tag_type: str = "P") -> str:
    return f'<para style="{style}" tagType="{tag_type}">{_xml_text(text)}</para>'


def _heading(text: str, style: str, tag_type: str) -> str:
    return f'<para style="{style}" tagType="{tag_type}">{_xml_text(text)}</para>'


def _build_accessible_rml(
    run_id: str,
    profile: dict,
    matches: list[dict],
    checklist_progress: dict[str, list[bool]],
) -> str:
    story_parts: list[str] = []

    story_parts.append(_heading("CommonMASS Application Preparation Packet", "cmTitle", "H1"))
    story_parts.append(
        _paragraph(
            f"Run ID: {run_id} | Generated at UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}",
            "cmMeta",
            "P",
        )
    )

    story_parts.append(_heading("Profile Summary", "cmSection", "H2"))
    profile_items = _profile_summary_items(profile)
    if profile_items:
        for label, value in profile_items:
            story_parts.append(_paragraph(f"{label}: {value}", "cmBody", "P"))
    else:
        story_parts.append(_paragraph("No profile data was provided.", "cmBody", "P"))

    story_parts.append(_heading("Matched Benefits", "cmSection", "H2"))
    if matches:
        for match in matches:
            title = match.get("title", match.get("id", "Benefit"))
            description = _markdown_links_to_plain_text(match.get("description", ""))
            details = _markdown_links_to_plain_text(match.get("details", ""))
            action_statuses = match.get("actionStatuses") or []
            official_url = match.get("officialUrl", "")
            official_button_label = match.get("officialButtonLabel", "")

            story_parts.append(_heading(title, "cmSubsection", "H3"))

            if description:
                story_parts.append(_paragraph(description, "cmBody", "P"))

            if details and details != description:
                story_parts.append(_paragraph(details, "cmBody", "P"))

            if action_statuses:
                story_parts.append(_paragraph("Current status", "cmLabel", "P"))
                for status in action_statuses:
                    story_parts.append(
                        _paragraph(f"• {_markdown_links_to_plain_text(status)}", "cmBody", "P")
                    )

            if official_url:
                if official_button_label:
                    story_parts.append(
                        _paragraph(
                            f"{official_button_label}: {official_url}",
                            "cmLink",
                            "P",
                        )
                    )
                else:
                    story_parts.append(_paragraph(f"Official site: {official_url}", "cmLink", "P"))
    else:
        story_parts.append(
            _paragraph(
                "No matched benefits based on the submitted profile.",
                "cmBody",
                "P",
            )
        )

    story_parts.append(_heading("Application Checklists", "cmSection", "H2"))
    if matches:
        for match in matches:
            benefit_id = match["id"]
            title = match.get("title", benefit_id)
            checklist = match.get("checklist") or []
            progress = checklist_progress.get(benefit_id, [False] * len(checklist))
            completed = sum(1 for item in progress if item)
            total = len(checklist)

            story_parts.append(_heading(title, "cmSubsection", "H3"))
            story_parts.append(
                _paragraph(f"Completed {completed} of {total} checklist items.", "cmBody", "P")
            )

            if checklist:
                for item_text, checked in _get_ordered_checklist_items(checklist, progress):
                    mark = "Completed" if checked else "Not completed"
                    story_parts.append(
                        _paragraph(
                            f"• {item_text} — {mark}",
                            "cmBody",
                            "P",
                        )
                    )
            else:
                story_parts.append(_paragraph("No checklist items available.", "cmBody", "P"))
    else:
        story_parts.append(_paragraph("No checklist items available.", "cmBody", "P"))

    story_xml = "\n    ".join(story_parts)

    return f"""
<!DOCTYPE document SYSTEM "rml.dtd">
<document filename="CommonMASS-Packet.pdf" tagged="1">
  <template
      title="CommonMASS Application Preparation Packet"
      author="CommonMASS"
      subject="Application preparation checklist packet"
      lang="en-US"
      pageSize="(612.0,792.0)"
      leftMargin="54"
      rightMargin="54"
      topMargin="54"
      bottomMargin="54">
    <pageTemplate id="main">
      <frame id="mainFrame" x1="54" y1="54" width="504" height="684"/>
    </pageTemplate>
  </template>

  <stylesheet>
    <paraStyle
        name="cmTitle"
        fontName="Helvetica-Bold"
        fontSize="20"
        leading="24"
        spaceAfter="12"/>
    <paraStyle
        name="cmSection"
        fontName="Helvetica-Bold"
        fontSize="15"
        leading="18"
        spaceBefore="14"
        spaceAfter="8"/>
    <paraStyle
        name="cmSubsection"
        fontName="Helvetica-Bold"
        fontSize="12"
        leading="15"
        spaceBefore="10"
        spaceAfter="6"/>
    <paraStyle
        name="cmLabel"
        fontName="Helvetica-Bold"
        fontSize="10"
        leading="13"
        spaceBefore="4"
        spaceAfter="2"/>
    <paraStyle
        name="cmMeta"
        fontName="Helvetica"
        fontSize="9"
        leading="12"
        textColor="#555555"
        spaceAfter="10"/>
    <paraStyle
        name="cmBody"
        fontName="Helvetica"
        fontSize="10"
        leading="14"
        spaceAfter="5"/>
    <paraStyle
        name="cmLink"
        fontName="Helvetica"
        fontSize="10"
        leading="14"
        textColor="#1e3a5f"
        spaceAfter="5"/>
  </stylesheet>

  <story>
    {story_xml}
  </story>
</document>
"""


def _build_pdf_bytes(
    run_id: str,
    profile: dict,
    matches: list[dict],
    checklist_progress: dict[str, list[bool]],
) -> bytes:
    rml = _build_accessible_rml(
        run_id=run_id,
        profile=profile,
        matches=matches,
        checklist_progress=checklist_progress,
    )

    output = BytesIO()
    rml2pdf.go(rml.encode("utf-8"), outputFileName=output)
    return output.getvalue()

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

    matches = _strip_state_aid_statuses_for_not_enrolling(profile, matches)
    matches = _sort_matches_for_display(safe_profile, matches)
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
                "runId": run_id,
                "expires_in": URL_EXPIRES_SECONDS,
                "bucket_region_used": region,
                "matched_benefits": matches,
                "packet_data": packet_data,
                "filename": "CommonMASS-Packet.pdf",
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
            500,
            {"error": "Failed to store generated packet in S3."},
            event=event,
            extra_headers=extra_headers,
        )

    disposition = "inline"
    if PDF_CONTENT_DISPOSITION in {"attachment", "inline"}:
        disposition = PDF_CONTENT_DISPOSITION

    try:
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
    except ClientError:
        return build_response(
            500,
            {"error": "Failed to generate packet download URL."},
            event=event,
            extra_headers=extra_headers,
        )

    return build_response(
        200,
        {
            "run_id": run_id,
            "runId": run_id,
            "expires_in": URL_EXPIRES_SECONDS,
            "bucket_region_used": region,
            "matched_benefits": matches,
            "packet_data": packet_data,
            "filename": "CommonMASS-Packet.pdf",
            "download_url": presigned_url,
            "url": presigned_url,
            "presigned_url": presigned_url,
        },
        event=event,
        extra_headers=extra_headers,
    )
