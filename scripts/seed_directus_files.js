const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const mysql = require("mysql2/promise");

const DEFAULT_MAP_PATH = path.join("scripts", "wp-media-map.json");
const DEFAULT_UPLOADS_ROOT = path.join(process.cwd(), "wp-content", "uploads");

const toRelativeUploadPath = (value) => {
  if (!value) return "";
  const markers = ["/wp-content/uploads/", "/uploads/"];
  for (const marker of markers) {
    if (value.includes(marker)) {
      return value.split(marker, 2)[1].replace(/^\/+/, "");
    }
  }
  return value.replace(/^\/+/, "");
};

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
};

const parseArgs = () => {
  const args = process.argv.slice(2);
  const mapIndex = args.indexOf("--map");
  const dryRun = args.includes("--dry-run");
  const mapPath = mapIndex !== -1 && args[mapIndex + 1] ? args[mapIndex + 1] : DEFAULT_MAP_PATH;
  return { mapPath, dryRun };
};

const buildRecordSets = (featuredImages, projectTypes) => {
  const projectSet = new Set(projectTypes);
  const records = {
    news: [],
    projects: [],
    pages: [],
  };

  featuredImages.forEach((record) => {
    if (record.post_type === "post") {
      records.news.push(record);
    } else if (record.post_type === "page") {
      records.pages.push(record);
    } else if (projectSet.has(record.post_type)) {
      records.projects.push(record);
    }
  });

  return records;
};

