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


# -----------------------------
# Env vars
# -----------------------------
PACKETS_BUCKET = os.environ.get("PACKETS_BUCKET", "")
PACKETS_PREFIX = os.environ.get("PACKETS_PREFIX", "packets/")
URL_EXPIRES_SECONDS = int(os.environ.get("URL_EXPIRES_SECONDS", "300"))

# Optional: where the benefit catalog lives (recommended)
RULES_BUCKET = os.environ.get("RULES_BUCKET", "")
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json")

# Optional: lock down who can call this (simple shared secret)
REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret")
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "")


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

    # Minimal CORS safety net (API Gateway should also enforce)
    # Can set ALLOWED_ORIGIN to CloudFront domain.
    allowed_origin = os.environ.get("ALLOWED_ORIGIN")
    if allowed_origin:
        headers["Access-Control-Allow-Origin"] = allowed_origin
        headers["Vary"] = "Origin"
        headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization," + SHARED_SECRET_HEADER
        headers["Access-Control-Allow-Methods"] = "POST,OPTIONS"

    if extra_headers:
        headers.update(extra_headers)

    return {"statusCode": status_code, "headers": headers, "body": body}


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
    # headers can be mixed-case depending on gateway
    for k, v in headers.items():
        if k.lower() == name.lower():
            return v
    return None


# -----------------------------
# Benefits catalog (server-side)
# -----------------------------
FALLBACK_CATALOG = {
    "pell-grant": {
        "title": "Federal Pell Grant",
        "category": "Education",
        "description": "A subsidy the U.S. federal government provides for students who need it to pay for college.",
        "checklist": [
            "Create an FSA ID",
            "Gather tax documents",
            "Complete the FAFSA form",
            "Review your Student Aid Report (SAR)",
        ],
    },
    "massgrant": {
        "title": "MASSGrant",
        "category": "Education",
        "description": "Need-based grant for Massachusetts residents attending college in-state.",
        "checklist": [
            "Complete the FAFSA",
            "Be a Massachusetts resident",
            "Enroll in a Massachusetts college",
            "Maintain satisfactory academic progress",
            "Check award notification from your school",
        ],
    },
    "massgrant-plus": {
        "title": "MASSGrant Plus",
        "category": "Education",
        "description": "Additional need-based grant for Massachusetts residents with exceptional financial need.",
        "checklist": [
            "Complete the FAFSA",
            "Demonstrate Expected Family Contribution (EFC) of $0",
            "Enroll full-time at a Massachusetts public college",
            "Maintain good academic standing",
            "Review eligibility with financial aid office",
        ],
    },
    "masshealth": {
        "title": "MassHealth",
        "category": "Health",
        "description": "Massachusetts Medicaid and CHIP program providing health coverage for eligible residents.",
        "checklist": [
            "Verify Massachusetts residency",
            "Gather income documentation",
            "Collect proof of identity and citizenship",
            "Apply online at MAhealthconnector.org",
            "Choose a MassHealth plan",
        ],
    },
    "mbta-pass": {
        "title": "MBTA Student Pass",
        "category": "Transport",
        "description": "Discounted monthly passes for eligible students using MBTA services.",
        "checklist": [
            "Get current student ID",
            "Verify full-time enrollment status",
            "Visit school transportation office or MBTA.com",
            "Purchase discounted semester or monthly pass",
            "Carry student ID when using pass",
        ],
    },
    "snap": {
        "title": "SNAP (Food Stamps)",
        "category": "Food",
        "description": "Provides food purchasing assistance for low- and no-income people.",
        "checklist": [
            "Check student eligibility requirements",
            "Gather proof of enrollment",
            "Gather proof of income",
            "Submit application through state portal",
        ],
    },
}


def _load_catalog(s3, bucket: str, key: str) -> dict:
    if not bucket:
        return FALLBACK_CATALOG
    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
        raw = obj["Body"].read().decode("utf-8")
        data = json.loads(raw)
        # Accept either {id:{...}} or {"benefits":{id:{...}}}
        if isinstance(data, dict) and "benefits" in data and isinstance(data["benefits"], dict):
            return data["benefits"]
        if isinstance(data, dict):
            return data
        return FALLBACK_CATALOG
    except Exception:
        return FALLBACK_CATALOG


