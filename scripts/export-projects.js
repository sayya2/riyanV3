const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { format } = require("@fast-csv/format");
const TurndownService = require("turndown");

// UUID regex for detecting Directus file IDs
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Configure Turndown for clean, readable Markdown
const turndownService = new TurndownService({
  headingStyle: 'atx',        // Use # for headings
  hr: '---',
  bulletListMarker: '-',      // Use - for bullets
  codeBlockStyle: 'fenced',
  emDelimiter: '*',           // Use * for italics
  strongDelimiter: '**',      // Use ** for bold
  linkStyle: 'inlined'        // [text](url) format
});

// Convert HTML to Markdown
const htmlToMarkdown = (html) => {
  if (!html || !html.trim()) return "";
  try {
    return turndownService.turndown(html);
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error.message);
    return html; // Return original HTML if conversion fails
  }
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);

  const statusIndex = args.indexOf("--status");
  const status = statusIndex !== -1 && args[statusIndex + 1] ? args[statusIndex + 1] : null;

  const outputIndex = args.indexOf("--output");
  const outputPath = outputIndex !== -1 && args[outputIndex + 1] ? args[outputIndex + 1] : null;

  return { status, outputPath };
};

// Get Directus base URL for media resolution
const getDirectusUrl = () => {
  return (
    process.env.NEXT_PUBLIC_DIRECTUS_URL ||
    process.env.DIRECTUS_PUBLIC_URL ||
    process.env.DIRECTUS_URL ||
    "http://localhost:8055"
  ).replace(/\/+$/, "");
};

// Resolve Directus file UUID to full URL
const resolveMediaUrl = (uuid) => {
  if (!uuid) return "";
  const trimmed = String(uuid).trim();

  // Check if it's already an absolute URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Check if it's a Directus UUID
  if (UUID_REGEX.test(trimmed)) {
    const directusUrl = getDirectusUrl();
    return `${directusUrl}/assets/${trimmed}`;
  }

  // Return as-is for other cases
  return trimmed;
};

// CSV escape helper
const escapeCSV = (value) => {
  if (value == null) return "";
  const str = String(value);

  // Check if escaping is needed
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Format timestamp for filename
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "-")
    .slice(0, 19); // YYYY-MM-DD-HH-MM-SS
};

