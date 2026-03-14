const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "riyan_nextjs",
  charset: "utf8mb4",
};

const targets = [
  { table: "pages", field: "content" },
  { table: "news", field: "content" },
  { table: "projects", field: "content" },
  { table: "careers", field: "content" },
];

const STYLE_RE = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const COMMENT_RE = /<!--[\s\S]*?-->/g;
const DATA_ATTR_RE =
  /\sdata-(?:elementor[a-z0-9_-]*|id|element_type|widget_type|settings)="[^"]*"/gi;
const CLASS_RE = /\sclass="([^"]*)"/gi;
const EMPTY_CLASS_RE = /\sclass=""/gi;

const shouldKeepClass = (token) => {
  if (!token) return false;
  if (token.startsWith("elementor")) return false;
  if (token.startsWith("swiper")) return false;
  if (token.startsWith("e-")) return false;
  return true;
};

const stripElementor = (value) => {
  if (value === null || value === undefined) return value;
  const input = String(value);
  let output = input;

  output = output.replace(STYLE_RE, "");
  output = output.replace(SCRIPT_RE, "");
  output = output.replace(COMMENT_RE, "");
  output = output.replace(DATA_ATTR_RE, "");
  output = output.replace(CLASS_RE, (_, classes) => {
    const kept = classes
      .split(/\s+/)
      .filter(Boolean)
      .filter(shouldKeepClass);
    return kept.length ? ` class="${kept.join(" ")}"` : "";
  });
  output = output.replace(EMPTY_CLASS_RE, "");

  return output;
};

async function main() {
  const connection = await mysql.createConnection(config);

  try {
    let totalUpdated = 0;

    for (const target of targets) {
      const whereParts = [
        `${target.field} LIKE '%elementor%'`,
        `${target.field} LIKE '%swiper%'`,
        `${target.field} LIKE '%<style%'`,
        `${target.field} LIKE '%<script%'`,
        `${target.field} LIKE '%data-elementor%'`,
        `${target.field} LIKE '%data-element_type%'`,
        `${target.field} LIKE '%data-widget_type%'`,
        `${target.field} LIKE '%data-settings%'`,
      ];
      const whereClause = whereParts.join(" OR ");
      const [rows] = await connection.query(
        `SELECT id, ${target.field} AS content FROM ${target.table} WHERE ${whereClause}`
      );

      let updated = 0;
      for (const row of rows) {
        const original = row.content;
        const cleaned = stripElementor(original);
        if (cleaned !== original) {
          await connection.query(
            `UPDATE ${target.table} SET ${target.field} = ? WHERE id = ?`,
            [cleaned, row.id]
          );
          updated += 1;
        }
      }

      totalUpdated += updated;
      console.log(
        `[strip-elementor] ${target.table}.${target.field}: scanned ${rows.length}, updated ${updated}`
      );
    }

    console.log(`[strip-elementor] total updated ${totalUpdated}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("[strip-elementor] failed:", error);
  process.exitCode = 1;
});
