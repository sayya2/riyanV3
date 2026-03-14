#!/bin/bash
# Database import helper for Raspberry Pi dev server
# Usage: ./scripts/db-import-pi.sh <sql-file>
set -e

# Check if SQL file is provided
if [ -z "$1" ]; then
  echo "❌ Error: No SQL file specified"
  echo ""
  echo "Usage: ./scripts/db-import-pi.sh <sql-file>"
  echo "Example: ./scripts/db-import-pi.sh /tmp/backup.sql"
  exit 1
fi

SQL_FILE=$1

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: File not found: $SQL_FILE"
  exit 1
fi

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

# Warning prompt
echo "⚠️  WARNING: This will replace the current database!"
echo "📁 Source file: $SQL_FILE"
echo "📊 File size: $(du -h "$SQL_FILE" | cut -f1)"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Import aborted by user"
  exit 0
fi

echo ""
echo "📥 Importing database from $SQL_FILE..."
echo "⏳ This may take a few minutes for large databases..."

# Import database
docker exec -i riyan_mariadb mysql \
  -u root \
  -p"$MYSQL_ROOT_PASS" \
  riyan_nextjs < "$SQL_FILE"

echo "✅ Database imported successfully!"
echo ""
echo "🔄 Restarting Directus to apply changes..."
docker compose -f docker-compose.pi.yml --env-file .env.pi restart directus

echo ""
echo "✅ Done!"
echo "🔧 Check Directus at: http://$(hostname -I | awk '{print $1}'):8055"
echo ""
echo "📝 Note: If you have login issues, you may need to reset the Directus admin password"
echo "   See docs/DEPLOYMENT.md for troubleshooting steps"
