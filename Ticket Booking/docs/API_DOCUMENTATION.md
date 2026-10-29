# REST API Specification & Contract

**System:** Event Ticket Booking & Reservation System  
**Base URL:** `http://localhost:8080` (or configured deployment URL)  
**Authentication Scheme:** Bearer Token (`Authorization: Bearer <JWT>`)

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method & Route:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Jordan Smith",
  "email": "jordan@example.com",
  "password": "Password@123",
  "role": "ROLE_USER"
}
```
- **Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "id": "6ae2c59327bdbd4cf4154831",
  "name": "Jordan Smith",
  "email": "jordan@example.com",
  "role": "ROLE_USER"
}
```

### 1.2 Login User
- **Method & Route:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "admin@ticketbooking.com",
  "password": "Admin@12345"
}
```
- **Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "id": "6ae2c59327bdbd4cf4154830",
  "name": "Administrator",
  "email": "admin@ticketbooking.com",
  "role": "ROLE_ADMIN"
}
```

---

## 2. Event Discovery & Seat Reservation Endpoints

### 2.1 Search & Filter Published Events
- **Method & Route:** `GET /api/events`
- **Access:** Public
- **Query Parameters:**
  - `search` (string): Text search across title, venue, location
  - `category` (string): CONCERT, CONFERENCE, THEATER, SPORTS, COMEDY
  - `venue` (string): Filter by venue
  - `fromDate` / `toDate` (YYYY-MM-DD): Date range filter
  - `page` (int, default: 0), `size` (int, default: 12)
  - `sortBy` (string, default: "eventDate"), `sortDir` ("asc"|"desc")
- **Response (200 OK):**
```json
{
  "content": [
    {
      "id": "6ae2c59327bdbd4cf4154832",
      "title": "Coldplay: Music of the Spheres World Tour",
      "category": "CONCERT",
      "venue": "Wembley Arena Stadium",
      "location": "London, UK",
      "eventDate": "2026-11-12",
      "startTime": "19:30",
      "status": "PUBLISHED",
      "totalSeats": 62,
      "availableSeats": 58,
      "heldSeats": 2,
      "bookedSeats": 2,
      "minPrice": 75.0,
      "maxPrice": 250.0
    }
  ],
  "totalElements": 1,
  "totalPages": 1
}
```

### 2.2 Get Event Seat Inventory Map
- **Method & Route:** `GET /api/events/{eventId}/seats`
- **Access:** Public (Optional auth attaches `heldByMe` flag)
- **Response (200 OK):**
```json
[
  {
    "id": "6ae2c59327bdbd4cf4154833",
    "eventId": "6ae2c59327bdbd4cf4154832",
    "seatNumber": "VIP-1",
    "categoryCode": "VIP",
    "price": 250.0,
    "status": "AVAILABLE",
    "heldByMe": false,
    "holdExpiresAt": null
  }
]
```

### 2.3 Hold Seats Temporarily (10-Minute Lock)
- **Method & Route:** `POST /api/events/{eventId}/holds`
- **Access:** Authenticated (`ROLE_USER` or `ROLE_ADMIN`)
- **Request Body:**
```json
{
  "seatNumbers": ["VIP-1", "VIP-2"]
}
```
- **Response (200 OK):**
```json
{
  "eventId": "6ae2c59327bdbd4cf4154832",
  "heldSeats": ["VIP-1", "VIP-2"],
  "expiresAt": "2026-10-29T04:15:00Z",
  "remainingSeconds": 600,
  "message": "Seats successfully reserved for 10 minutes."
}
```
- **Conflict Response (409 Conflict):**
```json
{
  "timestamp": "2026-10-29T04:05:01Z",
  "status": 409,
  "error": "Conflict",
  "message": "Seat VIP-1 is currently held or already booked by another user. Please choose another seat.",
  "path": "/api/events/6ae2c59327bdbd4cf4154832/holds"
}
```

---

## 3. Booking & Cancellation Endpoints

