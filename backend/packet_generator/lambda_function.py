import base64
import os
import re
import uuid
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from urllib.parse import urlsplit
from xml.sax.saxutils import escape

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from rlextra.rml2pdf import rml2pdf

from commonmass_backend import (
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

PACKETS_BUCKET = os.environ.get("PACKETS_BUCKET", "").strip()
PACKETS_PREFIX = os.environ.get("PACKETS_PREFIX", "packets/").strip()
URL_EXPIRES_SECONDS = int(os.environ.get("URL_EXPIRES_SECONDS", "300"))
PACKETS_KMS_KEY_ID = os.environ.get("PACKETS_KMS_KEY_ID", "").strip()
PDF_CONTENT_DISPOSITION = os.environ.get("PDF_CONTENT_DISPOSITION", "inline").strip().lower()
MAX_BODY_BYTES = int(os.environ.get("MAX_BODY_BYTES", "65536"))

RULES_BUCKET = os.environ.get("RULES_BUCKET", "").strip()
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json").strip()

REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").strip().lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret").strip()
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "").strip()

PDF_FILENAME = "CommonMASS-Application-Preparation-Packet.pdf"
NOT_ENROLLED_NEXT_YEAR_VALUE = "not_enrolled_next_year"
MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM = "Attend a participating MASSGrant Plus school"

PDF_FONT_DIR = os.environ.get("PDF_FONT_DIR", "").strip()
REQUIRE_EMBEDDED_FONTS = os.environ.get("REQUIRE_EMBEDDED_FONTS", "true").strip().lower() == "true"

FONT_REGULAR_FACE = "CommonMASSDejaVu-Regular"
FONT_BOLD_FACE = "CommonMASSDejaVu-Bold"

PROFILE_LABELS = {
    "student_status": "Student status",
    "citizen_status": "Citizen or eligible non-citizen status",
    "residency_length": "Massachusetts residency status",
    "fafsa_completed": "FAFSA completed",
    "masfa_completed": "MASFA completed",
    "masfa_high_school_completer": "Massachusetts high school completer status",
    "masfa_documentation_ready": "Has MASFA document option",
    "dhe_affidavit_completed": "DHE Tuition Equity Form and Affidavit completed",
    "prior_bachelors_degree": "Already has bachelor's degree",
    "massgrant_plus_income_band": "MASSGrant Plus family income",
    "work_study": "Federal work-study",
    "household_sizes": "Household size range",
    "household_size_exact": "Exact household size",
    "masshealth_income_under_limit": "Below MassHealth yearly threshold",
    "snap_income_under_limit": "Below SNAP monthly threshold",
    "school_name": "College or university",
}


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

    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", value)
    text = re.sub(r"https?://\S+", "", text)
    text = re.sub(r"\s+", " ", text).strip(" -:;,.")
    return text


def _xml_text(value: str | None) -> str:
    return escape((value or "").strip(), {'"': "&quot;", "'": "&apos;"})


def _xml_attr(value: str | None) -> str:
    return escape((value or "").strip(), {'"': "&quot;", "'": "&apos;"})


def _spacer(length: int | str = 8) -> str:
    return f'<spacer length="{length}"/>'


def _outline(text: str, level: int = 0, closed: bool | None = None) -> str:
    attrs: list[str] = []

    if level > 0:
        attrs.append(f'level="{level}"')

    if closed is not None:
        attrs.append(f'closed="{"1" if closed else "0"}"')

    attr_text = f" {' '.join(attrs)}" if attrs else ""
    return f"<outlineAdd{attr_text}>{_xml_text(text)}</outlineAdd>"


def _display_url_value(url: str) -> str:
    if not url:
        return ""

    parts = urlsplit(url.strip())
    host = (parts.netloc or "").replace("www.", "").strip()
    path = parts.path or ""
    compact = f"{host}{path}".rstrip("/")

    if not compact:
        compact = url.strip().replace("https://", "").replace("http://", "")

    return compact


