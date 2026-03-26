import os
import base64
import json
import uuid
import boto3
from io import BytesIO
from pathlib import Path
from datetime import datetime, timezone
from botocore.config import Config
from botocore.exceptions import ClientError

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader


# -----------------------------
# Env vars
# -----------------------------
PACKETS_BUCKET = os.environ.get("PACKETS_BUCKET", "")
PACKETS_PREFIX = os.environ.get("PACKETS_PREFIX", "packets/")
URL_EXPIRES_SECONDS = int(os.environ.get("URL_EXPIRES_SECONDS", "300"))

RULES_BUCKET = os.environ.get("RULES_BUCKET", "")
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json")

REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret")
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "")

MASSGRANT_PLUS_UNDER_85K_LIMIT = 85000
SNAP_THRESHOLDS = {
    1: 2608,
    2: 3525,
    3: 4442,
    4: 5358,
    5: 6275,
    6: 7192,
    7: 8108,
    8: 9025,
}
SNAP_ADDITIONAL_PERSON_INCREMENT = 917
MASSHEALTH_THRESHOLDS = {
    1: 21228,
    2: 28788,
    3: 36336,
    4: 43896,
    5: 51456,
    6: 59004,
    7: 66564,
    8: 74112,
}
MASSHEALTH_ADDITIONAL_PERSON_INCREMENT = 7560

SCHOOL_ALIASES = {
    "Benjamin Franklin Institute of Technology": "Franklin Cummings Tech",
    "Harvard Graduate School of Arts and Sciences": "Harvard University",
    "Harvard Divinity School": "Harvard University",
    "Harvard Graduate School of Education": "Harvard University",
    "Harvard Kennedy School": "Harvard University",
    "Harvard Law School": "Harvard University",
    "Harvard Medical School": "Harvard University",
    "Harvard School of Dental Medicine": "Harvard University",
    "Harvard T.H. Chan School of Public Health": "Harvard University",
    "Harvard University Graduate School of Design": "Harvard University",
    "Lasell College": "Lasell University",
    "New England Conservatory": "New England Conservatory of Music",
    "Simmons College": "Simmons University",
    "Suffolk University Boston": "Suffolk University",
    "Suffolk University Law School": "Suffolk University",
}

MASSGRANT_PLUS_ELIGIBLE_SCHOOLS = {
    "Bridgewater State University",
    "Fitchburg State University",
    "Framingham State University",
    "Massachusetts College of Art and Design",
    "Massachusetts College of Liberal Arts",
    "Massachusetts Maritime Academy",
    "Salem State University",
    "University of Massachusetts Amherst",
    "University of Massachusetts Boston",
    "University of Massachusetts Dartmouth",
    "University of Massachusetts Lowell",
    "Westfield State University",
    "Worcester State University",
}

MBTA_ELIGIBLE_SCHOOLS = {
    "Berklee College of Music",
    "Boston Architectural College",
    "Boston College",
    "Boston Graduate School of Psychoanalysis",
    "Boston University",
    "Bridgewater State University",
    "Bunker Hill Community College",
    "Curry College",
    "Emerson College",
    "Emmanuel College",
    "Endicott College",
    "Fisher College",
    "Franklin Cummings Tech",
    "Harvard University",
    "Hebrew College",
    "Lasell University",
    "Lesley University",
    "Longy School of Music of Bard College",
    "Massachusetts College of Art and Design",
    "Massachusetts Institute of Technology",
    "MCPHS University",
    "MGH Institute of Health Professions",
    "New England College of Optometry",
    "New England Conservatory of Music",
    "New England Law | Boston",
    "Northeastern University",
    "Quincy College",
    "Salem State University",
    "Simmons University",
    "Stonehill College",
    "Suffolk University",
    "Tufts University",
    "University of Massachusetts Boston",
    "Wentworth Institute of Technology",
}




# -----------------------------
# Friendly labels
# -----------------------------
FIELD_LABELS = {
    "student_status": "Student Status",
    "citizen_status": "Citizen Status",
    "residency_length": "Massachusetts Residency Status",
    "fafsa_completed": "FAFSA Completed",
    "prior_bachelors_degree": "Prior Bachelor's Degree",
    "massgrant_plus_income_band": "MASSGrant Plus Income Band",
    "work_study": "Work Study",
    "household_sizes": "Household Size",
    "household_size_exact": "Exact Household Size",
    "masshealth_income_under_limit": "MassHealth Income Threshold",
    "snap_income_under_limit": "SNAP Income Threshold",
    "school_name": "College or University",
}


