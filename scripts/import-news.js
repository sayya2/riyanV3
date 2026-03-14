const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const csv = require("csv-parser");
const { marked } = require("marked");
const createDOMPurify = require("dompurify");
const { JSDOM } = require("jsdom");

// Setup DOMPurify for HTML sanitization
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

// Convert Markdown to safe HTML
const markdownToHtml = (markdown) => {
  if (!markdown || !markdown.trim()) return null;
  try {
    const html = marked.parse(markdown);
    const safeHtml = DOMPurify.sanitize(html);
    return safeHtml;
  } catch (error) {
    console.error("Error converting Markdown to HTML:", error.message);
    return null;
  }
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);

  const fileIndex = args.indexOf("--file");
  const filePath = fileIndex !== -1 && args[fileIndex + 1] ? args[fileIndex + 1] : null;

  const dryRun = args.includes("--dry-run");
  const skipGallery = args.includes("--skip-gallery");

  if (!filePath) {
    console.error("❌ Error: --file parameter required");
    console.error("");
    console.error("Usage: node scripts/import-news.js --file <path> [--dry-run] [--skip-gallery]");
    console.error("");
    console.error("Options:");
    console.error("  --file <path>      Path to CSV file (required)");
    console.error("  --dry-run          Validation only, no database changes");
    console.error("  --skip-gallery     Skip gallery updates (default behavior)");
    console.error("");
    console.error("Examples:");
    console.error("  node scripts/import-news.js --file exports/news-export-20260107.csv --dry-run");
    console.error("  npm run import:news:dry -- --file exports/news-export-20260107.csv");
    console.error("  npm run import:news -- --file exports/news-export-20260107.csv");
    process.exit(1);
  }

  return { filePath, dryRun, skipGallery };
};

// Parse CSV file
const parseCSV = async (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", reject);
  });
};

// Validate import data
const validateImport = async (pool, rows) => {
  console.log("🔍 Validation phase...");
  const errors = [];
  const warnings = [];

  // Check all news IDs exist
  const newsIds = rows.map(r => parseInt(r.id)).filter(id => !isNaN(id));

  if (newsIds.length === 0) {
    errors.push("No valid news IDs found in CSV");
    return { errors, warnings };
  }

  const placeholders = newsIds.map(() => "?").join(",");
  const [existingNews] = await pool.query(
    `SELECT id FROM news WHERE id IN (${placeholders})`,
    newsIds
  );

  const existingIds = new Set(existingNews.map(p => p.id));

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header and 1-based indexing
    const id = parseInt(row.id);

    // Validate ID
    if (isNaN(id)) {
      errors.push(`Row ${rowNum}: Invalid news ID "${row.id}"`);
      return;
    }

    if (!existingIds.has(id)) {
      errors.push(`Row ${rowNum}: News ID ${id} not found in database`);
      return;
    }

    // Validate required fields
    if (!row.slug || !row.slug.trim()) {
      errors.push(`Row ${rowNum}: Missing slug for news ${id}`);
    }

    if (!row.title || !row.title.trim()) {
      errors.push(`Row ${rowNum}: Missing title for news ${id}`);
    }

    // Validate status
    if (row.status && !["draft", "published", "archived"].includes(row.status)) {
      errors.push(`Row ${rowNum}: Invalid status "${row.status}" for news ${id}`);
    }

    // Validate dates (ISO format)
    ["published_at", "created_at", "updated_at"].forEach(field => {
      if (row[field] && row[field].trim()) {
        const date = new Date(row[field]);
        if (isNaN(date.getTime())) {
          warnings.push(`Row ${rowNum}: Invalid date format for ${field}: "${row[field]}"`);
        }
      }
    });
  });

  // Validate category slugs exist
  const allCategorySlugs = new Set();
  rows.forEach(row => {
    if (row.category_slugs && row.category_slugs.trim()) {
      row.category_slugs.split(",").forEach(slug => {
        const trimmed = slug.trim();
        if (trimmed) allCategorySlugs.add(trimmed);
      });
    }
  });

  if (allCategorySlugs.size > 0) {
    const categoryPlaceholders = Array.from(allCategorySlugs).map(() => "?").join(",");
    const [existingCategories] = await pool.query(
      `SELECT slug FROM news_categories WHERE slug IN (${categoryPlaceholders})`,
      Array.from(allCategorySlugs)
    );

    const existingCategorySlugs = new Set(existingCategories.map(s => s.slug));
    const missingCategories = Array.from(allCategorySlugs).filter(s => !existingCategorySlugs.has(s));

    if (missingCategories.length > 0) {
      errors.push(`Unknown category slugs: ${missingCategories.join(", ")}`);
    }
  }

  // Validate tag slugs exist
  const allTagSlugs = new Set();
  rows.forEach(row => {
    if (row.tag_slugs && row.tag_slugs.trim()) {
      row.tag_slugs.split(",").forEach(slug => {
        const trimmed = slug.trim();
        if (trimmed) allTagSlugs.add(trimmed);
      });
    }
  });

  if (allTagSlugs.size > 0) {
    const tagPlaceholders = Array.from(allTagSlugs).map(() => "?").join(",");
    const [existingTags] = await pool.query(
      `SELECT slug FROM tags WHERE slug IN (${tagPlaceholders})`,
      Array.from(allTagSlugs)
    );

    const existingTagSlugs = new Set(existingTags.map(s => s.slug));
    const missingTags = Array.from(allTagSlugs).filter(s => !existingTagSlugs.has(s));

    if (missingTags.length > 0) {
      errors.push(`Unknown tag slugs: ${missingTags.join(", ")}`);
    }
  }

  return { errors, warnings };
};

