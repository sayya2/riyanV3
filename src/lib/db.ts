import mysql from 'mysql2/promise';
import path from 'path';
import { promises as fs } from 'fs';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'riyan_nextjs',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

export interface MenuItem {
  id: number;
  title: string;
  url: string;
  parent_id: number;
}

export interface Post {
  ID: number;
  post_title: string;
  post_content: string;
  post_excerpt: string;
  post_name?: string;
  post_date: string;
  post_type: string;
  post_status: string;
  thumbnail_url?: string | null;
}

export interface Project {
  ID: number;
  post_title: string;
  post_excerpt: string;
  post_content: string;
  post_name?: string;
  post_date: string;
  thumbnail_url?: string | null;
  categories?: string[];
  services?: string[];
  gallery?: string[];
}

export interface NewsPost extends Post {
  categories?: string[];
  tags?: string[];
  gallery?: string[];
}

export interface CareerPost extends Post {
  location?: string | null;
  employment_type?: string | null;
  department?: string | null;
  closing_date?: string | null;
  job_description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  qualifications?: string | null;
  benefits?: string | null;
}

export interface ProjectCategory {
  term_id: number;
  name: string;
  slug: string;
  count: number;
}

export interface ProjectService {
  term_id: number;
  name: string;
  slug: string;
  count: number;
}

export interface ProjectMeta {
  client?: string;
  year?: string;
  location?: string;
  services?: string[];
}

export interface AdjacentProject {
  post_name: string;
  post_title: string;
}

export interface AdjacentNews {
  post_name: string;
  post_title: string;
}

export interface AdjacentCareer {
  post_name: string;
  post_title: string;
}

export interface HeroSlide {
  id: number;
  order: number;
  title: string;
  description: string;
  imageUrl: string;
}

const stripHtmlAndWhitespace = (value: string) =>
  value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

const safeJsonParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error("Failed to parse JSON from DB:", error);
    return null;
  }
};

const parseSerializedArray = (value: string | null): string[] => {
  if (!value) return [];
  const matches = Array.from(value.matchAll(/s:\d+:"([^"]*)"/g)).map((m) => m[1]).filter(Boolean);
  return matches;
};

