#!/bin/bash
set -euo pipefail

echo "Adding ON DELETE CASCADE for project-related foreign keys..."

docker exec riyan_mariadb mysql -u user -p'Riyanitaccess@26+' riyan_nextjs <<'SQL'
SET @db := DATABASE();

-- project_gallery.project_id -> projects.id
SET @tbl := 'project_gallery';
SET @col := 'project_id';
SET @fk_name := 'project_gallery_project_id_foreign';
SET @has_table := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = @tbl);
SET @has_col := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = @tbl AND column_name = @col);
SET @fk := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db AND table_name = @tbl AND column_name = @col AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(@has_table = 1 AND @has_col = 1 AND @fk IS NOT NULL, CONCAT('ALTER TABLE ', @tbl, ' DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF(@has_table = 1 AND @has_col = 1, CONCAT('ALTER TABLE ', @tbl, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (', @col, ') REFERENCES projects (id) ON DELETE CASCADE'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- project_gallery.projects_id -> projects.id (legacy)
SET @tbl := 'project_gallery';
SET @col := 'projects_id';
SET @fk_name := 'project_gallery_projects_id_foreign';
SET @has_table := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = @tbl);
SET @has_col := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = @tbl AND column_name = @col);
SET @fk := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db AND table_name = @tbl AND column_name = @col AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(@has_table = 1 AND @has_col = 1 AND @fk IS NOT NULL, CONCAT('ALTER TABLE ', @tbl, ' DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF(@has_table = 1 AND @has_col = 1, CONCAT('ALTER TABLE ', @tbl, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (', @col, ') REFERENCES projects (id) ON DELETE CASCADE'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- project_sectors.project_id -> projects.id
SET @tbl := 'project_sectors';
SET @col := 'project_id';
SET @fk_name := 'project_sectors_project_id_foreign';
SET @has_table := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = @tbl);
SET @has_col := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = @tbl AND column_name = @col);
SET @fk := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db AND table_name = @tbl AND column_name = @col AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(@has_table = 1 AND @has_col = 1 AND @fk IS NOT NULL, CONCAT('ALTER TABLE ', @tbl, ' DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF(@has_table = 1 AND @has_col = 1, CONCAT('ALTER TABLE ', @tbl, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (', @col, ') REFERENCES projects (id) ON DELETE CASCADE'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- project_services.project_id -> projects.id
SET @tbl := 'project_services';
SET @col := 'project_id';
SET @fk_name := 'project_services_project_id_foreign';
SET @has_table := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = @tbl);
SET @has_col := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = @tbl AND column_name = @col);
SET @fk := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db AND table_name = @tbl AND column_name = @col AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(@has_table = 1 AND @has_col = 1 AND @fk IS NOT NULL, CONCAT('ALTER TABLE ', @tbl, ' DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF(@has_table = 1 AND @has_col = 1, CONCAT('ALTER TABLE ', @tbl, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (', @col, ') REFERENCES projects (id) ON DELETE CASCADE'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- projects_sectors.projects_id -> projects.id (legacy)
SET @tbl := 'projects_sectors';
SET @col := 'projects_id';
SET @fk_name := 'projects_sectors_projects_id_foreign';
SET @has_table := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = @tbl);
SET @has_col := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = @tbl AND column_name = @col);
SET @fk := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db AND table_name = @tbl AND column_name = @col AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(@has_table = 1 AND @has_col = 1 AND @fk IS NOT NULL, CONCAT('ALTER TABLE ', @tbl, ' DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF(@has_table = 1 AND @has_col = 1, CONCAT('ALTER TABLE ', @tbl, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (', @col, ') REFERENCES projects (id) ON DELETE CASCADE'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- projects_services.projects_id -> projects.id (legacy)
SET @tbl := 'projects_services';
SET @col := 'projects_id';
SET @fk_name := 'projects_services_projects_id_foreign';
SET @has_table := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = @tbl);
SET @has_col := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = @tbl AND column_name = @col);
SET @fk := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db AND table_name = @tbl AND column_name = @col AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(@has_table = 1 AND @has_col = 1 AND @fk IS NOT NULL, CONCAT('ALTER TABLE ', @tbl, ' DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF(@has_table = 1 AND @has_col = 1, CONCAT('ALTER TABLE ', @tbl, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (', @col, ') REFERENCES projects (id) ON DELETE CASCADE'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- project_project_categories.project_id -> projects.id (legacy)
SET @tbl := 'project_project_categories';
SET @col := 'project_id';
SET @fk_name := 'project_project_categories_project_id_foreign';
SET @has_table := (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = @db AND table_name = @tbl);
SET @has_col := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = @db AND table_name = @tbl AND column_name = @col);
SET @fk := (
  SELECT constraint_name
  FROM information_schema.key_column_usage
  WHERE table_schema = @db AND table_name = @tbl AND column_name = @col AND referenced_table_name = 'projects'
  LIMIT 1
);
SET @sql := IF(@has_table = 1 AND @has_col = 1 AND @fk IS NOT NULL, CONCAT('ALTER TABLE ', @tbl, ' DROP FOREIGN KEY ', @fk), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @sql := IF(@has_table = 1 AND @has_col = 1, CONCAT('ALTER TABLE ', @tbl, ' ADD CONSTRAINT ', @fk_name, ' FOREIGN KEY (', @col, ') REFERENCES projects (id) ON DELETE CASCADE'), 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SQL

echo "Done."
