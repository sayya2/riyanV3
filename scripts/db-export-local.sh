#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "❌ docker compose not available" >&2
  exit 1
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="backups"
BACKUP_PATH="${BACKUP_DIR}/riyan_utf8_${TIMESTAMP}.sql"

mkdir -p "$BACKUP_DIR"

$DC -f docker-compose.yml exec -T mariadb \
  mysqldump --default-character-set=utf8mb4 \
  -uuser -p'Riyanitaccess@26+' riyan_nextjs \
  > "$BACKUP_PATH"

echo "✅ Exported UTF-8 DB backup to $BACKUP_PATH"
