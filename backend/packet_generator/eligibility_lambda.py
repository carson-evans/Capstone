import json
import os

import boto3
from botocore.config import Config

from commonmass_backend import (
    detect_bucket_region,
    load_catalog,
    match_benefits,
    normalize_requested_matches,
)

RULES_BUCKET = os.environ.get("RULES_BUCKET", "")
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json")

REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret")
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "")


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

    if not isinstance(profile, dict):
        return _resp(400, {"error": "profile must be an object"}, event=event)

    region = detect_bucket_region(RULES_BUCKET)
    s3 = None

    if RULES_BUCKET:
        s3 = boto3.client(
            "s3",
            region_name=region,
            config=Config(signature_version="s3v4", retries={"max_attempts": 2}),
        )

    catalog = load_catalog(s3, RULES_BUCKET, BENEFITS_CATALOG_KEY)
    matched_benefits = normalize_requested_matches(match_benefits(profile), catalog)

    return _resp(
        200,
        {
            "matchedBenefits": matched_benefits,
            "matched_benefits": matched_benefits,
        },
        event=event,
    )