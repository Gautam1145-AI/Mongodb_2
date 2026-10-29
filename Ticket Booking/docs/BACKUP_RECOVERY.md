# MongoDB Backup, Restoration & Disaster Recovery Runbook

**System:** Event Ticket Booking & Reservation System  
**Tooling:** `mongodump`, `mongorestore`, `mongosh` (MongoDB Database Tools 100.x+)

---

## 1. Replication vs. Backup: Core Architectural Differences

A common misconception is that replication eliminates the need for backups.

| Feature | Replica Sets (Replication) | Database Backups (mongodump) |
| :--- | :--- | :--- |
| **Purpose** | High Availability & Hardware Fault Tolerance | Point-in-time Disaster Recovery & Archival |
| **Human Error Protection** | **None.** An accidental `db.dropDatabase()` or bad update replicates immediately to all secondaries. | **Complete.** Historical snapshots allow restoring data from before the incident occurred. |
| **Ransomware / Corruption** | Corrupted data is immediately replicated. | Isolated, write-protected, and immutable backups preserve historical state. |
| **Storage Location** | Live nodes in the active cluster | Separate cloud storage bucket (AWS S3, Google Cloud Storage, or off-site disk) |

---

## 2. Automated Hot Backup Workflow (`mongodump`)

The project includes an automated backup script at `scripts/backup.sh`.

### How to Run:
```bash
./scripts/backup.sh
```

### Command Executed Under the Hood:
```bash
mongodump \
  --uri="mongodb://127.0.0.1:27017/ticket_booking?replicaSet=rs0" \
  --db="ticket_booking" \
  --out="./backups/backup_$(date +%Y%m%d_%H%M%S)" \
  --gzip
```

### Features:
1. **Timestamped Folders:** Backups are placed in `backups/backup_YYYYMMDD_HHMMSS/ticket_booking/`.
2. **Gzip Compression:** Decreases storage usage by up to 80%.
3. **Index Metadata Preservation:** Archives both `.bson.gz` (data) and `.metadata.json.gz` (indexes).
4. **Verification Step:** Validates that all collection archives were written with non-zero size.

---

## 3. Safe Test Restoration Workflow (`mongorestore`)

To prevent catastrophic data loss, **never run destructive restores against production.** The project provides `scripts/restore-test.sh` which maps namespaces safely into a test staging database (`ticket_booking_restore_test`).

### How to Run:
```bash
./scripts/restore-test.sh
```

### Command Executed Under the Hood:
```bash
mongorestore \
  --uri="mongodb://127.0.0.1:27017/?replicaSet=rs0" \
  --nsFrom="ticket_booking.*" \
  --nsTo="ticket_booking_restore_test.*" \
  --gzip \
  --drop \
  --dir="./backups/backup_20261029_094611"
```

### Verification & Data Integrity:
The script automatically verifies the restored staging database by printing document counts and index parity:
```bash
mongosh "mongodb://127.0.0.1:27017/ticket_booking_restore_test?replicaSet=rs0" --eval "
  db.getCollectionNames().forEach(c => {
    print(' - ' + c + ': ' + db[c].countDocuments() + ' docs | ' + db[c].getIndexes().length + ' indexes');
  });
"
```

---

## 4. Disaster Recovery Runbook (Step-by-Step)

In the event of database corruption or hardware outage:

1. **Assess Impact & Stop Influx:**
   Temporarily put the frontend into maintenance mode or disable write APIs.
2. **Identify Latest Known Clean Backup:**
   List backups in `./backups/` and inspect timestamps.
3. **Restore to Staging:**
   Run `scripts/restore-test.sh` and verify document counts.
4. **Promote Staging to Production:**
   Once verified, restore to production namespace:
   ```bash
   mongorestore --uri="$PROD_MONGODB_URI" --gzip --dir="./backups/backup_clean"
   ```
5. **Restart Backend Service:**
   Restart Spring Boot backend to refresh connection pools and warm index caches.
6. **Post-Mortem & Log Analysis:**
   Document incident cause and update retention policies.

