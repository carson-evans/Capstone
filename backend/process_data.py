# Backend process
from flask import Flask, request, jsonify
from logic import check_mbta

app = Flask(__name__)


@app.route('/process', methods=['POST'])
def process_data():
    data = request.get_json()

    if data is None:
        return jsonify({"error": "Must send Json"}), 400
    errors = []

    required_fields = [
        "ma_resident",
        "age", 
        "household_size",
        "income_frequency",
        "income_amount",
        "employement_status"
    ]
    missing = [f for f in required_fields if f not in data]
    if missing:
        return jsonify({"error": "Missing fields", "missing": missing}), 400

    if errors:
        return jsonify({"errors": errors}), 400

    # #check bool
    # if not isinstance(data["ma_resident"], bool):
    #     errors.append("ma_resident is not boolean")
    # #check int
    # if not isinstance(data["age"],int) or data["age"] < 0:
    #     errors.append("age is not integer >= 0")
    # #check number
    # if not isinstance(data["household_size"],int) or data["household_size"] < 1:
    #     errors.append("household_size isn't a integer >= 1")
    # #check income frequency string
    # if not isinstance(data["income_amount"],(int, float)) or data["income_amount"] < 0:
    #     errors.append("income_amount isn't a number >= 0")
    #check employement for IF string
    #valid_status = (
    #    "employed_full_time",
    #    "employed_part_time",
    #    "unemployed",
    #    "student",
    #    "retired",
    #    "other"
    #)
    
   # if data["employemt_status"] not in valid_status:
   #     errors.append("Invalid employement_status value")
    
   # if errors:
   #     return jsonify({"errors", errors}), 400
    
    if data["income_frequency"] == "monthly":
        income_annual = data["income_amount"] * 12
    else:
        income_annual = data["income_amount"]
    
    matches= []

    #rules
    #Mbta
    mbta_outcome = check_mbta(data)
    if mbta_outcome:
        matches.append({mbta_outcome})

    #Massheath
    #if data["ma_resident"] and income_annual <= 30000:

   return jsonify({
        "matches": matches
    }), 200

#
if __name__ == "__main__":

    app.run(debug=True)
