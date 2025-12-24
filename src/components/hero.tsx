import HeroSliderClient from "./hero-slider-client";
import pool, { type HeroSlide } from "@/lib/db-new";
import { resolveImageUrl } from "@/lib/media";

const fallbackImage = "/wp-content/uploads/2022/06/hd-1800x900-1.png";

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (input: string, limit = 160) =>
  input.length > limit ? `${input.slice(0, limit - 3)}...` : input;

type ProjectRow = {
  id: number;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
};

const projectToSlide = (project: ProjectRow, index: number): HeroSlide => {
  const rawDescription =
    project.excerpt?.trim() || project.content?.trim() || "";
  const description = rawDescription ? truncate(stripHtml(rawDescription)) : "";

  return {
    id: project.id,
    title: project.title || "Project",
    description,
    image_url: resolveImageUrl(project.featured_image) || fallbackImage,
    link_url: project.slug ? `/projects/${project.slug}` : "",
    sort_order: index,
    status: "published",
  };
};

const getRecentProjects = async (limit = 7): Promise<ProjectRow[]> => {
  const [rows] = await pool.query<any[]>(
    `SELECT id, slug, title, excerpt, content, featured_image
     FROM projects
     WHERE status = 'published'
     ORDER BY published_at DESC, id DESC
     LIMIT ?`,
    [limit]
  );

  return rows as ProjectRow[];
};

const Hero = async () => {
  let slides: HeroSlide[] = [];

  try {
    const projects = await getRecentProjects(7);
    slides = projects.map(projectToSlide);
  } catch (error) {
    console.error("Failed to load hero projects:", error);
  }

  return <HeroSliderClient slides={slides} />;
};

export default Hero;
