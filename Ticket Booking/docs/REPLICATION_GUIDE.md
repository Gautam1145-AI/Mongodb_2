# MongoDB Replication, High Availability & Consistency Guide

**System:** Event Ticket Booking & Reservation System  
**Cluster Architecture:** MongoDB Multi-Node / Atlas Replica Set (`rs0`)

---

## 1. Overview of MongoDB Replication

Replication in MongoDB provides high availability, fault tolerance, and data redundancy. A replica set consists of:
- **One Primary Member:** Accepts all write operations and writes changes to the Operations Log (`local.oplog.rs`).
- **Secondary Members:** Replicate the primary's oplog and apply operations asynchronously to maintain identical state.
- **Arbiters (Optional):** Vote in elections but hold no data.

---

## 2. Replication Mechanism: The Oplog (`local.oplog.rs`)

The **oplog** is a capped collection on the Primary node.
1. When a client performs a write (e.g. `createBooking`), WiredTiger writes the document and appends an idempotent operation entry to `oplog.rs`.
2. Secondaries fetch oplog entries via tailable cursors using long-polling.
3. Secondaries apply the oplog entries in batches, matching the primary's state.

---

## 3. Consistency Tuning: Write Concern & Read Preference

For an **Event Ticketing System**, strong consistency is critical to avoid overselling seats.

### 3.1 Write Concern: `w: majority`
Configured in `com.ticketbooking.config.MongoConfig`:
```java
template.setWriteConcern(WriteConcern.MAJORITY);
```
- **Guaranteed Durability:** A write is acknowledged only after being committed to the journal and written to a calculated majority of data-bearing replica set members.
- **Rollback Prevention:** Writes confirmed with `w: majority` can never be rolled back if the primary experiences an unexpected hardware crash.

### 3.2 Read Preference: `primary`
```java
template.setReadPreference(ReadPreference.primary());
```
- Ensures all reads for seat inventory and booking creation are routed to the **Primary** node.
- Eliminates the risk of reading stale seat availability from a secondary member experiencing replication lag.

---

## 4. Leader Election & Failover Walkthrough

MongoDB uses a consensus protocol based on Raft.

```mermaid
sequenceDiagram
    autonumber
    participant App as Spring Boot Backend
    participant P as Primary Node (Node 1)
    participant S1 as Secondary Node (Node 2)
    participant S2 as Secondary Node (Node 3)

    App->>P: write(createBooking) with w:majority
    P->>P: Commit to oplog.rs
    P-->>S1: Async oplog replication
    P-->>S2: Async oplog replication
    S1-->>P: Acknowledge write
    P-->>App: Booking Confirmed (201 Created)

    Note over P: Primary experiences unexpected failure
    S1->>P: Heartbeat (No response after 10s)
    S2->>P: Heartbeat (No response after 10s)
    Note over S1,S2: Election Triggered (Candidate: S1)
    S1->>S2: Vote Request
    S2-->>S1: Vote Granted (S1 has latest oplog)
    Note over S1: S1 transitions to PRIMARY
    App->>S1: Automatic driver reconnect; resume traffic
```

---

## 5. Live Replication Commands for College Viva

Execute the following commands in `mongosh`:

### 5.1 Check Cluster Topology & Health
```javascript
rs.status()
```
Examine:
- `set`: Replica set name (e.g. `rs0`)
- `members[i].stateStr`: `PRIMARY`, `SECONDARY`, `STARTUP2`
- `members[i].health`: 1.0 (Healthy)
- `members[i].uptime`: Node uptime in seconds

### 5.2 Inspect Replication Lag
```javascript
rs.printSecondaryReplicationInfo()
```
Displays how many seconds each secondary is behind the primary.

### 5.3 Simulating Primary Failover
```javascript
// Step down the primary for 60 seconds
rs.stepDown(60)
```
Notice:
1. Shell prompt changes from `PRIMARY>` to `SECONDARY>`.
2. A secondary automatically assumes `PRIMARY>`.
3. Spring Boot backend logs automatic cluster topology recalculation without crashing.

