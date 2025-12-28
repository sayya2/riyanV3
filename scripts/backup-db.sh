#!/bin/bash

# Database Backup Script
# Creates a backup of the MariaDB database
# Reads credentials from .env or .env.pi file

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/riyan_backup_$DATE.sql"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=== Database Backup Script ==="
echo ""

# Determine which env file to use (prefer .env.pi for Pi deployments)
ENV_FILE=""
if [ -f ".env.pi" ]; then
    ENV_FILE=".env.pi"
    echo "Using .env.pi for credentials"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
    echo "Using .env for credentials"
else
    echo -e "${RED}Error: No .env or .env.pi file found!${NC}"
    echo "Please create an environment file with database credentials"
    exit 1
fi

# Read database credentials from env file
DB_USER=$(grep MYSQL_USER "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DB_PASSWORD=$(grep MYSQL_PASSWORD "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
DB_NAME=$(grep MYSQL_DATABASE "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")

# Validate credentials were found
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}Error: Could not read database credentials from $ENV_FILE${NC}"
    echo "Required: MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Check if database container is running
if ! docker compose ps mariadb | grep -q "Up"; then
    echo -e "${RED}Error: MariaDB container is not running!${NC}"
    echo "Start it with: docker compose up -d mariadb"
    exit 1
fi

echo -e "${YELLOW}Creating database backup...${NC}"
echo "Database: $DB_NAME"
echo ""

# Create backup
docker compose exec -T mariadb mysqldump \
    -u "$DB_USER" \
    -p"$DB_PASSWORD" \
    "$DB_NAME" > $BACKUP_FILE

# Compress backup
echo -e "${YELLOW}Compressing backup...${NC}"
gzip $BACKUP_FILE

echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}.gz${NC}"
echo ""
echo "Backup size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"
echo ""

# Keep only last 7 backups
echo "Cleaning old backups (keeping last 7)..."
cd $BACKUP_DIR
ls -t riyan_backup_*.sql.gz | tail -n +8 | xargs -r rm
cd ..

echo -e "${GREEN}✓ Backup complete!${NC}"
echo ""
echo "To restore this backup:"
echo "  gunzip ${BACKUP_FILE}.gz"
echo "  docker compose exec -T mariadb mysql -u $DB_USER -p'<password>' $DB_NAME < ${BACKUP_FILE}"
echo ""
echo -e "${YELLOW}Note: For Pi deployments, use ./scripts/db-import-pi.sh instead${NC}"
