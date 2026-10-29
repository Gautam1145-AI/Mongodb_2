"""
HospitalDB Database Connection and Query Manager
Supports PyMongo with real MongoDB (local or MongoDB Atlas)
and graceful automatic fallback to mongomock for instant demo/offline execution.
"""

import os
import re
from datetime import datetime, timezone
from bson import ObjectId, json_util
from dotenv import load_dotenv
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import mongomock

from seed_data import get_sample_data

load_dotenv()

DEFAULT_MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/HospitalDB")
DB_NAME = os.getenv("DB_NAME", "HospitalDB")


class HospitalDatabase:
    def __init__(self, uri=DEFAULT_MONGO_URI):
        self.uri = uri
        self.client = None
        self.db = None
        self.is_mock = False
        self.connection_status = "Initializing..."
        self.init_connection(uri)

    def init_connection(self, uri):
        """Attempts to connect to MongoDB, falling back to mongomock if unavailable."""
        self.uri = uri
        try:
            # Try connecting to real MongoDB with a fast timeout (2 seconds)
            real_client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=2000)
            real_client.admin.command("ping")
            self.client = real_client
            self.db = self.client[DB_NAME]
            self.is_mock = False
            self.connection_status = f"Connected to Real MongoDB ({self._mask_uri(uri)})"
            print(f"[HospitalDB] {self.connection_status}")
            
            # Ensure collections and seed if empty
            if self.db.patients.count_documents({}) == 0:
                print("[HospitalDB] Real MongoDB is empty. Seeding initial data...")
                self.seed_database()

        except Exception as e:
            print(f"[HospitalDB] Real MongoDB connection failed ({str(e)}). Switching to mongomock...")
            self.client = mongomock.MongoClient()
            self.db = self.client[DB_NAME]
            self.is_mock = True
            self.connection_status = "In-Memory MongoDB Mock (Offline/Demo Mode)"
            self.seed_database()

    def _mask_uri(self, uri):
        """Mask credentials in connection string for security/display."""
        if "@" in uri:
            return re.sub(r"://([^:]+):([^@]+)@", "://***:***@", uri)
        return uri

    def switch_connection(self, new_uri):
        """Switch to a new MongoDB connection string (e.g. from user input)."""
        previous_status = self.connection_status
        previous_mock = self.is_mock
        try:
            real_client = pymongo.MongoClient(new_uri, serverSelectionTimeoutMS=3000)
            real_client.admin.command("ping")
            self.client = real_client
            self.db = self.client[DB_NAME]
            self.uri = new_uri
            self.is_mock = False
            self.connection_status = f"Connected to MongoDB ({self._mask_uri(new_uri)})"
            if self.db.patients.count_documents({}) == 0:
                self.seed_database()
            return True, f"Successfully connected to MongoDB at {self._mask_uri(new_uri)}"
        except Exception as e:
            return False, f"Connection failed: {str(e)}"

    def seed_database(self, force=False):
        """Populate database with sample data across all 7 collections."""
        sample = get_sample_data()
        for col_name, documents in sample.items():
            col = self.db[col_name]
            if force:
                col.delete_many({})
            if col.count_documents({}) == 0:
                col.insert_many(documents)
        return True

    # -------------------------------------------------------------
    # PATIENT MANAGEMENT (CRUD + Queries 1, 2, 4, 5, 6)
    # -------------------------------------------------------------
    def get_patients(self, search=None, blood_group=None):
        """Query 1 & 2: Display patients, with optional name/ID/blood group filter."""
        query = {}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"patient_id": {"$regex": search, "$options": "i"}},
                {"phone": {"$regex": search, "$options": "i"}},
                {"address": {"$regex": search, "$options": "i"}}
            ]
        if blood_group and blood_group != "All":
            query["blood_group"] = blood_group

        patients = list(self.db.patients.find(query).sort("patient_id", 1))
        return self._format_docs(patients)

    def get_patient_by_id(self, patient_id):
        patient = self.db.patients.find_one({"patient_id": patient_id})
        return self._format_doc(patient)

    def insert_patient(self, data):
        """Register new patient."""
        if not data.get("patient_id"):
            count = self.db.patients.count_documents({}) + 101
            data["patient_id"] = f"P{count}"
        if "created_at" not in data:
            data["created_at"] = datetime.now(timezone.utc)
        result = self.db.patients.insert_one(data)
        return data["patient_id"]

    def update_patient(self, patient_id, update_fields):
        """Query 4: Update patient details."""
        update_fields.pop("_id", None)
        update_fields.pop("patient_id", None)
        result = self.db.patients.update_one(
            {"patient_id": patient_id},
            {"$set": update_fields}
        )
        return result.modified_count > 0 or result.matched_count > 0

    def delete_patient(self, patient_id):
        """Query 5: Delete a patient record."""
        result = self.db.patients.delete_one({"patient_id": patient_id})
        return result.deleted_count > 0

    def count_patients(self):
        """Query 6: Count total patients."""
        return self.db.patients.count_documents({})

    # -------------------------------------------------------------
    # DOCTOR MANAGEMENT (CRUD + Queries 3, 7)
    # -------------------------------------------------------------
    def get_doctors(self, specialization=None, available_only=False):
        """Query 3: Find doctors by specialization or availability."""
        query = {}
        if specialization and specialization != "All":
            query["specialization"] = specialization
        if available_only:
            query["available"] = True

        doctors = list(self.db.doctors.find(query).sort("name", 1))
        return self._format_docs(doctors)

    def get_doctor_by_id(self, doctor_id):
        doctor = self.db.doctors.find_one({"doctor_id": doctor_id})
        return self._format_doc(doctor)

    def insert_doctor(self, data):
        if not data.get("doctor_id"):
            count = self.db.doctors.count_documents({}) + 101
            data["doctor_id"] = f"D{count}"
        if "available" not in data:
            data["available"] = True
        self.db.doctors.insert_one(data)
        return data["doctor_id"]

    def update_doctor(self, doctor_id, update_fields):
        update_fields.pop("_id", None)
        update_fields.pop("doctor_id", None)
        result = self.db.doctors.update_one(
            {"doctor_id": doctor_id},
            {"$set": update_fields}
        )
        return result.modified_count > 0 or result.matched_count > 0

    def count_doctors_by_specialization(self):
        """Query 7: Count Doctors by Specialization using aggregation pipeline."""
        pipeline = [
            {
                "$group": {
                    "_id": "$specialization",
                    "totalDoctors": {"$sum": 1}
                }
            },
            {"$sort": {"totalDoctors": -1}}
        ]
        return list(self.db.doctors.aggregate(pipeline))

    # -------------------------------------------------------------
    # APPOINTMENT MANAGEMENT (Query 8 + Lookup Aggregations)
    # -------------------------------------------------------------
    def get_appointments_with_details(self, date_filter=None, status_filter=None):
        """
        Query 8: Find appointments with joined Patient and Doctor details
        using MongoDB's $lookup and $unwind pipeline stages.
        """
        match_stage = {}
        if status_filter and status_filter != "All":
            match_stage["status"] = status_filter

        pipeline = []
        if match_stage:
            pipeline.append({"$match": match_stage})

        pipeline.extend([
            {
                "$lookup": {
                    "from": "patients",
                    "localField": "patient_id",
                    "foreignField": "patient_id",
                    "as": "patient_details"
                }
            },
            {"$unwind": {"path": "$patient_details", "preserveNullAndEmptyArrays": True}},
            {
                "$lookup": {
                    "from": "doctors",
                    "localField": "doctor_id",
                    "foreignField": "doctor_id",
                    "as": "doctor_details"
                }
            },
            {"$unwind": {"path": "$doctor_details", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": 0,
                    "appointment_id": 1,
                    "patient_id": 1,
                    "patient_name": {"$ifNull": ["$patient_details.name", "Unknown"]},
                    "patient_phone": "$patient_details.phone",
                    "doctor_id": 1,
                    "doctor_name": {"$ifNull": ["$doctor_details.name", "Unassigned"]},
                    "specialization": "$doctor_details.specialization",
                    "consultation_fee": "$doctor_details.consultation_fee",
                    "appointment_date": 1,
                    "status": 1,
                    "reason": 1,
                    "notes": 1
                }
            },
            {"$sort": {"appointment_date": -1}}
        ])

        results = list(self.db.appointments.aggregate(pipeline))
        return self._format_docs(results)

    def book_appointment(self, data):
        if not data.get("appointment_id"):
            count = self.db.appointments.count_documents({}) + 101
            data["appointment_id"] = f"A{count}"
        if "status" not in data:
            data["status"] = "Scheduled"
        if isinstance(data.get("appointment_date"), str):
            try:
                data["appointment_date"] = datetime.fromisoformat(data["appointment_date"])
            except Exception:
                data["appointment_date"] = datetime.now(timezone.utc)
        self.db.appointments.insert_one(data)
        return data["appointment_id"]

    def update_appointment_status(self, appointment_id, status):
        result = self.db.appointments.update_one(
            {"appointment_id": appointment_id},
            {"$set": {"status": status}}
        )
        return result.modified_count > 0

    # -------------------------------------------------------------
    # MEDICAL RECORDS & PRESCRIPTIONS
    # -------------------------------------------------------------
    def get_medical_records(self, patient_id=None):
        query = {"patient_id": patient_id} if patient_id else {}
        records = list(self.db.medical_records.find(query).sort("record_date", -1))
        
        # Enrich with doctor and patient name
        enriched = []
        for r in records:
            pat = self.db.patients.find_one({"patient_id": r.get("patient_id")})
            doc = self.db.doctors.find_one({"doctor_id": r.get("doctor_id")})
            r["patient_name"] = pat.get("name") if pat else "Unknown"
            r["doctor_name"] = doc.get("name") if doc else "Unknown"
            enriched.append(r)
        return self._format_docs(enriched)

    def insert_medical_record(self, data):
        if not data.get("record_id"):
            count = self.db.medical_records.count_documents({}) + 101
            data["record_id"] = f"MR{count}"
        if "record_date" not in data:
            data["record_date"] = datetime.now(timezone.utc)
        self.db.medical_records.insert_one(data)
        return data["record_id"]

    def get_prescriptions(self, patient_id=None):
        query = {"patient_id": patient_id} if patient_id else {}
        prescriptions = list(self.db.prescriptions.find(query).sort("date", -1))
        enriched = []
        for p in prescriptions:
            pat = self.db.patients.find_one({"patient_id": p.get("patient_id")})
            doc = self.db.doctors.find_one({"doctor_id": p.get("doctor_id")})
            p["patient_name"] = pat.get("name") if pat else "Unknown"
            p["doctor_name"] = doc.get("name") if doc else "Unknown"
            enriched.append(p)
        return self._format_docs(enriched)

    def insert_prescription(self, data):
        if not data.get("prescription_id"):
            count = self.db.prescriptions.count_documents({}) + 101
            data["prescription_id"] = f"RX{count}"
        if "date" not in data:
            data["date"] = datetime.now(timezone.utc)
        self.db.prescriptions.insert_one(data)
        return data["prescription_id"]

    # -------------------------------------------------------------
    # BILLING & REVENUE ANALYTICS
    # -------------------------------------------------------------
    def get_billing(self, status=None):
        query = {"payment_status": status} if status and status != "All" else {}
        bills = list(self.db.billing.find(query).sort("bill_date", -1))
        enriched = []
        for b in bills:
            pat = self.db.patients.find_one({"patient_id": b.get("patient_id")})
            b["patient_name"] = pat.get("name") if pat else "Unknown"
            enriched.append(b)
        return self._format_docs(enriched)

    def insert_bill(self, data):
        if not data.get("bill_id"):
            count = self.db.billing.count_documents({}) + 101
            data["bill_id"] = f"B{count}"
        if "bill_date" not in data:
            data["bill_date"] = datetime.now(timezone.utc)
        if "amount" in data:
            data["amount"] = float(data["amount"])
        self.db.billing.insert_one(data)
        return data["bill_id"]

    def update_bill_status(self, bill_id, status, method="UPI"):
        result = self.db.billing.update_one(
            {"bill_id": bill_id},
            {"$set": {"payment_status": status, "payment_method": method}}
        )
        return result.modified_count > 0

    def calculate_total_revenue(self):
        """
        Calculates total revenue using MongoDB's Aggregation Pipeline:
        db.billing.aggregate([
            { $match: { payment_status: "Paid" } },
            { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }
        ])
        """
        pipeline = [
            {"$match": {"payment_status": "Paid"}},
            {"$group": {"_id": None, "totalRevenue": {"$sum": "$amount"}}}
        ]
        result = list(self.db.billing.aggregate(pipeline))
        return result[0]["totalRevenue"] if result else 0

    # -------------------------------------------------------------
    # ROOM MANAGEMENT
    # -------------------------------------------------------------
    def get_rooms(self, room_type=None):
        query = {"room_type": room_type} if room_type and room_type != "All" else {}
        rooms = list(self.db.rooms.find(query).sort("room_number", 1))
        return self._format_docs(rooms)

    def insert_room(self, data):
        if "total_beds" in data:
            data["total_beds"] = int(data["total_beds"])
        if "occupied_beds" not in data:
            data["occupied_beds"] = 0
        if "charge_per_day" in data:
            data["charge_per_day"] = float(data["charge_per_day"])
        if "allocated_patients" not in data:
            data["allocated_patients"] = []
        data["status"] = "Occupied" if data["occupied_beds"] >= data["total_beds"] else "Available"
        self.db.rooms.insert_one(data)
        return data.get("room_number")

    def allocate_room(self, room_number, patient_id):
        room = self.db.rooms.find_one({"room_number": room_number})
        if not room:
            return False, "Room not found"
        if patient_id in room.get("allocated_patients", []):
            return False, "Patient already allocated to this room"
        if room.get("occupied_beds", 0) >= room.get("total_beds", 1):
            return False, "Room is fully occupied"

        new_occupied = room.get("occupied_beds", 0) + 1
        new_status = "Occupied" if new_occupied >= room.get("total_beds", 1) else "Available"
        self.db.rooms.update_one(
            {"room_number": room_number},
            {
                "$push": {"allocated_patients": patient_id},
                "$set": {"occupied_beds": new_occupied, "status": new_status}
            }
        )
        return True, "Patient allocated successfully"

    def discharge_room(self, room_number, patient_id):
        room = self.db.rooms.find_one({"room_number": room_number})
        if not room or patient_id not in room.get("allocated_patients", []):
            return False, "Patient not found in this room"

        new_occupied = max(0, room.get("occupied_beds", 1) - 1)
        self.db.rooms.update_one(
            {"room_number": room_number},
            {
                "$pull": {"allocated_patients": patient_id},
                "$set": {"occupied_beds": new_occupied, "status": "Available"}
            }
        )
        return True, "Patient discharged from room successfully"

    # -------------------------------------------------------------
    # ADVANCED ANALYTICS & DASHBOARD
    # -------------------------------------------------------------
    def get_dashboard_stats(self):
        total_patients = self.db.patients.count_documents({})
        total_doctors = self.db.doctors.count_documents({})
        total_appointments = self.db.appointments.count_documents({})
        total_revenue = self.calculate_total_revenue()
        
        # Pending bills
        pending_bills_count = self.db.billing.count_documents({"payment_status": "Pending"})
        
        # Room occupancy
        rooms = list(self.db.rooms.find({}))
        total_beds = sum(r.get("total_beds", 0) for r in rooms)
        occupied_beds = sum(r.get("occupied_beds", 0) for r in rooms)
        available_beds = max(0, total_beds - occupied_beds)

        # Doctors by Specialization
        docs_by_spec = self.count_doctors_by_specialization()

        # Appointments by Status
        appts_by_status_raw = list(self.db.appointments.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]))
        appts_by_status = {item["_id"]: item["count"] for item in appts_by_status_raw}

        # Busiest Doctors Pipeline
        busiest_doctors = list(self.db.appointments.aggregate([
            {"$group": {"_id": "$doctor_id", "appointment_count": {"$sum": 1}}},
            {"$sort": {"appointment_count": -1}},
            {"$limit": 5},
            {
                "$lookup": {
                    "from": "doctors",
                    "localField": "_id",
                    "foreignField": "doctor_id",
                    "as": "doc"
                }
            },
            {"$unwind": {"path": "$doc", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "doctor_id": "$_id",
                    "doctor_name": "$doc.name",
                    "specialization": "$doc.specialization",
                    "appointment_count": 1
                }
            }
        ]))

        return {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_appointments": total_appointments,
            "total_revenue": total_revenue,
            "pending_bills": pending_bills_count,
            "total_beds": total_beds,
            "occupied_beds": occupied_beds,
            "available_beds": available_beds,
            "doctors_by_specialization": docs_by_spec,
            "appointments_by_status": appts_by_status,
            "busiest_doctors": busiest_doctors,
            "connection_status": self.connection_status,
            "is_mock": self.is_mock
        }

    # -------------------------------------------------------------
    # 360-DEGREE PATIENT MEDICAL HISTORY (Full Journey)
    # -------------------------------------------------------------
    def get_patient_360(self, patient_id):
        patient = self.get_patient_by_id(patient_id)
        if not patient:
            return None

        appointments = self.get_appointments_with_details()
        patient_appts = [a for a in appointments if a.get("patient_id") == patient_id]

        records = self.get_medical_records(patient_id)
        prescriptions = self.get_prescriptions(patient_id)
        bills = [b for b in self.get_billing() if b.get("patient_id") == patient_id]
        
        # Room allocation
        room = self.db.rooms.find_one({"allocated_patients": patient_id})

        return {
            "patient": patient,
            "appointments": patient_appts,
            "medical_records": records,
            "prescriptions": prescriptions,
            "bills": bills,
            "room": self._format_doc(room) if room else None
        }

    # -------------------------------------------------------------
    # LIVE MONGO QUERY EXECUTOR (Interactive Console for College Lab)
    # -------------------------------------------------------------
    def execute_raw_operation(self, collection_name, operation, filter_dict=None, pipeline_list=None, update_dict=None):
        """
        Executes raw MongoDB operations for the interactive query playground.
        Supports: find, aggregate, countDocuments, insertOne, updateOne, deleteOne.
        """
        col = self.db[collection_name]
        filter_dict = filter_dict or {}

        if operation == "find":
            docs = list(col.find(filter_dict))
            return self._format_docs(docs)
        elif operation == "aggregate":
            docs = list(col.aggregate(pipeline_list or []))
            return self._format_docs(docs)
        elif operation == "countDocuments":
            return {"count": col.count_documents(filter_dict)}
        elif operation == "updateOne":
            res = col.update_one(filter_dict, update_dict or {})
            return {"matched_count": res.matched_count, "modified_count": res.modified_count}
        elif operation == "deleteOne":
            res = col.delete_one(filter_dict)
            return {"deleted_count": res.deleted_count}
        elif operation == "insertOne":
            res = col.insert_one(filter_dict)
            return {"inserted_id": str(res.inserted_id)}
        else:
            raise ValueError(f"Unsupported operation: {operation}")

    # -------------------------------------------------------------
    # JSON Serialization Helpers
    # -------------------------------------------------------------
    def _format_doc(self, doc):
        if not doc:
            return None
        formatted = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                formatted[k] = str(v)
            elif isinstance(v, datetime):
                formatted[k] = v.strftime("%Y-%m-%d %H:%M")
            elif isinstance(v, list):
                formatted[k] = [self._format_item(i) for i in v]
            elif isinstance(v, dict):
                formatted[k] = self._format_doc(v)
            else:
                formatted[k] = v
        return formatted

    def _format_item(self, item):
        if isinstance(item, dict):
            return self._format_doc(item)
        elif isinstance(item, ObjectId):
            return str(item)
        elif isinstance(item, datetime):
            return item.strftime("%Y-%m-%d %H:%M")
        return item

    def _format_docs(self, docs):
        return [self._format_doc(d) for d in docs]


# Global singleton instance
db_instance = HospitalDatabase()