def _display_url_label(label: str, url: str) -> str:
    clean_label = _markdown_links_to_plain_text(label or "")
    if clean_label:
        return clean_label

    normalized = (url or "").lower()

    known_labels = {
        "studentaid.gov/h/apply-for-aid/fafsa": "Open FAFSA application page",
        "studentaid.gov/fsa-id/sign-in/landing": "Open StudentAid.gov account page",
        "mass.edu/osfa/students/masfa.asp": "Open MASFA information page",
        "madhestudentxprod.regenteducation.net/signin": "Open MASFA sign-in page",
        "mahealthconnector.org": "Open MA Health Connector",
        "mahix.org/individual": "Open MassHealth information page",
        "dtaconnect.eohhs.mass.gov": "Open DTA Connect",
        "mass.gov/orgs/department-of-transitional-assistance": "Open DTA program page",
        "mbta.com/fares/college-student-semester-passes": "Open MBTA student pass information",
        "mbta.com": "Open MBTA website",
    }

    for key, value in known_labels.items():
        if key in normalized:
            return value

    parts = urlsplit(url or "")
    host = (parts.netloc or "").replace("www.", "").strip()
    return f"Open {host}" if host else "Open official website"


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
    return benefit_id == "massgrant-plus" and item == MASSGRANT_PLUS_SCHOOL_CHECKLIST_ITEM


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
            bool(raw_progress[index]) if index < len(raw_progress) else _should_default_checklist_item_to_checked(benefit_id, item)
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


def _is_positive_status(status: str) -> bool:
    normalized = (status or "").strip().lower()
    positive_markers = (
        "no action needed",
        "already completed",
        "already applied",
        "already submitted",
        "already enrolled",
        "already has",
        "already reviewed",
    )
    return any(marker in normalized for marker in positive_markers)


def _status_style(status: str) -> str:
    return "govStatusDone" if _is_positive_status(status) else "govStatusAction"


def _checklist_item_style(checked: bool) -> str:
    return "govChecklistDone" if checked else "govChecklistAction"


def _status_line_text(status: str) -> str:
    clean_status = _markdown_links_to_plain_text(status)
    if not clean_status:
        return ""
    return f"Status: {clean_status}"


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
                "description": _markdown_links_to_plain_text(match.get("description", "")),
                "details": _markdown_links_to_plain_text(match.get("details", "")),
                "actionStatuses": [
                    _markdown_links_to_plain_text(status)
                    for status in (match.get("actionStatuses") or [])
                ],
                "officialUrl": match.get("officialUrl", ""),
                "officialButtonLabel": match.get("officialButtonLabel", ""),
            }
        )

    total_checklist_items = sum(len(section["items"]) for section in checklist_sections)
    completed_checklist_items = sum(
        section["completedCount"] for section in checklist_sections
    )

    return {
        "runId": run_id,
        "generatedAtUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "summary": {
            "matchedBenefitCount": len(matches),
            "completedChecklistItems": completed_checklist_items,
            "totalChecklistItems": total_checklist_items,
        },
        "profileSummary": profile_summary,
        "matchedBenefits": matched_benefits,
        "checklists": checklist_sections,
    }


def _paragraph(text: str, style: str = "govBody", tag_type: str = "P") -> str:
    return f'<para style="{style}" tagType="{tag_type}">{_xml_text(text)}</para>'


def _heading(text: str, style: str, tag_type: str) -> str:
    return f'<para style="{style}" tagType="{tag_type}">{_xml_text(text)}</para>'


def _data_line(label: str, value: str, style: str = "govDataLine") -> str:
    return _paragraph(f"{label}: {value}", style, "P")


def _candidate_font_directories() -> list[Path]:
    candidates: list[Path] = []

    if PDF_FONT_DIR:
        candidates.append(Path(PDF_FONT_DIR))

    here = Path(__file__).resolve().parent
    candidates.extend(
        [
            here / "fonts",
            Path("/var/task/fonts"),
            Path("/opt/fonts"),
            Path("/usr/share/fonts/truetype/dejavu"),
        ]
    )

    unique: list[Path] = []
    seen: set[str] = set()

    for candidate in candidates:
        resolved = str(candidate)
        if resolved not in seen:
            seen.add(resolved)
            unique.append(candidate)

    return unique


def _find_font_file(possible_names: list[str]) -> str | None:
    for directory in _candidate_font_directories():
        for name in possible_names:
            candidate = directory / name
            if candidate.exists() and candidate.is_file():
                return candidate.as_posix()
    return None


