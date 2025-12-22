import mysql from 'mysql2/promise';
import { resolveImageUrl } from './media';

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

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface MenuItem {
  id: number;
  menu_location: string;
  parent_id: number | null;
  title: string;
  url: string;
  target?: string;
  sort_order: number;
  status: 'active' | 'inactive';
}

export interface Project {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image?: string | null;
  client?: string;
  year?: string;
  location?: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  sectors?: string[];
  services?: string[];
  gallery?: string[];
}

export interface NewsPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image?: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  categories?: string[];
  tags?: string[];
  gallery?: string[];
}

export interface Career {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  location?: string;
  employment_type?: string;
  department?: string;
  closing_date?: string;
  job_description?: string;
  responsibilities?: string;
  requirements?: string;
  qualifications?: string;
  benefits?: string;
  status: 'draft' | 'published' | 'archived' | 'closed';
  published_at: string;
}

export interface Page {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image?: string | null;
  template?: string;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
}

export interface HeroSlide {
  id: number;
  title: string;
  description: string;
  image_url: string;
  link_url?: string;
  sort_order: number;
  status: 'draft' | 'published';
}

export interface Sector {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  count?: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface AdjacentProject {
  slug: string;
  title: string;
}

export interface AdjacentNews {
  slug: string;
  title: string;
}

export interface AdjacentCareer {
  slug: string;
  title: string;
}

// =====================================================
// MENU FUNCTIONS
// =====================================================

export async function getMenuItems(location: string = 'primary'): Promise<MenuItem[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT * FROM menu_items
     WHERE menu_location = ? AND status = 'active'
     ORDER BY sort_order`,
    [location]
  );
  return rows as MenuItem[];
}

// =====================================================
// PROJECT FUNCTIONS
// =====================================================

export async function getProjectSectors(): Promise<Sector[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT
       pc.*,
       COUNT(ps.project_id) as count
     FROM sectors pc
     LEFT JOIN project_sectors ps ON pc.id = ps.sector_id
     LEFT JOIN projects p ON p.id = ps.project_id AND p.status = 'published'
     GROUP BY pc.id
     ORDER BY pc.sort_order, pc.name`
  );
  return rows as Sector[];
}

export async function getProjectServices(): Promise<Service[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT
       s.*,
       COUNT(ps.project_id) as count
     FROM services s
     LEFT JOIN project_services ps ON s.id = ps.service_id
     LEFT JOIN projects p ON p.id = ps.project_id AND p.status = 'published'
     GROUP BY s.id
     ORDER BY s.sort_order, s.name`
  );
  return rows as Service[];
}

export async function getProjects({
  sectorSlug,
  serviceSlug,
  search,
  limit = 24,
}: {
  sectorSlug?: string;
  serviceSlug?: string;
  search?: string;
  limit?: number;
} = {}): Promise<Project[]> {
  let query = `
    SELECT DISTINCT
      p.*,
      GROUP_CONCAT(DISTINCT pc.name ORDER BY pc.name SEPARATOR ', ') AS sectors,
      GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS services
    FROM projects p
    LEFT JOIN project_sectors pse ON p.id = pse.project_id
    LEFT JOIN sectors pc ON pc.id = pse.sector_id
    LEFT JOIN project_services ps ON p.id = ps.project_id
    LEFT JOIN services s ON s.id = ps.service_id
    WHERE p.status = 'published'
  `;

  const params: any[] = [];

  if (sectorSlug) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_sectors ps2
      JOIN sectors pc2 ON pc2.id = ps2.sector_id
      WHERE ps2.project_id = p.id AND pc2.slug = ?
    )`;
    params.push(sectorSlug);
  }

  if (serviceSlug) {
    query += ` AND EXISTS (
      SELECT 1 FROM project_services ps2
      JOIN services s2 ON s2.id = ps2.service_id
      WHERE ps2.project_id = p.id AND s2.slug = ?
    )`;
    params.push(serviceSlug);
  }

  if (search) {
    query += ` AND MATCH(p.title, p.excerpt, p.content) AGAINST (? IN NATURAL LANGUAGE MODE)`;
    params.push(search);
  }

  query += ` GROUP BY p.id ORDER BY p.published_at DESC LIMIT ?`;
  params.push(limit);

  const [rows] = await pool.query<any[]>(query, params);

  return rows.map((row) => ({
    ...row,
    featured_image: resolveImageUrl(row.featured_image),
    sectors: row.sectors ? row.sectors.split(', ') : [],
    services: row.services ? row.services.split(', ') : [],
  }));
}

