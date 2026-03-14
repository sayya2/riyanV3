#!/bin/bash
# Database export/backup helper for Raspberry Pi dev server
# Creates timestamped database dumps and manages backup retention
set -e

# Backup configuration
BACKUP_DIR="/data/backups/riyan"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/riyan_db_$TIMESTAMP.sql"
RETENTION_COUNT=7  # Keep last 7 backups

# Check if .env.pi exists
if [ ! -f ".env.pi" ]; then
  echo "❌ Error: .env.pi file not found"
  echo "Please create .env.pi from .env.pi.template"
  exit 1
fi

# Read MySQL root password from .env.pi
MYSQL_ROOT_PASS=$(grep MYSQL_ROOT_PASSWORD .env.pi | cut -d '=' -f2 | tr -d '"' | tr -d "'")

if [ -z "$MYSQL_ROOT_PASS" ]; then
  echo "❌ Error: MYSQL_ROOT_PASSWORD not found in .env.pi"
  exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "💾 Exporting database..."
echo "📁 Backup location: $BACKUP_FILE"

# Export database
docker exec riyan_mariadb mysqldump \
  -u root \
  -p"$MYSQL_ROOT_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  riyan_nextjs > "$BACKUP_FILE"

echo "✅ Database exported successfully!"
echo "📊 Backup size: $(du -h $BACKUP_FILE | cut -f1)"
echo ""

# Clean up old backups
echo "🧹 Managing backup retention (keeping last $RETENTION_COUNT backups)..."
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/riyan_db_*.sql 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt "$RETENTION_COUNT" ]; then
  echo "📂 Found $BACKUP_COUNT backups, removing oldest..."
  ls -t "$BACKUP_DIR"/riyan_db_*.sql | tail -n +$((RETENTION_COUNT + 1)) | xargs -r rm -v
  echo "✅ Cleanup complete"
else
  echo "✅ No cleanup needed ($BACKUP_COUNT/$RETENTION_COUNT backups)"
fi

echo ""
echo "📋 Current backups:"
ls -lht "$BACKUP_DIR"/riyan_db_*.sql 2>/dev/null || echo "No backups found"

echo ""
echo "✅ Backup complete!"
echo "📁 Backup file: $BACKUP_FILE"
