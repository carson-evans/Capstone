#mbta check
#---------------------------------------------
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
        return qprograms == {
            "EAEDC", "MASSGrant", "MassHealth CarePlus",
            "MassHealth Family Assistance", "MassHealth Limited",
            "MassHealth Standard", "SNAP", "TAFDC"
            }

#Snap Check
#---------------------------------------------
def snap_result(status, reason, missing_fields=None, program_id="snap"):
    return {
        "program_id": program_id,
        "program_name": "Snap",
        "status": status,  
        "reason": reason,
        "missing_fields": missing_fields or []
    }

def check_snap(profile):
    if "selected_benefits" in profile and "snap" not in profile["selected_benefits"]:
        return None

    snap = profile.get("snap")
    if snap is None:
        return snap_result(
            status="need_more_info",
            reason="Missing SNAP section",
            missing_fields=["snap"]
        )
    
    #---------------------------------
    #Required fields
    #---------------------------------
    required_fields = ["ma_resident",
                       "lawful_presence", 
                       "household_size", 
                       "household_gross"
                    ]
    
    missing = [f for f in required_fields if snap.get(f) is None]

    if missing:
        return snap_result(
            status="need_more_info",
            reason="Missing required profile fields",
            missing_fields=missing
        )
    
    #Federal Poverty Level
    gross_income_limit = 1696
    net_income_limit = 1252

    #Logic for Snap eligible 


    # if older than 60 only calculate net income
    
    if snap.get("ma_resident") and snap.get("lawful_presence"):

         # if older than 60 only calculate net income
        if profile.get("age") > 60:
            if snap.get("household_net") < net_income_limit + (snap.get("household_size") * 438 ):
                return snap_result(
                    program_id="snap",
                    status="Eligible",
                    reason="Household net income eligible for snap",
                )
            else:
                return snap_result(
                    program_id="snap",
                    status="Ineligible",
                    reason="Household net income exceeds SNAP limits"
                )


        # check if student and if they meet the requirements
        elif snap.get("is_student") and profile.get("age") >= 18 and profile.get("age") <= 49:
            if snap.get("snap_student_rules") is False:
                return snap_result(
                    program_id="snap",
                    status="ineligible",
                    reason="Student did not meet the requirements",
                )
    
    else:
        return snap_result(
            program_id="snap",
            status="Ineligible",
            reason="Must be a MA resident and have lawful presence to be eligible for SNAP"
        )
    
    # Gross Income checker
    if snap.get("household_gross") < gross_income_limit + (snap.get("household_size") * 596):
        return snap_result(
            program_id="snap",
            status="Eligible",
            reason="Household gross income eligible for snap",
        )
    else:
        return snap_result(
            program_id="snap",
            status="Ineligible",
            reason="Household gross income exceeds SNAP limits"
        )
