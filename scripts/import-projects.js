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
    console.error("Usage: node scripts/import-projects.js --file <path> [--dry-run] [--skip-gallery]");
    console.error("");
    console.error("Options:");
    console.error("  --file <path>      Path to CSV file (required)");
    console.error("  --dry-run          Validation only, no database changes");
    console.error("  --skip-gallery     Skip gallery updates (default behavior)");
    console.error("");
    console.error("Examples:");
    console.error("  node scripts/import-projects.js --file exports/projects-export-20260107.csv --dry-run");
    console.error("  npm run import:projects:dry -- --file exports/projects-export-20260107.csv");
    console.error("  npm run import:projects -- --file exports/projects-export-20260107.csv");
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

  // Check all project IDs exist
  const projectIds = rows.map(r => parseInt(r.id)).filter(id => !isNaN(id));

  if (projectIds.length === 0) {
    errors.push("No valid project IDs found in CSV");
    return { errors, warnings };
  }

  const placeholders = projectIds.map(() => "?").join(",");
  const [existingProjects] = await pool.query(
    `SELECT id FROM projects WHERE id IN (${placeholders})`,
    projectIds
  );

  const existingIds = new Set(existingProjects.map(p => p.id));

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +2 for header and 1-based indexing
    const id = parseInt(row.id);

    // Validate ID
    if (isNaN(id)) {
      errors.push(`Row ${rowNum}: Invalid project ID "${row.id}"`);
      return;
    }

    if (!existingIds.has(id)) {
      errors.push(`Row ${rowNum}: Project ID ${id} not found in database`);
      return;
    }

    // Validate required fields
    if (!row.slug || !row.slug.trim()) {
      errors.push(`Row ${rowNum}: Missing slug for project ${id}`);
    }

    if (!row.title || !row.title.trim()) {
      errors.push(`Row ${rowNum}: Missing title for project ${id}`);
    }

    // Validate status
    if (row.status && !["draft", "published", "archived"].includes(row.status)) {
      errors.push(`Row ${rowNum}: Invalid status "${row.status}" for project ${id}`);
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

  // Validate sector slugs exist
  const allSectorSlugs = new Set();
  rows.forEach(row => {
    if (row.sector_slugs && row.sector_slugs.trim()) {
      row.sector_slugs.split(",").forEach(slug => {
        const trimmed = slug.trim();
        if (trimmed) allSectorSlugs.add(trimmed);
      });
    }
  });

  if (allSectorSlugs.size > 0) {
    const sectorPlaceholders = Array.from(allSectorSlugs).map(() => "?").join(",");
    const [existingSectors] = await pool.query(
      `SELECT slug FROM sectors WHERE slug IN (${sectorPlaceholders})`,
      Array.from(allSectorSlugs)
    );

    const existingSectorSlugs = new Set(existingSectors.map(s => s.slug));
    const missingSectors = Array.from(allSectorSlugs).filter(s => !existingSectorSlugs.has(s));

    if (missingSectors.length > 0) {
      errors.push(`Unknown sector slugs: ${missingSectors.join(", ")}`);
    }
  }

  // Validate service slugs exist
  const allServiceSlugs = new Set();
  rows.forEach(row => {
    if (row.service_slugs && row.service_slugs.trim()) {
      row.service_slugs.split(",").forEach(slug => {
        const trimmed = slug.trim();
        if (trimmed) allServiceSlugs.add(trimmed);
      });
    }
  });

  if (allServiceSlugs.size > 0) {
    const servicePlaceholders = Array.from(allServiceSlugs).map(() => "?").join(",");
    const [existingServices] = await pool.query(
      `SELECT slug FROM services WHERE slug IN (${servicePlaceholders})`,
      Array.from(allServiceSlugs)
    );

    const existingServiceSlugs = new Set(existingServices.map(s => s.slug));
    const missingServices = Array.from(allServiceSlugs).filter(s => !existingServiceSlugs.has(s));

    if (missingServices.length > 0) {
      errors.push(`Unknown service slugs: ${missingServices.join(", ")}`);
    }
  }

  return { errors, warnings };
};