def _resolve_logo_path() -> Path | None:
    candidate_paths = [
        Path(__file__).with_name("CommonDark.png"),
        Path(__file__).resolve().parents[2] / "src" / "assets" / "CommonDark.png",
    ]

    for candidate_path in candidate_paths:
        if candidate_path.exists():
            return candidate_path

    return None


LOGO_PATH = _resolve_logo_path()


def _normalize_school_name(value) -> str:
    if value is None:
        return ""

    trimmed = str(value).strip()
    if not trimmed:
        return ""

    return SCHOOL_ALIASES.get(trimmed, trimmed)


def _is_massgrant_plus_school_eligible(value) -> bool:
    school_name = _normalize_school_name(value)
    return bool(school_name) and school_name in MASSGRANT_PLUS_ELIGIBLE_SCHOOLS


def _is_mbta_school_eligible(value) -> bool:
    school_name = _normalize_school_name(value)
    return bool(school_name) and school_name in MBTA_ELIGIBLE_SCHOOLS


# -----------------------------
# HTTP helpers
# -----------------------------
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


def _detect_bucket_region(bucket: str) -> str:
    try:
        s3 = boto3.client("s3", region_name="us-east-1", config=Config(signature_version="s3v4"))
        loc = s3.get_bucket_location(Bucket=bucket).get("LocationConstraint")
        return loc or "us-east-1"
    except ClientError:
        return os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"


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


def _get_header(event: dict, name: str) -> str | None:
    headers = event.get("headers") or {}
    for k, v in headers.items():
        if str(k).lower() == name.lower():
            return v
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


def _get_http_method(event: dict) -> str:
    return (
        event.get("httpMethod")
        or event.get("requestContext", {}).get("http", {}).get("method")
        or ""
    ).upper()


# -----------------------------
# Fallback catalog
# -----------------------------
FALLBACK_CATALOG = {
    "pell-grant": {
        "id": "pell-grant",
        "title": "Federal Pell Grant",
        "category": "Education",
        "description": "A subsidy the U.S. federal government provides for students who need it to pay for college.",
        "officialUrl": "https://studentaid.gov/h/apply-for-aid/fafsa",
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Create an FSA ID",
            "Gather tax documents",
            "Complete the FAFSA form",
            "Review your Student Aid Report (SAR)",
        ],
    },
    "massgrant": {
        "id": "massgrant",
        "title": "MASSGrant",
        "category": "Education",
        "description": "Need-based grant for Massachusetts residents attending college in-state.",
        "officialUrl": "https://studentaid.gov/h/apply-for-aid/fafsa",
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Complete the FAFSA",
            "Be a Massachusetts resident",
            "Enroll in a Massachusetts college",
            "Maintain satisfactory academic progress",
            "Check award notification from your school",
        ],
    },
    "massgrant-plus": {
        "id": "massgrant-plus",
        "title": "MASSGrant Plus",
        "category": "Education",
        "description": "State grant that can reduce tuition and fees for eligible Massachusetts residents at participating public institutions.",
        "officialUrl": "https://studentaid.gov/h/apply-for-aid/fafsa",
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Complete the FAFSA",
            "Be a Massachusetts resident for at least 12 months for reasons other than education",
            "Attend a participating MASSGrant Plus school",
            "Not already hold a bachelor's degree",
            "Review eligibility with your financial aid office",
        ],
    },
    "masshealth": {
        "id": "masshealth",
        "title": "MassHealth",
        "category": "Health",
        "description": "Massachusetts Medicaid and CHIP program providing comprehensive health coverage for eligible residents.",
        "officialUrl": "https://www.mahix.org/individual/",
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Verify Massachusetts residency",
            "Gather income documentation",
            "Collect proof of identity and citizenship",
            "Apply online at MAhealthconnector.org",
            "Choose a MassHealth plan",
        ],
    },
    "mbta-pass": {
        "id": "mbta-pass",
        "title": "MBTA Student Pass",
        "category": "Transport",
        "description": "Discounted monthly passes for full-time students using MBTA services in the Greater Boston area.",
        "officialUrl": "https://www.mbta.com/fares/college-student-semester-passes",
        "officialButtonLabel": "Visit Official Site",
        "checklist": [
            "Get current student ID",
            "Verify full-time enrollment status",
            "Visit school transportation office or MBTA.com",
            "Purchase discounted semester or monthly pass",
            "Carry student ID when using pass",
        ],
    },
    "snap": {
        "id": "snap",
        "title": "SNAP (Food Stamps)",
        "category": "Food",
        "description": "Provides food purchasing assistance for low- and no-income people.",
        "officialUrl": "https://dtaconnect.eohhs.mass.gov/",
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Check student eligibility requirements",
            "Gather proof of enrollment",
            "Gather proof of income",
            "Submit application through state portal",
        ],
    },
}