// Import news with transaction support
const importNews = async (pool, rows, options = {}) => {
  const { dryRun, skipGallery } = options;

  const connection = await pool.getConnection();

  try {
    if (!dryRun) {
      await connection.beginTransaction();
      console.log("🔄 Transaction started");
    }

    let updateCount = 0;
    let relationshipsUpdated = 0;

    for (const row of rows) {
      const newsId = parseInt(row.id);

      // Update core news fields
      const updateFields = [];
      const updateValues = [];

      // Only update non-empty fields
      if (row.slug && row.slug.trim()) {
        updateFields.push("slug = ?");
        updateValues.push(row.slug.trim());
      }

      if (row.title && row.title.trim()) {
        updateFields.push("title = ?");
        updateValues.push(row.title.trim());
      }

      // Convert Markdown to HTML for excerpt if excerpt_editable is provided
      if (row.excerpt_editable !== undefined && row.excerpt_editable.trim()) {
        const html = markdownToHtml(row.excerpt_editable);
        if (html !== null) {
          updateFields.push("excerpt = ?");
          updateValues.push(html);
        }
      } else if (row.excerpt !== undefined) {
        // Fallback to direct excerpt update if no editable column
        updateFields.push("excerpt = ?");
        updateValues.push(row.excerpt);
      }

      // Convert Markdown to HTML for content if content_editable is provided
      if (row.content_editable !== undefined && row.content_editable.trim()) {
        const html = markdownToHtml(row.content_editable);
        if (html !== null) {
          updateFields.push("content = ?");
          updateValues.push(html);
        }
      } else if (row.content !== undefined) {
        // Fallback to direct content update if no editable column
        updateFields.push("content = ?");
        updateValues.push(row.content);
      }

      if (row.status && ["draft", "published", "archived"].includes(row.status)) {
        updateFields.push("status = ?");
        updateValues.push(row.status);
      }

      // Update timestamp
      updateFields.push("updated_at = NOW()");

      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE news
          SET ${updateFields.join(", ")}
          WHERE id = ?
        `;

        if (!dryRun) {
          await connection.query(updateQuery, [...updateValues, newsId]);
        }
        console.log(`✏️  Updated news ${newsId}: ${row.title}`);
        updateCount++;
      }

      // Update categories (M2M relationship)
      if (row.category_slugs !== undefined) {
        const categorySlugs = row.category_slugs
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        if (categorySlugs.length > 0) {
          // Get category IDs
          const placeholders = categorySlugs.map(() => "?").join(",");
          const [categories] = await connection.query(
            `SELECT id FROM news_categories WHERE slug IN (${placeholders})`,
            categorySlugs
          );

          const categoryIds = categories.map(s => s.id);

          if (!dryRun) {
            // Delete existing relationships
            await connection.query(
              "DELETE FROM news_news_categories WHERE news_id = ?",
              [newsId]
            );

            // Insert new relationships
            if (categoryIds.length > 0) {
              const insertValues = categoryIds.map(categoryId => [newsId, categoryId]);
              await connection.query(
                "INSERT INTO news_news_categories (news_id, category_id) VALUES ?",
                [insertValues]
              );
            }
          }

          console.log(`   🔗 Updated categories: ${categorySlugs.join(", ")}`);
          relationshipsUpdated++;
        } else {
          // Empty category_slugs = remove all categories
          if (!dryRun) {
            await connection.query(
              "DELETE FROM news_news_categories WHERE news_id = ?",
              [newsId]
            );
          }
          console.log(`   🔗 Removed all categories`);
        }
      }

      // Update tags (M2M relationship)
      if (row.tag_slugs !== undefined) {
        const tagSlugs = row.tag_slugs
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        if (tagSlugs.length > 0) {
          // Get tag IDs
          const placeholders = tagSlugs.map(() => "?").join(",");
          const [tags] = await connection.query(
            `SELECT id FROM tags WHERE slug IN (${placeholders})`,
            tagSlugs
          );

          const tagIds = tags.map(s => s.id);

          if (!dryRun) {
            // Delete existing relationships
            await connection.query(
              "DELETE FROM news_tags WHERE news_id = ?",
              [newsId]
            );

            // Insert new relationships
            if (tagIds.length > 0) {
              const insertValues = tagIds.map(tagId => [newsId, tagId]);
              await connection.query(
                "INSERT INTO news_tags (news_id, tag_id) VALUES ?",
                [insertValues]
              );
            }
          }

          console.log(`   🔗 Updated tags: ${tagSlugs.join(", ")}`);
          relationshipsUpdated++;
        } else {
          // Empty tag_slugs = remove all tags
          if (!dryRun) {
            await connection.query(
              "DELETE FROM news_tags WHERE news_id = ?",
              [newsId]
            );
          }
          console.log(`   🔗 Removed all tags`);
        }
      }

      // Skip gallery updates (not implemented in this version)
      if (!skipGallery && row.gallery_filenames && row.gallery_filenames.trim()) {
        console.log(`   ⚠️  Gallery update not implemented (use --skip-gallery to suppress)`);
      }
    }

    if (!dryRun) {
      await connection.commit();
      console.log("✅ Transaction committed");
    } else {
      console.log("🔍 DRY RUN - No changes made");
    }

    console.log("");
    console.log("📊 Import summary:");
    console.log(`   - ${updateCount} news updated`);
    console.log(`   - ${relationshipsUpdated} relationship updates`);

  } catch (error) {
    if (!dryRun) {
      await connection.rollback();
      console.error("❌ Transaction rolled back due to error");
    }
    throw error;
  } finally {
    connection.release();
  }
};

async function main() {
  const { filePath, dryRun, skipGallery } = parseArgs();

  console.log("📥 Importing news from CSV...");
  console.log(`📁 File: ${filePath}`);
  console.log(`🔍 Mode: ${dryRun ? "DRY RUN" : "LIVE IMPORT"}`);
  console.log("");

  // Check file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Parse CSV
  console.log("📖 Reading CSV file...");
  const rows = await parseCSV(filePath);
  console.log(`✅ Loaded ${rows.length} rows`);
  console.log("");

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
    // Validation phase
    const { errors, warnings } = await validateImport(pool, rows);

    if (warnings.length > 0) {
      console.log("⚠️  Warnings:");
      warnings.forEach(w => console.log(`   ${w}`));
      console.log("");
    }

    if (errors.length > 0) {
      console.error("❌ Validation failed:");
      errors.forEach(e => console.error(`   ${e}`));
      console.error("");
      console.error("Please fix the errors and try again.");
      await pool.end();
      process.exit(1);
    }

    console.log("✅ Validation passed");
    console.log("");

    // Warning before live import
    if (!dryRun) {
      console.log("⚠️  WARNING: This will modify the database!");
      console.log("⚠️  Make sure you have a backup before proceeding.");
      console.log("");
      console.log("💡 To create a backup, run:");
      console.log("   ./scripts/db-export-pi.sh");
      console.log("");
    }

    // Import phase
    await importNews(pool, rows, { dryRun, skipGallery });

    console.log("");
    console.log("✅ Import complete!");

  } catch (error) {
    console.error("❌ Error during import:", error);
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
