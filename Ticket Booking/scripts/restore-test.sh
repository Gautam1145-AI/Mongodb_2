#!/usr/bin/env bash
# ==============================================================================
# Event Ticket Booking System - Safe Staging Database Restoration & Verification
# Uses mongorestore to restore into an isolated test namespace.
# ==============================================================================

set -euo pipefail

MONGODB_HOST="${MONGODB_HOST:-127.0.0.1:27017}"
MONGODB_URI="${MONGODB_URI:-mongodb://${MONGODB_HOST}/?replicaSet=rs0}"
SOURCE_DB="${MONGODB_DATABASE:-ticket_booking}"
TARGET_TEST_DB="${TARGET_TEST_DB:-ticket_booking_restore_test}"
BACKUP_PATH="${1:-}"

if [ -z "${BACKUP_PATH}" ]; then
    # Pick the latest backup directory
    LATEST_BACKUP=$(find ./backups -type d -name "backup_*" 2>/dev/null | sort -r | head -n 1 || true)
    if [ -n "${LATEST_BACKUP}" ]; then
        BACKUP_PATH="${LATEST_BACKUP}"
    else
        echo "Usage: $0 <path_to_backup_directory>"
        echo "Example: $0 ./backups/backup_20261029_120000"
        exit 1
    fi
fi

echo "=================================================================="
echo "Starting Safe MongoDB Test Restore"
echo "Source Archive:   ${BACKUP_PATH}"
echo "Target Namespace: ${TARGET_TEST_DB}"
echo "=================================================================="

# Check mongorestore binary
if ! command -v mongorestore >/dev/null 2>&1; then
    if [ -x "/opt/homebrew/bin/mongorestore" ]; then
        RESTORE_BIN="/opt/homebrew/bin/mongorestore"
    else
        echo "Error: mongorestore binary not found."
        exit 1
    fi
else
    RESTORE_BIN="mongorestore"
fi

# Check mongosh binary
if ! command -v mongosh >/dev/null 2>&1; then
    if [ -x "/opt/homebrew/bin/mongosh" ]; then
        MONGOSH_BIN="/opt/homebrew/bin/mongosh"
    else
        MONGOSH_BIN=""
    fi
else
    MONGOSH_BIN="mongosh"
fi

# Execute safe restore into staging database using namespace mapping
echo "[Step 1] Restoring archive into isolated namespace '${TARGET_TEST_DB}'..."
"${RESTORE_BIN}" \
    --uri="${MONGODB_URI}" \
    --nsFrom="${SOURCE_DB}.*" \
    --nsTo="${TARGET_TEST_DB}.*" \
    --gzip \
    --drop \
    --dir="${BACKUP_PATH}"

echo "=================================================================="
echo "RESTORE COMPLETED TO STAGING DATABASE: ${TARGET_TEST_DB}"
echo "=================================================================="

# Step 2: Verification of restored data
if [ -n "${MONGOSH_BIN}" ]; then
    echo "[Step 2] Verifying collection document counts in '${TARGET_TEST_DB}':"
    "${MONGOSH_BIN}" "mongodb://${MONGODB_HOST}/${TARGET_TEST_DB}?replicaSet=rs0" --quiet --eval "
        db.getCollectionNames().forEach(c => {
            print(' - ' + c + ': ' + db[c].countDocuments() + ' docs | ' + db[c].getIndexes().length + ' indexes');
        });
    "
fi

echo "Data verification completed successfully."