# -----------------------------
# Server-side matching (mirror BenefitsContext rules)
# -----------------------------
def _match_benefits(profile: dict) -> list[dict]:
    """
    Returns list of matches:
      [{"id": "...", "actionStatus": "...optional..."}]
    """
    a = profile or {}

    def is_enrolled():
        return a.get("student_status") in ("full_time", "part_time")

    def is_full_time():
        return a.get("student_status") == "full_time"

    matches: list[dict] = []

    # Pell Grant: enrolled AND citizen_status == yes
    if is_enrolled() and a.get("citizen_status") == "yes":
        action = "No action needed (already applied to FAFSA)" if a.get("fafsa_completed") == "yes" else "Action needed - Complete FAFSA"
        matches.append({"id": "pell-grant", "actionStatus": action})

    # MASSGrant: enrolled AND ma_resident yes AND citizen yes
    if is_enrolled() and a.get("ma_resident") == "yes" and a.get("citizen_status") == "yes":
        action = "No action needed (already applied to FAFSA)" if a.get("fafsa_completed") == "yes" else "Action needed - Complete FAFSA"
        matches.append({"id": "massgrant", "actionStatus": action})

    # MASSGrant Plus: full-time AND ma_resident yes AND citizen yes AND income low
    if is_full_time() and a.get("ma_resident") == "yes" and a.get("citizen_status") == "yes" and a.get("income_level") == "low":
        action = "No action needed (already applied to FAFSA)" if a.get("fafsa_completed") == "yes" else "Action needed - Complete FAFSA"
        matches.append({"id": "massgrant-plus", "actionStatus": action})

    # SNAP: ma_resident yes AND income low/medium AND (work_study yes OR income low)
     if (
        a.get("ma_resident") == "yes"
        and a.get("income_level") == 'low'
       #or (a.get("age") > 60 and a.get("income_level") == "medium")   #Later on if frontend add age
        or (a.get("work_study") == "yes" and a.get("income_level") == "medium")
     ):
            
        action = "You likely qualify for SNAP. Apply through your state SNAP portal."
        matches.append({"id": "snap", "actionStatus": action})

    # MassHealth: ma_resident yes AND citizen yes AND income low/medium
    if a.get("ma_resident") == "yes" and a.get("citizen_status") == "yes" and a.get("income_level") in ("low", "medium"):
        matches.append({"id": "masshealth"})

    # MBTA Student Pass: enrolled AND transportation yes/sometimes
    if is_enrolled() and a.get("transportation") in ("yes", "sometimes"):
        matches.append({"id": "mbta-pass"})

    # de-dupe preserving order
    seen = set()
    unique = []
    for m in matches:
        if m["id"] not in seen:
            seen.add(m["id"])
            unique.append(m)
    return unique


# -----------------------------
# PDF generation
# -----------------------------
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


def _draw_heading(c, x, y, text):
    c.setFont("Helvetica-Bold", 16)
    c.drawString(x, y, text)
    return y - 18


def _draw_subheading(c, x, y, text):
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, text)
    return y - 14


