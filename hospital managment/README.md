# 🏥 Hospital Management System Using MongoDB

An enterprise-grade, full-stack **Hospital Management System (HMS)** designed as a comprehensive **College DBMS Project**. It demonstrates core and advanced MongoDB concepts including CRUD operations, aggregation pipelines, relational document references (`$lookup`), document schema design, and interactive query execution.

Built with **Python Flask**, **PyMongo**, and a modern cyber-clean dark mode UI with glassmorphism.

---

## 🌟 Key Highlights

- **Dual-Engine MongoDB Architecture**:
  - Connects seamlessly to your local **MongoDB Community Server** (`mongodb://localhost:27017/HospitalDB`) or cloud-hosted **MongoDB Atlas** cluster (`mongodb+srv://...`).
  - Automatically falls back to an **in-memory MongoDB engine (`mongomock`)** with pre-seeded data if MongoDB is offline, allowing instant presentation anywhere without installation blockers.
  - Interactive **Connection Modal in the Navbar** lets you switch between Local, Atlas, and Demo modes live from the browser.
- **Interactive MongoDB Live Query Console**:
  - Built-in live lab playground at `/queries` executing all 8 core college DBMS queries and aggregation pipelines with syntax highlighting and instant BSON/JSON output stream.
- **360-Degree Patient Medical Journey**:
  - Aggregates appointments, diagnoses, prescriptions, room admissions, and billing invoices into a unified Electronic Health Record (EHR).
- **Revenue Analytics & Aggregation Pipelines**:
  - Live financial reporting using MongoDB's `$match` and `$group` accumulators.
- **Ward & Bed Management**:
  - Real-time room capacity tracking, bed occupancy gauges, patient admission, and discharge workflows.

---

## 📂 Database Design (`HospitalDB`)

The system organizes clinical operations across **7 interconnected collections**:

| Collection | Description | Key Fields |
| :--- | :--- | :--- |
| `patients` | Patient personal, contact & demographic details | `patient_id`, `name`, `age`, `gender`, `blood_group`, `phone`, `address`, `created_at` |
| `doctors` | Physician profiles, specialties & availability | `doctor_id`, `name`, `specialization`, `experience`, `consultation_fee`, `available`, `department` |
| `appointments` | Scheduled visits connecting patients & doctors | `appointment_id`, `patient_id`, `doctor_id`, `appointment_date`, `status`, `reason`, `notes` |
| `medical_records` | Clinical diagnoses, treatment regimens & allergies | `record_id`, `patient_id`, `doctor_id`, `diagnosis`, `treatment`, `record_date`, `follow_up` |
| `prescriptions` | Medicines prescribed with dosages & schedules | `prescription_id`, `patient_id`, `doctor_id`, `date`, `medicines` (array of subdocs), `instructions` |
| `billing` | Invoices, itemized charges & payment states | `bill_id`, `patient_id`, `appointment_id`, `amount`, `payment_status`, `payment_method`, `bill_date` |
| `rooms` | Hospital wards, bed allocation & daily rates | `room_number`, `room_type`, `floor`, `total_beds`, `occupied_beds`, `charge_per_day`, `status`, `allocated_patients` |

---

## ⚡ Important MongoDB Queries & Aggregations

### Query 1: Display All Patients
```javascript
db.patients.find()
```

### Query 2: Find a Patient by Name
```javascript
db.patients.find({
    name: "Rahul Sharma"
})
```

### Query 3: Find Doctors by Specialization
```javascript
db.doctors.find({
    specialization: "Cardiology"
})
```

### Query 4: Update Patient Details ($set)
```javascript
db.patients.updateOne(
    { patient_id: "P101" },
    { $set: { address: "Jodhpur" } }
)
```

### Query 5: Delete a Patient Record
```javascript
db.patients.deleteOne({
    patient_id: "P101"
})
```

### Query 6: Count Total Patients
```javascript
db.patients.countDocuments()
```

### Query 7: Count Doctors by Specialization ($group Aggregation Pipeline)
```javascript
db.doctors.aggregate([
    {
        $group: {
            _id: "$specialization",
            totalDoctors: { $sum: 1 }
        }
    },
    {
        $sort: { totalDoctors: -1 }
    }
])
```

