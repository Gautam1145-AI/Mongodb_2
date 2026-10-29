# MongoDB Indexing Strategy & Query Optimization Report

**System:** Event Ticket Booking & Reservation System  
**Engine:** WiredTiger Storage Engine  
**Objective:** Eliminate Collection Scans (`COLLSCAN`), optimize point & range lookups to Index Scans (`IXSCAN`), and enforce database-level unique constraints.

---

## 1. Index Inventory & Specifications

The system enforces indexes on all four core collections.

| Collection | Index Key | Index Type | Purpose / Query Optimized |
| :--- | :--- | :--- | :--- |
| **`users`** | `{ email: 1 }` | Unique Single Field | O(1) user login, authentication, and duplicate email prevention |
| **`events`** | `{ status: 1, eventDate: 1 }` | Compound Index | Primary event discovery: filter by status, sort/range by eventDate |
| **`seats`** | `{ eventId: 1, seatNumber: 1 }` | Unique Compound | Concurrency safety: guarantees no event can have duplicate seat numbers |
| **`seats`** | `{ eventId: 1, status: 1 }` | Compound Index | Fast retrieval of available seats for seat grid rendering |
| **`bookings`** | `{ bookingRef: 1 }` | Unique Single Field | Point lookup for ticket inspection, cancellation, and barcode validation |
| **`bookings`** | `{ userId: 1, bookedAt: -1 }` | Compound Index | User booking history sorted in reverse chronological order |
| **`bookings`** | `{ eventId: 1, status: 1 }` | Compound Index | Administrative sales and revenue aggregation queries |
| **`bookings`** | `{ idempotencyKey: 1 }` | Unique Sparse | Rejection of duplicate client network retries |

---

## 2. Compound Index Ordering & The Left-Prefix Rule

In compound indexes, field ordering follows the **Equality, Sort, Range (ESR)** rule:

1. **Equality (`status: 1`):** Filters down the document set to a small subset.
2. **Sort / Range (`eventDate: 1`):** Enables index-based ordering without an in-memory `SORT` stage.

### The Left-Prefix Rule:
An index on `{ a: 1, b: 1, c: 1 }` can support queries on:
- `{ a: 1 }`
- `{ a: 1, b: 1 }`
- `{ a: 1, b: 1, c: 1 }`

It **CANNOT** support queries on `{ b: 1 }` or `{ c: 1 }` alone without performing a collection scan or full index scan.

---

## 3. Explain Plan ExecutionStats: IXSCAN vs. COLLSCAN

To demonstrate query optimization for the college syllabus, explain plans were executed with `executionStats` mode against our live database.

### Benchmark Comparison

| Metric | Query A (With Index: `IXSCAN`) | Query B (Unindexed: `COLLSCAN`) |
| :--- | :--- | :--- |
| **Filter** | `{ status: "PUBLISHED", eventDate: { $gte: "2026-11-01" } }` | `{ description: { $regex: "symphony" } }` |
| **Winning Stage** | `IXSCAN` $\rightarrow$ `FETCH` | `COLLSCAN` |
| **Index Used** | `status_eventDate_idx` | `None` |
| **Total Keys Examined** | 1 | 0 |
| **Total Docs Examined** | 1 | 5 (Entire collection) |
| **Documents Returned** | 1 | 1 |
| **Doc Examined / Returned Ratio** | **1.0 (Optimal)** | **5.0 (500% waste)** |
| **Execution Time** | &lt; 0.1 ms | 1.8 ms |

### Key Diagnostic Takeaway:
In `Query A`, `totalDocsExamined == nReturned`, representing **index selectivity of 100%**. In `Query B`, the database engine was forced to inspect every document in storage to evaluate the regex condition, demonstrating linear $O(N)$ degradation as the dataset scales.

---

## 4. Index Write Overhead & Storage Trade-offs

Every secondary index added to a MongoDB collection introduces trade-offs:
1. **Write Latency:** When inserting a booking or seat, WiredTiger must update both the document B-tree and every corresponding secondary index B-tree.
2. **RAM Working Set:** Indexes must fit in memory (`wiredTigerCache`) to maintain sub-millisecond lookups.
3. **Design Mitigation:** We avoided indexing low-cardinality fields alone (e.g. `status` by itself), instead combining them into compound indexes (`{ status: 1, eventDate: 1 }`) that provide high index selectivity for real application queries.

