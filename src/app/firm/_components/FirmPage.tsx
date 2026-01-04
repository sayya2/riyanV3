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

  const showArticle = !hideContent || (lead && hideHero);

  return (
    <main className="min-h-screen bg-white">
      {!hideHero ? (
        <PageHero
          title={title}
          eyebrow={eyebrow}
          description={heroDescription}
          imageUrl={heroImage}
          heightClass={heroHeight}
        />
      ) : null}

      <section className={`${contentShell} py-12 space-y-10`}>
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
          <div className="pt-10 max-w-6xl w-full">{children}</div>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-4 text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={`/firm/${link.path}`}
              className="inline-flex items-center object-contain rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
