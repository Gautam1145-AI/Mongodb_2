"""
Hospital Management System - Flask Application
Backend providing web pages, REST APIs, and interactive MongoDB query runner.
"""

import os
import json
from datetime import datetime, timezone
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from database import db_instance

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "hospital-management-key-2026")

# -------------------------------------------------------------
# TEMPLATE CONTEXT PROCESSOR (Inject Global DB Status)
# -------------------------------------------------------------
@app.context_processor
def inject_global_data():
    return {
        "db_status": db_instance.connection_status,
        "is_mock": db_instance.is_mock,
        "mongo_uri": db_instance._mask_uri(db_instance.uri),
        "current_year": datetime.now().year
    }

# -------------------------------------------------------------
# HTML PAGE ROUTES
# -------------------------------------------------------------
@app.route("/")
@app.route("/dashboard")
def dashboard():
    stats = db_instance.get_dashboard_stats()
    recent_appointments = db_instance.get_appointments_with_details()[:5]
    return render_template("index.html", stats=stats, recent_appointments=recent_appointments, active_page="dashboard")

@app.route("/patients")
def patients_page():
    search = request.args.get("search", "").strip()
    blood_group = request.args.get("blood_group", "All")
    patients = db_instance.get_patients(search=search, blood_group=blood_group)
    return render_template("patients.html", patients=patients, search=search, blood_group=blood_group, active_page="patients")

@app.route("/patients/<patient_id>/history")
def patient_history_page(patient_id):
    patient_data = db_instance.get_patient_360(patient_id)
    if not patient_data:
        flash("Patient not found", "error")
        return redirect(url_for("patients_page"))
    return render_template("patient_history.html", data=patient_data, active_page="patients")

@app.route("/doctors")
def doctors_page():
    specialization = request.args.get("specialization", "All")
    available_only = request.args.get("available_only") == "true"
    doctors = db_instance.get_doctors(specialization=specialization, available_only=available_only)
    specs = db_instance.count_doctors_by_specialization()
    return render_template("doctors.html", doctors=doctors, specs=specs, current_spec=specialization, active_page="doctors")

@app.route("/appointments")
def appointments_page():
    status_filter = request.args.get("status", "All")
    appointments = db_instance.get_appointments_with_details(status_filter=status_filter)
    patients = db_instance.get_patients()
    doctors = db_instance.get_doctors(available_only=True)
    return render_template("appointments.html", appointments=appointments, patients=patients, doctors=doctors, current_status=status_filter, active_page="appointments")

@app.route("/medical-records")
def medical_records_page():
    patient_id = request.args.get("patient_id")
    records = db_instance.get_medical_records(patient_id=patient_id)
    prescriptions = db_instance.get_prescriptions(patient_id=patient_id)
    patients = db_instance.get_patients()
    doctors = db_instance.get_doctors()
    return render_template("medical_records.html", records=records, prescriptions=prescriptions, patients=patients, doctors=doctors, active_page="medical-records")

@app.route("/billing")
def billing_page():
    status_filter = request.args.get("status", "All")
    bills = db_instance.get_billing(status=status_filter)
    total_revenue = db_instance.calculate_total_revenue()
    patients = db_instance.get_patients()
    return render_template("billing.html", bills=bills, total_revenue=total_revenue, patients=patients, current_status=status_filter, active_page="billing")

@app.route("/rooms")
def rooms_page():
    room_type = request.args.get("type", "All")
    rooms = db_instance.get_rooms(room_type=room_type)
    patients = db_instance.get_patients()
    return render_template("rooms.html", rooms=rooms, patients=patients, current_type=room_type, active_page="rooms")

@app.route("/queries")
def queries_playground():
    """Interactive MongoDB query playground with sample queries 1-8."""
    return render_template("queries.html", active_page="queries")

# -------------------------------------------------------------
# REST API ENDPOINTS
# -------------------------------------------------------------
@app.route("/api/stats")
def api_stats():
    return jsonify(db_instance.get_dashboard_stats())

