#
def mbta_result(status, reason, missing_fields=None, program_id="mbta"):
    return {
        "program_id": program_id,
        "program_name": "MBTA",
        "status": status,
        "reason": reason,
        "missing_feilds": missing_fields or []
    }

def check_mbta(profile):

    if "selected_benefits" in profile and "mbta" not in profile["selected_benefits"]:
        return None

mbta = profile.get("mbta")
if mbta is None:
    return {           
        "program_id": "mbta",
        "status": "need_more_info",
        "reason": "Missing mbta section",
        "missing_fields": ["mbta"]
    }

#free access
free_access = ["blind",
    "military",
    "police",
    "firefighter",
    "government_official"
]
if any(mbta.get(x)is True for x in free_access):
    return{
        "program_id": "mbta_free",
        "status": "eligible",
        "reason": "Eligible under free category",
        "missing_fields": []
    }
#Desability
if mbta.get("medicare") or mbta.get("disability"):
    return {
        "program_id": "mbta_tap",
        "status": "eligible",
        "reason": "Eligible under TAP",
        "missing_fields": []
}
#
if 18 <= profile["age"] <= 64:
    return qprograms = {
        "EAEDC", "MASSGrant", "MassHealth CarePlus",
        "MassHealth Family Assistance", "MassHealth Limited",
        "MassHealth Standard", "SNAP", "TAFDC"
        }