### Query 8: Find Appointments with Patient Details ($lookup Relational Join)
```javascript
db.appointments.aggregate([
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
])
```

### Advanced Pipeline: Calculate Total Revenue from Paid Bills
```javascript
db.billing.aggregate([
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
])
```

---

## 🏗️ Project Architecture

```
hospital managment/
│
├── app.py                     # Main Flask web server & REST API controller
├── database.py                # PyMongo connection manager & query handlers
├── seed_data.py               # Pre-populated realistic sample clinical dataset
├── test_app.py                # Automated test suite for routes & MongoDB queries
├── requirements.txt           # Python dependency requirements
├── .env                       # Local environment settings (MONGO_URI, PORT)
├── .env.example               # Configuration template
│
├── templates/
│   ├── base.html              # Layout shell with navigation & DB connection modal
│   ├── index.html             # Executive Dashboard & clinical KPI metrics
│   ├── patients.html          # Patient registry, search & CRUD modals
│   ├── patient_history.html   # 360-degree patient EHR medical journey
│   ├── doctors.html           # Doctor profiles, department stats & availability
│   ├── appointments.html      # Appointment booking & status lifecycle
│   ├── medical_records.html   # Diagnoses, treatments & prescription regimens
│   ├── billing.html           # Invoicing & revenue aggregation pipeline
│   ├── rooms.html             # Room & bed occupancy management
│   └── queries.html           # Live interactive MongoDB Query Console
│
├── static/
│   ├── css/
│   │   └── style.css          # Modern dark glassmorphic design system
│   └── js/
│       └── script.js          # Interactive client logic, modals & query runner
│
└── README.md                  # Comprehensive project report & viva guide
```

---

## 🚀 How to Run the Application

### 1. Prerequisites
- **Python 3.10+** installed
- Optional: **MongoDB Community Server** or **MongoDB Atlas** account (app includes automatic fallback mock)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Database Connection (Optional)
By default, the application connects to `mongodb://localhost:27017/HospitalDB`.
To connect to MongoDB Atlas, create or edit `.env`:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/HospitalDB?retryWrites=true&w=majority
DB_NAME=HospitalDB
PORT=5000
```
*(You can also configure the connection string directly from the UI by clicking the database pill in the navbar!)*

### 4. Start the Application
```bash
python app.py
```
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

### 5. Run Automated Tests
```bash
python test_app.py
```

---

## 🎓 College Lab & Viva Voce Q&A Reference

### Q1: Why use MongoDB instead of a Relational Database (SQL) for a Hospital System?
> **Answer**: In healthcare applications, clinical records, doctor notes, and prescriptions vary significantly between patients. MongoDB's document-oriented JSON/BSON schema allows flexible data structures (like embedded medicine arrays within prescriptions) without rigid table migrations, while supporting horizontal scalability for massive hospital data.

### Q2: What is the purpose of `$lookup` in MongoDB?
> **Answer**: `$lookup` performs a left outer join to an unsharded collection in the same database to filter in documents from the "joined" collection for processing. In our project (Query 8), it connects `appointments` with `patients` using `patient_id`.

### Q3: What does the `$unwind` stage do?
> **Answer**: `$lookup` outputs matching documents as an array. The `$unwind` stage deconstructs that array field to output a document for each element, flattening the structure so child fields (like `patient_details.name`) can be directly accessed.

### Q4: Explain the difference between Embedded Documents and References in MongoDB.
> **Answer**:
> - **Embedded Documents**: Stored inside the parent document (e.g., the `medicines` array inside a `prescription` document). Best for 1-to-few relationships accessed together.
> - **Referenced Documents**: Stored in separate collections using matching IDs (e.g., `patient_id` connecting `appointments` and `patients`). Best for 1-to-many relationships to avoid data duplication.

### Q5: How does the Aggregation Pipeline calculate total revenue?
> **Answer**: The pipeline uses two stages:
> 1. `$match`: Filters documents where `payment_status` is `"Paid"`.
> 2. `$group`: Groups the matched documents using `_id: null` (aggregating all) and computes the sum of the `amount` field using the `$sum` accumulator.