const normalizeMediaUrl = (value?: string | null): string | null => {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const withoutProtocol = trimmed.replace(/^https?:\/\/[^/]+/i, "");

  const wpIndex = withoutProtocol.indexOf("/wp-content/");
  if (wpIndex !== -1) {
    const path = withoutProtocol.slice(wpIndex);
    return path.startsWith("/") ? path : `/${path}`;
  }

  if (withoutProtocol.startsWith("wp-content/")) {
    return `/${withoutProtocol}`;
  }

  if (withoutProtocol.startsWith("/wp-content/")) {
    return withoutProtocol;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

const normalizeMediaArray = (values?: (string | null)[]): string[] =>
  (values || [])
    .map((entry) => normalizeMediaUrl(entry))
    .filter((entry): entry is string => Boolean(entry));

const wpContentRoot = path.join(process.cwd(), 'wp-content');

const getLocalImages = async (relativeDir: string): Promise<string[]> => {
  try {
    const dir = path.join(wpContentRoot, relativeDir);
    const entries = await fs.readdir(dir);
    return entries
      .filter((name) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name))
      .map((name) => `/wp-content/${relativeDir.replace(/\\/g, "/")}/${name}`);
  } catch (error) {
    return [];
  }
};

const getCareerPostTypes = (): string[] => {
  const envTypes =
    process.env.CAREER_POST_TYPES || process.env.CAREER_POST_TYPE
      ? (process.env.CAREER_POST_TYPES || process.env.CAREER_POST_TYPE || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  const defaults = ["career", "careers"];
  const types = Array.from(new Set([...envTypes, ...defaults])).filter(Boolean);

  return types.length ? types : ["career"];
};

const buildCareerTypeClause = (alias = "p"): { clause: string; params: string[] } => {
  const types = getCareerPostTypes();
  const prefix = alias ? `${alias}.` : "";
  if (types.length === 1) {
    return { clause: `${prefix}post_type = ?`, params: types };
  }
  const placeholders = types.map(() => "?").join(",");
  return { clause: `${prefix}post_type IN (${placeholders})`, params: types };
};

let cachedCareerPageId: number | null | undefined;

const getCareerPageId = async (): Promise<number | null> => {
  if (typeof cachedCareerPageId !== "undefined") {
    return cachedCareerPageId;
  }

  const [rows] = await pool.query<any[]>(
    `
      SELECT ID
      FROM wp_posts
      WHERE post_type = 'page'
        AND post_status = 'publish'
        AND post_name = 'career'
      LIMIT 1
    `
  );

  cachedCareerPageId = rows.length ? Number(rows[0].ID) : null;
  return cachedCareerPageId;
};

export async function getMenuItems(): Promise<MenuItem[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      p.ID as id,
      p.post_title as title,
      MAX(CASE WHEN pm.meta_key = '_menu_item_url' THEN pm.meta_value END) as url,
      MAX(CASE WHEN pm.meta_key = '_menu_item_menu_item_parent' THEN pm.meta_value END) as parent_id
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
    WHERE p.post_type = 'nav_menu_item'
    AND p.post_status = 'publish'
    GROUP BY p.ID, p.post_title, p.menu_order
    ORDER BY p.menu_order
  `);

  return rows as MenuItem[];
}

export async function getPosts(postType: string = 'post', limit: number = 10): Promise<Post[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      p.ID,
      p.post_title,
      p.post_content,
      p.post_excerpt,
      p.post_name,
      p.post_date,
      p.post_type,
      p.post_status,
      img.guid as thumbnail_url
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
    LEFT JOIN wp_posts img ON img.ID = pm.meta_value
    WHERE p.post_type = ?
      AND p.post_status = 'publish'
    ORDER BY post_date DESC
    LIMIT ?
  `, [postType, limit]);

  return (rows as any[]).map((row) => ({
    ID: Number(row.ID),
    post_title: row.post_title,
    post_content: row.post_content,
    post_excerpt: row.post_excerpt,
    post_name: row.post_name,
    post_date: row.post_date,
    post_type: row.post_type,
    post_status: row.post_status,
    thumbnail_url: normalizeMediaUrl(row.thumbnail_url),
  }));
}

export async function getProjectCategories(): Promise<ProjectCategory[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      t.term_id,
      t.name,
      t.slug,
      tt.count
    FROM wp_terms t
    JOIN wp_term_taxonomy tt ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'project_category'
    ORDER BY t.name ASC
  `);

  return rows.map((row) => ({
    term_id: Number(row.term_id),
    name: row.name as string,
    slug: row.slug as string,
    count: Number(row.count),
  }));
}

export async function getProjectServices(): Promise<ProjectService[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      t.term_id,
      t.name,
      t.slug,
      tt.count
    FROM wp_terms t
    JOIN wp_term_taxonomy tt ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'service'
    ORDER BY t.name ASC
  `);

  return rows.map((row) => ({
    term_id: Number(row.term_id),
    name: row.name as string,
    slug: row.slug as string,
    count: Number(row.count),
  }));
}