@app.route("/api/patients", methods=["GET", "POST"])
def api_patients():
    if request.method == "POST":
        data = request.json or request.form.to_dict()
        try:
            data["age"] = int(data.get("age", 0))
        except ValueError:
            pass
        pid = db_instance.insert_patient(data)
        return jsonify({"success": True, "patient_id": pid, "message": "Patient registered successfully"}), 201
    
    search = request.args.get("search")
    bg = request.args.get("blood_group")
    return jsonify(db_instance.get_patients(search=search, blood_group=bg))

@app.route("/api/patients/<patient_id>", methods=["GET", "PUT", "DELETE"])
def api_patient_detail(patient_id):
    if request.method == "GET":
        pat = db_instance.get_patient_by_id(patient_id)
        if not pat:
            return jsonify({"error": "Patient not found"}), 404
        return jsonify(pat)
    
    elif request.method == "PUT":
        data = request.json or request.form.to_dict()
        if "age" in data:
            try:
                data["age"] = int(data["age"])
            except ValueError:
                pass
        success = db_instance.update_patient(patient_id, data)
        return jsonify({"success": success, "message": "Patient updated successfully"})
    
    elif request.method == "DELETE":
        success = db_instance.delete_patient(patient_id)
        return jsonify({"success": success, "message": "Patient record deleted successfully"})

@app.route("/api/patients/<patient_id>/history")
def api_patient_history(patient_id):
    history = db_instance.get_patient_360(patient_id)
    if not history:
        return jsonify({"error": "Patient not found"}), 404
    return jsonify(history)

@app.route("/api/doctors", methods=["GET", "POST"])
def api_doctors():
    if request.method == "POST":
        data = request.json or request.form.to_dict()
        try:
            data["experience"] = int(data.get("experience", 0))
            data["consultation_fee"] = float(data.get("consultation_fee", 500))
        except ValueError:
            pass
        data["available"] = str(data.get("available", "true")).lower() in ["true", "1", "yes"]
        did = db_instance.insert_doctor(data)
        return jsonify({"success": True, "doctor_id": did, "message": "Doctor added successfully"}), 201

    spec = request.args.get("specialization")
    avail = request.args.get("available_only") == "true"
    return jsonify(db_instance.get_doctors(specialization=spec, available_only=avail))

@app.route("/api/doctors/<doctor_id>", methods=["PUT"])
def api_update_doctor(doctor_id):
    data = request.json or request.form.to_dict()
    if "experience" in data:
        try:
            data["experience"] = int(data["experience"])
        except ValueError:
            pass
    if "consultation_fee" in data:
        try:
            data["consultation_fee"] = float(data["consultation_fee"])
        except ValueError:
            pass
    if "available" in data:
        data["available"] = str(data["available"]).lower() in ["true", "1", "yes"]
    success = db_instance.update_doctor(doctor_id, data)
    return jsonify({"success": success, "message": "Doctor updated successfully"})

@app.route("/api/appointments", methods=["GET", "POST"])
def api_appointments():
    if request.method == "POST":
        data = request.json or request.form.to_dict()
        aid = db_instance.book_appointment(data)
        return jsonify({"success": True, "appointment_id": aid, "message": "Appointment booked successfully"}), 201
    
    status = request.args.get("status")
    return jsonify(db_instance.get_appointments_with_details(status_filter=status))

@app.route("/api/appointments/<appointment_id>/status", methods=["PUT"])
def api_appointment_status(appointment_id):
    data = request.json or request.form.to_dict()
    status = data.get("status", "Completed")
    success = db_instance.update_appointment_status(appointment_id, status)
    return jsonify({"success": success, "message": f"Appointment status changed to {status}"})

@app.route("/api/medical-records", methods=["GET", "POST"])
def api_medical_records():
    if request.method == "POST":
        data = request.json or request.form.to_dict()
        rid = db_instance.insert_medical_record(data)
        return jsonify({"success": True, "record_id": rid, "message": "Medical record saved"}), 201
    
    patient_id = request.args.get("patient_id")
    return jsonify(db_instance.get_medical_records(patient_id))

@app.route("/api/prescriptions", methods=["GET", "POST"])
def api_prescriptions():
    if request.method == "POST":
        data = request.json
        rx_id = db_instance.insert_prescription(data)
        return jsonify({"success": True, "prescription_id": rx_id, "message": "Prescription generated"}), 201
    
    patient_id = request.args.get("patient_id")
    return jsonify(db_instance.get_prescriptions(patient_id))

