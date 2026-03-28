import json
import os

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

MASSGRANT_PLUS_UNDER_85K_LIMIT = 85000

FAFSA_URL = "https://studentaid.gov/h/apply-for-aid/fafsa"
FAFSA_STATUS_URL = "https://studentaid.gov/fsa-id/sign-in/landing?redirectTo=%2Fmy-activity"

MASFA_START_URL = "https://www.mass.edu/osfa/students/masfa.asp"
MASFA_STATUS_URL = "https://madhestudentxprod.regenteducation.net/signin"

DHE_TUITION_EQUITY_FORM_URL = (
    "https://www.mass.edu/tuitionequity/documents/2025-09-10%20Tuition%20Equity%20Form%20and%20Affidavit_Fillable.pdf"
)
DHE_AFFIDAVIT_ACTION_STATUS = "Action Needed, Complete DHE Affidavit"
NO_ACTION_ALREADY_COMPLETED_STATUS = "No Action Needed - Already Completed"
NOT_ENROLLED_NEXT_ACADEMIC_YEAR_VALUE = "not_enrolled_next_year"
COMPLETE_DHE_AFFIDAVIT_CHECKLIST_ITEM = "Complete the DHE Tuition Equity Form and Affidavit"
PROVIDE_DHE_AFFIDAVIT_CHECKLIST_ITEM = "Provide the completed DHE Tuition Equity Form and Affidavit"

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

