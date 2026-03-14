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
    .filter(f => f.startsWith("news-export-") && f.endsWith(".csv"))
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

  console.log("📊 Exporting news from database...");
  console.log(`🔍 Filter: ${status || "all statuses"}`);
  console.log("");

  // Setup output path
  const exportDir = path.join(process.cwd(), "exports");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = getTimestamp();
  const defaultFilename = `news-export-${timestamp}.csv`;
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
    // Query main news
    const newsQuery = `
      SELECT
        id,
        slug,
        title,
        excerpt,
        content,
        featured_image,
        status,
        published_at,
        created_at,
        updated_at
      FROM news
      WHERE 1=1
        ${status ? "AND status = ?" : ""}
      ORDER BY id ASC
    `;

    const newsParams = status ? [status] : [];
    const [newsRows] = await pool.query(newsQuery, newsParams);

    console.log(`✅ Found ${newsRows.length} news posts`);

    if (newsRows.length === 0) {
      console.log("⚠️  No news to export");
      await pool.end();
      return;
    }

    const newsIds = newsRows.map(n => n.id);

    // Query categories relationships
    console.log("🔗 Fetching relationships...");

    const categoriesQuery = `
      SELECT
        nnc.news_id,
        nc.id as category_id,
        nc.slug as category_slug,
        nc.name as category_name
      FROM news_news_categories nnc
      INNER JOIN news_categories nc ON nc.id = nnc.category_id
      WHERE nnc.news_id IN (?)
      ORDER BY nnc.news_id, nc.name
    `;

    const [categoryRows] = newsIds.length > 0
      ? await pool.query(categoriesQuery, [newsIds])
      : [[]];

    // Query tags relationships
    const tagsQuery = `
      SELECT
        nt.news_id,
        t.id as tag_id,
        t.slug as tag_slug,
        t.name as tag_name
      FROM news_tags nt
      INNER JOIN tags t ON t.id = nt.tag_id
      WHERE nt.news_id IN (?)
      ORDER BY nt.news_id, t.name
    `;

    const [tagRows] = newsIds.length > 0
      ? await pool.query(tagsQuery, [newsIds])
      : [[]];

    // Query gallery images
    const galleryQuery = `
      SELECT
        ng.news_id,
        ng.media_id,
        ng.sort_order,
        df.filename_disk,
        df.filename_download,
        df.title
      FROM news_gallery ng
      LEFT JOIN directus_files df ON df.id = ng.media_id
      WHERE ng.news_id IN (?)
      ORDER BY ng.news_id, ng.sort_order
    `;

    const [galleryRows] = newsIds.length > 0
      ? await pool.query(galleryQuery, [newsIds])
      : [[]];

    console.log(`   - ${categoryRows.length} category relationships`);
    console.log(`   - ${tagRows.length} tag relationships`);
    console.log(`   - ${galleryRows.length} gallery items`);
    console.log("");

    // Aggregate data by news_id
    console.log("📝 Aggregating data...");

    const newsMap = new Map();

    // Initialize with news data
    newsRows.forEach(news => {
      newsMap.set(news.id, {
        ...news,
        categories: [],
        tags: [],
        gallery: []
      });
    });

    // Aggregate categories
    categoryRows.forEach(row => {
      const news = newsMap.get(row.news_id);
      if (news) {
        news.categories.push(row.category_slug);
      }
    });

    // Aggregate tags
    tagRows.forEach(row => {
      const news = newsMap.get(row.news_id);
      if (news) {
        news.tags.push(row.tag_slug);
      }
    });

    // Aggregate gallery
    galleryRows.forEach(row => {
      const news = newsMap.get(row.news_id);
      if (news) {
        news.gallery.push({
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
    newsMap.forEach(news => {
      csvStream.write({
        id: news.id,
        slug: news.slug,
        title: news.title,
        excerpt: news.excerpt || "",
        excerpt_editable: htmlToMarkdown(news.excerpt || ""),
        content: news.content || "",
        content_editable: htmlToMarkdown(news.content || ""),
        status: news.status,
        published_at: news.published_at || "",
        created_at: news.created_at || "",
        updated_at: news.updated_at || "",
        category_slugs: news.categories.join(","),
        tag_slugs: news.tags.join(","),
        gallery_filenames: news.gallery.map(g => g.filename || g.media_id).join(","),
        featured_image_uuid: news.featured_image || "",
        featured_image_url: resolveMediaUrl(news.featured_image),
        gallery_urls: news.gallery.map(g => resolveMediaUrl(g.media_id)).join("|")
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
    console.log(`📦 Exported ${newsMap.size} news posts`);
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
