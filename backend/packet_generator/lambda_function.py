import os
import json
import uuid
import boto3
from io import BytesIO
from datetime import datetime, timezone
from botocore.config import Config
from botocore.exceptions import ClientError

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors


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


# -----------------------------
# Friendly labels
# -----------------------------
FIELD_LABELS = {
    "student_status": "Student Status",
    "citizen_status": "Citizen Status",
    "ma_resident": "Massachusetts Resident",
    "fafsa_completed": "FAFSA Completed",
    "work_study": "Work Study",
    "income_level": "Income Level",
    "transportation": "Transportation Need",
    "housing_status": "Housing Status",
    "dependent_status": "Dependent Status",
    "health_insurance": "Health Insurance",
}


# -----------------------------
# HTTP helpers
# -----------------------------
def _resp(status_code: int, body, content_type: str = "application/json", extra_headers: dict | None = None):
    if body is None:
        body = ""
    if not isinstance(body, str):
        body = json.dumps(body)

    headers = {
        "Content-Type": content_type,
        "Cache-Control": "no-store",
    }

    allowed_origin = os.environ.get("ALLOWED_ORIGIN")
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
        "description": "Additional need-based grant for Massachusetts residents with exceptional financial need.",
        "officialUrl": "https://studentaid.gov/h/apply-for-aid/fafsa",
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Complete the FAFSA",
            "Demonstrate exceptional financial need",
            "Enroll full-time at a Massachusetts public college",
            "Maintain good academic standing",
            "Review eligibility with financial aid office",
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

    def is_full_time():
        return a.get("student_status") == "full_time"

    matches: list[dict] = []

    if is_enrolled() and a.get("citizen_status") == "yes":
        action = (
            "No action needed (already applied to FAFSA)"
            if a.get("fafsa_completed") == "yes"
            else "Action needed - Complete FAFSA"
        )
        matches.append({"id": "pell-grant", "actionStatus": action})

    if is_enrolled() and a.get("ma_resident") == "yes" and a.get("citizen_status") == "yes":
        action = (
            "No action needed (already applied to FAFSA)"
            if a.get("fafsa_completed") == "yes"
            else "Action needed - Complete FAFSA"
        )
        matches.append({"id": "massgrant", "actionStatus": action})

    if (
        is_full_time()
        and a.get("ma_resident") == "yes"
        and a.get("citizen_status") == "yes"
        and a.get("income_level") == "low"
    ):
        action = (
            "No action needed (already applied to FAFSA)"
            if a.get("fafsa_completed") == "yes"
            else "Action needed - Complete FAFSA"
        )
        matches.append({"id": "massgrant-plus", "actionStatus": action})

    if (
        a.get("ma_resident") == "yes"
        and a.get("income_level") in ("low", "medium")
        and (a.get("work_study") == "yes" or a.get("income_level") == "low")
    ):
        matches.append({
            "id": "snap",
            "actionStatus": "You likely qualify for SNAP. Apply through your state SNAP portal."
        })

    if (
        a.get("ma_resident") == "yes"
        and a.get("citizen_status") == "yes"
        and a.get("income_level") in ("low", "medium")
    ):
        matches.append({"id": "masshealth"})

    if is_enrolled() and a.get("transportation") in ("yes", "sometimes"):
        matches.append({"id": "mbta-pass"})

    seen = set()
    unique = []
    for m in matches:
        if m["id"] not in seen:
            seen.add(m["id"])
            unique.append(m)

    return unique


# -----------------------------
# Checklist progress normalization
# -----------------------------
def _normalize_checklist_progress(checklist_progress: dict, matches: list[dict], catalog: dict) -> dict[str, list[bool]]:
    normalized: dict[str, list[bool]] = {}
    incoming = checklist_progress if isinstance(checklist_progress, dict) else {}

    for m in matches:
        benefit_id = m["id"]
        checklist = catalog.get(benefit_id, {}).get("checklist") or []
        raw_progress = incoming.get(benefit_id, [])

        if not isinstance(raw_progress, list):
            raw_progress = []

        normalized[benefit_id] = [
            bool(raw_progress[i]) if i < len(raw_progress) else False
            for i in range(len(checklist))
        ]

    return normalized


