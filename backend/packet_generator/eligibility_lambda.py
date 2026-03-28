import os

import boto3
from botocore.config import Config

from commonmass_backend import (
    build_response,
    detect_bucket_region,
    get_authoritative_matches,
    get_http_method,
    load_catalog,
    parse_json_payload,
    sanitize_profile,
    sanitize_selected_benefits,
    secret_is_valid,
    validate_json_request,
)

RULES_BUCKET = os.environ.get("RULES_BUCKET", "")
BENEFITS_CATALOG_KEY = os.environ.get("BENEFITS_CATALOG_KEY", "benefits/catalog.json")

REQUIRE_SHARED_SECRET = os.environ.get("REQUIRE_SHARED_SECRET", "false").lower() == "true"
SHARED_SECRET_HEADER = os.environ.get("SHARED_SECRET_HEADER", "x-commonmass-secret")
SHARED_SECRET_VALUE = os.environ.get("SHARED_SECRET_VALUE", "")
MAX_BODY_BYTES = int(os.environ.get("MAX_BODY_BYTES", "32768"))


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

    if not isinstance(profile, dict):
        return build_response(400, {"error": "profile must be an object"}, event=event)

    if selected is not None and not isinstance(selected, list):
        return build_response(400, {"error": "selectedBenefits must be a list if provided"}, event=event)

    safe_profile = sanitize_profile(profile)

    region = detect_bucket_region(RULES_BUCKET)
    s3 = None

    if RULES_BUCKET:
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
    matched_benefits = get_authoritative_matches(
        safe_profile,
        catalog,
        selected_benefit_ids=safe_selected,
    )

    extra_headers = {}
    if context and getattr(context, "aws_request_id", None):
        extra_headers["X-Request-Id"] = context.aws_request_id

    return build_response(
        200,
        {
            "matchedBenefits": matched_benefits,
            "matched_benefits": matched_benefits,
        },
        event=event,
        extra_headers=extra_headers,
    )