// Cleanup old export files (keep last 7)
const cleanupOldExports = (exportDir) => {
  const RETENTION_COUNT = 7;

  if (!fs.existsSync(exportDir)) return;

  const files = fs.readdirSync(exportDir)
    .filter(f => f.startsWith("projects-export-") && f.endsWith(".csv"))
    .map(f => ({
      name: f,
      path: path.join(exportDir, f),
      time: fs.statSync(path.join(exportDir, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > RETENTION_COUNT) {
    const toDelete = files.slice(RETENTION_COUNT);
    toDelete.forEach(file => {
      fs.unlinkSync(file.path);
      console.log(`🗑️  Removed old export: ${file.name}`);
    });
  }
};

async function main() {
  const { status, outputPath } = parseArgs();

  console.log("📊 Exporting projects from database...");
  console.log(`🔍 Filter: ${status || "all statuses"}`);
  console.log("");

  // Setup output path
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = getTimestamp();
  const defaultFilename = `projects-export-${timestamp}.csv`;
  const finalOutputPath = outputPath || path.join(exportDir, defaultFilename);

  // Create database connection pool
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "riyan_nextjs",
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    // Query main projects
    const projectQuery = `
      SELECT
        id,
        slug,
        title,
        excerpt,
        content,
        featured_image,
        client,
        year,
        completed_year,
        location,
        status,
        published_at,
        created_at,
        updated_at
      FROM projects
      WHERE 1=1
        ${status ? "AND status = ?" : ""}
      ORDER BY id ASC
    `;

    const projectParams = status ? [status] : [];
    const [projectRows] = await pool.query(projectQuery, projectParams);

    console.log(`✅ Found ${projectRows.length} projects`);

    if (projectRows.length === 0) {
      console.log("⚠️  No projects to export");
      await pool.end();
      return;
    }

    const projectIds = projectRows.map(p => p.id);

    // Query sectors relationships
    console.log("🔗 Fetching relationships...");

    const sectorsQuery = `
      SELECT
        ps.projects_id as project_id,
        s.id as sector_id,
        s.slug as sector_slug,
        s.name as sector_name
      FROM projects_sectors ps
      INNER JOIN sectors s ON s.id = ps.sectors_id
      WHERE ps.projects_id IN (?)
      ORDER BY ps.projects_id, s.name
    `;

    const [sectorRows] = projectIds.length > 0
      ? await pool.query(sectorsQuery, [projectIds])
      : [[]];

    // Query services relationships (from both tables)
    const servicesQuery = `
      SELECT
        ps.projects_id as project_id,
        sv.id as service_id,
        sv.slug as service_slug,
        sv.name as service_name
      FROM projects_services ps
      INNER JOIN services sv ON sv.id = ps.services_id
      WHERE ps.projects_id IN (?)

      UNION ALL

      SELECT
        psl.project_id,
        sv.id as service_id,
        sv.slug as service_slug,
        sv.name as service_name
      FROM project_services psl
      INNER JOIN services sv ON sv.id = psl.service_id
      WHERE psl.project_id IN (?)

      ORDER BY project_id, service_name
    `;

    const [serviceRows] = projectIds.length > 0
      ? await pool.query(servicesQuery, [projectIds, projectIds])
      : [[]];

    // Query gallery images
    const galleryQuery = `
      SELECT
        pg.project_id,
        pg.media_id,
        pg.sort_order,
        df.filename_disk,
        df.filename_download,
        df.title
      FROM project_gallery pg
      LEFT JOIN directus_files df ON df.id = pg.media_id
      WHERE pg.project_id IN (?)
      ORDER BY pg.project_id, pg.sort_order
    `;

    const [galleryRows] = projectIds.length > 0
      ? await pool.query(galleryQuery, [projectIds])
      : [[]];

    console.log(`   - ${sectorRows.length} sector relationships`);
    console.log(`   - ${serviceRows.length} service relationships`);
    console.log(`   - ${galleryRows.length} gallery items`);
    console.log("");

    // Aggregate data by project_id
    console.log("📝 Aggregating data...");

    const projectMap = new Map();

    // Initialize with project data
    projectRows.forEach(project => {
      projectMap.set(project.id, {
        ...project,
        sectors: [],
        services: [],
        gallery: []
      });
    });

    // Aggregate sectors
    sectorRows.forEach(row => {
      const project = projectMap.get(row.project_id);
      if (project) {
        project.sectors.push(row.sector_slug);
      }
    });

    // Aggregate services (deduplicate)
    const servicesByProject = new Map();
    serviceRows.forEach(row => {
      if (!servicesByProject.has(row.project_id)) {
        servicesByProject.set(row.project_id, new Set());
      }
      servicesByProject.get(row.project_id).add(row.service_slug);
    });

    servicesByProject.forEach((slugSet, projectId) => {
      const project = projectMap.get(projectId);
      if (project) {
        project.services = Array.from(slugSet);
      }
    });

    // Aggregate gallery
    galleryRows.forEach(row => {
      const project = projectMap.get(row.project_id);
      if (project) {
        project.gallery.push({
          media_id: row.media_id,
          filename: row.filename_disk || row.filename_download || "",
          sort_order: row.sort_order
        });
      }
    });

    // Generate CSV
    console.log("💾 Generating CSV...");

    const directusUrl = getDirectusUrl();
    const csvStream = format({ headers: true });
    const writeStream = fs.createWriteStream(finalOutputPath);

    csvStream.pipe(writeStream);

    // Write rows
    projectMap.forEach(project => {
      csvStream.write({
        id: project.id,
        slug: project.slug,
        title: project.title,
        excerpt: project.excerpt || "",
        excerpt_editable: htmlToMarkdown(project.excerpt || ""),
        content: project.content || "",
        content_editable: htmlToMarkdown(project.content || ""),
        client: project.client || "",
        year: project.year || "",
        completed_year: project.completed_year || "",
        location: project.location || "",
        status: project.status,
        published_at: project.published_at || "",
        created_at: project.created_at || "",
        updated_at: project.updated_at || "",
        sector_slugs: project.sectors.join(","),
        service_slugs: project.services.join(","),
        gallery_filenames: project.gallery.map(g => g.filename || g.media_id).join(","),
        featured_image_uuid: project.featured_image || "",
        featured_image_url: resolveMediaUrl(project.featured_image),
        gallery_urls: project.gallery.map(g => resolveMediaUrl(g.media_id)).join("|")
      });
    });

    csvStream.end();

    // Wait for write to complete
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    const fileSize = fs.statSync(finalOutputPath).size;

    console.log("");
    console.log("✅ Export complete!");
    console.log(`📁 Output: ${finalOutputPath}`);
    console.log(`📊 Size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`📦 Exported ${projectMap.size} projects`);
    console.log("");

    // Cleanup old exports
    cleanupOldExports(exportDir);

  } catch (error) {
    console.error("❌ Error during export:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run main function
main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
