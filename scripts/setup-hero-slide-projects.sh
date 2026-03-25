#!/bin/bash
set -euo pipefail

DIRECTUS_URL="${DIRECTUS_URL:-http://localhost:8055}"
DIRECTUS_EMAIL="${DIRECTUS_EMAIL:-admin@riyan.com.mv}"
DIRECTUS_PASSWORD="${DIRECTUS_PASSWORD:-ChangeThisPassword123!}"
DB_CONTAINER="${DB_CONTAINER:-riyan_mariadb}"
DB_NAME="${DB_NAME:-riyan_nextjs}"
DB_USER="${DB_USER:-user}"
DB_PASSWORD="${DB_PASSWORD:-Riyanitaccess@26+}"

echo "Ensuring hero_slides.project_id exists in the database..."

docker exec "$DB_CONTAINER" mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<'SQL'
SET @db := DATABASE();

SET @has_column := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db
    AND table_name = 'hero_slides'
    AND column_name = 'project_id'
);
SET @sql := IF(
  @has_column = 0,
  'ALTER TABLE hero_slides ADD COLUMN project_id int(10) unsigned DEFAULT NULL AFTER link_url',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_index := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = @db
    AND table_name = 'hero_slides'
    AND index_name = 'hero_slides_project_id_index'
);
SET @sql := IF(
  @has_index = 0,
  'ALTER TABLE hero_slides ADD INDEX hero_slides_project_id_index (project_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_name := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db
    AND table_name = 'hero_slides'
    AND column_name = 'project_id'
    AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(
  @fk_name IS NULL,
  'ALTER TABLE hero_slides ADD CONSTRAINT hero_slides_project_id_foreign FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SQL

echo "Logging into Directus..."

TOKEN=$(
  curl -s -X POST "$DIRECTUS_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$DIRECTUS_EMAIL\",\"password\":\"$DIRECTUS_PASSWORD\"}" \
  | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
)

if [ -z "$TOKEN" ]; then
  echo "Failed to get Directus access token."
  exit 1
fi

echo "Configuring hero_slides.project_id field metadata..."

FIELD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$DIRECTUS_URL/fields/hero_slides/project_id")

FIELD_PAYLOAD='{
  "field": "project_id",
  "type": "integer",
  "meta": {
    "special": ["m2o"],
    "interface": "select-dropdown-m2o",
    "display": "related-values",
    "display_options": {
      "template": "{{title}}"
    },
    "options": {
      "template": "{{title}}",
      "filter": {
        "status": {
          "_eq": "published"
        }
      }
    },
    "hidden": false,
    "required": false,
    "note": "Optional linked project for homepage hero."
  }
}'

if [ "$FIELD_STATUS" = "200" ]; then
  curl -s -X PATCH "$DIRECTUS_URL/fields/hero_slides/project_id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIELD_PAYLOAD" > /dev/null
else
  curl -s -X POST "$DIRECTUS_URL/fields/hero_slides" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$FIELD_PAYLOAD" > /dev/null
fi

echo "Configuring Directus relation metadata for hero_slides.project_id..."

RELATION_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  "$DIRECTUS_URL/relations/hero_slides/project_id")

RELATION_PAYLOAD='{
  "collection": "hero_slides",
  "field": "project_id",
  "related_collection": "projects",
  "meta": {
    "many_collection": "hero_slides",
    "many_field": "project_id",
    "one_collection": "projects",
    "one_field": null,
    "one_deselect_action": "nullify",
    "sort_field": null
  },
  "schema": {
    "table": "hero_slides",
    "column": "project_id",
    "foreign_key_table": "projects",
    "foreign_key_column": "id",
    "constraint_name": "hero_slides_project_id_foreign",
    "on_update": "NO ACTION",
    "on_delete": "SET NULL"
  }
}'

if [ "$RELATION_STATUS" = "200" ]; then
  curl -s -X PATCH "$DIRECTUS_URL/relations/hero_slides/project_id" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$RELATION_PAYLOAD" > /dev/null
else
  curl -s -X POST "$DIRECTUS_URL/relations" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$RELATION_PAYLOAD" > /dev/null
fi

echo "Done."
echo ""
echo "Next:"
echo "  1. Open Directus -> Hero Slides and link each slide to a published project."
echo "  2. Keep title/description/image_url only if you want manual fallback content."
echo "  3. Deploy the web app changes, then revalidate '/'."