def _normalize_catalog(data) -> dict:
    if not data:
        return {}

    if isinstance(data, dict) and "benefits" in data:
        data = data["benefits"]

    if isinstance(data, dict):
        normalized = {}
        for k, v in data.items():
            if isinstance(v, dict):
                benefit_id = v.get("id") or k
                normalized[str(benefit_id)] = {
                    **v,
                    "id": benefit_id,
                }
        return normalized

    if isinstance(data, list):
        normalized = {}
        for item in data:
            if isinstance(item, dict) and item.get("id"):
                normalized[str(item["id"])] = item
        return normalized

    return {}


def _merge_catalogs(base: dict, override: dict) -> dict:
    merged = dict(base)
    for bid, item in override.items():
        if bid in merged:
            merged[bid] = {
                **merged[bid],
                **item,
            }
        else:
            merged[bid] = item
    return merged


def _load_catalog(s3, bucket: str, key: str) -> dict:
    final_catalog = dict(FALLBACK_CATALOG)

    if not bucket:
        return final_catalog

    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
        raw = obj["Body"].read().decode("utf-8")
        parsed = json.loads(raw)

        normalized = _normalize_catalog(parsed)
        if normalized:
            final_catalog = _merge_catalogs(FALLBACK_CATALOG, normalized)

        return final_catalog
    except Exception:
        return final_catalog