export async function getProjectBySlug(slug: string): Promise<(Project & { gallery: string[] }) | null> {
  const [rows] = await pool.query<any[]>(
    `SELECT p.*,
      GROUP_CONCAT(DISTINCT pc.name ORDER BY pc.name SEPARATOR ', ') AS sectors,
      GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') AS services
     FROM projects p
     LEFT JOIN project_sectors pse ON p.id = pse.project_id
     LEFT JOIN sectors pc ON pc.id = pse.sector_id
     LEFT JOIN project_services ps ON p.id = ps.project_id
     LEFT JOIN services s ON s.id = ps.service_id
     WHERE p.slug = ? AND p.status = 'published'
     GROUP BY p.id
     LIMIT 1`,
    [slug]
  );

  if (!rows.length) return null;

  const project = rows[0];

  // Get gallery images
  const [galleryRows] = await pool.query<any[]>(
    `SELECT df.id as directus_id, m.filepath
     FROM project_gallery pg
     LEFT JOIN directus_files df ON df.id = pg.media_id
     LEFT JOIN media m ON m.id = pg.media_id_legacy
     WHERE pg.project_id = ?
     ORDER BY pg.sort_order`,
    [project.id]
  );

  return {
    ...project,
    featured_image: resolveImageUrl(project.featured_image),
    sectors: project.sectors ? project.sectors.split(', ') : [],
    services: project.services ? project.services.split(', ') : [],
    gallery: galleryRows
      .map((row) => resolveImageUrl(row.directus_id || row.filepath))
      .filter(Boolean) as string[],
  };
}

export async function getAdjacentProjects(slug: string): Promise<{
  previous: AdjacentProject | null;
  next: AdjacentProject | null;
}> {
  const [current] = await pool.query<any[]>(
    `SELECT published_at FROM projects WHERE slug = ? AND status = 'published'`,
    [slug]
  );

  if (!current.length) return { previous: null, next: null };

  const [prev] = await pool.query<any[]>(
    `SELECT slug, title FROM projects
     WHERE status = 'published' AND published_at < ?
     ORDER BY published_at DESC LIMIT 1`,
    [current[0].published_at]
  );

  const [next] = await pool.query<any[]>(
    `SELECT slug, title FROM projects
     WHERE status = 'published' AND published_at > ?
     ORDER BY published_at ASC LIMIT 1`,
    [current[0].published_at]
  );

  return {
    previous: prev.length ? prev[0] : null,
    next: next.length ? next[0] : null,
  };
}

// =====================================================
// NEWS FUNCTIONS
// =====================================================

