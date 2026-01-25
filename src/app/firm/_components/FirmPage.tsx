import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/db-new";
import PageHero from "@/components/PageHero";
import { resolveImageUrl } from "@/lib/media";

const fallbackImg = "/images/about-hero.png";
const contentShell = "w-full mx-auto px-[6%] md:px-[138px]";

export const firmPages = [
  { path: "about", slug: "about", label: "About" },
  { path: "career", slug: "career", label: "Career" },
  { path: "career/internships", slug: "internships", label: "Internships" },
  { path: "contact", slug: "contact", label: "Contact" },
];

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

export async function FirmPageBySlug({
  slug,
  currentPath,
  titleOverride,
  children,
  hideContent = false,
  hideHero = false,
  heroImageOverride,
  heroDescriptionOverride,
  heroHeightClass,
  heroEyebrow,
  heroSectionClassName,
  contentShellClassName,
  contentSectionClassName,
  childrenWrapperClassName,
  textOnlyHero = false,
}: {
  slug: string;
  currentPath: string;
  titleOverride?: string;
  children?: ReactNode;
  hideContent?: boolean;
  hideHero?: boolean;
  heroImageOverride?: string;
  heroDescriptionOverride?: string;
  heroHeightClass?: string;
  heroEyebrow?: string;
  heroSectionClassName?: string;
  contentShellClassName?: string;
  contentSectionClassName?: string;
  childrenWrapperClassName?: string;
  textOnlyHero?: boolean;
}) {
  const page = await getPageBySlug(slug);

  if (!page) {
    return notFound();
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[FirmPage] page", {
      id: page.id,
      slug: page.slug,
      title: page.title,
    });
  }

  const img = resolveImageUrl(page.featured_image) || fallbackImg;
  const lead =
    page.excerpt && page.excerpt.trim().length > 0
      ? stripHtml(page.excerpt)
      : "";
  const title = titleOverride || page.title;

  const navLinks = firmPages.filter((link) => link.path !== currentPath);
  const heroImage = resolveImageUrl(heroImageOverride) || img;
  const heroDescription = heroDescriptionOverride || lead;
  const eyebrow = heroEyebrow || "Firm";
  const heroHeight = heroHeightClass || "min-h-[60vh] md:min-h-[80vh]";
  const heroSectionBase = "pt-8 pb-6 md:pt-12 md:pb-8 lg:pt-16 lg:pb-10";
  const shellClassName = contentShellClassName || contentShell;

  const showArticle = !hideContent || (lead && hideHero);

  return (
    <main className="min-h-screen bg-white">
      {/* <div className="firm-sub-nav flex flex-wrap gap-10 justify-end   px-[20px] sm:px-[20px] md:px-[30px] lg:px-[134px] items-center text-[0.85rem]  h-[10vh] ">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            href={`/firm/${link.path}`}
            className="inline-flex  text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div> */}
      {textOnlyHero ? (
        <section
          className={`${shellClassName} ${heroSectionBase} ${
            heroSectionClassName || ""
          }`}
        >
          <div className="space-y-3">
            {eyebrow ? (
              <p className="text-xs uppercase tracking-[0.35em] text-primary font-semibold ">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-gray-900 max-w-4xl -ml-1 leading-tight">
              {title}
            </h1>
            {heroDescription ? (
              <p className="text-lg text-gray-700 md:max-w-3xl leading-relaxed -ml-1">
                {heroDescription}
              </p>
            ) : null}
          </div>
        </section>
      ) : !hideHero ? (
        <PageHero
          title={title}
          eyebrow={eyebrow}
          description={heroDescription}
          imageUrl={heroImage}
          heightClass={heroHeight}
          sectionClassName={heroSectionClassName}
        />
      ) : null}

      <section
        className={`${shellClassName} py-12 space-y-10 ${
          contentSectionClassName || ""
        }`}
      >
        {showArticle ? (
          <article className="space-y-6 max-w-5xl">
            {lead && hideHero ? (
              <p className="text-lg text-gray-700 leading-relaxed">{lead}</p>
            ) : null}
            {!hideContent ? (
              <div
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: page.content || "" }}
              />
            ) : null}
          </article>
        ) : null}

        {children ? (
          <div
            className={`pt-0 max-w-6xl w-full ${
              childrenWrapperClassName || ""
            }`}
          >
            {children}
          </div>
        ) : null}
      </section>
    </main>
  );
}