# -----------------------------
# Matching logic
# -----------------------------
def _match_benefits(profile: dict) -> list[dict]:
    a = profile or {}

    def is_enrolled():
        return a.get("student_status") in ("full_time", "part_time")

    def is_student_or_future():
        return is_enrolled() or a.get("student_status") in ("future_full_time", "future_part_time")

    def get_massgrant_plus_enrollment_status():
        if a.get("student_status") in ("full_time", "future_full_time"):
            return "full_time"
        if a.get("student_status") in ("part_time", "future_part_time"):
            return "part_time"
        return None

    def get_exact_household_size():
        raw_household_size = a.get("household_sizes")
        if not raw_household_size:
            return None

        exact_value = a.get("household_size_exact") if raw_household_size == "9_plus" else raw_household_size
        try:
            parsed_value = int(exact_value)
        except (TypeError, ValueError):
            return None

        if parsed_value < 1:
            return None
        if raw_household_size == "9_plus" and parsed_value < 9:
            return None

        return parsed_value

    def get_income_threshold(program: str):
        household_size = get_exact_household_size()
        if not household_size:
            return None

        if program == "masshealth":
            thresholds = MASSHEALTH_THRESHOLDS
            increment = MASSHEALTH_ADDITIONAL_PERSON_INCREMENT
        else:
            thresholds = SNAP_THRESHOLDS
            increment = SNAP_ADDITIONAL_PERSON_INCREMENT

        if household_size <= 8:
            return thresholds.get(household_size)

        household_size_eight_threshold = thresholds.get(8)
        if household_size_eight_threshold is None:
            return None

        return household_size_eight_threshold + (household_size - 8) * increment

    def get_inferred_massgrant_plus_income_band():
        masshealth_threshold = get_income_threshold("masshealth")
        if (
            a.get("masshealth_income_under_limit") == "yes"
            and masshealth_threshold is not None
            and masshealth_threshold <= MASSGRANT_PLUS_UNDER_85K_LIMIT
        ):
            return "under_85k"

        snap_threshold = get_income_threshold("snap")
        if (
            a.get("snap_income_under_limit") == "yes"
            and snap_threshold is not None
            and snap_threshold * 12 <= MASSGRANT_PLUS_UNDER_85K_LIMIT
        ):
            return "under_85k"

        return None

    def get_effective_massgrant_plus_income_band():
        inferred_band = get_inferred_massgrant_plus_income_band()
        if inferred_band:
            return inferred_band

        explicit_band = a.get("massgrant_plus_income_band")
        if explicit_band in ("under_85k", "85k_to_100k", "over_100k"):
            return explicit_band

        return None

    def is_massgrant_plus_enrollment_eligible():
        enrollment_status = get_massgrant_plus_enrollment_status()
        income_band = get_effective_massgrant_plus_income_band()

        if not income_band or income_band == "over_100k":
            return False
        if income_band == "85k_to_100k":
            return enrollment_status == "full_time"
        if enrollment_status == "full_time":
            return True
        if enrollment_status == "part_time":
            return enrollment_status == "part_time"
        return False

    def is_massgrant_enrollment_eligible():
        return a.get("student_status") in ("full_time", "future_full_time")

    def is_massachusetts_resident():
        residency_length = a.get("residency_length")
        return bool(residency_length) and residency_length != "not_ma_resident"

    def has_qualifying_massgrant_residency():
        residency_length = a.get("residency_length")
        return bool(residency_length) and residency_length not in ("not_ma_resident", "under_12_months")

    def is_snap_income_eligible():
        return (
            a.get("masshealth_income_under_limit") == "yes"
            or a.get("snap_income_under_limit") == "yes"
        )

    matches: list[dict] = []

    if is_student_or_future() and a.get("citizen_status") == "yes":
        action = (
            "No action needed (already applied to FAFSA)"
            if a.get("fafsa_completed") == "yes"
            else "Action needed - Complete FAFSA"
        )
        matches.append({"id": "pell-grant", "actionStatus": action})

    if (
        is_massgrant_enrollment_eligible()
        and a.get("citizen_status") == "yes"
        and has_qualifying_massgrant_residency()
        and a.get("prior_bachelors_degree") == "no"
    ):
        action = (
            "No action needed (already applied to FAFSA)"
            if a.get("fafsa_completed") == "yes"
            else "Action needed - Complete FAFSA"
        )
        matches.append({"id": "massgrant", "actionStatus": action})

    if (
        a.get("citizen_status") == "yes"
        and has_qualifying_massgrant_residency()
        and a.get("prior_bachelors_degree") == "no"
        and _is_massgrant_plus_school_eligible(a.get("school_name"))
        and is_massgrant_plus_enrollment_eligible()
    ):
        action = (
            "No action needed (already applied to FAFSA)"
            if a.get("fafsa_completed") == "yes"
            else "Action needed - Complete FAFSA"
        )
        matches.append({"id": "massgrant-plus", "actionStatus": action})

    if (
        is_massachusetts_resident()
        and a.get("citizen_status") == "yes"
        and (a.get("work_study") == "yes" or is_snap_income_eligible())
    ):
        matches.append({
            "id": "snap",
            "actionStatus": "You likely qualify for SNAP. Apply through your state SNAP portal."
        })

    if (
        is_massachusetts_resident()
        and a.get("citizen_status") == "yes"
        and a.get("masshealth_income_under_limit") == "yes"
    ):
        matches.append({"id": "masshealth"})

    if is_student_or_future() and _is_mbta_school_eligible(a.get("school_name")):
        matches.append({"id": "mbta-pass"})

    seen = set()
    unique = []
    for m in matches:
        if m["id"] not in seen:
            seen.add(m["id"])
            unique.append(m)

    return unique


def _get_match_item(match: dict, catalog: dict) -> dict:
    benefit_id = ""
    if isinstance(match, dict):
        benefit_id = str(match.get("id") or "").strip()

    catalog_item = catalog.get(benefit_id, {}) if benefit_id else {}
    if not isinstance(catalog_item, dict):
        catalog_item = {}

    merged = dict(catalog_item)
    if isinstance(match, dict):
        merged.update(match)

    if benefit_id:
        merged["id"] = benefit_id

    checklist = merged.get("checklist")
    if not isinstance(checklist, list):
        merged["checklist"] = catalog_item.get("checklist") or []

    return merged


def _normalize_requested_matches(raw_matches, catalog: dict) -> list[dict]:
    normalized: list[dict] = []
    seen: set[str] = set()

    if not isinstance(raw_matches, list):
        return normalized

    for raw_match in raw_matches:
        if not isinstance(raw_match, dict):
            continue

        benefit_id = str(raw_match.get("id") or "").strip()
        if not benefit_id or benefit_id in seen:
            continue

        seen.add(benefit_id)
        normalized.append(_get_match_item({**raw_match, "id": benefit_id}, catalog))

    return normalized


