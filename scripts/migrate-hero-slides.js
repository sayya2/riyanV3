const mysql = require("mysql2/promise");

const stripHtmlAndWhitespace = (value) =>
  value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const safeJsonParse = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    return null;
  }
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

const getLayerText = (layer) => {
  if (!layer || typeof layer !== "object") return "";
  if (typeof layer.text === "string") return layer.text;
  if (layer.content && typeof layer.content.text === "string") return layer.content.text;
  return "";
};

const getImageFromParams = (params) => {
  if (!params || typeof params !== "object") return "";
  const bg = params.bg;
  if (!bg || typeof bg !== "object") return "";
  if (typeof bg.image === "string") return bg.image;
  if (bg.image && typeof bg.image.src === "string") return bg.image.src;
  if (bg.image && typeof bg.image.url === "string") return bg.image.url;
  return "";
};

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "user",
    password: process.env.DB_PASSWORD || "Riyanitaccess@26+",
    database: process.env.DB_NAME || "riyan_nextjs",
    port: Number(process.env.DB_PORT) || 3307,
    waitForConnections: true,
    connectionLimit: 5,
  });

  const sliderAlias = process.env.HERO_SLIDER_ALIAS || "slider-1";

  const [sliderRows] = await pool.query(
    "SELECT id FROM wp_revslider_sliders WHERE alias = ? LIMIT 1",
    [sliderAlias]
  );

  if (!sliderRows.length) {
    console.error(`No slider found for alias "${sliderAlias}"`);
    await pool.end();
    process.exit(1);
  }

  const sliderId = sliderRows[0].id;
  const [rows] = await pool.query(
    "SELECT id, slide_order, params, layers FROM wp_revslider_slides WHERE slider_id = ? ORDER BY slide_order",
    [sliderId]
  );

  const slides = rows
    .map((row) => {
      const params = safeJsonParse(row.params);
      const layers = safeJsonParse(row.layers);
      const publishState = params?.publish?.state;
      if (publishState === "unpublished") return null;

      const imageUrl = getImageFromParams(params);
      const textLayers = Object.entries(layers || {})
        .filter(([key, value]) => {
          if (["top", "middle", "bottom"].includes(key)) return false;
          return Boolean(getLayerText(value));
        })
        .sort((a, b) => {
          const aNum = Number.parseInt(a[0], 10);
          const bNum = Number.parseInt(b[0], 10);
          if (Number.isNaN(aNum) && Number.isNaN(bNum)) return 0;
          if (Number.isNaN(aNum)) return 1;
          if (Number.isNaN(bNum)) return -1;
          return aNum - bNum;
        })
        .map((entry) => getLayerText(entry[1]));

      const title = stripHtmlAndWhitespace(textLayers[0] || "");
      const description = stripHtmlAndWhitespace(textLayers[1] || "");

      if (!imageUrl && !title && !description) return null;

      return {
        legacyId: row.id,
        order: Number(row.slide_order) || 0,
        title,
        description,
        imageUrl,
      };
    })
    .filter(Boolean);

  if (!slides.length) {
    console.error("No published slides found.");
    await pool.end();
    process.exit(1);
  }

  const relativePaths = Array.from(
    new Set(
      slides
        .map((slide) => toRelativeUploadPath(normalizeUploadsPath(slide.imageUrl)))
        .filter(Boolean)
    )
  );

  const fileIdByPath = new Map();
  if (relativePaths.length) {
    const placeholders = relativePaths.map(() => "?").join(", ");
    const [fileRows] = await pool.query(
      `SELECT id, filename_disk FROM directus_files WHERE filename_disk IN (${placeholders})`,
      relativePaths
    );
    fileRows.forEach((row) => {
      fileIdByPath.set(row.filename_disk, row.id);
    });
  }

  const [existing] = await pool.query(
    "SELECT id, sort_order FROM hero_slides ORDER BY sort_order, id"
  );

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    const relativePath = toRelativeUploadPath(normalizeUploadsPath(slide.imageUrl));
    const directusId = fileIdByPath.get(relativePath) || slide.imageUrl || null;
    const payload = [slide.title || null, slide.description || null, directusId, slide.order];

    if (existing[i]) {
      await pool.query(
        "UPDATE hero_slides SET title = ?, description = ?, image_url = ?, sort_order = ?, status = 'published' WHERE id = ?",
        [...payload, existing[i].id]
      );
    } else {
      await pool.query(
        "INSERT INTO hero_slides (title, description, image_url, sort_order, status) VALUES (?, ?, ?, ?, 'published')",
        payload
      );
    }
  }

  if (existing.length > slides.length) {
    const remainingIds = existing.slice(slides.length).map((row) => row.id);
    const placeholders = remainingIds.map(() => "?").join(", ");
    await pool.query(
      `UPDATE hero_slides SET status = 'draft' WHERE id IN (${placeholders})`,
      remainingIds
    );
  }

  console.log(
    `Updated ${Math.min(existing.length, slides.length)} hero slides; inserted ${Math.max(0, slides.length - existing.length)}.`
  );

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