### 3.1 Confirm Booking (ACID Multi-Document Transaction)
- **Method & Route:** `POST /api/bookings`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "eventId": "6ae2c59327bdbd4cf4154832",
  "seatNumbers": ["VIP-1", "VIP-2"],
  "idempotencyKey": "PAY-coldplay-user1-VIP1-VIP2-1793246",
  "paymentMethod": "MOCK_CREDIT_CARD"
}
```
- **Response (201 Created):**
```json
{
  "id": "6ae2c59327bdbd4cf4154834",
  "bookingRef": "BK-9B4F81A2",
  "userId": "6ae2c59327bdbd4cf4154831",
  "userEmail": "user@ticketbooking.com",
  "userName": "Alex Morgan",
  "eventId": "6ae2c59327bdbd4cf4154832",
  "eventTitle": "Coldplay: Music of the Spheres World Tour",
  "seatNumbers": ["VIP-1", "VIP-2"],
  "status": "CONFIRMED",
  "totalAmount": 500.0,
  "paymentStatus": "MOCK_PAID",
  "bookedAt": "2026-10-29T04:05:00Z"
}
```

### 3.2 View My Bookings
- **Method & Route:** `GET /api/bookings/my`
- **Access:** Authenticated
- **Response (200 OK):** Returns array of user's bookings sorted descending by booking date.

### 3.3 Cancel Booking
- **Method & Route:** `POST /api/bookings/{bookingRef}/cancel`
- **Access:** Authenticated (Booking Owner or `ROLE_ADMIN`)
- **Response (200 OK):**
```json
{
  "bookingRef": "BK-9B4F81A2",
  "status": "CANCELLED",
  "paymentStatus": "REFUNDED",
  "cancelledAt": "2026-10-29T04:10:00Z"
}
```

---

## 4. Admin Management & Analytics Endpoints

### 4.1 Create Event and Auto-Generate Seats
- **Method & Route:** `POST /api/admin/events`
- **Access:** Admin only (`ROLE_ADMIN`)
- **Request Body:**
```json
{
  "title": "Hans Zimmer Live Symphony",
  "description": "Epic movie soundtracks performed by a 100-piece live orchestra.",
  "category": "CONCERT",
  "venue": "Royal Albert Hall",
  "location": "London, UK",
  "eventDate": "2026-12-05",
  "startTime": "19:00",
  "endTime": "22:00",
  "ticketCategories": [
    {
      "categoryCode": "VIP",
      "categoryName": "VIP Stalls",
      "price": 220.0,
      "totalSeats": 10
    },
    {
      "categoryCode": "GEN",
      "categoryName": "General Balcony",
      "price": 60.0,
      "totalSeats": 30
    }
  ]
}
```

### 4.2 Aggregation Analytics Overview
- **Method & Route:** `GET /api/admin/analytics/overview`
- **Access:** Admin only (`ROLE_ADMIN`)
- **Response (200 OK):**
```json
{
  "totalEvents": 5,
  "totalBookings": 12,
  "confirmedBookings": 10,
  "confirmedTickets": 24,
  "cancelledBookings": 2,
  "cancellationRate": 16.7,
  "totalRevenue": 4850.0,
  "totalSeats": 210,
  "availableSeats": 182,
  "heldSeats": 4,
  "bookedSeats": 24
}
```

---

## 5. Operations & Syllabus Diagnostics Endpoints

### 5.1 Health Check
- **Route:** `GET /api/health`
- **Response:** `{ "status": "UP", "database": "CONNECTED", "dbPing": 1.0, "databaseName": "ticket_booking" }`

### 5.2 Live Explain Plans
- **Route:** `GET /api/ops/query-explain`
- **Response:** Returns real MongoDB `executionStats` comparing `IXSCAN` on compound indexed queries versus `COLLSCAN` on unindexed queries.

### 5.3 Replica Set Topology
- **Route:** `GET /api/ops/replica-status`
- **Response:** Returns cluster topology, node roles (PRIMARY, SECONDARY), readPreference, and writeConcern.

