# MongoDB Syllabus Practical Demonstration Cheatsheet

This cheatsheet provides practical `mongosh` commands and corresponding Java Spring Data MongoDB implementations for college syllabus demonstration and viva voce examination.

All examples use realistic event, seat, and booking data from the **Event Ticket Booking & Reservation System**.

---

## 1. MongoDB Fundamentals & Architecture

### 1.1 MongoDB vs. RDBMS Comparison

| Architectural Aspect | Relational DBMS (e.g., PostgreSQL / MySQL) | MongoDB (Document Database) |
| :--- | :--- | :--- |
| **Data Model** | Rigid Tables, Rows, and Columns | Flexible BSON (Binary JSON) Documents |
| **Schema Flexibility** | Schema-on-write (requires strict DDL migrations) | Schema-on-read (polymorphic and evolving schemas) |
| **Complex Relationships** | Normalized Tables with Costly Multi-table JOINs | Embedding (subdocuments/arrays) or Referencing |
| **Horizontal Scalability** | Challenging; relies mainly on vertical scaling | Native auto-sharding and distributed partitioning |
| **High Availability** | Active-passive replication or complex clustering | Replica Sets with automated Raft-like leader elections |
| **Atomic Scope** | Multi-table ACID transactions by default | Single-document atomic writes + Multi-document transactions |

### 1.2 Sharding Architecture Concepts
- **Mongos (Query Router):** Client-facing proxy that routes application queries to the appropriate shard.
- **Config Servers:** 3-member replica set storing cluster metadata, routing tables, and chunk ranges.
- **Shard Replica Sets:** Independent replica sets storing partitioned subsets of the data based on the **Shard Key**.
- **Shard Key Selection for Ticket Booking:** A compound shard key `{ eventId: "hashed", bookedAt: 1 }` distributes high-volume booking traffic evenly across shards while keeping per-event queries targeted.

---

## 2. Insert Operations

### 2.1 `insertOne`
Insert a single user document:
```javascript
db.users.insertOne({
  name: "Liam Gallagher",
  email: "liam@oasisband.co.uk",
  passwordHash: "$2a$10$Wq6mJ5zYkK7H2iBq0lRz1u.bEKnT3qR7QnS1mG9H5v6P8x7c1a",
  role: "ROLE_USER",
  createdAt: new Date(),
  updatedAt: new Date()
});
```
**Java Equivalent:**
```java
User user = new User(null, "Liam Gallagher", "liam@oasisband.co.uk", hash, Role.ROLE_USER);
mongoTemplate.insert(user);
```

### 2.2 `insertMany`
Batch insert seat documents for an event:
```javascript
db.seats.insertMany([
  { eventId: "ev101", seatNumber: "VIP-1", categoryCode: "VIP", price: NumberDecimal("250.00"), status: "AVAILABLE", createdAt: new Date() },
  { eventId: "ev101", seatNumber: "VIP-2", categoryCode: "VIP", price: NumberDecimal("250.00"), status: "AVAILABLE", createdAt: new Date() },
  { eventId: "ev101", seatNumber: "VIP-3", categoryCode: "VIP", price: NumberDecimal("250.00"), status: "AVAILABLE", createdAt: new Date() }
]);
```
**Java Equivalent:**
```java
List<Seat> seats = List.of(new Seat(...), new Seat(...));
seatRepository.saveAll(seats);
```

---

## 3. Read Operations, Filters & Projections

### 3.1 Comparison Operators (`$eq`, `$gt`, `$gte`, `$lt`, `$lte`, `$ne`)
Find events occurring between specific dates with ticket prices:
```javascript
db.events.find({
  status: { $eq: "PUBLISHED" },
  eventDate: { $gte: "2026-11-01", $lte: "2026-12-31" }
});
```

### 3.2 Logical Operators (`$and`, `$or`, `$not`)
Search events in London OR categorized as CONCERT, excluding CANCELLED status:
```javascript
db.events.find({
  $and: [
    { status: { $ne: "CANCELLED" } },
    {
      $or: [
        { location: { $regex: "London", $options: "i" } },
        { category: "CONCERT" }
      ]
    }
  ]
});
```

### 3.3 Array Operators (`$in`, `$all`, `$size`, `$elemMatch`)
1. **`$in`**: Find seats with specific numbers:
```javascript
db.seats.find({
  eventId: "ev101",
  seatNumber: { $in: ["VIP-1", "VIP-2", "VIP-3"] }
});
```
2. **`$size`**: Find bookings with exactly 2 reserved tickets:
```javascript
db.bookings.find({ seatNumbers: { $size: 2 } });
```
3. **`$elemMatch`**: Find events having a ticket category priced under $100 with at least 20 seats:
```javascript
db.events.find({
  ticketCategories: {
    $elemMatch: {
      price: { $lte: NumberDecimal("100.00") },
      totalSeats: { $gte: 20 }
    }
  }
});
```

### 3.4 Element Operators (`$exists`, `$type`)
Find bookings where cancellation timestamp exists:
```javascript
db.bookings.find({
  cancelledAt: { $exists: true, $ne: null }
});
```

### 3.5 Projections, Sorting, Limiting, and Skipping
Return only event title, venue, and date, sorted by date with pagination:
```javascript
db.events.find(
  { status: "PUBLISHED" },
  { title: 1, venue: 1, eventDate: 1, _id: 0 }
)
.sort({ eventDate: 1 })
.skip(10)
.limit(10);
```

