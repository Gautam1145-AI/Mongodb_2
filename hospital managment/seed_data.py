"""
HospitalDB Seed Data
Provides initial data for all 7 MongoDB collections:
patients, doctors, appointments, medical_records, prescriptions, billing, rooms.
"""

from datetime import datetime, timezone, timedelta

def get_sample_data():
    now = datetime.now(timezone.utc)
    
    patients = [
        {
            "patient_id": "P101",
            "name": "Rahul Sharma",
            "age": 25,
            "gender": "Male",
            "phone": "9876543210",
            "address": "Jaipur",
            "blood_group": "B+",
            "emergency_contact": "9876500001",
            "created_at": now - timedelta(days=25)
        },
        {
            "patient_id": "P102",
            "name": "Priya Patel",
            "age": 32,
            "gender": "Female",
            "phone": "9823456789",
            "address": "Ahmedabad",
            "blood_group": "O+",
            "emergency_contact": "9823400002",
            "created_at": now - timedelta(days=20)
        },
        {
            "patient_id": "P103",
            "name": "Anita Roy",
            "age": 45,
            "gender": "Female",
            "phone": "9845123456",
            "address": "Kolkata",
            "blood_group": "A+",
            "emergency_contact": "9845100003",
            "created_at": now - timedelta(days=15)
        },
        {
            "patient_id": "P104",
            "name": "Vikram Singh",
            "age": 58,
            "gender": "Male",
            "phone": "9812345678",
            "address": "Delhi",
            "blood_group": "AB+",
            "emergency_contact": "9812300004",
            "created_at": now - timedelta(days=10)
        },
        {
            "patient_id": "P105",
            "name": "Sneha Kulkarni",
            "age": 28,
            "gender": "Female",
            "phone": "9890123456",
            "address": "Pune",
            "blood_group": "O-",
            "emergency_contact": "9890100005",
            "created_at": now - timedelta(days=8)
        },
        {
            "patient_id": "P106",
            "name": "Arjun Nair",
            "age": 36,
            "gender": "Male",
            "phone": "9833445566",
            "address": "Kochi",
            "blood_group": "A-",
            "emergency_contact": "9833400006",
            "created_at": now - timedelta(days=5)
        },
        {
            "patient_id": "P107",
            "name": "Meera Iyer",
            "age": 62,
            "gender": "Female",
            "phone": "9844556677",
            "address": "Chennai",
            "blood_group": "B-",
            "emergency_contact": "9844500007",
            "created_at": now - timedelta(days=2)
        }
    ]

    doctors = [
        {
            "doctor_id": "D101",
            "name": "Dr. Amit Verma",
            "specialization": "Cardiology",
            "experience": 10,
            "consultation_fee": 800,
            "available": True,
            "email": "amit.verma@hospital.org",
            "phone": "9811223344",
            "department": "Cardiology"
        },
        {
            "doctor_id": "D102",
            "name": "Dr. Sunita Rao",
            "specialization": "Neurology",
            "experience": 14,
            "consultation_fee": 1000,
            "available": True,
            "email": "sunita.rao@hospital.org",
            "phone": "9811223345",
            "department": "Neurology"
        },
        {
            "doctor_id": "D103",
            "name": "Dr. Rajesh Gupta",
            "specialization": "Orthopedics",
            "experience": 8,
            "consultation_fee": 700,
            "available": False,
            "email": "rajesh.gupta@hospital.org",
            "phone": "9811223346",
            "department": "Orthopedics"
        },
        {
            "doctor_id": "D104",
            "name": "Dr. Kavita Joshi",
            "specialization": "Pediatrics",
            "experience": 12,
            "consultation_fee": 650,
            "available": True,
            "email": "kavita.joshi@hospital.org",
            "phone": "9811223347",
            "department": "Pediatrics"
        },
        {
            "doctor_id": "D105",
            "name": "Dr. Sanjay Deshmukh",
            "specialization": "Cardiology",
            "experience": 16,
            "consultation_fee": 900,
            "available": True,
            "email": "sanjay.deshmukh@hospital.org",
            "phone": "9811223348",
            "department": "Cardiology"
        },
        {
            "doctor_id": "D106",
            "name": "Dr. Ananya Sen",
            "specialization": "General Medicine",
            "experience": 7,
            "consultation_fee": 500,
            "available": True,
            "email": "ananya.sen@hospital.org",
            "phone": "9811223349",
            "department": "General Medicine"
        },
        {
            "doctor_id": "D107",
            "name": "Dr. Rohan Mathew",
            "specialization": "Dermatology",
            "experience": 9,
            "consultation_fee": 600,
            "available": True,
            "email": "rohan.mathew@hospital.org",
            "phone": "9811223350",
            "department": "Dermatology"
        }
    ]

    appointments = [
        {
            "appointment_id": "A101",
            "patient_id": "P101",
            "doctor_id": "D101",
            "appointment_date": now + timedelta(days=1, hours=2),
            "status": "Scheduled",
            "reason": "Regular Checkup",
            "notes": "Mild palpitations reported"
        },
        {
            "appointment_id": "A102",
            "patient_id": "P102",
            "doctor_id": "D102",
            "appointment_date": now + timedelta(days=2, hours=4),
            "status": "Scheduled",
            "reason": "Frequent Migraine Headaches",
            "notes": "Requires neurological screening"
        },
        {
            "appointment_id": "A103",
            "patient_id": "P103",
            "doctor_id": "D103",
            "appointment_date": now - timedelta(days=3),
            "status": "Completed",
            "reason": "Knee Joint Pain",
            "notes": "X-ray completed; physiotherapy suggested"
        },
        {
            "appointment_id": "A104",
            "patient_id": "P104",
            "doctor_id": "D105",
            "appointment_date": now - timedelta(days=2),
            "status": "Completed",
            "reason": "Post-cardiac stent evaluation",
            "notes": "ECG stable, medication adjusted"
        },
        {
            "appointment_id": "A105",
            "patient_id": "P105",
            "doctor_id": "D104",
            "appointment_date": now + timedelta(days=3),
            "status": "Scheduled",
            "reason": "Seasonal allergy consultation",
            "notes": "Skin patch test recommended"
        },
        {
            "appointment_id": "A106",
            "patient_id": "P106",
            "doctor_id": "D106",
            "appointment_date": now - timedelta(days=1),
            "status": "Completed",
            "reason": "Viral fever and body ache",
            "notes": "Blood profile normal; advised rest"
        },
        {
            "appointment_id": "A107",
            "patient_id": "P107",
            "doctor_id": "D101",
            "appointment_date": now + timedelta(days=4),
            "status": "Scheduled",
            "reason": "Blood pressure monitoring",
            "notes": "Elderly patient routine checkup"
        }
    ]

    medical_records = [
        {
            "record_id": "MR101",
            "patient_id": "P101",
            "doctor_id": "D101",
            "appointment_id": "A101",
            "diagnosis": "Essential Hypertension (Stage 1)",
            "treatment": "Dietary sodium reduction, daily 30m aerobic exercise, and medication.",
            "record_date": now - timedelta(days=10),
            "follow_up": (now + timedelta(days=20)).strftime("%Y-%m-%d"),
            "allergies": "None"
        },
        {
            "record_id": "MR102",
            "patient_id": "P103",
            "doctor_id": "D103",
            "appointment_id": "A103",
            "diagnosis": "Grade 2 Osteoarthritis of Left Knee",
            "treatment": "Topical NSAID gel, physical therapy 3x/week, intra-articular hyaluronic acid.",
            "record_date": now - timedelta(days=3),
            "follow_up": (now + timedelta(days=27)).strftime("%Y-%m-%d"),
            "allergies": "Sulfa drugs"
        },
        {
            "record_id": "MR103",
            "patient_id": "P104",
            "doctor_id": "D105",
            "appointment_id": "A104",
            "diagnosis": "Coronary Artery Disease - Stable Post-PCI",
            "treatment": "Dual antiplatelet therapy, statin therapy, cardiac rehab program.",
            "record_date": now - timedelta(days=2),
            "follow_up": (now + timedelta(days=60)).strftime("%Y-%m-%d"),
            "allergies": "Penicillin"
        },
        {
            "record_id": "MR104",
            "patient_id": "P106",
            "doctor_id": "D106",
            "appointment_id": "A106",
            "diagnosis": "Acute Upper Respiratory Tract Viral Infection",
            "treatment": "Antipyretics, warm saline gargles, adequate hydration.",
            "record_date": now - timedelta(days=1),
            "follow_up": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
            "allergies": "None"
        }
    ]

    prescriptions = [
        {
            "prescription_id": "RX101",
            "patient_id": "P101",
            "doctor_id": "D101",
            "record_id": "MR101",
            "date": now - timedelta(days=10),
            "medicines": [
                {"name": "Amlodipine 5mg", "dosage": "1 tablet daily", "duration": "30 days", "timing": "Morning after breakfast"},
                {"name": "Metoprolol 25mg", "dosage": "1 tablet twice daily", "duration": "15 days", "timing": "After meals"}
            ],
            "instructions": "Limit dietary salt. Avoid caffeine before bedtime."
        },
        {
            "prescription_id": "RX102",
            "patient_id": "P103",
            "doctor_id": "D103",
            "record_id": "MR102",
            "date": now - timedelta(days=3),
            "medicines": [
                {"name": "Paracetamol 650mg", "dosage": "1 tablet as needed", "duration": "5 days", "timing": "Post meal"},
                {"name": "Glucosamine + Chondroitin", "dosage": "1 capsule daily", "duration": "60 days", "timing": "Morning"}
            ],
            "instructions": "Use knee brace during walking. Apply warm compress in evenings."
        },
        {
            "prescription_id": "RX103",
            "patient_id": "P104",
            "doctor_id": "D105",
            "record_id": "MR103",
            "date": now - timedelta(days=2),
            "medicines": [
                {"name": "Atorvastatin 40mg", "dosage": "1 tablet daily", "duration": "90 days", "timing": "At night"},
                {"name": "Clopidogrel 75mg", "dosage": "1 tablet daily", "duration": "90 days", "timing": "After breakfast"}
            ],
            "instructions": "Strict low cholesterol diet. Report any unusual muscle pain."
        }
    ]

    billing = [
        {
            "bill_id": "B101",
            "patient_id": "P101",
            "appointment_id": "A101",
            "amount": 1500,
            "payment_status": "Paid",
            "payment_method": "Credit Card",
            "bill_date": now - timedelta(days=10),
            "items": [
                {"description": "Consultation Fee", "amount": 800},
                {"description": "Electrocardiogram (ECG)", "amount": 700}
            ]
        },
        {
            "bill_id": "B102",
            "patient_id": "P102",
            "appointment_id": "A102",
            "amount": 1000,
            "payment_status": "Pending",
            "payment_method": "Pending",
            "bill_date": now - timedelta(days=1),
            "items": [
                {"description": "Neurology Initial Consultation", "amount": 1000}
            ]
        },
        {
            "bill_id": "B103",
            "patient_id": "P103",
            "appointment_id": "A103",
            "amount": 2200,
            "payment_status": "Paid",
            "payment_method": "UPI",
            "bill_date": now - timedelta(days=3),
            "items": [
                {"description": "Orthopedic Consultation", "amount": 700},
                {"description": "Bilateral Knee X-Ray (AP/Lat)", "amount": 1500}
            ]
        },
        {
            "bill_id": "B104",
            "patient_id": "P104",
            "appointment_id": "A104",
            "amount": 4500,
            "payment_status": "Paid",
            "payment_method": "Net Banking",
            "bill_date": now - timedelta(days=2),
            "items": [
                {"description": "Cardiology Consultation", "amount": 900},
                {"description": "Echocardiogram (2D Echo)", "amount": 2600},
                {"description": "Blood Lipid Panel", "amount": 1000}
            ]
        },
        {
            "bill_id": "B105",
            "patient_id": "P105",
            "appointment_id": "A105",
            "amount": 650,
            "payment_status": "Pending",
            "payment_method": "Pending",
            "bill_date": now,
            "items": [
                {"description": "Pediatric Consultation", "amount": 650}
            ]
        },
        {
            "bill_id": "B106",
            "patient_id": "P106",
            "appointment_id": "A106",
            "amount": 1100,
            "payment_status": "Paid",
            "payment_method": "Cash",
            "bill_date": now - timedelta(days=1),
            "items": [
                {"description": "General Physician Consultation", "amount": 500},
                {"description": "Complete Blood Count (CBC)", "amount": 600}
            ]
        }
    ]

    rooms = [
        {
            "room_number": "R101",
            "room_type": "ICU",
            "floor": 1,
            "total_beds": 4,
            "occupied_beds": 2,
            "charge_per_day": 4500,
            "status": "Available",
            "allocated_patients": ["P104"],
            "features": ["Continuous Cardiac Monitoring", "Ventilator Facility", "Nurse Station Proximity"]
        },
        {
            "room_number": "R102",
            "room_type": "General Ward",
            "floor": 1,
            "total_beds": 10,
            "occupied_beds": 6,
            "charge_per_day": 1200,
            "status": "Available",
            "allocated_patients": ["P102", "P103"],
            "features": ["Adjustable Beds", "Oxygen Outlet", "Call Bell"]
        },
        {
            "room_number": "R201",
            "room_type": "Private Deluxe",
            "floor": 2,
            "total_beds": 1,
            "occupied_beds": 1,
            "charge_per_day": 3800,
            "status": "Occupied",
            "allocated_patients": ["P101"],
            "features": ["Air Conditioned", "Attached Restroom", "Attendant Couch", "Smart TV"]
        },
        {
            "room_number": "R202",
            "room_type": "Semi-Private",
            "floor": 2,
            "total_beds": 2,
            "occupied_beds": 0,
            "charge_per_day": 2400,
            "status": "Available",
            "allocated_patients": [],
            "features": ["Privacy Curtain", "Reclining Beds", "Individual Lockers"]
        },
        {
            "room_number": "R301",
            "room_type": "Emergency Observation",
            "floor": 3,
            "total_beds": 6,
            "occupied_beds": 2,
            "charge_per_day": 2800,
            "status": "Available",
            "allocated_patients": ["P106"],
            "features": ["Defibrillator Access", "Triage Station", "Direct ER Elevator"]
        }
    ]

    return {
        "patients": patients,
        "doctors": doctors,
        "appointments": appointments,
        "medical_records": medical_records,
        "prescriptions": prescriptions,
        "billing": billing,
        "rooms": rooms
    }