export async function getNewsCategories(): Promise<NewsCategory[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT
       nc.*,
       COUNT(nnc.news_id) as count
     FROM news_categories nc
     LEFT JOIN news_news_categories nnc ON nc.id = nnc.category_id
     LEFT JOIN news n ON n.id = nnc.news_id AND n.status = 'published'
     GROUP BY nc.id
     ORDER BY nc.sort_order, nc.name`
  );
  return rows as NewsCategory[];
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
  let query = `
    SELECT DISTINCT
      n.*,
      GROUP_CONCAT(DISTINCT nc.name ORDER BY nc.name SEPARATOR ', ') AS categories,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', ') AS tags
    FROM news n
    LEFT JOIN news_news_categories nnc ON n.id = nnc.news_id
    LEFT JOIN news_categories nc ON nc.id = nnc.category_id
    LEFT JOIN news_tags nt ON n.id = nt.news_id
    LEFT JOIN tags t ON t.id = nt.tag_id
    WHERE n.status = 'published'
  `;

  const params: any[] = [];

  if (categorySlug) {
    query += ` AND EXISTS (
      SELECT 1 FROM news_news_categories nnc2
      JOIN news_categories nc2 ON nc2.id = nnc2.category_id
      WHERE nnc2.news_id = n.id AND nc2.slug = ?
    )`;
    params.push(categorySlug);
  }

  if (search) {
    query += ` AND MATCH(n.title, n.excerpt, n.content) AGAINST (? IN NATURAL LANGUAGE MODE)`;
    params.push(search);
  }

  query += ` GROUP BY n.id ORDER BY n.published_at DESC LIMIT ?`;
  params.push(limit);

  const [rows] = await pool.query<any[]>(query, params);

  return rows.map((row) => ({
    ...row,
    featured_image: resolveImageUrl(row.featured_image),
    categories: row.categories ? row.categories.split(', ') : [],
    tags: row.tags ? row.tags.split(', ') : [],
  }));
}

export async function getNewsBySlug(slug: string): Promise<(NewsPost & { gallery: string[] }) | null> {
  const [rows] = await pool.query<any[]>(
    `SELECT n.*,
      GROUP_CONCAT(DISTINCT nc.name ORDER BY nc.name SEPARATOR ', ') AS categories,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ', ') AS tags
     FROM news n
     LEFT JOIN news_news_categories nnc ON n.id = nnc.news_id
     LEFT JOIN news_categories nc ON nc.id = nnc.category_id
     LEFT JOIN news_tags nt ON n.id = nt.news_id
     LEFT JOIN tags t ON t.id = nt.tag_id
     WHERE n.slug = ? AND n.status = 'published'
     GROUP BY n.id
     LIMIT 1`,
    [slug]
  );

  if (!rows.length) return null;

  const news = rows[0];

  const [galleryRows] = await pool.query<any[]>(
    `SELECT df.id as directus_id, m.filepath
     FROM news_gallery ng
     LEFT JOIN directus_files df ON df.id = ng.media_id
     LEFT JOIN media m ON m.id = ng.media_id
     WHERE ng.news_id = ?
     ORDER BY ng.sort_order`,
    [news.id]
  );

  return {
    ...news,
    featured_image: resolveImageUrl(news.featured_image),
    categories: news.categories ? news.categories.split(', ') : [],
    tags: news.tags ? news.tags.split(', ') : [],
    gallery: galleryRows
      .map((row) => resolveImageUrl(row.directus_id || row.filepath))
      .filter(Boolean) as string[],
  };
}

export async function getAdjacentNews(slug: string): Promise<{
  previous: AdjacentNews | null;
  next: AdjacentNews | null;
}> {
  const [current] = await pool.query<any[]>(
    `SELECT published_at FROM news WHERE slug = ? AND status = 'published'`,
    [slug]
  );

  if (!current.length) return { previous: null, next: null };

  const [prev] = await pool.query<any[]>(
    `SELECT slug, title FROM news
     WHERE status = 'published' AND published_at < ?
     ORDER BY published_at DESC LIMIT 1`,
    [current[0].published_at]
  );

  const [next] = await pool.query<any[]>(
    `SELECT slug, title FROM news
     WHERE status = 'published' AND published_at > ?
     ORDER BY published_at ASC LIMIT 1`,
    [current[0].published_at]
  );

  return {
    previous: prev.length ? prev[0] : null,
    next: next.length ? next[0] : null,
  };
}

// =====================================================
// CAREER FUNCTIONS
// =====================================================

export async function getCareerPosts({
  search,
  limit = 30,
}: {
  search?: string;
  limit?: number;
} = {}): Promise<Career[]> {
  let query = `SELECT * FROM careers WHERE status = 'published'`;
  const params: any[] = [];

  if (search) {
    query += ` AND MATCH(title, excerpt, content, job_description) AGAINST (? IN NATURAL LANGUAGE MODE)`;
    params.push(search);
  }

  query += ` ORDER BY published_at DESC LIMIT ?`;
  params.push(limit);

  const [rows] = await pool.query<any[]>(query, params);
  return rows as Career[];
}

export async function getCareerBySlug(slug: string): Promise<Career | null> {
  const [rows] = await pool.query<any[]>(
    `SELECT * FROM careers WHERE slug = ? AND status = 'published' LIMIT 1`,
    [slug]
  );
  return rows.length ? (rows[0] as Career) : null;
}

export async function getAdjacentCareers(slug: string): Promise<{
  previous: AdjacentCareer | null;
  next: AdjacentCareer | null;
}> {
  const [current] = await pool.query<any[]>(
    `SELECT published_at FROM careers WHERE slug = ? AND status = 'published'`,
    [slug]
  );

  if (!current.length) return { previous: null, next: null };

  const [prev] = await pool.query<any[]>(
    `SELECT slug, title FROM careers
     WHERE status = 'published' AND published_at < ?
     ORDER BY published_at DESC LIMIT 1`,
    [current[0].published_at]
  );

  const [next] = await pool.query<any[]>(
    `SELECT slug, title FROM careers
     WHERE status = 'published' AND published_at > ?
     ORDER BY published_at ASC LIMIT 1`,
    [current[0].published_at]
  );

  return {
    previous: prev.length ? prev[0] : null,
    next: next.length ? next[0] : null,
  };
}

// Deprecated - kept for backwards compatibility during migration
export async function getCareerPageId(): Promise<number | null> {
  // This function is no longer needed with the new schema
  // Careers are now a standalone table, not child pages
  return null;
}

// =====================================================
// PAGE FUNCTIONS
// =====================================================

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const [rows] = await pool.query<any[]>(
    `SELECT * FROM pages WHERE slug = ? AND status = 'published' LIMIT 1`,
    [slug]
  );
  if (!rows.length) return null;
  return {
    ...(rows[0] as Page),
    featured_image: resolveImageUrl(rows[0].featured_image),
  };
}

// =====================================================
// HERO SLIDES
// =====================================================

export async function getHeroSlides(sliderAlias?: string): Promise<HeroSlide[]> {
  // sliderAlias parameter kept for backwards compatibility but ignored in new schema
  const [rows] = await pool.query<any[]>(
    `SELECT * FROM hero_slides WHERE status = 'published' ORDER BY sort_order`
  );
  return rows.map((row) => ({
    ...row,
    image_url: resolveImageUrl(row.image_url) || row.image_url,
  })) as HeroSlide[];
}

// =====================================================
// MEDIA FUNCTIONS
// =====================================================

export async function getClientLogos(): Promise<{ name: string; url: string }[]> {
  const folderId = process.env.DIRECTUS_CLIENT_LOGOS_FOLDER_ID;

  if (folderId) {
    const [rows] = await pool.query<any[]>(
      `SELECT id, title, filename_download
       FROM directus_files
       WHERE folder = ?
       ORDER BY title`,
      [folderId]
    );

    return rows
      .map((row) => ({
        name: row.title || row.filename_download || "Client logo",
        url: resolveImageUrl(row.id) || "",
      }))
      .filter((row) => row.url);
  }

  const [rows] = await pool.query<any[]>(
    `SELECT title as name, filepath as url
     FROM media
     WHERE filepath LIKE '%/2025/09/%'
       AND (filepath LIKE '%.png' OR filepath LIKE '%.jpg' OR filepath LIKE '%.svg')
     ORDER BY title`
  );
  return rows as { name: string; url: string }[];
}

export async function getAboutCarouselImages(): Promise<string[]> {
  const folderId = process.env.DIRECTUS_ABOUT_CAROUSEL_FOLDER_ID;

  if (folderId) {
    const [rows] = await pool.query<any[]>(
      `SELECT id
       FROM directus_files
       WHERE folder = ?
       ORDER BY title`,
      [folderId]
    );
    return rows
      .map((row) => resolveImageUrl(row.id))
      .filter(Boolean) as string[];
  }

  const [rows] = await pool.query<any[]>(
    `SELECT filepath FROM media
     WHERE filepath LIKE '%/about_carousel/%'
     ORDER BY title`
  );
  return rows.map((row: any) => row.filepath);
}

export async function getGalleryImages(limit: number = 40): Promise<string[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT filepath FROM media
     ORDER BY RAND()
     LIMIT ?`,
    [limit]
  );
  return rows.map((row: any) => row.filepath);
}

// =====================================================
// GENERIC POST FETCHING (Backwards Compatibility)
// =====================================================

// Legacy function for backwards compatibility
export async function getPosts(postType: string, limit: number = 10): Promise<any[]> {
  // Map old post types to new tables
  switch (postType) {
    case 'post':
      return getNewsPosts({ limit });
    case 'project':
      return getProjects({ limit });
    case 'career':
    case 'careers':
      return getCareerPosts({ limit });
    default:
      return [];
  }
}