@app.route("/api/billing", methods=["GET", "POST"])
def api_billing():
    if request.method == "POST":
        data = request.json or request.form.to_dict()
        bid = db_instance.insert_bill(data)
        return jsonify({"success": True, "bill_id": bid, "message": "Bill generated successfully"}), 201
    
    status = request.args.get("status")
    return jsonify(db_instance.get_billing(status))

@app.route("/api/billing/<bill_id>/pay", methods=["PUT"])
def api_pay_bill(bill_id):
    data = request.json or {}
    method = data.get("payment_method", "Cash")
    success = db_instance.update_bill_status(bill_id, "Paid", method)
    return jsonify({"success": success, "message": f"Bill {bill_id} marked as Paid via {method}"})

@app.route("/api/rooms/allocate", methods=["POST"])
def api_allocate_room():
    data = request.json or request.form.to_dict()
    room_number = data.get("room_number")
    patient_id = data.get("patient_id")
    success, msg = db_instance.allocate_room(room_number, patient_id)
    return jsonify({"success": success, "message": msg}), (200 if success else 400)

@app.route("/api/rooms/discharge", methods=["POST"])
def api_discharge_room():
    data = request.json or request.form.to_dict()
    room_number = data.get("room_number")
    patient_id = data.get("patient_id")
    success, msg = db_instance.discharge_room(room_number, patient_id)
    return jsonify({"success": success, "message": msg}), (200 if success else 400)

@app.route("/api/database/connect", methods=["POST"])
def api_db_connect():
    data = request.json or {}
    new_uri = data.get("uri", "").strip()
    if not new_uri:
        return jsonify({"success": False, "message": "MongoDB URI cannot be empty"}), 400
    
    success, msg = db_instance.switch_connection(new_uri)
    return jsonify({"success": success, "message": msg, "is_mock": db_instance.is_mock})

@app.route("/api/database/reset-seed", methods=["POST"])
def api_reset_seed():
    db_instance.seed_database(force=True)
    return jsonify({"success": True, "message": "Sample data reset across all 7 collections successfully!"})