const normalizeUploadsPath = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const marker = "/wp-content/uploads/";
  if (trimmed.includes(marker)) {
    return marker + trimmed.split(marker, 2)[1].replace(/^\/+/, "");
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const addCandidate = (map, relativePath, info) => {
  if (!relativePath) return;
  if (map.has(relativePath)) return;
  map.set(relativePath, info);
};

async function main() {
  const { mapPath, dryRun } = parseArgs();
  const data = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  const featuredImages = data.featured_images || [];

  const uploadsRoot = process.env.DIRECTUS_UPLOADS_ROOT || DEFAULT_UPLOADS_ROOT;
  const storageKey = process.env.DIRECTUS_STORAGE || "local";
  const projectTypes = (process.env.WP_PROJECT_TYPES || "project,liquid-portfolio,portfolio")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const records = buildRecordSets(featuredImages, projectTypes);
  const uniquePaths = new Map();

  const pool = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "riyan_nextjs",
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 5,
  });

  const [columns] = await pool.query("SHOW COLUMNS FROM directus_files");
  const columnSet = new Set(columns.map((col) => col.Field));
  const now = new Date();

  const [mediaRows] = await pool.query(
    "SELECT id, filename, filepath, mime_type, file_size, title, width, height FROM media"
  );
  const mediaById = new Map(mediaRows.map((row) => [row.id, row]));

  mediaRows.forEach((row) => {
    const relativePath = toRelativeUploadPath(row.filepath || row.filename);
    addCandidate(uniquePaths, relativePath, {
      title: row.title || row.filename || path.basename(relativePath),
      mime: row.mime_type,
      filesize: row.file_size,
      width: row.width,
      height: row.height,
    });
  });

  featuredImages.forEach((record) => {
    const relativePath = toRelativeUploadPath(record.featured_image);
    addCandidate(uniquePaths, relativePath, {
      title: record.attachment_title || record.title || path.basename(relativePath),
    });
  });

  const [heroRows] = await pool.query(
    "SELECT id, image_url FROM hero_slides WHERE image_url IS NOT NULL AND image_url <> ''"
  );
  heroRows.forEach((row) => {
    const relativePath = toRelativeUploadPath(row.image_url);
    addCandidate(uniquePaths, relativePath, {
      title: `Hero slide ${row.id}`,
    });
  });

  const fileIdByPath = new Map();

  for (const [relativePath, info] of uniquePaths.entries()) {
    const diskPath = relativePath.replace(/\\/g, "/");
    const absolutePath = path.join(uploadsRoot, diskPath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const [existing] = await pool.query(
      "SELECT id FROM directus_files WHERE filename_disk = ? LIMIT 1",
      [diskPath]
    );

    if (existing.length) {
      fileIdByPath.set(diskPath, existing[0].id);
      continue;
    }

    const id = crypto.randomUUID();
    const stats = fs.statSync(absolutePath);
    const filenameDownload = path.basename(diskPath);
    const mime = info?.mime || getMimeType(diskPath);

    const row = {
      id,
      storage: storageKey,
      filename_disk: diskPath,
      filename_download: filenameDownload,
      title: info?.title || filenameDownload,
      type: mime,
      filesize: info?.filesize || stats.size,
      width: info?.width,
      height: info?.height,
      uploaded_on: now,
      modified_on: now,
    };

    const columnsToInsert = Object.keys(row).filter((key) => columnSet.has(key));
    const values = columnsToInsert.map((key) => row[key]);
    const placeholders = columnsToInsert.map(() => "?").join(", ");

    if (!dryRun) {
      await pool.query(
        `INSERT INTO directus_files (${columnsToInsert.join(", ")}) VALUES (${placeholders})`,
        values
      );
    }

    fileIdByPath.set(diskPath, id);
  }

  const updateTable = async (table, entries) => {
    for (const record of entries) {
      const sources = [record.attachment_guid, record.featured_image].filter(Boolean);
      const variants = new Set();
      let fileId = null;

      for (const source of sources) {
        const normalized = normalizeUploadsPath(source);
        if (!normalized) continue;

        const relativePath = toRelativeUploadPath(normalized);
        if (relativePath && !fileId) {
          const diskPath = relativePath.replace(/\\/g, "/");
          fileId = fileIdByPath.get(diskPath) || null;
        }

        const uploadsVariant = normalized.replace("/wp-content/uploads/", "/uploads/");
        variants.add(normalized);
        variants.add(uploadsVariant);
        variants.add(`https://riyan.com.mv${normalized}`);
        variants.add(`http://riyan.com.mv${normalized}`);
        variants.add(`https://riyan.com.mv${uploadsVariant}`);
        variants.add(`http://riyan.com.mv${uploadsVariant}`);
      }

      if (!fileId) continue;

      if (dryRun) continue;

      await pool.query(
        `UPDATE ${table}
         SET featured_image = ?
         WHERE slug = ? AND (featured_image IS NULL OR featured_image = '')`,
        [fileId, record.slug]
      );

      for (const variant of variants) {
        await pool.query(
          `UPDATE ${table} SET featured_image = ? WHERE featured_image = ?`,
          [fileId, variant]
        );
      }
    }
  };

  const updateRemainingFeaturedImages = async (table) => {
    const [rows] = await pool.query(
      `SELECT id, featured_image FROM ${table}
       WHERE featured_image LIKE '/uploads/%'
          OR featured_image LIKE 'uploads/%'
          OR featured_image LIKE '/wp-content/uploads/%'
          OR featured_image LIKE 'http%/wp-content/uploads/%'`
    );

    for (const row of rows) {
      const normalized = normalizeUploadsPath(row.featured_image);
      const relativePath = toRelativeUploadPath(normalized);
      if (!relativePath) continue;
      const diskPath = relativePath.replace(/\\/g, "/");
      const fileId = fileIdByPath.get(diskPath);
      if (!fileId) continue;
      if (dryRun) continue;
      await pool.query(`UPDATE ${table} SET featured_image = ? WHERE id = ?`, [
        fileId,
        row.id,
      ]);
    }
  };

  await updateTable("news", records.news);
  await updateTable("projects", records.projects);
  await updateTable("pages", records.pages);
  await updateRemainingFeaturedImages("news");
  await updateRemainingFeaturedImages("projects");
  await updateRemainingFeaturedImages("pages");

  const ensureGallerySchema = async (table) => {
    const [cols] = await pool.query(`SHOW COLUMNS FROM ${table}`);
    const type = cols.find((col) => col.Field === "media_id")?.Type || "";
    const legacyColumn = cols.find((col) => col.Field === "media_id_legacy");

    if (!legacyColumn) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN media_id_legacy INT(10) UNSIGNED NULL`);
      await pool.query(`UPDATE ${table} SET media_id_legacy = media_id WHERE media_id_legacy IS NULL`);
    }

    if (!type.startsWith("char(36)")) {
      await pool.query(`ALTER TABLE ${table} MODIFY media_id CHAR(36)`);
    }
  };

  const updateGallery = async (table) => {
    await ensureGallerySchema(table);
    const [rows] = await pool.query(
      `SELECT ${table}.id as row_id, ${table}.media_id_legacy as legacy_id, media.filepath
       FROM ${table}
       JOIN media ON media.id = ${table}.media_id_legacy`
    );

    for (const row of rows) {
      const relativePath = toRelativeUploadPath(row.filepath);
      if (!relativePath) continue;
      const diskPath = relativePath.replace(/\\/g, "/");
      const fileId = fileIdByPath.get(diskPath);
      if (!fileId) continue;
      if (dryRun) continue;
      await pool.query(`UPDATE ${table} SET media_id = ? WHERE id = ?`, [fileId, row.row_id]);
    }
  };

  await updateGallery("news_gallery");
  await updateGallery("project_gallery");

  const updateHeroSlides = async () => {
    for (const row of heroRows) {
      const normalized = normalizeUploadsPath(row.image_url);
      const relativePath = toRelativeUploadPath(normalized);
      if (!relativePath) continue;
      const diskPath = relativePath.replace(/\\/g, "/");
      const fileId = fileIdByPath.get(diskPath);
      if (!fileId) continue;
      if (dryRun) continue;
      await pool.query(`UPDATE hero_slides SET image_url = ? WHERE id = ?`, [fileId, row.id]);
    }
  };

  await updateHeroSlides();

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