def _resolve_embedded_font_paths() -> tuple[str | None, str | None]:
    regular = _find_font_file(
        [
            "DejaVuSans.ttf",
            "NotoSans-Regular.ttf",
            "Inter-Regular.ttf",
            "Arial-Regular.ttf",
        ]
    )
    bold = _find_font_file(
        [
            "DejaVuSans-Bold.ttf",
            "NotoSans-Bold.ttf",
            "Inter-Bold.ttf",
            "Arial-Bold.ttf",
        ]
    )

    if regular and bold:
        return regular, bold

    if REQUIRE_EMBEDDED_FONTS:
        raise RuntimeError(
            "Embedded PDF font files were not found. Add DejaVuSans.ttf and DejaVuSans-Bold.ttf "
            "to a fonts/ folder next to lambda_function.py, or set PDF_FONT_DIR to a directory "
            "containing those files."
        )

    return None, None


def _build_accessible_rml(
    run_id: str,
    profile: dict,
    matches: list[dict],
    checklist_progress: dict[str, list[bool]],
) -> str:
    generated_at = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")
    profile_items = _profile_summary_items(profile)

    regular_font_path, bold_font_path = _resolve_embedded_font_paths()
    regular_font_name = FONT_REGULAR_FACE if regular_font_path and bold_font_path else "Helvetica"
    bold_font_name = FONT_BOLD_FACE if regular_font_path and bold_font_path else "Helvetica-Bold"

    docinit_xml = "<docinit pageMode=\"UseOutlines\" pageLayout=\"OneColumn\"/>"
    if regular_font_path and bold_font_path:
        docinit_xml = f"""
    <docinit pageMode="UseOutlines" pageLayout="OneColumn">
        <registerTTFont faceName="{FONT_REGULAR_FACE}" fileName="{_xml_attr(regular_font_path)}"/>
        <registerTTFont faceName="{FONT_BOLD_FACE}" fileName="{_xml_attr(bold_font_path)}"/>
        <registerFontFamily normal="{FONT_REGULAR_FACE}" bold="{FONT_BOLD_FACE}"/>
    </docinit>
"""

    total_checklist_items = sum(len(match.get("checklist") or []) for match in matches)
    completed_checklist_items = 0

    for match in matches:
        benefit_id = match["id"]
        checklist = match.get("checklist") or []
        progress = checklist_progress.get(benefit_id, [False] * len(checklist))
        completed_checklist_items += sum(1 for item in progress if item)

    story_parts: list[str] = []

    story_parts.append(_outline("Application Preparation Packet"))
    story_parts.append(
        _paragraph(
            "CommonMASS | Massachusetts Benefits Screening and Application Preparation",
            "govKicker",
            "P",
        )
    )
    story_parts.append(_heading("Application Preparation Packet", "govTitle", "H1"))
    story_parts.append(
        _paragraph(
            "This packet summarizes possible programs, current statuses, and preparation steps based on the information submitted to CommonMASS.",
            "govSubtitle",
            "P",
        )
    )

    story_parts.append(_spacer(16))

    story_parts.append(_outline("Document Information", 1))
    story_parts.append(_heading("Document Information", "govSection", "H2"))
    story_parts.append(_data_line("Reference ID", run_id))
    story_parts.append(_data_line("Generated", generated_at))

    story_parts.append(_spacer(12))

    story_parts.append(_outline("Summary of Results", 1))
    story_parts.append(_heading("Summary of Results", "govSection", "H2"))
    story_parts.append(
        _paragraph(
            f"Matched programs: {len(matches)}",
            "govSummaryLine",
            "P",
        )
    )
    story_parts.append(
        _paragraph(
            f"Checklist progress: {completed_checklist_items} of {total_checklist_items} items completed",
            "govSummaryLine",
            "P",
        )
    )
    story_parts.append(
        _paragraph(
            "CommonMASS is a screening and preparation tool. Final eligibility, enrollment, and award decisions are made by the relevant agency, school, or program administrator.",
            "govCallout",
            "P",
        )
    )

    story_parts.append(_spacer(12))

    story_parts.append(_outline("Submitted Profile", 1))
    story_parts.append(_heading("Submitted Profile", "govSection", "H2"))
    if profile_items:
        for label, value in profile_items:
            story_parts.append(_data_line(label, value))
    else:
        story_parts.append(
            _paragraph(
                "No profile information was available in the submitted request.",
                "govBody",
                "P",
            )
        )

    story_parts.append(_spacer(14))

    story_parts.append(_outline("Matched Programs and Recommended Actions", 1))
    story_parts.append(_heading("Matched Programs and Recommended Actions", "govSection", "H2"))

    if matches:
        for match in matches:
            title = match.get("title", match.get("id", "Program"))
            description = _markdown_links_to_plain_text(match.get("description", ""))
            details = _markdown_links_to_plain_text(match.get("details", ""))
            action_statuses = match.get("actionStatuses") or []
            official_url = match.get("officialUrl", "")
            official_button_label = match.get("officialButtonLabel", "")

            story_parts.append(_outline(title, 2))
            story_parts.append(_heading(title, "govProgramTitle", "H3"))

            if description:
                story_parts.append(_paragraph(description, "govLead", "P"))

            if details and details != description:
                story_parts.append(_paragraph(details, "govBodySecondary", "P"))

            if official_url:
                story_parts.append(_paragraph("Official website", "govInlineLabel", "P"))
                story_parts.append(
                    _paragraph(
                        _display_url_label(official_button_label, official_url),
                        "govLinkAction",
                        "P",
                    )
                )
                story_parts.append(
                    _paragraph(
                        f"URL: {_display_url_value(official_url)}",
                        "govUrlLine",
                        "P",
                    )
                )

            if action_statuses:
                for status in action_statuses:
                    status_line = _status_line_text(status)
                    if status_line:
                        story_parts.append(
                            _paragraph(
                                status_line,
                                _status_style(status_line),
                                "P",
                            )
                        )
            else:
                story_parts.append(
                    _paragraph(
                        "Status: No current program status was provided.",
                        "govNeutralLine",
                        "P",
                    )
                )

            story_parts.append(_spacer(14))
    else:
        story_parts.append(
            _paragraph(
                "No matched programs were found based on the submitted profile information.",
                "govBody",
                "P",
            )
        )

    story_parts.append(_spacer(10))

    story_parts.append(_outline("Application Checklist by Program", 1))
    story_parts.append(_heading("Application Checklist by Program", "govSection", "H2"))

    if matches:
        for match in matches:
            benefit_id = match["id"]
            title = match.get("title", benefit_id)
            checklist = match.get("checklist") or []
            progress = checklist_progress.get(benefit_id, [False] * len(checklist))
            completed = sum(1 for item in progress if item)
            total = len(checklist)

            story_parts.append(_outline(f"{title} Checklist", 2))
            story_parts.append(_heading(title, "govProgramTitle", "H3"))
            story_parts.append(
                _paragraph(
                    f"Completed items: {completed} of {total}",
                    "govProgressLine",
                    "P",
                )
            )

            if checklist:
                for item_text, checked in _get_ordered_checklist_items(checklist, progress):
                    prefix = "Completed" if checked else "Action needed"
                    story_parts.append(
                        _paragraph(
                            f"{prefix}: {item_text}",
                            _checklist_item_style(checked),
                            "P",
                        )
                    )
            else:
                story_parts.append(
                    _paragraph(
                        "No checklist items are available for this program.",
                        "govNeutralLine",
                        "P",
                    )
                )

            story_parts.append(_spacer(12))
    else:
        story_parts.append(
            _paragraph(
                "No checklist items are available because no programs were matched.",
                "govBody",
                "P",
            )
        )

    story_parts.append(_spacer(10))
    story_parts.append(
        _paragraph(
            "Important notice: Use this packet as a preparation aid only. Confirm deadlines, forms, identity requirements, residency requirements, and submission instructions on the official program website before applying.",
            "govFinalNotice",
            "P",
        )
    )

    story_xml = "\n        ".join(story_parts)

    return f"""<!DOCTYPE document SYSTEM "rml.dtd">
<document filename="{PDF_FILENAME}" tagged="1">
    {docinit_xml}
    <template
        title="CommonMASS Application Preparation Packet"
        author="CommonMASS"
        subject="Massachusetts benefits summary and application preparation packet"
        lang="en-US"
        pageSize="(612.0,792.0)"
        leftMargin="54"
        rightMargin="54"
        topMargin="50"
        bottomMargin="110"
    >
        <pageTemplate id="main">
            <pageGraphics>
                <setFont name="{regular_font_name}" size="8.5"/>
                <drawRightString x="552" y="30">Page <pageNumber/></drawRightString>
            </pageGraphics>
            <frame id="mainFrame" x1="54" y1="110" width="504" height="632"/>
        </pageTemplate>
    </template>

    <stylesheet>
        <paraStyle
            name="govKicker"
            fontName="{bold_font_name}"
            fontSize="8.6"
            leading="11.4"
            textColor="#163A63"
            backColor="#F3F6FA"
            borderWidth="0.4"
            borderColor="#D5DEE8"
            borderPadding="5"
            spaceAfter="10"
            wordWrap="CJK"
        />
        <paraStyle
            name="govTitle"
            fontName="{bold_font_name}"
            fontSize="21.0"
            leading="26.0"
            textColor="#102A43"
            spaceAfter="6"
            wordWrap="CJK"
        />
        <paraStyle
            name="govSubtitle"
            fontName="{regular_font_name}"
            fontSize="10.4"
            leading="15.2"
            textColor="#334E68"
            spaceAfter="2"
            wordWrap="CJK"
        />
        <paraStyle
            name="govSection"
            fontName="{bold_font_name}"
            fontSize="13.0"
            leading="16.6"
            textColor="#102A43"
            backColor="#EAF0F5"
            borderWidth="0.4"
            borderColor="#D5DEE8"
            borderPadding="6"
            spaceBefore="2"
            spaceAfter="7"
            wordWrap="CJK"
        />
        <paraStyle
            name="govDataLine"
            fontName="{regular_font_name}"
            fontSize="10.0"
            leading="14.2"
            textColor="#1F2933"
            spaceBefore="0"
            spaceAfter="3"
            wordWrap="CJK"
        />
        <paraStyle
            name="govSummaryLine"
            fontName="{bold_font_name}"
            fontSize="10.1"
            leading="14.2"
            textColor="#102A43"
            spaceBefore="0"
            spaceAfter="3"
            wordWrap="CJK"
        />
        <paraStyle
            name="govCallout"
            fontName="{regular_font_name}"
            fontSize="9.8"
            leading="14.2"
            textColor="#243B53"
            backColor="#FFF8E8"
            borderWidth="0.4"
            borderColor="#D9C27A"
            borderPadding="6"
            spaceBefore="2"
            spaceAfter="5"
            wordWrap="CJK"
        />
        <paraStyle
            name="govProgramTitle"
            fontName="{bold_font_name}"
            fontSize="11.7"
            leading="15.2"
            textColor="#FFFFFF"
            backColor="#173F6D"
            borderWidth="0.4"
            borderColor="#173F6D"
            borderPadding="6"
            spaceBefore="2"
            spaceAfter="6"
            wordWrap="CJK"
        />
        <paraStyle
            name="govLead"
            fontName="{bold_font_name}"
            fontSize="10.2"
            leading="14.4"
            textColor="#1F2933"
            spaceBefore="0"
            spaceAfter="4"
            wordWrap="CJK"
        />
        <paraStyle
            name="govBody"
            fontName="{regular_font_name}"
            fontSize="9.8"
            leading="14.2"
            textColor="#1F2933"
            spaceBefore="0"
            spaceAfter="4"
            wordWrap="CJK"
        />
        <paraStyle
            name="govBodySecondary"
            fontName="{regular_font_name}"
            fontSize="9.6"
            leading="14.2"
            textColor="#486581"
            spaceBefore="0"
            spaceAfter="4"
            wordWrap="CJK"
        />
        <paraStyle
            name="govInlineLabel"
            fontName="{bold_font_name}"
            fontSize="9.2"
            leading="12.4"
            textColor="#243B53"
            spaceBefore="2"
            spaceAfter="1"
            wordWrap="CJK"
        />
        <paraStyle
            name="govLinkAction"
            fontName="{bold_font_name}"
            fontSize="9.8"
            leading="13.6"
            textColor="#102A43"
            spaceBefore="0"
            spaceAfter="1"
            wordWrap="CJK"
        />
        <paraStyle
            name="govUrlLine"
            fontName="{regular_font_name}"
            fontSize="8.8"
            leading="12.2"
            textColor="#486581"
            spaceBefore="0"
            spaceAfter="5"
            wordWrap="CJK"
        />
        <paraStyle
            name="govNeutralLine"
            fontName="{regular_font_name}"
            fontSize="9.3"
            leading="13.4"
            textColor="#486581"
            backColor="#F8FAFC"
            borderWidth="0.35"
            borderColor="#D7E2EA"
            borderPadding="5"
            spaceBefore="2"
            spaceAfter="5"
            wordWrap="CJK"
        />
        <paraStyle
            name="govStatusDone"
            fontName="{bold_font_name}"
            fontSize="9.6"
            leading="13.8"
            textColor="#1E5F3A"
            backColor="#EEF8F1"
            borderWidth="0.4"
            borderColor="#9EC8AA"
            borderPadding="6"
            spaceBefore="2"
            spaceAfter="5"
            wordWrap="CJK"
        />
        <paraStyle
            name="govStatusAction"
            fontName="{bold_font_name}"
            fontSize="9.6"
            leading="13.8"
            textColor="#8A3D12"
            backColor="#FFF3E8"
            borderWidth="0.4"
            borderColor="#D9A37B"
            borderPadding="6"
            spaceBefore="2"
            spaceAfter="5"
            wordWrap="CJK"
        />
        <paraStyle
            name="govProgressLine"
            fontName="{bold_font_name}"
            fontSize="9.9"
            leading="13.8"
            textColor="#102A43"
            spaceBefore="0"
            spaceAfter="3"
            wordWrap="CJK"
        />
        <paraStyle
            name="govChecklistAction"
            fontName="{regular_font_name}"
            fontSize="9.4"
            leading="13.6"
            textColor="#1F2933"
            leftIndent="13"
            spaceBefore="0"
            spaceAfter="2"
            wordWrap="CJK"
        />
        <paraStyle
            name="govChecklistDone"
            fontName="{regular_font_name}"
            fontSize="9.4"
            leading="13.6"
            textColor="#486581"
            leftIndent="13"
            spaceBefore="0"
            spaceAfter="2"
            wordWrap="CJK"
        />
        <paraStyle
            name="govFinalNotice"
            fontName="{regular_font_name}"
            fontSize="9.7"
            leading="14.2"
            textColor="#243B53"
            backColor="#FFF8E8"
            borderWidth="0.4"
            borderColor="#D9C27A"
            borderPadding="6"
            spaceBefore="4"
            spaceAfter="2"
            wordWrap="CJK"
        />
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
        return build_response(
            200,
            "",
            event=event,
            content_type="text/plain; charset=utf-8",
        )

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
        return build_response(
            400,
            {"error": "selectedBenefits must be a list if provided"},
            event=event,
        )

    if checklist_progress is not None and not isinstance(checklist_progress, dict):
        return build_response(
            400,
            {"error": "checklistProgress must be an object if provided"},
            event=event,
        )

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
    matches = _strip_state_aid_statuses_for_not_enrolling(safe_profile, matches)
    matches = _sort_matches_for_display(safe_profile, matches)

    normalized_progress = _normalize_checklist_progress(checklist_progress, matches)

    run_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    key = f"{PACKETS_PREFIX}{timestamp}-{run_id}.pdf"

    try:
        pdf_bytes = _build_pdf_bytes(
            run_id=run_id,
            profile=safe_profile,
            matches=matches,
            checklist_progress=normalized_progress,
        )
    except RuntimeError as error:
        return build_response(
            500,
            {"error": str(error)},
            event=event,
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
                "filename": PDF_FILENAME,
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
                "ResponseContentDisposition": f'{disposition}; filename="{PDF_FILENAME}"',
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
            "filename": PDF_FILENAME,
            "download_url": presigned_url,
            "url": presigned_url,
            "presigned_url": presigned_url,
        },
        event=event,
        extra_headers=extra_headers,
    )