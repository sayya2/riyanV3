import HeroSliderClient from "./hero-slider-client";
import { getHeroSlides, type DirectusHeroSlide } from "@/lib/directus";
import type { HeroSlide } from "@/lib/db-new";
import { resolveImageUrl } from "@/lib/media";

const fallbackImage = "/wp-content/uploads/2022/06/hd-1800x900-1.png";

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (input: string, limit = 160) =>
  input.length > limit ? `${input.slice(0, limit - 3)}...` : input;

const heroSlideToSlide = (slide: DirectusHeroSlide, index: number): HeroSlide | null => {
  const project =
    slide.project_id && typeof slide.project_id === "object" ? slide.project_id : null;

  const rawDescription = project
    ? project.excerpt?.trim() || project.content?.trim() || slide.description?.trim() || ""
    : slide.description?.trim() || "";
  const description = rawDescription ? truncate(stripHtml(rawDescription)) : "";

  const title = project?.title?.trim() || slide.title?.trim() || "Project";
  const image =
    resolveImageUrl(project?.featured_image) ||
    resolveImageUrl(slide.image_url) ||
    fallbackImage;
  const link = project?.slug ? `/projects/${project.slug}` : slide.link_url || "";

  if (!title && !image) return null;

  return {
    id: slide.id,
    title,
    description,
    image_url: image,
    link_url: link,
    sort_order: Number.isFinite(slide.sort_order) ? slide.sort_order : index,
    status: "published",
  };
};

const Hero = async () => {
  let slides: HeroSlide[] = [];

  try {
    const heroSlides = await getHeroSlides();
    slides = heroSlides
      .map(heroSlideToSlide)
      .filter((slide): slide is HeroSlide => slide !== null);
  } catch (error) {
    console.error("Failed to load hero slides:", error);
  }

  return <HeroSliderClient slides={slides} />;
};

export default Hero;