def _build_pdf_bytes(run_id: str, profile: dict, matches: list[dict], catalog: dict) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    margin_x = 0.75 * inch
    y = height - 0.9 * inch

    # Title
    y = _draw_heading(c, margin_x, y, "CommonMASS Packet")
    c.setFont("Helvetica", 10)
    c.drawString(margin_x, y, f"Run ID: {run_id}")
    y -= 12
    c.drawString(margin_x, y, f"Generated (UTC): {datetime.now(timezone.utc).isoformat()}")
    y -= 20

    # Profile summary (non-sensitive; only using screener answers)
    y = _draw_subheading(c, margin_x, y, "Profile Summary")
    c.setFont("Helvetica", 10)

    # Only include known fields to avoid dumping unexpected data
    ordered_keys = [
        "student_status",
        "citizen_status",
        "ma_resident",
        "fafsa_completed",
        "work_study",
        "income_level",
        "transportation",
        "housing_status",
        "dependent_status",
        "health_insurance",
    ]
    for k in ordered_keys:
        if k in (profile or {}):
            v = profile.get(k)
            c.drawString(margin_x, y, f"- {k}: {v}")
            y -= 12
            if y < 1.0 * inch:
                c.showPage()
                y = height - 0.9 * inch

    y -= 8

    # Matches
    y = _draw_subheading(c, margin_x, y, "Matched Benefits (server-side)")
    if not matches:
        c.setFont("Helvetica", 11)
        c.drawString(margin_x, y, "No matches based on the provided profile.")
        y -= 16
    else:
        for m in matches:
            bid = m["id"]
            item = catalog.get(bid, {"title": bid})
            title = item.get("title", bid)
            action = m.get("actionStatus")

            c.setFont("Helvetica-Bold", 11)
            c.drawString(margin_x, y, f"• {title}")
            y -= 13

            if action:
                c.setFont("Helvetica", 10)
                c.drawString(margin_x + 14, y, f"Status: {action}")
                y -= 12

            desc = item.get("description") or ""
            if desc:
                c.setFont("Helvetica", 10)
                for line in _wrap_text(c, desc, max_width=width - 2 * margin_x - 14, font_size=10):
                    c.drawString(margin_x + 14, y, line)
                    y -= 12
                    if y < 1.0 * inch:
                        c.showPage()
                        y = height - 0.9 * inch

            y -= 6
            if y < 1.0 * inch:
                c.showPage()
                y = height - 0.9 * inch

    # Checklists
    if matches:
        c.showPage()
        y = height - 0.9 * inch
        y = _draw_heading(c, margin_x, y, "Application Checklists")
        y -= 6

        for m in matches:
            bid = m["id"]
            item = catalog.get(bid, None)
            if not item:
                continue

            title = item.get("title", bid)
            checklist = item.get("checklist") or []

            y = _draw_subheading(c, margin_x, y, title)
            c.setFont("Helvetica", 11)

            if not checklist:
                c.drawString(margin_x, y, "No checklist available.")
                y -= 14
            else:
                for step in checklist:
                    # draw checkbox square
                    c.rect(margin_x, y - 9, 9, 9, stroke=1, fill=0)
                    for line in _wrap_text(c, step, max_width=width - 2 * margin_x - 18, font_size=11):
                        c.drawString(margin_x + 14, y - 7, line)
                        y -= 14
                        if y < 1.0 * inch:
                            c.showPage()
                            y = height - 0.9 * inch

            y -= 10
            if y < 1.0 * inch:
                c.showPage()
                y = height - 0.9 * inch

    c.setTitle("CommonMASS Packet")
    c.save()
    return buf.getvalue()


# -----------------------------
# Lambda entry
# -----------------------------
def lambda_handler(event, context):
    # Preflight (if we enable ALLOWED_ORIGIN)
    if isinstance(event, dict) and event.get("requestContext") and event.get("httpMethod") == "OPTIONS":
        return _resp(200, "", content_type="text/plain")

    if not PACKETS_BUCKET:
        return _resp(500, {"error": "PACKETS_BUCKET env var not set"})

    # Optional shared-secret gate
    if REQUIRE_SHARED_SECRET:
        header_val = _get_header(event or {}, SHARED_SECRET_HEADER)
        if not SHARED_SECRET_VALUE or header_val != SHARED_SECRET_VALUE:
            return _resp(403, {"error": "Forbidden"})

    payload = _parse_payload(event)
    profile = payload.get("profile") or {}
    selected = payload.get("selectedBenefits") or payload.get("selected_benefits") or []

    # Basic validation
    if not isinstance(profile, dict):
        return _resp(400, {"error": "profile must be an object"})
    if selected is not None and not isinstance(selected, list):
        return _resp(400, {"error": "selectedBenefits must be a list if provided"})

    region = _detect_bucket_region(PACKETS_BUCKET)

    s3 = boto3.client(
        "s3",
        region_name=region,
        config=Config(signature_version="s3v4", retries={"max_attempts": 2}),
    )

    # Load benefit catalog (rules bucket) if available
    catalog = _load_catalog(s3, RULES_BUCKET, BENEFITS_CATALOG_KEY)

    # Server-side matching
    matches = _match_benefits(profile)

    # If selectedBenefits were provided, optionally filter matches to those only
    # (Keeps UI/packet aligned if we only want packet for shown benefits)
    if selected:
        selected_set = set(str(x) for x in selected)
        matches = [m for m in matches if m["id"] in selected_set]

    run_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    key = f"{PACKETS_PREFIX}{ts}-{run_id}.pdf"

    pdf_bytes = _build_pdf_bytes(run_id, profile, matches, catalog)

    try:
        s3.put_object(
            Bucket=PACKETS_BUCKET,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            CacheControl="no-store",
            ServerSideEncryption="AES256",  # SSE-S3
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
        content_type="application/json",
    )