FALLBACK_CATALOG = {
    "pell-grant": {
        "id": "pell-grant",
        "title": "Federal Pell Grant",
        "description": "A subsidy the U.S. federal government provides for students who need it to pay for college.",
        "details": "The Pell Grant is federal gift aid, which means it usually does not need to be repaid. Your school determines the final amount based on your FAFSA information, enrollment status, and cost of attendance. You can start and manage the form through [StudentAid.gov](https://studentaid.gov/h/apply-for-aid/fafsa).",
        "category": "Education",
        "officialUrl": FAFSA_URL,
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
        "description": "Need-based grant for Massachusetts residents attending college in-state. Awards range from $300 to $1,900 per year.",
        "details": "MASSGrant is state financial aid for eligible Massachusetts residents enrolled at approved in-state colleges. Depending on your eligibility, schools may review you through the [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) or the [MASFA](https://www.mass.edu/osfa/students/masfa.asp). Students using MASFA may need the [DHE Tuition Equity Form and Affidavit](https://www.mass.edu/tuitionequity/documents/2025-09-10%20Tuition%20Equity%20Form%20and%20Affidavit_Fillable.pdf) if they cannot provide the other listed documentation.",
        "category": "Education",
        "officialUrl": FAFSA_URL,
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Complete the FAFSA or MASFA",
            "Be a Massachusetts resident",
            "Enroll in a Massachusetts college",
            "Maintain satisfactory academic progress",
            "Check award notification from your school",
        ],
    },
    "massgrant-plus": {
        "id": "massgrant-plus",
        "title": "MASSGrant Plus",
        "description": "State grant that can reduce tuition and fees for eligible Massachusetts residents at participating public institutions.",
        "details": "This screener treats MASSGrant Plus as requiring Massachusetts residency for at least 12 months for reasons other than education before the academic year, attendance at a participating MASSGrant Plus school, at least 6 credits when family income is below $85,000, at least 12 credits when family income is $85,000 to $100,000, no prior bachelor's degree, and the correct state-aid application path through [FAFSA](https://studentaid.gov/h/apply-for-aid/fafsa) or [MASFA](https://www.mass.edu/osfa/students/masfa.asp). Students using MASFA may need the [DHE Tuition Equity Form and Affidavit](https://www.mass.edu/tuitionequity/documents/2025-09-10%20Tuition%20Equity%20Form%20and%20Affidavit_Fillable.pdf) if they cannot provide the other listed documentation.",
        "category": "Education",
        "officialUrl": FAFSA_URL,
        "officialButtonLabel": "Start Official Application",
        "checklist": [
            "Complete the FAFSA or MASFA",
            "Be a Massachusetts resident for at least 12 months for reasons other than education",
            "Attend a participating MASSGrant Plus school",
            "Not already hold a bachelor's degree",
            "Review eligibility with your financial aid office",
        ],
    },
    "masshealth": {
        "id": "masshealth",
        "title": "MassHealth",
        "description": "Massachusetts Medicaid and CHIP program providing comprehensive health coverage for eligible residents.",
        "details": "MassHealth provides low-cost or no-cost health coverage for eligible Massachusetts residents. Many applicants complete the process through the [Massachusetts Health Connector](https://www.mahix.org/individual/), where you may also be routed to the correct MassHealth program based on your household and income information.",
        "category": "Health",
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
        "description": "Discounted monthly passes for full-time students using MBTA services in the Greater Boston area.",
        "details": "The MBTA student pass is usually coordinated through participating colleges, not just through an individual checkout page. Your school may have its own process or transportation office instructions, so check the [official MBTA student pass page](https://www.mbta.com/fares/college-student-semester-passes) and confirm the steps your campus requires.",
        "category": "Transport",
        "officialUrl": "https://www.mbta.com/fares/college-student-semester-passes",
        "officialButtonLabel": "Visit Official Site",
        "checklist": [
            "Get current student ID",
            "Verify full-time enrollment status",
            "Visit school's transportation office or MBTA.com",
            "Purchase discounted semester or monthly pass",
            "Carry student ID when using pass",
        ],
    },
    "snap": {
        "id": "snap",
        "title": "SNAP (Food Stamps)",
        "description": "Provides food purchasing assistance for low- and no-income people.",
        "details": "SNAP can help eligible students and households pay for groceries, but college students sometimes need to meet extra student-specific rules. In Massachusetts, applications and case updates are commonly handled through [DTA Connect](https://dtaconnect.eohhs.mass.gov/), where you can submit documents, check notices, and track your case.",
        "category": "Food",
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


def detect_bucket_region(bucket: str) -> str:
    if not bucket:
        return os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"

    try:
        s3 = boto3.client("s3", region_name="us-east-1", config=Config(signature_version="s3v4"))
        location = s3.get_bucket_location(Bucket=bucket).get("LocationConstraint")
        return location or "us-east-1"
    except ClientError:
        return os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"


def normalize_school_name(value) -> str:
    if value is None:
        return ""

    trimmed = str(value).strip()
    if not trimmed:
        return ""

    return SCHOOL_ALIASES.get(trimmed, trimmed)


def is_massgrant_plus_eligible_school(value) -> bool:
    school_name = normalize_school_name(value)
    return bool(school_name) and school_name in MASSGRANT_PLUS_ELIGIBLE_SCHOOLS


def is_mbta_eligible_school(value) -> bool:
    school_name = normalize_school_name(value)
    return bool(school_name) and school_name in MBTA_ELIGIBLE_SCHOOLS


def get_exact_household_size(profile: dict) -> int | None:
    raw_household_size = profile.get("household_sizes")

    if not raw_household_size:
        return None

    exact_value = profile.get("household_size_exact") if raw_household_size == "9_plus" else raw_household_size

    try:
        parsed_value = int(exact_value)
    except (TypeError, ValueError):
        return None

    if parsed_value < 1:
        return None

    if raw_household_size == "9_plus" and parsed_value < 9:
        return None

    return parsed_value


def get_income_threshold(program: str, profile: dict) -> int | None:
    household_size = get_exact_household_size(profile)

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

    threshold_for_eight = thresholds.get(8)
    if threshold_for_eight is None:
        return None

    return threshold_for_eight + (household_size - 8) * increment


def get_inferred_massgrant_plus_income_band(profile: dict) -> str | None:
    masshealth_threshold = get_income_threshold("masshealth", profile)
    if (
        profile.get("masshealth_income_under_limit") == "yes"
        and masshealth_threshold is not None
        and masshealth_threshold <= MASSGRANT_PLUS_UNDER_85K_LIMIT
    ):
        return "under_85k"

    snap_threshold = get_income_threshold("snap", profile)
    if (
        profile.get("snap_income_under_limit") == "yes"
        and snap_threshold is not None
        and snap_threshold * 12 <= MASSGRANT_PLUS_UNDER_85K_LIMIT
    ):
        return "under_85k"

    return None


def get_effective_massgrant_plus_income_band(profile: dict) -> str | None:
    inferred_band = get_inferred_massgrant_plus_income_band(profile)
    if inferred_band:
        return inferred_band

    explicit_band = profile.get("massgrant_plus_income_band")
    if explicit_band in ("under_85k", "85k_to_100k", "over_100k"):
        return explicit_band

    return None


def is_student_or_future(profile: dict) -> bool:
    return profile.get("student_status") in (
        "full_time",
        "part_time",
        "future_full_time",
        "future_part_time",
    )


def is_massgrant_enrollment_eligible(profile: dict) -> bool:
    return profile.get("student_status") in ("full_time", "future_full_time")


def get_massgrant_plus_enrollment_status(profile: dict) -> str | None:
    if profile.get("student_status") in ("full_time", "future_full_time"):
        return "full_time"
    if profile.get("student_status") in ("part_time", "future_part_time"):
        return "part_time"
    return None


def is_massgrant_plus_enrollment_eligible(profile: dict) -> bool:
    enrollment_status = get_massgrant_plus_enrollment_status(profile)
    income_band = get_effective_massgrant_plus_income_band(profile)

    if not income_band or income_band == "over_100k":
        return False

    if income_band == "85k_to_100k":
        return enrollment_status == "full_time"

    if enrollment_status == "full_time":
        return True

    return enrollment_status == "part_time"


def is_massachusetts_resident(profile: dict) -> bool:
    residency_length = profile.get("residency_length")
    return bool(residency_length) and residency_length != "not_ma_resident"


def has_qualifying_massgrant_residency(profile: dict) -> bool:
    residency_length = profile.get("residency_length")
    return bool(residency_length) and residency_length not in ("not_ma_resident", "under_12_months")


def uses_masfa_route(profile: dict) -> bool:
    return profile.get("citizen_status") == "no"


def has_masfa_document_path(profile: dict) -> bool:
    documentation_ready = profile.get("masfa_documentation_ready")

    if documentation_ready == "yes":
        return True

    if documentation_ready == "no":
        return profile.get("dhe_affidavit_completed") in ("yes", "no")

    return False


def qualifies_under_tuition_equity(profile: dict) -> bool:
    return (
        uses_masfa_route(profile)
        and has_qualifying_massgrant_residency(profile)
        and profile.get("masfa_high_school_completer") == "yes"
        and has_masfa_document_path(profile)
    )


def has_state_aid_path(profile: dict) -> bool:
    if profile.get("citizen_status") == "yes":
        return True

    return qualifies_under_tuition_equity(profile)


def needs_dhe_affidavit(profile: dict) -> bool:
    return (
        qualifies_under_tuition_equity(profile)
        and profile.get("masfa_documentation_ready") == "no"
        and profile.get("dhe_affidavit_completed") == "no"
    )


def get_state_aid_application_type(profile: dict) -> str:
    return "masfa" if uses_masfa_route(profile) else "fafsa"


def is_state_aid_application_completed(profile: dict) -> bool:
    if uses_masfa_route(profile):
        return profile.get("masfa_completed") == "yes"

    return profile.get("fafsa_completed") == "yes"


def is_not_enrolling_next_academic_year(profile: dict, route: str) -> bool:
    if route == "masfa":
        return profile.get("masfa_completed") == NOT_ENROLLED_NEXT_ACADEMIC_YEAR_VALUE

    return profile.get("fafsa_completed") == NOT_ENROLLED_NEXT_ACADEMIC_YEAR_VALUE


def get_state_aid_action(profile: dict) -> dict:
    if uses_masfa_route(profile):
        if is_not_enrolling_next_academic_year(profile, "masfa"):
            return {
                "applicationType": "masfa",
                "applicationCompleted": False,
                "officialUrl": MASFA_START_URL,
                "officialButtonLabel": "View Official Site",
            }

        if profile.get("masfa_completed") == "yes":
            return {
                "applicationType": "masfa",
                "applicationCompleted": True,
                "officialUrl": MASFA_STATUS_URL,
                "officialButtonLabel": "Check MASFA Status",
                "actionStatus": NO_ACTION_ALREADY_COMPLETED_STATUS,
            }

        return {
            "applicationType": "masfa",
            "applicationCompleted": False,
            "officialUrl": MASFA_START_URL,
            "officialButtonLabel": "Start MASFA Application",
            "actionStatus": "Action Needed, Please Complete MASFA",
        }

    if is_not_enrolling_next_academic_year(profile, "fafsa"):
        return {
            "applicationType": "fafsa",
            "applicationCompleted": False,
            "officialUrl": FAFSA_URL,
            "officialButtonLabel": "View Official Site",
        }

    if profile.get("fafsa_completed") == "yes":
        return {
            "applicationType": "fafsa",
            "applicationCompleted": True,
            "officialUrl": FAFSA_STATUS_URL,
            "officialButtonLabel": "Check FAFSA Status",
            "actionStatus": NO_ACTION_ALREADY_COMPLETED_STATUS,
        }

    return {
        "applicationType": "fafsa",
        "applicationCompleted": False,
        "officialUrl": FAFSA_URL,
        "officialButtonLabel": "Start FAFSA Application",
        "actionStatus": "Action needed - Complete FAFSA",
    }


def get_pell_action(profile: dict) -> dict:
    if is_not_enrolling_next_academic_year(profile, "fafsa"):
        return {
            "applicationType": "fafsa",
            "applicationCompleted": False,
            "officialUrl": FAFSA_URL,
            "officialButtonLabel": "View Official Site",
        }

    if profile.get("fafsa_completed") == "yes":
        return {
            "applicationType": "fafsa",
            "applicationCompleted": True,
            "officialUrl": FAFSA_STATUS_URL,
            "officialButtonLabel": "Check FAFSA Status",
            "actionStatus": NO_ACTION_ALREADY_COMPLETED_STATUS,
        }

    return {
        "applicationType": "fafsa",
        "applicationCompleted": False,
        "officialUrl": FAFSA_URL,
        "officialButtonLabel": "Start FAFSA Application",
        "actionStatus": "Action needed - Complete FAFSA",
    }


def get_dhe_affidavit_checklist_item(profile: dict) -> str | None:
    if not qualifies_under_tuition_equity(profile):
        return None

    if profile.get("masfa_documentation_ready") != "no":
        return None

    if profile.get("dhe_affidavit_completed") == "yes":
        return PROVIDE_DHE_AFFIDAVIT_CHECKLIST_ITEM

    return COMPLETE_DHE_AFFIDAVIT_CHECKLIST_ITEM


def build_massgrant_action_statuses(profile: dict) -> list[str]:
    route = "masfa" if uses_masfa_route(profile) else "fafsa"
    if is_not_enrolling_next_academic_year(profile, route):
        return []

    statuses: list[str] = []

    if needs_dhe_affidavit(profile):
        statuses.append(DHE_AFFIDAVIT_ACTION_STATUS)

    state_aid_action_status = get_state_aid_action(profile).get("actionStatus")
    if state_aid_action_status:
        statuses.append(state_aid_action_status)

    return statuses


def build_massgrant_checklist(profile: dict) -> list[str]:
    checklist = [
        "Complete the MASFA" if uses_masfa_route(profile) else "Complete the FAFSA",
        "Be a Massachusetts resident",
        "Enroll in a Massachusetts college",
        "Maintain satisfactory academic progress",
    ]

    dhe_item = get_dhe_affidavit_checklist_item(profile)
    if dhe_item:
        checklist.append(dhe_item)

    checklist.append("Check award notification from your school")
    return checklist


def build_massgrant_plus_checklist(profile: dict) -> list[str]:
    checklist = [
        "Complete the MASFA" if uses_masfa_route(profile) else "Complete the FAFSA",
        "Be a Massachusetts resident for at least 12 months for reasons other than education",
        "Attend a participating MASSGrant Plus school",
        "Not already hold a bachelor's degree",
    ]

    dhe_item = get_dhe_affidavit_checklist_item(profile)
    if dhe_item:
        checklist.append(dhe_item)

    checklist.append("Review eligibility with your financial aid office")
    return checklist


def is_snap_income_eligible(profile: dict) -> bool:
    return (
        profile.get("masshealth_income_under_limit") == "yes"
        or profile.get("snap_income_under_limit") == "yes"
    )


def match_benefits(profile: dict) -> list[dict]:
    a = profile or {}
    matches: list[dict] = []

    if is_student_or_future(a) and a.get("citizen_status") == "yes":
        pell_action = get_pell_action(a)
        matches.append(
            {
                "id": "pell-grant",
                **pell_action,
                "actionStatuses": [pell_action["actionStatus"]] if pell_action.get("actionStatus") else [],
            }
        )

    if (
        is_massgrant_enrollment_eligible(a)
        and has_state_aid_path(a)
        and has_qualifying_massgrant_residency(a)
        and a.get("prior_bachelors_degree") == "no"
    ):
        state_aid_action = get_state_aid_action(a)
        matches.append(
            {
                "id": "massgrant",
                **state_aid_action,
                "actionStatuses": build_massgrant_action_statuses(a),
                "checklist": build_massgrant_checklist(a),
                "dheAffidavitRequired": needs_dhe_affidavit(a),
            }
        )

    if (
        has_state_aid_path(a)
        and has_qualifying_massgrant_residency(a)
        and a.get("prior_bachelors_degree") == "no"
        and is_massgrant_plus_eligible_school(a.get("school_name"))
        and is_massgrant_plus_enrollment_eligible(a)
    ):
        state_aid_action = get_state_aid_action(a)
        matches.append(
            {
                "id": "massgrant-plus",
                **state_aid_action,
                "actionStatuses": build_massgrant_action_statuses(a),
                "checklist": build_massgrant_plus_checklist(a),
                "dheAffidavitRequired": needs_dhe_affidavit(a),
            }
        )

    if (
        is_massachusetts_resident(a)
        and a.get("citizen_status") == "yes"
        and (a.get("work_study") == "yes" or is_snap_income_eligible(a))
    ):
        matches.append(
            {
                "id": "snap",
                "actionStatuses": [],
            }
        )

    if (
        is_massachusetts_resident(a)
        and a.get("citizen_status") == "yes"
        and a.get("masshealth_income_under_limit") == "yes"
    ):
        matches.append(
            {
                "id": "masshealth",
                "actionStatuses": [],
            }
        )

    if is_student_or_future(a) and is_mbta_eligible_school(a.get("school_name")):
        matches.append(
            {
                "id": "mbta-pass",
                "actionStatuses": [],
            }
        )

    seen = set()
    unique_matches = []

    for match in matches:
        if match["id"] in seen:
            continue
        seen.add(match["id"])
        unique_matches.append(match)

    return unique_matches


def _normalize_catalog(data) -> dict:
    if not data:
        return {}

    if isinstance(data, dict) and "benefits" in data:
        data = data["benefits"]

    if isinstance(data, dict):
        normalized = {}
        for key, value in data.items():
            if isinstance(value, dict):
                benefit_id = value.get("id") or key
                normalized[str(benefit_id)] = {
                    **value,
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
    for benefit_id, item in override.items():
        if benefit_id in merged:
            merged[benefit_id] = {
                **merged[benefit_id],
                **item,
            }
        else:
            merged[benefit_id] = item
    return merged


def load_catalog(s3, bucket: str, key: str) -> dict:
    final_catalog = dict(FALLBACK_CATALOG)

    if not bucket or s3 is None:
        return final_catalog

    try:
        obj = s3.get_object(Bucket=bucket, Key=key)
        raw = obj["Body"].read().decode("utf-8")
        parsed = json.loads(raw)

        normalized = _normalize_catalog(parsed)
        if normalized:
            return _merge_catalogs(final_catalog, normalized)

        return final_catalog
    except Exception:
        return final_catalog


def merge_match_with_catalog(match: dict, catalog: dict) -> dict:
    benefit_id = str(match.get("id") or "").strip()
    catalog_item = catalog.get(benefit_id, {}) if benefit_id else {}

    if not isinstance(catalog_item, dict):
        catalog_item = {}

    merged = dict(catalog_item)
    merged.update(match)

    if benefit_id:
        merged["id"] = benefit_id

    checklist = merged.get("checklist")
    if not isinstance(checklist, list):
        merged["checklist"] = catalog_item.get("checklist") or []

    action_statuses = merged.get("actionStatuses")
    if isinstance(action_statuses, list):
        merged["actionStatuses"] = [str(item) for item in action_statuses if str(item).strip()]
    elif merged.get("actionStatus"):
        merged["actionStatuses"] = [str(merged["actionStatus"])]
    else:
        merged["actionStatuses"] = []

    return merged


def normalize_requested_matches(raw_matches, catalog: dict) -> list[dict]:
    normalized = []
    seen = set()

    if not isinstance(raw_matches, list):
        return normalized

    for raw_match in raw_matches:
        if not isinstance(raw_match, dict):
            continue

        benefit_id = str(raw_match.get("id") or "").strip()
        if not benefit_id or benefit_id in seen:
            continue

        seen.add(benefit_id)
        normalized.append(merge_match_with_catalog({**raw_match, "id": benefit_id}, catalog))

    return normalized


def get_authoritative_matches(
    profile: dict,
    catalog: dict,
    selected_benefit_ids: list[str] | None = None,
) -> list[dict]:
    matches = normalize_requested_matches(match_benefits(profile), catalog)

    if selected_benefit_ids:
        selected_set = {
            str(benefit_id).strip()
            for benefit_id in selected_benefit_ids
            if str(benefit_id).strip()
        }
        matches = [match for match in matches if match["id"] in selected_set]

    return matches