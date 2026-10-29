# Event Ticket Booking & Reservation System Using MongoDB

An enterprise-grade, full-stack college final project demonstrating advanced **MongoDB architecture, ACID multi-document transactions, conditional atomic updates for concurrency control, query optimization (IXSCAN vs. COLLSCAN), replica sets, and real-time aggregation analytics** using **Java 21 LTS, Spring Boot 3.4, and React + Vite**.

[![Java 21](https://img.shields.io/badge/Java-21_LTS-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot 3.4](https://img.shields.io/badge/Spring_Boot-3.4.3-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![MongoDB 7.0+](https://img.shields.io/badge/MongoDB-7.0+_ReplicaSet-green.svg)](https://www.mongodb.com/)
[![React 18](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Build Status](https://img.shields.io/badge/Tests-13_Passed-success.svg)]()

---

## Architecture Overview

```
                         +-----------------------------------+
                         |      React Frontend (Vite)        |
                         |  (Seat Map, Recharts, Tailwind)   |
                         +-----------------+-----------------+
                                           | HTTP / REST (JWT)
                                           v
                         +-----------------------------------+
                         |   Spring Boot 3.4 REST Backend    |
                         |  (Java 21, Security, Validation)  |
                         +-----------------+-----------------+
                                           | Spring Transaction Session
                                           v
                         +-----------------------------------+
                         |     MongoTransactionManager       |
                         |   (ACID Multi-Doc Transactions)   |
                         +-----------------+-----------------+
                                           | findAndModify / Aggregation
                                           v
               +-------------------------------------------------------+
               |             MongoDB Replica Set (rs0)                 |
               |                                                       |
               |  +-----------------+           +-------------------+  |
               |  |  Primary Node   |===oplog==>|  Secondary Node  |  |
               |  | (Reads & Writes)|           | (Read Replica)    |  |
               |  +-----------------+           +-------------------+  |
               |   w: MAJORITY                    Read: PRIMARY        |
               +-------------------------------------------------------+
```

---

## Key Features

### 1. User Experience
- **Interactive Event Discovery:** Search by title, venue, location; filter by category (Concert, Tech, Theater, Sports, Comedy) and date range; sort by date or price.
- **Interactive SVG/Grid Seat Selector:** Color-coded seating tiers (VIP, Premium, General) showing `AVAILABLE`, `HELD`, `BOOKED`, and `SELECTED` states.
- **10-Minute Temporary Hold Engine:** Conditionally reserves seats with a live countdown timer. Unconfirmed holds automatically expire and release back to `AVAILABLE`.
- **Atomic Booking Confirmation:** Generates unique booking references (`BK-XXXXXXXX`), printable ticket cards, and mock payment confirmation.
- **Self-Service Booking History & Cancellation:** View upcoming and past reservations. Cancel bookings with automatic transaction-backed seat release.

### 2. Administrator & Analytics Console
- **Real-Time Aggregation Analytics:** KPI statistics computed via MongoDB Aggregation Pipelines (`$match`, `$group`, `$project`, `$sort`, `$unwind`). Cancelled bookings are strictly excluded from financial totals.
- **Interactive Recharts Visualizations:** Revenue trends, sales breakdown by category, top event occupancy rates.
- **Event & Seat Inventory Management:** Create events with custom ticket category tiers. The backend automatically generates individual seat documents.
- **Live Database Diagnostics:** Inspect replica set health, execute live `explain("executionStats")` query plans, and review active collection indexes.

### 3. Concurrency & Transactional Correctness
- **Race Condition Prevention:** Two users competing for the same seat cannot both acquire it. The system uses conditional atomic `findAndModify` operations:
  $$\text{Query: } \{\text{eventId, seatNumber, status: AVAILABLE}\} \rightarrow \text{Update: } \{\text{status: BOOKED}\}$$
- **ACID Multi-Document Transactions:** Ensures that updating seat status and inserting the booking document succeed or fail together as an atomic unit.
- **Idempotency Key Protection:** Client retries with the same `idempotencyKey` return the existing booking without charging or locking duplicate seats.

---

## Directory Structure

```text
.
├── backend/                        # Java 21 & Spring Boot 3.4 Application
│   ├── mvnw                        # Portable Maven wrapper script
│   ├── pom.xml                     # Maven project configuration
│   └── src/
│       ├── main/java/com/ticketbooking/
│       │   ├── config/             # MongoConfig (TxManager), SecurityConfig, DataInitializer
│       │   ├── controller/         # REST Controllers (Auth, Event, Booking, Analytics, Ops)
│       │   ├── dto/                # Request & Response Data Transfer Objects
│       │   ├── exception/          # GlobalExceptionHandler & Custom Exceptions
│       │   ├── model/              # User, Event, Seat, Booking Entities
│       │   ├── repository/         # Spring Data MongoDB Repositories
│       │   ├── security/           # JWT Utils, Filter, CustomUserDetailsService
│       │   ├── service/            # Business Logic & Atomic Concurrency Services
│       │   └── analytics/          # Real MongoDB Aggregation Pipelines
│       └── test/                   # JUnit 5 & Concurrency Multi-Threaded Tests
├── frontend/                       # React 18 & Vite Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── api/client.js           # API Client with token interceptors
│       ├── context/AuthContext.jsx # Authentication state provider
│       ├── components/             # Navbar, Footer, SeatMap, EventCard, StatusBadge
│       └── pages/                  # Home, Details, Confirmation, MyBookings, Admin
├── scripts/
│   ├── seed-data.js                # Standalone MongoDB shell seed script
│   ├── backup.sh                   # Hot backup script using mongodump (--gzip)
│   └── restore-test.sh             # Safe staging restore script using mongorestore
├── docs/                           # Comprehensive Project Documentation
│   ├── PROJECT_REPORT.md           # Full 26-section college project report
│   ├── DATABASE_DESIGN.md          # Collection schemas, indexes, and ER diagram
│   ├── API_DOCUMENTATION.md        # Complete REST API specification
│   ├── QUERY_CHEATSHEET.md         # Practical syllabus commands for viva demonstration
│   ├── INDEXING_AND_OPTIMIZATION.md# Explain plan executionStats & benchmark analysis
│   ├── REPLICATION_GUIDE.md        # Replica set topology, oplog, and failover runbook
│   ├── BACKUP_RECOVERY.md          # mongodump / mongorestore disaster recovery guide
│   ├── TESTING_REPORT.md           # Automated test execution results (13 tests)
│   └── DEPLOYMENT_GUIDE.md         # Atlas, Render, and Vercel production deployment
└── README.md
```

---

## Pre-Seeded Test Accounts

The system automatically initializes test accounts upon first startup:

| Account Type | Email Address | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ticketbooking.com` | `Admin@12345` | Event CRUD, Analytics, DB Ops |
| **Test User 1** | `user@ticketbooking.com` | `User@12345` | Seat Holds, Bookings, Cancellation |
| **Test User 2** | `sarah.connor@example.com` | `User@12345` | Seat Holds, Bookings, Cancellation |

*(Quick-fill buttons are provided on the login page for convenience during evaluation).*

---

## Quick Start Guide

### Prerequisites
- **Java 21 LTS** or higher (`java -version`)
- **Node.js 18+** & npm (`node -v`)
- **MongoDB 7.0+ with Replica Set Enabled** (or a free MongoDB Atlas cluster URI)

> **Important:** MongoDB multi-document transactions require a replica set. To initiate a local replica set on an existing mongod:
> ```bash
> mongosh --eval "rs.initiate()"
> ```

---

### 1. Run the Spring Boot Backend

```bash
cd backend

# Run automated tests against the replica set
./mvnw clean test

# Start the Spring Boot application (Default port: 8080)
./mvnw spring-boot:run
```

The backend starts at `http://localhost:8080`. Initial events, seats, and admin accounts are auto-seeded on startup.

---

### 2. Run the React Frontend

Open a second terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## Running Automated Tests

The backend includes a comprehensive 13-test automated test suite covering CRUD, concurrency, transactions, and aggregations:

```bash
cd backend
./mvnw test
```

### Verified Test Cases:
1. `ConcurrentBookingTests`: Simulates two threads booking the exact same seat simultaneously. Proves that exactly one request succeeds and the other receives a conflict response.
2. `ConcurrentBookingTests`: Proves concurrent bookings for distinct seats both succeed.
3. `ConcurrentBookingTests`: Proves concurrent seat holds prevent double-reservations.
4. `BookingServiceTests`: Tests booking creation, total price calculations, and idempotency key replays.
5. `BookingServiceTests`: Tests booking cancellation and transactional seat release.
6. `EventCrudTests`: Tests event lifecycle (Create, Read, Update, Cancel) and automatic seat inventory generation.
7. `AnalyticsAggregationTests`: Verifies `$group` and `$sum` pipelines calculate revenue accurately while excluding cancelled bookings.

---

## Backup & Restoration Demonstrations

### 1. Create a Hot Compressed Backup
```bash
./scripts/backup.sh
```
*Creates a timestamped snapshot under `./backups/backup_YYYYMMDD_HHMMSS/` using `mongodump --gzip`.*

### 2. Test Safe Restoration into Staging DB
```bash
./scripts/restore-test.sh
```
*Restores the backup into `ticket_booking_restore_test` using `mongorestore --nsFrom --nsTo` and verifies document counts.*

---

## College Viva Voce Demonstration Guide (5 Minutes)

When presenting to evaluators, demonstrate these four core areas:

1. **ACID Concurrency Prevention:**
   - Open two browser tabs side-by-side (one incognito).
   - Log in as `admin@ticketbooking.com` in Tab 1 and `user@ticketbooking.com` in Tab 2.
   - Navigate to the same event. Select the same seat (`VIP-1`) in both tabs.
   - Click "Hold Seats" simultaneously. Show that one user acquires the seat while the other receives an instant `409 Conflict` notice from MongoDB's `findAndModify`.
2. **Query Explain Plan Optimization:**
   - Navigate to `/admin/diagnostics`.
   - Show the live `executionStats` for `{ status: 1, eventDate: 1 }` (`IXSCAN`, `totalDocsExamined: 1`).
   - Contrast with the unindexed regex search (`COLLSCAN`, `totalDocsExamined: 5`).
3. **Real-Time Aggregations:**
   - Open `/admin/dashboard` to view the live charts.
   - Cancel a booking in `/my-bookings` and refresh the dashboard to prove that gross revenue immediately decreases by the refunded amount.
4. **Replica Set & Failover:**
   - Review `/admin/diagnostics` $\rightarrow$ "Replica Set Topology".
   - In terminal, execute `mongosh --eval "rs.status().members"` to show member sync health and write concern `w: majority`.

---

## Documentation Links

- [Full College Project Report](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/PROJECT_REPORT.md)
- [Database Schema Design & ER Diagram](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/DATABASE_DESIGN.md)
- [REST API Specification](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/API_DOCUMENTATION.md)
- [MongoDB Syllabus Practical Cheatsheet](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/QUERY_CHEATSHEET.md)
- [Indexing & Query Optimization Analysis](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/INDEXING_AND_OPTIMIZATION.md)
- [Replication & Failover Runbook](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/REPLICATION_GUIDE.md)
- [Backup & Disaster Recovery Runbook](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/BACKUP_RECOVERY.md)
- [Automated Testing Report](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/TESTING_REPORT.md)
- [Cloud Deployment Guide (Atlas, Render, Vercel)](file:///Users/gautam_kumar/Desktop/Ticket%20Booking/docs/DEPLOYMENT_GUIDE.md)

---

## License
MIT License. Developed for Academic Final Project Evaluation.

