#!/usr/bin/env bash
# ==============================================================================
# Event Ticket Booking System - Database Hot Backup Script
# Uses mongodump to create timestamped, gzip-compressed MongoDB backups.
# ==============================================================================

set -euo pipefail

MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017/ticket_booking?replicaSet=rs0}"
DB_NAME="${MONGODB_DATABASE:-ticket_booking}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="${BACKUP_DIR}/backup_${TIMESTAMP}"

echo "=================================================================="
echo "Starting MongoDB Hot Backup"
echo "Database:  ${DB_NAME}"
echo "Output:    ${TARGET_DIR}"
echo "Timestamp: ${TIMESTAMP}"
echo "=================================================================="

# Check if mongodump is available
if ! command -v mongodump >/dev/null 2>&1; then
    if [ -x "/opt/homebrew/bin/mongodump" ]; then
        MONGODUMP_BIN="/opt/homebrew/bin/mongodump"
    else
        echo "Error: mongodump binary not found. Please install MongoDB Database Tools."
        exit 1
    fi
else
    MONGODUMP_BIN="mongodump"
fi

mkdir -p "${TARGET_DIR}"

# Execute mongodump with gzip compression
echo "[Step 1] Dumping database collections and index metadata..."
"${MONGODUMP_BIN}" \
    --uri="${MONGODB_URI}" \
    --db="${DB_NAME}" \
    --out="${TARGET_DIR}" \
    --gzip

# Verification of backup output
if [ -d "${TARGET_DIR}/${DB_NAME}" ]; then
    FILE_COUNT=$(find "${TARGET_DIR}/${DB_NAME}" -type f | wc -l | tr -d ' ')
    TOTAL_SIZE=$(du -sh "${TARGET_DIR}" | cut -f1)
    echo "=================================================================="
    echo "BACKUP SUCCESSFUL!"
    echo "Files archived: ${FILE_COUNT}"
    echo "Archive size:   ${TOTAL_SIZE}"
    echo "Archive path:   ${TARGET_DIR}/${DB_NAME}"
    echo "=================================================================="
else
    echo "Error: Backup verification failed. Output directory was not created."
    exit 1
fi