// Import projects with transaction support
const importProjects = async (pool, rows, options = {}) => {
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
      const projectId = parseInt(row.id);

      // Update core project fields
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

      if (row.client !== undefined) {
        updateFields.push("client = ?");
        updateValues.push(row.client || null);
      }

      if (row.year !== undefined) {
        updateFields.push("year = ?");
        updateValues.push(row.year || null);
      }

      if (row.completed_year !== undefined) {
        updateFields.push("completed_year = ?");
        updateValues.push(row.completed_year || null);
      }

      if (row.location !== undefined) {
        updateFields.push("location = ?");
        updateValues.push(row.location || null);
      }

      if (row.status && ["draft", "published", "archived"].includes(row.status)) {
        updateFields.push("status = ?");
        updateValues.push(row.status);
      }

      // Update timestamp
      updateFields.push("updated_at = NOW()");

      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE projects
          SET ${updateFields.join(", ")}
          WHERE id = ?
        `;

        if (!dryRun) {
          await connection.query(updateQuery, [...updateValues, projectId]);
        }
        console.log(`✏️  Updated project ${projectId}: ${row.title}`);
        updateCount++;
      }

      // Update sectors (M2M relationship)
      if (row.sector_slugs !== undefined) {
        const sectorSlugs = row.sector_slugs
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        if (sectorSlugs.length > 0) {
          // Get sector IDs
          const placeholders = sectorSlugs.map(() => "?").join(",");
          const [sectors] = await connection.query(
            `SELECT id FROM sectors WHERE slug IN (${placeholders})`,
            sectorSlugs
          );

          const sectorIds = sectors.map(s => s.id);

          if (!dryRun) {
            // Delete existing relationships
            await connection.query(
              "DELETE FROM projects_sectors WHERE projects_id = ?",
              [projectId]
            );

            // Insert new relationships
            if (sectorIds.length > 0) {
              const insertValues = sectorIds.map(sectorId => [projectId, sectorId]);
              await connection.query(
                "INSERT INTO projects_sectors (projects_id, sectors_id) VALUES ?",
                [insertValues]
              );
            }
          }

          console.log(`   🔗 Updated sectors: ${sectorSlugs.join(", ")}`);
          relationshipsUpdated++;
        } else {
          // Empty sector_slugs = remove all sectors
          if (!dryRun) {
            await connection.query(
              "DELETE FROM projects_sectors WHERE projects_id = ?",
              [projectId]
            );
          }
          console.log(`   🔗 Removed all sectors`);
        }
      }

      // Update services (M2M relationship)
      if (row.service_slugs !== undefined) {
        const serviceSlugs = row.service_slugs
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

        if (serviceSlugs.length > 0) {
          // Get service IDs
          const placeholders = serviceSlugs.map(() => "?").join(",");
          const [services] = await connection.query(
            `SELECT id FROM services WHERE slug IN (${placeholders})`,
            serviceSlugs
          );

          const serviceIds = services.map(s => s.id);

          if (!dryRun) {
            // Delete existing relationships (both tables)
            await connection.query(
              "DELETE FROM projects_services WHERE projects_id = ?",
              [projectId]
            );
            await connection.query(
              "DELETE FROM project_services WHERE project_id = ?",
              [projectId]
            );

            // Insert new relationships (use projects_services as primary)
            if (serviceIds.length > 0) {
              const insertValues = serviceIds.map(serviceId => [projectId, serviceId]);
              await connection.query(
                "INSERT INTO projects_services (projects_id, services_id) VALUES ?",
                [insertValues]
              );
            }
          }

          console.log(`   🔗 Updated services: ${serviceSlugs.join(", ")}`);
          relationshipsUpdated++;
        } else {
          // Empty service_slugs = remove all services
          if (!dryRun) {
            await connection.query(
              "DELETE FROM projects_services WHERE projects_id = ?",
              [projectId]
            );
            await connection.query(
              "DELETE FROM project_services WHERE project_id = ?",
              [projectId]
            );
          }
          console.log(`   🔗 Removed all services`);
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
    console.log(`   - ${updateCount} projects updated`);
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

  console.log("📥 Importing projects from CSV...");
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
    await importProjects(pool, rows, { dryRun, skipGallery });

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