# -----------------------------
# PDF helpers
# -----------------------------
PROFILE_LABELS = {
    "student_status": "Student status",
    "citizen_status": "Citizen / eligible non-citizen",
    "ma_resident": "Massachusetts resident",
    "fafsa_completed": "FAFSA completed",
    "work_study": "Federal work-study",
    "income_level": "Estimated annual income",
    "transportation": "Uses public transportation",
    "housing_status": "Housing status",
    "dependent_status": "Claimed as dependent",
    "health_insurance": "Health insurance",
}

PROFILE_VALUE_LABELS = {
    "student_status": {"full_time": "Yes, full-time", "part_time": "Yes, part-time", "no": "No"},
    "citizen_status": {"yes": "Yes", "no": "No"},
    "ma_resident": {"yes": "Yes", "no": "No"},
    "fafsa_completed": {"yes": "Yes", "no": "No"},
    "work_study": {"yes": "Yes", "no": "No"},
    "income_level": {"low": "Below $20,000", "medium": "Between $20,000 and $40,000", "high": "Above $40,000"},
    "transportation": {"yes": "Yes, regularly", "sometimes": "Sometimes", "no": "No"},
    "housing_status": {"on_campus": "On-campus housing", "off_campus": "Off-campus (renting)", "family": "Living with family"},
    "dependent_status": {"yes": "Yes", "no": "No"},
    "health_insurance": {"parents": "Yes, through parents", "school": "Yes, through school", "no": "No"},
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

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(0.75 * inch, height - 0.52 * inch, "CommonMASS Packet")

    c.setFont("Helvetica", 9)
    c.drawRightString(width - 0.75 * inch, height - 0.52 * inch, "Generated Benefit Summary")

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
        c.drawString(x + 2, y - 8, "✓")
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

    # -----------------------------
    # Page 1
    # -----------------------------
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
    y = _draw_section_title(c, margin_x, y, "Application Checklists")

    # -----------------------------
    # Page 2+
    # -----------------------------

    if not matches:
        c.setFont("Helvetica", 10)
        c.drawString(margin_x, y, "No checklist items available.")
    else:
        for m in matches:
            bid = m["id"]
            item = catalog.get(bid, {})
            title = item.get("title", bid)
            checklist = item.get("checklist") or []
            progress = checklist_progress.get(bid, [False] * len(checklist))
            ordered_items = list(zip(checklist, progress))

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

            for step, checked in ordered_items:

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

    c.setTitle("CommonMASS Packet")
    c.save()
    return buf.getvalue()



# -----------------------------
# Lambda entry
# -----------------------------
def lambda_handler(event, context):
    method = _get_http_method(event or {})
    if method == "OPTIONS":
        return _resp(200, "", content_type="text/plain")

    if not PACKETS_BUCKET:
        return _resp(500, {"error": "PACKETS_BUCKET env var not set"})

    if REQUIRE_SHARED_SECRET:
        header_val = _get_header(event or {}, SHARED_SECRET_HEADER)
        if not SHARED_SECRET_VALUE or header_val != SHARED_SECRET_VALUE:
            return _resp(403, {"error": "Forbidden"})

    payload = _parse_payload(event)

    profile = payload.get("profile") or {}
    selected = payload.get("selectedBenefits") or payload.get("selected_benefits") or []
    checklist_progress = payload.get("checklistProgress") or payload.get("checklist_progress") or {}

    if not isinstance(profile, dict):
        return _resp(400, {"error": "profile must be an object"})

    if selected is not None and not isinstance(selected, list):
        return _resp(400, {"error": "selectedBenefits must be a list if provided"})
    if checklist_progress is not None and not isinstance(checklist_progress, dict):
        return _resp(400, {"error": "checklistProgress must be an object if provided"})

    if checklist_state is not None and not isinstance(checklist_state, dict):
        return _resp(400, {"error": "checklistState must be an object if provided"})

    region = _detect_bucket_region(PACKETS_BUCKET)

    s3 = boto3.client(
        "s3",
        region_name=region,
        config=Config(signature_version="s3v4", retries={"max_attempts": 2}),
    )

    catalog = _load_catalog(s3, RULES_BUCKET, BENEFITS_CATALOG_KEY)

    matches = _match_benefits(profile)

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

    try:
        s3.put_object(
            Bucket=PACKETS_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            CacheControl="no-store",
            ServerSideEncryption="AES256",
        )
    except ClientError as e:
        return _resp(500, {"error": "Failed to write PDF to S3", "details": str(e)})

    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": PACKETS_BUCKET, "Key": key},
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
    )