export async function getProjects(
  {
    categorySlug,
    serviceSlug,
    search,
    limit = 24,
  }: {
    categorySlug?: string;
    serviceSlug?: string;
    search?: string;
    limit?: number;
  } = {}
): Promise<Project[]> {
  const params: any[] = [];
  let where = `p.post_type = 'project' AND p.post_status = 'publish'`;

  if (categorySlug) {
    where += ` AND t.slug = ?`;
    params.push(categorySlug);
  }

  if (serviceSlug) {
    where += ` AND s.slug = ?`;
    params.push(serviceSlug);
  }

  if (search) {
    where += ` AND (p.post_title LIKE ? OR p.post_excerpt LIKE ? OR p.post_content LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  params.push(limit);

  const [rows] = await pool.query<any[]>(`
    SELECT
      p.ID,
      p.post_title,
      p.post_excerpt,
      p.post_content,
      p.post_name,
      p.post_date,
      img.guid AS thumbnail_url,
      GROUP_CONCAT(DISTINCT t.name) AS categories,
      GROUP_CONCAT(DISTINCT s.name) AS services
    FROM wp_posts p
    LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
    LEFT JOIN wp_posts img ON img.ID = pm.meta_value
    LEFT JOIN wp_term_relationships trc ON trc.object_id = p.ID
    LEFT JOIN wp_term_taxonomy ttc ON ttc.term_taxonomy_id = trc.term_taxonomy_id AND ttc.taxonomy = 'project_category'
    LEFT JOIN wp_terms t ON t.term_id = ttc.term_id
    LEFT JOIN wp_term_relationships trs ON trs.object_id = p.ID
    LEFT JOIN wp_term_taxonomy tts ON tts.term_taxonomy_id = trs.term_taxonomy_id AND tts.taxonomy = 'service'
    LEFT JOIN wp_terms s ON s.term_id = tts.term_id
    WHERE ${where}
    GROUP BY p.ID
    ORDER BY p.post_date DESC
    LIMIT ?
  `, params);

  return (rows as any[]).map((row) => ({
    ID: Number(row.ID),
    post_title: row.post_title,
    post_excerpt: row.post_excerpt,
    post_content: row.post_content,
    post_name: row.post_name,
    post_date: row.post_date,
    thumbnail_url: normalizeMediaUrl(row.thumbnail_url),
    categories: row.categories ? (row.categories as string).split(",") : [],
    services: row.services ? (row.services as string).split(",") : [],
  }));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const [rows] = await pool.query<any[]>(`
    SELECT ID, post_title, post_content, post_excerpt, post_date, post_type, post_status
    FROM wp_posts
    WHERE post_name = ?
    AND post_status = 'publish'
    LIMIT 1
  `, [slug]);

  return rows.length > 0 ? (rows[0] as Post) : null;
}

export async function getHeroSlides(sliderAlias: string = 'slider-1'): Promise<HeroSlide[]> {
  try {
    const [sliderRows] = await pool.query<any[]>(
      'SELECT id FROM wp_revslider_sliders WHERE alias = ? LIMIT 1',
      [sliderAlias]
    );

    if (!sliderRows.length) return [];

    const sliderId = sliderRows[0].id as number;

    const [rows] = await pool.query<any[]>(
      'SELECT id, slide_order, params, layers FROM wp_revslider_slides WHERE slider_id = ? ORDER BY slide_order',
      [sliderId]
    );

    return (rows as any[])
      .map((row): HeroSlide | null => {
        const params = safeJsonParse<any>(row.params);
        const layers = safeJsonParse<Record<string, any>>(row.layers);

        if (params?.publish?.state === 'unpublished') return null;

        const imageUrl = normalizeMediaUrl(params?.bg?.image ?? '') || params?.bg?.image || '';

        const textLayers = Object.entries(layers ?? {})
          .filter(([key, value]) => {
            if (['top', 'middle', 'bottom'].includes(key)) return false;
            const text = (value as any)?.text;
            return typeof text === 'string' && text.trim().length > 0;
          })
          .sort((a, b) => Number(a[0]) - Number(b[0]));

        const title = stripHtmlAndWhitespace(textLayers[0]?.[1]?.text ?? '');
        const description = stripHtmlAndWhitespace(textLayers[1]?.[1]?.text ?? '');

        if (!imageUrl && !title && !description) return null;

        return {
          id: Number(row.id),
          order: Number(row.slide_order) || 0,
          title,
          description,
          imageUrl,
        };
      })
      .filter((slide): slide is HeroSlide => Boolean(slide));
  } catch (error) {
    console.error("[getHeroSlides] failed, returning empty array", error);
    return [];
  }
}

export async function getProjectBySlug(
  slug: string
): Promise<(Project & { meta: ProjectMeta }) | null> {
  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\u200b/g, "");

  if (process.env.NODE_ENV !== "production") {
    console.log("[getProjectBySlug] lookup", normalizedSlug);
  }

  const [rows] = await pool.query<any[]>(
    `
      SELECT
        p.ID,
        p.post_title,
        p.post_excerpt,
        p.post_content,
        p.post_name,
        p.post_date,
        img.guid AS thumbnail_url
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
      LEFT JOIN wp_posts img ON img.ID = pm.meta_value
      WHERE p.post_type = 'project'
        AND p.post_status = 'publish'
        AND (
          p.post_name = ?
          OR LOWER(p.post_name) = LOWER(?)
          OR p.guid LIKE CONCAT('%/', ?, '/%')
          OR REPLACE(p.post_name, '–', '-') = REPLACE(?, '–', '-')
        )
      LIMIT 1
    `,
    [normalizedSlug, normalizedSlug, normalizedSlug, normalizedSlug]
  );

  if (!rows.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getProjectBySlug] no match for", normalizedSlug);
    }
    return null;
  }

  const project = rows[0] as any;

  const [categoryRows] = await pool.query<any[]>(
    `
      SELECT DISTINCT t.name
      FROM wp_term_relationships tr
      JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'project_category'
      JOIN wp_terms t ON t.term_id = tt.term_id
      WHERE tr.object_id = ?
    `,
    [project.ID]
  );

  const [serviceRows] = await pool.query<any[]>(
    `
      SELECT DISTINCT t.name
      FROM wp_term_relationships tr
      JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'service'
      JOIN wp_terms t ON t.term_id = tt.term_id
      WHERE tr.object_id = ?
    `,
    [project.ID]
  );

  const [metaRows] = await pool.query<any[]>(
    `
      SELECT meta_key, meta_value
      FROM wp_postmeta
      WHERE post_id = ?
        AND meta_key IN ('client','year','location','services')
    `,
    [project.ID]
  );

  const meta: ProjectMeta = {};
  for (const row of metaRows as any[]) {
    const key = row.meta_key as keyof ProjectMeta;
    if (key === "services") {
      meta.services = parseSerializedArray(row.meta_value as string);
    } else if (key === "client" || key === "year" || key === "location") {
      meta[key] = (row.meta_value as string) ?? "";
    }
  }

  const [galleryRows] = await pool.query<any[]>(
    `
      SELECT guid
      FROM wp_posts
      WHERE post_parent = ?
        AND post_type = 'attachment'
        AND post_mime_type LIKE 'image/%'
      ORDER BY menu_order, ID
      LIMIT 24
    `,
    [project.ID]
  );

  const gallery = (galleryRows as any[])
    .map((row) => row.guid as string)
    .filter(Boolean);

  return {
    ID: Number(project.ID),
    post_title: project.post_title,
    post_excerpt: project.post_excerpt,
    post_content: project.post_content,
    post_name: project.post_name,
    post_date: project.post_date,
    thumbnail_url: normalizeMediaUrl(project.thumbnail_url),
    categories: categoryRows.map((r) => r.name as string),
    services: serviceRows.map((r) => r.name as string),
    gallery: normalizeMediaArray(gallery),
    meta,
  };
}

export async function getAdjacentProjects(slug: string): Promise<{
  previous: AdjacentProject | null;
  next: AdjacentProject | null;
}> {
  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\u200b/g, "");

  const [currentRows] = await pool.query<any[]>(
    `
      SELECT post_date
      FROM wp_posts
      WHERE post_type = 'project'
        AND post_status = 'publish'
        AND post_name = ?
      LIMIT 1
    `,
    [normalizedSlug]
  );

  if (!currentRows.length) {
    return { previous: null, next: null };
  }

  const postDate = currentRows[0].post_date;

  const [prevRows] = await pool.query<any[]>(
    `
      SELECT post_name, post_title
      FROM wp_posts
      WHERE post_type = 'project'
        AND post_status = 'publish'
        AND post_date < ?
      ORDER BY post_date DESC
      LIMIT 1
    `,
    [postDate]
  );

  const [nextRows] = await pool.query<any[]>(
    `
      SELECT post_name, post_title
      FROM wp_posts
      WHERE post_type = 'project'
        AND post_status = 'publish'
        AND post_date > ?
      ORDER BY post_date ASC
      LIMIT 1
    `,
    [postDate]
  );

  return {
    previous: prevRows.length ? (prevRows[0] as AdjacentProject) : null,
    next: nextRows.length ? (nextRows[0] as AdjacentProject) : null,
  };
}

export async function getNewsCategories(): Promise<ProjectCategory[]> {
  const [rows] = await pool.query<any[]>(`
    SELECT
      t.term_id,
      t.name,
      t.slug,
      tt.count
    FROM wp_terms t
    JOIN wp_term_taxonomy tt ON tt.term_id = t.term_id
    WHERE tt.taxonomy = 'category'
    ORDER BY t.name ASC
  `);

  return rows.map((row) => ({
    term_id: Number(row.term_id),
    name: row.name as string,
    slug: row.slug as string,
    count: Number(row.count),
  }));
}

export async function getNewsPosts({
  categorySlug,
  search,
  limit = 12,
}: {
  categorySlug?: string;
  search?: string;
  limit?: number;
} = {}): Promise<NewsPost[]> {
  const params: any[] = [];
  let where = `p.post_type = 'post' AND p.post_status = 'publish'`;

  if (categorySlug) {
    where += ` AND cat.slug = ?`;
    params.push(categorySlug);
  }

  if (search) {
    where += ` AND (p.post_title LIKE ? OR p.post_excerpt LIKE ? OR p.post_content LIKE ?)`;
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  params.push(limit);

  const [rows] = await pool.query<any[]>(
    `
      SELECT
        p.ID,
        p.post_title,
        p.post_excerpt,
        p.post_content,
        p.post_name,
        p.post_date,
        img.guid AS thumbnail_url,
        GROUP_CONCAT(DISTINCT cat.name) AS categories,
        GROUP_CONCAT(DISTINCT tag.name) AS tags
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
      LEFT JOIN wp_posts img ON img.ID = pm.meta_value
      LEFT JOIN wp_term_relationships trc ON trc.object_id = p.ID
      LEFT JOIN wp_term_taxonomy ttc ON ttc.term_taxonomy_id = trc.term_taxonomy_id AND ttc.taxonomy = 'category'
      LEFT JOIN wp_terms cat ON cat.term_id = ttc.term_id
      LEFT JOIN wp_term_relationships trt ON trt.object_id = p.ID
      LEFT JOIN wp_term_taxonomy ttt ON ttt.term_taxonomy_id = trt.term_taxonomy_id AND ttt.taxonomy = 'post_tag'
      LEFT JOIN wp_terms tag ON tag.term_id = ttt.term_id
      WHERE ${where}
      GROUP BY p.ID
      ORDER BY p.post_date DESC
      LIMIT ?
    `,
    params
  );

  return (rows as any[]).map((row) => ({
    ID: Number(row.ID),
    post_title: row.post_title,
    post_excerpt: row.post_excerpt,
    post_content: row.post_content,
    post_name: row.post_name,
    post_date: row.post_date,
    post_type: "post",
    post_status: "publish",
    thumbnail_url: normalizeMediaUrl(row.thumbnail_url),
    categories: row.categories ? (row.categories as string).split(",") : [],
    tags: row.tags ? (row.tags as string).split(",") : [],
  }));
}

export async function getNewsBySlug(slug: string): Promise<NewsPost | null> {
  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\u200b/g, "");

  if (process.env.NODE_ENV !== "production") {
    console.log("[getNewsBySlug] lookup", normalizedSlug);
  }

  const [rows] = await pool.query<any[]>(
    `
      SELECT
        p.ID,
        p.post_title,
        p.post_excerpt,
        p.post_content,
        p.post_name,
        p.post_date,
        img.guid AS thumbnail_url
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
      LEFT JOIN wp_posts img ON img.ID = pm.meta_value
      WHERE p.post_type = 'post'
        AND p.post_status = 'publish'
        AND (
          p.post_name = ?
          OR LOWER(p.post_name) = LOWER(?)
          OR p.guid LIKE CONCAT('%/', ?, '/%')
        )
      LIMIT 1
    `,
    [normalizedSlug, normalizedSlug, normalizedSlug]
  );

  if (!rows.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getNewsBySlug] no match for", normalizedSlug);
    }
    return null;
  }

  const article = rows[0] as any;

  const [categoryRows] = await pool.query<any[]>(
    `
      SELECT DISTINCT t.name
      FROM wp_term_relationships tr
      JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'category'
      JOIN wp_terms t ON t.term_id = tt.term_id
      WHERE tr.object_id = ?
    `,
    [article.ID]
  );

  const [tagRows] = await pool.query<any[]>(
    `
      SELECT DISTINCT t.name
      FROM wp_term_relationships tr
      JOIN wp_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id AND tt.taxonomy = 'post_tag'
      JOIN wp_terms t ON t.term_id = tt.term_id
      WHERE tr.object_id = ?
    `,
    [article.ID]
  );

  const [galleryRows] = await pool.query<any[]>(
    `
      SELECT guid
      FROM wp_posts
      WHERE post_parent = ?
        AND post_type = 'attachment'
        AND post_mime_type LIKE 'image/%'
      ORDER BY menu_order, ID
      LIMIT 16
    `,
    [article.ID]
  );

  const gallery = (galleryRows as any[])
    .map((row) => row.guid as string)
    .filter(Boolean);

  return {
    ID: Number(article.ID),
    post_title: article.post_title,
    post_excerpt: article.post_excerpt,
    post_content: article.post_content,
    post_name: article.post_name,
    post_date: article.post_date,
    post_type: "post",
    post_status: "publish",
    thumbnail_url: normalizeMediaUrl(article.thumbnail_url),
    categories: categoryRows.map((r) => r.name as string),
    tags: tagRows.map((r) => r.name as string),
    gallery: normalizeMediaArray(gallery),
  };
}

export async function getAdjacentNews(slug: string): Promise<{
  previous: AdjacentNews | null;
  next: AdjacentNews | null;
}> {
  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\u200b/g, "");

  const [currentRows] = await pool.query<any[]>(
    `
      SELECT post_date
      FROM wp_posts
      WHERE post_type = 'post'
        AND post_status = 'publish'
        AND post_name = ?
      LIMIT 1
    `,
    [normalizedSlug]
  );

  if (!currentRows.length) {
    return { previous: null, next: null };
  }

  const postDate = currentRows[0].post_date;

  const [prevRows] = await pool.query<any[]>(
    `
      SELECT post_name, post_title
      FROM wp_posts
      WHERE post_type = 'post'
        AND post_status = 'publish'
        AND post_date < ?
      ORDER BY post_date DESC
      LIMIT 1
    `,
    [postDate]
  );

  const [nextRows] = await pool.query<any[]>(
    `
      SELECT post_name, post_title
      FROM wp_posts
      WHERE post_type = 'post'
        AND post_status = 'publish'
        AND post_date > ?
      ORDER BY post_date ASC
      LIMIT 1
    `,
    [postDate]
  );

  return {
    previous: prevRows.length ? (prevRows[0] as AdjacentNews) : null,
    next: nextRows.length ? (nextRows[0] as AdjacentNews) : null,
  };
}

export async function getCareerPosts({
  search,
  limit = 18,
}: {
  search?: string;
  limit?: number;
} = {}): Promise<CareerPost[]> {
  const { clause: typeClause, params: typeParams } = buildCareerTypeClause("p");
  const careerPageId = await getCareerPageId();

  const params: any[] = [];
  const sources: string[] = [];

  sources.push(`(${typeClause} AND p.post_status = 'publish')`);
  params.push(...typeParams);

  if (careerPageId) {
    sources.push(
      "(p.post_type = 'page' AND p.post_status = 'publish' AND p.post_parent = ? AND p.post_name <> 'internships')"
    );
    params.push(careerPageId);
  }

  let where = sources.length > 1 ? `(${sources.join(" OR ")})` : sources[0] || "p.post_status = 'publish'";

  if (search) {
    const like = `%${search}%`;
    where += ` AND (p.post_title LIKE ? OR p.post_excerpt LIKE ? OR p.post_content LIKE ?)`;
    params.push(like, like, like);
  }

  params.push(limit);

  const [rows] = await pool.query<any[]>(
    `
      SELECT
        p.ID,
        p.post_title,
        p.post_content,
        p.post_excerpt,
        p.post_name,
        p.post_date,
        p.post_type,
        p.post_status,
        img.guid AS thumbnail_url,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'location' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'job_location' THEN pm.meta_value END)
        ) AS location,
        COALESCE(
          MAX(CASE WHEN pm.meta_key IN ('employment_type','job_type','type') THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'employmentType' THEN pm.meta_value END)
        ) AS employment_type,
        MAX(CASE WHEN pm.meta_key IN ('department','team') THEN pm.meta_value END) AS department,
        COALESCE(
          MAX(CASE WHEN pm.meta_key IN ('closing_date','deadline','application_deadline') THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'closingDate' THEN pm.meta_value END)
        ) AS closing_date,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'job_description' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'description' THEN pm.meta_value END)
        ) AS job_description,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'responsibilities' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'duties' THEN pm.meta_value END)
        ) AS responsibilities,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'requirements' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'required_skills' THEN pm.meta_value END)
        ) AS requirements,
        MAX(CASE WHEN pm.meta_key IN ('qualifications','education') THEN pm.meta_value END) AS qualifications,
        MAX(CASE WHEN pm.meta_key IN ('benefits','perks') THEN pm.meta_value END) AS benefits
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID
      LEFT JOIN wp_postmeta thumb ON thumb.post_id = p.ID AND thumb.meta_key = '_thumbnail_id'
      LEFT JOIN wp_posts img ON img.ID = thumb.meta_value
      WHERE ${where}
      GROUP BY p.ID
      ORDER BY p.post_date DESC
      LIMIT ?
    `,
    params
  );

  return (rows as any[]).map((row) => ({
    ID: Number(row.ID),
    post_title: row.post_title,
    post_content: row.post_content,
    post_excerpt: row.post_excerpt,
    post_name: row.post_name,
    post_date: row.post_date,
    post_type: row.post_type,
    post_status: row.post_status,
    thumbnail_url: normalizeMediaUrl(row.thumbnail_url),
    location: row.location || null,
    employment_type: row.employment_type || null,
    department: row.department || null,
    closing_date: row.closing_date || null,
    job_description: row.job_description || null,
    responsibilities: row.responsibilities || null,
    requirements: row.requirements || null,
    qualifications: row.qualifications || null,
    benefits: row.benefits || null,
  }));
}

export async function getCareerBySlug(slug: string): Promise<CareerPost | null> {
  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\u200b/g, "");

  if (process.env.NODE_ENV !== "production") {
    console.log("[getCareerBySlug] lookup", normalizedSlug);
  }

  const { clause: typeClause, params: typeParams } = buildCareerTypeClause("p");
  const careerPageId = await getCareerPageId();
  const nameMatch =
    "(p.post_name = ? OR LOWER(p.post_name) = LOWER(?) OR p.guid LIKE CONCAT('%/', ?, '/%'))";
  const matchers: string[] = [`(${typeClause} AND ${nameMatch})`];
  const params: any[] = [...typeParams, normalizedSlug, normalizedSlug, normalizedSlug];

  if (careerPageId) {
    matchers.push(`(p.post_type = 'page' AND p.post_parent = ? AND ${nameMatch})`);
    params.push(careerPageId, normalizedSlug, normalizedSlug, normalizedSlug);
  }

  const [rows] = await pool.query<any[]>(
    `
      SELECT
        p.ID,
        p.post_title,
        p.post_content,
        p.post_excerpt,
        p.post_name,
        p.post_date,
        p.post_type,
        p.post_status,
        img.guid AS thumbnail_url,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'location' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'job_location' THEN pm.meta_value END)
        ) AS location,
        COALESCE(
          MAX(CASE WHEN pm.meta_key IN ('employment_type','job_type','type') THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'employmentType' THEN pm.meta_value END)
        ) AS employment_type,
        MAX(CASE WHEN pm.meta_key IN ('department','team') THEN pm.meta_value END) AS department,
        COALESCE(
          MAX(CASE WHEN pm.meta_key IN ('closing_date','deadline','application_deadline') THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'closingDate' THEN pm.meta_value END)
        ) AS closing_date,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'job_description' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'description' THEN pm.meta_value END)
        ) AS job_description,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'responsibilities' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'duties' THEN pm.meta_value END)
        ) AS responsibilities,
        COALESCE(
          MAX(CASE WHEN pm.meta_key = 'requirements' THEN pm.meta_value END),
          MAX(CASE WHEN pm.meta_key = 'required_skills' THEN pm.meta_value END)
        ) AS requirements,
        MAX(CASE WHEN pm.meta_key IN ('qualifications','education') THEN pm.meta_value END) AS qualifications,
        MAX(CASE WHEN pm.meta_key IN ('benefits','perks') THEN pm.meta_value END) AS benefits
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID
      LEFT JOIN wp_postmeta thumb ON thumb.post_id = p.ID AND thumb.meta_key = '_thumbnail_id'
      LEFT JOIN wp_posts img ON img.ID = thumb.meta_value
      WHERE p.post_status = 'publish'
        AND (${matchers.join(" OR ")})
      GROUP BY p.ID
      LIMIT 1
    `,
    params
  );

  if (!rows.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getCareerBySlug] no match for", normalizedSlug);
    }
    return null;
  }

  const role = rows[0] as any;

  return {
    ID: Number(role.ID),
    post_title: role.post_title,
    post_content: role.post_content,
    post_excerpt: role.post_excerpt,
    post_name: role.post_name,
    post_date: role.post_date,
    post_type: role.post_type,
    post_status: role.post_status,
    thumbnail_url: normalizeMediaUrl(role.thumbnail_url),
    location: role.location || null,
    employment_type: role.employment_type || null,
    department: role.department || null,
    closing_date: role.closing_date || null,
    job_description: role.job_description || null,
    responsibilities: role.responsibilities || null,
    requirements: role.requirements || null,
    qualifications: role.qualifications || null,
    benefits: role.benefits || null,
  };
}

export async function getAdjacentCareers(slug: string): Promise<{
  previous: AdjacentCareer | null;
  next: AdjacentCareer | null;
}> {
  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\u200b/g, "");

  const { clause: typeClause, params: typeParams } = buildCareerTypeClause("");
  const careerPageId = await getCareerPageId();

  const sourceClauses = [`(${typeClause})`];
  const baseParams: any[] = [...typeParams];

  if (careerPageId) {
    sourceClauses.push("(post_type = 'page' AND post_parent = ?)");
    baseParams.push(careerPageId);
  }

  const sourceFilter = sourceClauses.length > 1 ? `(${sourceClauses.join(" OR ")})` : sourceClauses[0];

  const [currentRows] = await pool.query<any[]>(
    `
      SELECT post_date
      FROM wp_posts
      WHERE ${sourceFilter}
        AND post_status = 'publish'
        AND post_name = ?
      LIMIT 1
    `,
    [...baseParams, normalizedSlug]
  );

  if (!currentRows.length) {
    return { previous: null, next: null };
  }

  const postDate = currentRows[0].post_date;

  const [prevRows] = await pool.query<any[]>(
    `
      SELECT post_name, post_title
      FROM wp_posts
      WHERE ${sourceFilter}
        AND post_status = 'publish'
        AND post_date < ?
      ORDER BY post_date DESC
      LIMIT 1
    `,
    [...baseParams, postDate]
  );

  const [nextRows] = await pool.query<any[]>(
    `
      SELECT post_name, post_title
      FROM wp_posts
      WHERE ${sourceFilter}
        AND post_status = 'publish'
        AND post_date > ?
      ORDER BY post_date ASC
      LIMIT 1
    `,
    [...baseParams, postDate]
  );

  return {
    previous: prevRows.length ? (prevRows[0] as AdjacentCareer) : null,
    next: nextRows.length ? (nextRows[0] as AdjacentCareer) : null,
  };
}

export async function getPageBySlug(slug: string): Promise<Post | null> {
  const normalizedSlug = decodeURIComponent(slug)
    .trim()
    .replace(/\/+$/, "")
    .replace(/\u200b/g, "");

  if (process.env.NODE_ENV !== "production") {
    console.log("[getPageBySlug] lookup", normalizedSlug);
  }

  const [rows] = await pool.query<any[]>(
    `
      SELECT
        p.ID,
        p.post_title,
        p.post_content,
        p.post_excerpt,
        p.post_name,
        p.post_date,
        img.guid AS thumbnail_url
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_thumbnail_id'
      LEFT JOIN wp_posts img ON img.ID = pm.meta_value
      WHERE p.post_type = 'page'
        AND p.post_status = 'publish'
        AND (
          p.post_name = ?
          OR LOWER(p.post_name) = LOWER(?)
          OR p.guid LIKE CONCAT('%/', ?, '/%')
        )
      LIMIT 1
    `,
    [normalizedSlug, normalizedSlug, normalizedSlug]
  );

  if (!rows.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[getPageBySlug] no match for", normalizedSlug);
    }
    return null;
  }

  const page = rows[0] as any;

  return {
    ID: Number(page.ID),
    post_title: page.post_title,
    post_excerpt: page.post_excerpt,
    post_content: page.post_content,
    post_name: page.post_name,
    post_date: page.post_date,
    post_type: "page",
    post_status: "publish",
    thumbnail_url: normalizeMediaUrl(page.thumbnail_url),
  };
}

export interface ClientLogo {
  name: string;
  url: string;
}

export async function getClientLogos(): Promise<ClientLogo[]> {
  const [rows] = await pool.query<any[]>(
    `
      SELECT guid, post_title
      FROM wp_posts
      WHERE post_type = 'attachment'
        AND post_mime_type LIKE 'image/%'
        AND guid LIKE '%/2025/09/%'
        AND (
          guid LIKE '%.png'
          OR guid LIKE '%.jpg'
          OR guid LIKE '%.svg'
        )
        AND guid NOT LIKE '%-[0-9]%x[0-9]%'
      ORDER BY post_title ASC
    `
  );

  return (rows as any[])
    .map((row) => ({
      name: row.post_title as string,
      url: normalizeMediaUrl(row.guid) || (row.guid as string),
    }))
    .filter((row) => Boolean(row.url));
}

export async function getGalleryImages(limit: number = 40): Promise<string[]> {
  const [rows] = await pool.query<any[]>(
    `
      SELECT guid
      FROM wp_posts
      WHERE post_type = 'attachment'
        AND post_mime_type LIKE 'image/%'
        AND guid IS NOT NULL
        AND guid != ''
      ORDER BY RAND()
      LIMIT ?
    `,
    [limit]
  );

  return normalizeMediaArray((rows as any[]).map((row) => row.guid as string));
}

export async function getAboutCarouselImages(): Promise<string[]> {
  try {
    const [rows] = await pool.query<any[]>(
      `
        SELECT guid
        FROM wp_posts
        WHERE post_type = 'attachment'
          AND post_mime_type LIKE 'image/%'
          AND guid LIKE '%/about_carousel/%'
          AND guid IS NOT NULL
          AND guid != ''
        ORDER BY post_title ASC
      `
    );

    const normalized = normalizeMediaArray((rows as any[]).map((row) => row.guid as string));
    if (normalized.length) return normalized;
  } catch (error) {
    console.error("[getAboutCarouselImages] DB lookup failed, using local files", error);
  }

  const local = await getLocalImages(path.join('uploads', 'about_carousel'));
  return local;
}