# -----------------------------
# Checklist progress normalization
# -----------------------------
def _normalize_checklist_progress(checklist_progress: dict, matches: list[dict], catalog: dict) -> dict[str, list[bool]]:
    normalized: dict[str, list[bool]] = {}
    incoming = checklist_progress if isinstance(checklist_progress, dict) else {}

    for m in matches:
        match_item = _get_match_item(m, catalog)
        benefit_id = match_item["id"]
        checklist = match_item.get("checklist") or []
        raw_progress = incoming.get(benefit_id, [])

        if not isinstance(raw_progress, list):
            raw_progress = []

        normalized[benefit_id] = [
            bool(raw_progress[i]) if i < len(raw_progress) else False
            for i in range(len(checklist))
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


# -----------------------------
# PDF helpers
# -----------------------------
PROFILE_LABELS = {
    "student_status": "Student status",
    "citizen_status": "Citizen / eligible non-citizen",
    "residency_length": "Massachusetts residency status",
    "fafsa_completed": "FAFSA completed",
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
    "residency_length": {
        "not_ma_resident": "Not a Massachusetts resident",
        "under_12_months": "Less than 12 months",
        "one_to_five_years": "12 months or more",
        "over_five_years": "12 months or more",
    },
    "fafsa_completed": {"yes": "Yes", "no": "No"},
    "prior_bachelors_degree": {"yes": "Yes", "no": "No"},
    "massgrant_plus_income_band": {
        "under_85k": "Less than $85,000 per year before taxes",
        "85k_to_100k": "$85,000 to $100,000 per year before taxes",
        "over_100k": "More than $100,000 per year before taxes",
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


def _friendly_profile_value(key: str, value):
    if value is None:
        return ""
    mapping = PROFILE_VALUE_LABELS.get(key, {})
    return mapping.get(value, str(value))


def _wrap_text(c, text: str, max_width: float, font_name="Helvetica", font_size=11) -> list[str]:
    c.setFont(font_name, font_size)
    words = (text or "").split()
    lines = []
    cur = ""

    for w in words:
        test = (cur + " " + w).strip()
        if c.stringWidth(test, font_name, font_size) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w

    if cur:
        lines.append(cur)

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

    text_x = 0.75 * inch
    logo_baseline_y = height - 0.66 * inch
    logo_height = 0.34 * inch

    if LOGO_PATH is not None:
        try:
            logo = ImageReader(str(LOGO_PATH))
            image_width, image_height = logo.getSize()
            rendered_logo_width = logo_height * (image_width / image_height)
            c.drawImage(
                logo,
                text_x,
                logo_baseline_y,
                width=rendered_logo_width,
                height=logo_height,
                mask='auto',
                preserveAspectRatio=True,
            )
            text_x += rendered_logo_width + 0.18 * inch
        except Exception:
            pass

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(text_x, height - 0.51 * inch, "Application Preparation Checklist Packet")
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


def _draw_bullet_text(c, x, y, label, value, max_label_width=155):
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


def _build_pdf_bytes(
    run_id: str,
    profile: dict,
    matches: list[dict],
    catalog: dict,
    checklist_progress: dict[str, list[bool]],
) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    margin_x = 0.75 * inch

    # Page 1
    _draw_header_band(c, width, height)
    y = height - 1.15 * inch

    y = _draw_small_meta(
        c,
        margin_x,
        y,
        f"Run ID: {run_id}",
        f"UTC: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}"
    )

    y -= 8
    y = _draw_section_title(c, margin_x, y, "Profile Summary")

    ordered_keys = [
        "student_status",
        "citizen_status",
        "school_name",
        "residency_length",
        "fafsa_completed",
        "work_study",
        "household_sizes",
        "household_size_exact",
        "masshealth_income_under_limit",
        "snap_income_under_limit",
        "massgrant_plus_income_band",
        "prior_bachelors_degree",
    ]
    for k in ordered_keys:
        if k in profile:
            y = _ensure_space(c, y, height, 22)
            label = PROFILE_LABELS.get(k, k)
            value = _friendly_profile_value(k, profile.get(k))
            y = _draw_bullet_text(c, margin_x, y, label, value)

    y -= 14
    y = _draw_section_title(c, margin_x, y, "Matched Benefits")

    if not matches:
        c.setFont("Helvetica", 10)
        c.drawString(margin_x, y, "No matched benefits based on the submitted profile.")
        y -= 14
    else:
        for m in matches:
            bid = m["id"]
            item = _get_match_item(m, catalog)
            title = item.get("title", bid)
            desc = item.get("description", "")
            action = item.get("actionStatus", "")

            y = _ensure_space(c, y, height, 82)

            c.setFont("Helvetica-Bold", 11)
            c.setFillColor(colors.HexColor("#111827"))
            c.drawString(margin_x, y, title)

            if action:
                pill_x = margin_x + 170
                max_pill_width = width - margin_x - pill_x
                shortened_action = action
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
                    y + 2,
                    shortened_action,
                    good=("No action needed" in action),
                )

            y -= 17

            c.setFont("Helvetica", 9)
            c.setFillColor(colors.HexColor("#374151"))
            for line in _wrap_text(c, desc, width - 2 * margin_x - 12, font_size=9):
                c.drawString(margin_x + 12, y, line)
                y -= 12

            y -= 10

    # Page 2+
    _new_page(c)
    _draw_header_band(c, width, height)
    y = height - 1.15 * inch
    y = _draw_section_title(c, margin_x, y, "Application Checklists")

    if not matches:
        c.setFont("Helvetica", 10)
        c.drawString(margin_x, y, "No checklist items available.")
    else:
        for m in matches:
            bid = m["id"]
            item = _get_match_item(m, catalog)
            title = item.get("title", bid)
            checklist = item.get("checklist") or []
            progress = checklist_progress.get(bid, [False] * len(checklist))

            if not checklist:
                continue

            completed = sum(1 for x in progress if x)
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
    return buf.getvalue()


# -----------------------------
# Lambda entry
# -----------------------------
def lambda_handler(event, context):
    method = _get_http_method(event or {})
    if method == "OPTIONS":
        return _resp(200, "", event=event, content_type="text/plain")

    if REQUIRE_SHARED_SECRET:
        header_val = _get_header(event or {}, SHARED_SECRET_HEADER)
        if not SHARED_SECRET_VALUE or header_val != SHARED_SECRET_VALUE:
            return _resp(403, {"error": "Forbidden"}, event=event)

    payload = _parse_payload(event)

    profile = payload.get("profile") or {}
    selected = payload.get("selectedBenefits") or payload.get("selected_benefits") or []
    checklist_progress = payload.get("checklistProgress") or payload.get("checklist_progress") or {}
    requested_matches = payload.get("matchedBenefits")
    if requested_matches is None:
        requested_matches = payload.get("matched_benefits")

    if not isinstance(profile, dict):
        return _resp(400, {"error": "profile must be an object"}, event=event)

    if selected is not None and not isinstance(selected, list):
        return _resp(400, {"error": "selectedBenefits must be a list if provided"}, event=event)

    if checklist_progress is not None and not isinstance(checklist_progress, dict):
        return _resp(400, {"error": "checklistProgress must be an object if provided"}, event=event)

    if requested_matches is not None and not isinstance(requested_matches, list):
        return _resp(400, {"error": "matchedBenefits must be a list if provided"}, event=event)

    region_source_bucket = PACKETS_BUCKET or RULES_BUCKET
    region = (
        _detect_bucket_region(region_source_bucket)
        if region_source_bucket
        else os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    )

    s3 = None
    if PACKETS_BUCKET or RULES_BUCKET:
        s3 = boto3.client(
            "s3",
            region_name=region,
            config=Config(signature_version="s3v4", retries={"max_attempts": 2}),
        )

    catalog = _load_catalog(s3, RULES_BUCKET, BENEFITS_CATALOG_KEY) if s3 else dict(FALLBACK_CATALOG)

    if requested_matches is not None:
        matches = _normalize_requested_matches(requested_matches, catalog)
    else:
        matches = _normalize_requested_matches(_match_benefits(profile), catalog)

    if selected:
        selected_set = {str(x) for x in selected}
        matches = [m for m in matches if m["id"] in selected_set]

    normalized_progress = _normalize_checklist_progress(checklist_progress, matches, catalog)

    run_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    key = f"{PACKETS_PREFIX}{ts}-{run_id}.pdf"

    pdf_bytes = _build_pdf_bytes(
        run_id=run_id,
        profile=profile,
        matches=matches,
        catalog=catalog,
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