---

## 4. Update Operations & Atomic Modifiers

### 4.1 `$set`, `$unset`, and `$inc`
1. Update event details:
```javascript
db.events.updateOne(
  { _id: ObjectId("6ae2c59327bdbd4cf4154832") },
  {
    $set: { status: "PUBLISHED", updatedAt: new Date() },
    $unset: { draftNotes: "" }
  }
);
```

### 4.2 Conditional Atomic Update (Concurrency Prevention)
Atomically acquire seat hold only if it is AVAILABLE or previous hold expired:
```javascript
db.seats.findOneAndUpdate(
  {
    eventId: "ev101",
    seatNumber: "VIP-1",
    $or: [
      { status: "AVAILABLE" },
      { status: "HELD", holdExpiresAt: { $lt: new Date() } }
    ]
  },
  {
    $set: {
      status: "HELD",
      heldBy: "user_123",
      holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      updatedAt: new Date()
    }
  },
  { returnDocument: "after" }
);
```

---

## 5. Delete Operations

### 5.1 Safe Soft-Cancellation vs. Hard Deletion
In ticketing systems, historical booking records must never be hard-deleted.
```javascript
// Soft Cancellation (Auditable)
db.bookings.updateOne(
  { bookingRef: "BK-9B4F81A2", status: "CONFIRMED" },
  {
    $set: {
      status: "CANCELLED",
      paymentStatus: "REFUNDED",
      cancelledAt: new Date()
    }
  }
);

// Hard deletion (Permitted ONLY for unbooked draft events)
db.events.deleteOne({ _id: "draft_event_99", status: "DRAFT" });
```

---

## 6. Aggregation Pipelines

Demonstrating: `$match`, `$group`, `$project`, `$sort`, `$unwind`, and `$limit`.

### 6.1 Total Sales & Revenue by Event
```javascript
db.bookings.aggregate([
  // Stage 1: Filter confirmed bookings
  { $match: { status: "CONFIRMED" } },

  // Stage 2: Project ticket count and amount
  {
    $project: {
      eventId: 1,
      totalAmount: 1,
      ticketCount: { $size: "$seatNumbers" }
    }
  },

  // Stage 3: Group by event
  {
    $group: {
      _id: "$eventId",
      confirmedBookings: { $sum: 1 },
      ticketsSold: { $sum: "$ticketCount" },
      totalRevenue: { $sum: "$totalAmount" }
    }
  },

  // Stage 4: Sort by revenue descending
  { $sort: { totalRevenue: -1 } },

  // Stage 5: Top 5 events
  { $limit: 5 }
]);
```

### 6.2 Revenue by Category using `$lookup` and `$unwind`
```javascript
db.bookings.aggregate([
  { $match: { status: "CONFIRMED" } },
  {
    $lookup: {
      from: "events",
      localField: "eventId",
      foreignField: "_id",
      as: "event"
    }
  },
  { $unwind: "$event" },
  {
    $group: {
      _id: "$event.category",
      ticketsSold: { $sum: { $size: "$seatNumbers" } },
      grossRevenue: { $sum: "$totalAmount" }
    }
  },
  { $sort: { grossRevenue: -1 } }
]);
```

---

## 7. Indexing & Query Optimization

### 7.1 Compound Index & Left-Prefix Rule
```javascript
// Create compound index on events
db.events.createIndex({ status: 1, eventDate: 1 }, { name: "status_eventDate_idx" });

// Uses index (Left prefix matched)
db.events.find({ status: "PUBLISHED", eventDate: { $gte: "2026-11-01" } }).explain("executionStats");

// Also uses index (Left prefix 'status' alone)
db.events.find({ status: "PUBLISHED" }).explain("executionStats");

// DOES NOT use left prefix (Query on 'eventDate' alone requires full scan unless separate index exists)
db.events.find({ eventDate: { $gte: "2026-11-01" } }).explain("executionStats");
```

### 7.2 Hidden Index Demonstration
Hidden indexes allow testing the performance impact of dropping an index without actually dropping it:
```javascript
// Hide the index
db.events.hideIndex("status_eventDate_idx");

// Verify query reverts to COLLSCAN
db.events.find({ status: "PUBLISHED", eventDate: { $gte: "2026-11-01" } }).explain("executionStats");

// Unhide the index
db.events.unhideIndex("status_eventDate_idx");
```

---

## 8. Replication & High Availability

### 8.1 Replica Set Status & Health
```javascript
// Check cluster topology, primary node, and member sync health
rs.status();

// Check replication oplog info
rs.printReplicationInfo();

// Check secondary member replication lag
rs.printSecondaryReplicationInfo();
```

### 8.2 Safe Failover Testing (Simulating Primary Outage)
In an authorized administrative shell, force the current primary to step down for 60 seconds:
```javascript
rs.stepDown(60);
```
**Expected Observation:**
1. Current primary transitions from `PRIMARY` to `SECONDARY`.
2. Secondaries detect lack of primary heartbeat and initiate election.
3. Node with the freshest oplog is elected new `PRIMARY` in &lt; 3 seconds.
4. Client applications with replica set connection string automatically redirect writes to the new primary without downtime.