@app.route("/api/run-query", methods=["POST"])
def api_run_query():
    """
    Executes built-in and custom MongoDB queries for live lab demonstration.
    """
    data = request.json or {}
    query_id = data.get("query_id")

    try:
        if query_id == "q1":
            # Query 1: Display All Patients
            res = list(db_instance.db.patients.find({}))
            code = "db.patients.find()"
            return jsonify({"success": True, "code": code, "result": db_instance._format_docs(res)})

        elif query_id == "q2":
            # Query 2: Find a Patient by Name
            name = data.get("param", "Rahul Sharma")
            res = list(db_instance.db.patients.find({"name": {"$regex": name, "$options": "i"}}))
            code = f'db.patients.find({{ name: "{name}" }})'
            return jsonify({"success": True, "code": code, "result": db_instance._format_docs(res)})

        elif query_id == "q3":
            # Query 3: Find Doctors by Specialization
            spec = data.get("param", "Cardiology")
            res = list(db_instance.db.doctors.find({"specialization": spec}))
            code = f'db.doctors.find({{ specialization: "{spec}" }})'
            return jsonify({"success": True, "code": code, "result": db_instance._format_docs(res)})

        elif query_id == "q4":
            # Query 4: Update Patient Details
            pid = data.get("patient_id", "P101")
            new_address = data.get("address", "Jodhpur")
            db_instance.db.patients.update_one({"patient_id": pid}, {"$set": {"address": new_address}})
            updated = db_instance.db.patients.find_one({"patient_id": pid})
            code = f'db.patients.updateOne({{ patient_id: "{pid}" }}, {{ $set: {{ address: "{new_address}" }} }})'
            return jsonify({"success": True, "code": code, "result": db_instance._format_doc(updated)})

        elif query_id == "q5":
            # Query 5: Delete a Patient Record (Safe test)
            pid = data.get("patient_id", "P999")
            # If P999 doesn't exist, insert temporary demo doc to safely delete
            if not db_instance.db.patients.find_one({"patient_id": pid}):
                db_instance.db.patients.insert_one({"patient_id": pid, "name": "Temporary Test Patient", "age": 20})
            res = db_instance.db.patients.delete_one({"patient_id": pid})
            code = f'db.patients.deleteOne({{ patient_id: "{pid}" }})'
            return jsonify({"success": True, "code": code, "result": {"deleted_count": res.deleted_count}})

        elif query_id == "q6":
            # Query 6: Count Total Patients
            count = db_instance.db.patients.count_documents({})
            code = "db.patients.countDocuments()"
            return jsonify({"success": True, "code": code, "result": {"total_patients": count}})

        elif query_id == "q7":
            # Query 7: Count Doctors by Specialization (Aggregation Pipeline)
            pipeline = [
                {"$group": {"_id": "$specialization", "totalDoctors": {"$sum": 1}}},
                {"$sort": {"totalDoctors": -1}}
            ]
            res = list(db_instance.db.doctors.aggregate(pipeline))
            code = """db.doctors.aggregate([
    {
        $group: {
            _id: "$specialization",
            totalDoctors: { $sum: 1 }
        }
    },
    { $sort: { totalDoctors: -1 } }
])"""
            return jsonify({"success": True, "code": code, "result": res})

        elif query_id == "q8":
            # Query 8: Find Appointments with Patient Details ($lookup & $unwind)
            pipeline = [
                {
                    "$lookup": {
                        "from": "patients",
                        "localField": "patient_id",
                        "foreignField": "patient_id",
                        "as": "patient_details"
                    }
                },
                {"$unwind": "$patient_details"},
                {
                    "$project": {
                        "_id": 0,
                        "appointment_id": 1,
                        "patient_name": "$patient_details.name",
                        "appointment_date": 1,
                        "status": 1
                    }
                }
            ]
            res = list(db_instance.db.appointments.aggregate(pipeline))
            code = """db.appointments.aggregate([
    {
        $lookup: {
            from: "patients",
            localField: "patient_id",
            foreignField: "patient_id",
            as: "patient_details"
        }
    },
    {
        $unwind: "$patient_details"
    },
    {
        $project: {
            _id: 0,
            appointment_id: 1,
            patient_name: "$patient_details.name",
            appointment_date: 1,
            status: 1
        }
    }
])"""
            return jsonify({"success": True, "code": code, "result": db_instance._format_docs(res)})

        elif query_id == "q_revenue":
            # Revenue Aggregation Pipeline
            pipeline = [
                {"$match": {"payment_status": "Paid"}},
                {"$group": {"_id": None, "totalRevenue": {"$sum": "$amount"}}}
            ]
            res = list(db_instance.db.billing.aggregate(pipeline))
            code = """db.billing.aggregate([
    {
        $match: {
            payment_status: "Paid"
        }
    },
    {
        $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" }
        }
    }
])"""
            return jsonify({"success": True, "code": code, "result": res})

        elif query_id == "custom":
            # Custom Query Execution
            collection_name = data.get("collection")
            operation = data.get("operation", "find")
            raw_param = data.get("raw_input", "{}")
            
            parsed = json.loads(raw_param) if raw_param.strip() else {}
            
            if operation == "aggregate":
                pipeline = parsed if isinstance(parsed, list) else [parsed]
                res = list(db_instance.db[collection_name].aggregate(pipeline))
                return jsonify({"success": True, "code": f"db.{collection_name}.aggregate({raw_param})", "result": db_instance._format_docs(res)})
            elif operation == "find":
                res = list(db_instance.db[collection_name].find(parsed))
                return jsonify({"success": True, "code": f"db.{collection_name}.find({raw_param})", "result": db_instance._format_docs(res)})
            elif operation == "countDocuments":
                count = db_instance.db[collection_name].count_documents(parsed)
                return jsonify({"success": True, "code": f"db.{collection_name}.countDocuments({raw_param})", "result": {"count": count}})
            else:
                return jsonify({"success": False, "message": f"Unsupported operation: {operation}"}), 400

        else:
            return jsonify({"success": False, "message": "Unknown query ID"}), 400

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Hospital Management System running on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=True)
