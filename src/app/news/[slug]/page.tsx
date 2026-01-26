import Link from "next/link";
import PageHero from "@/components/PageHero";
import { ChevronLeft, ChevronRight, Share2 } from "lucide-react";
import { getAdjacentNews, getNewsBySlug } from "@/lib/directus";
import { resolveFileUrl } from "@/lib/media";
import Reveal from "@/components/Reveal";
import ProjectGalleryCarousel from "@/components/ProjectGalleryCarousel";
import ProjectAdjacentNav from "@/components/ProjectAdjacentNav";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

const contentShell = "w-full mx-auto px-[var(--gutter-phi-2)]";

export default async function NewsDetailPage({ params }: PageProps) {
  const resolvedParams =
    params && typeof (params as Promise<any>).then === "function"
      ? await (params as Promise<{ slug: string }>)
      : (params as { slug: string });

  const slug = resolvedParams?.slug;

  if (!slug) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Article not found.</p>
      </main>
    );
  }

  const article = await getNewsBySlug(slug);
  const adjacent = await getAdjacentNews(slug);

  if (!article) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Article not found.</p>
      </main>
    );
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("[NewsDetail] article", {
      id: article.id,
      slug: article.slug,
      title: article.title,
      categoriesRaw: article.categories,
      tagsRaw: article.tags,
      galleryRaw: article.gallery,
    });
    console.log("[NewsDetail] adjacent", adjacent);
  }

  const categories = (article.categories || [])
    .map(c => c.category_id?.name)
    .filter(Boolean) as string[];
  const tags = (article.tags || [])
    .map(t => t.tag_id?.name)
    .filter(Boolean) as string[];
  const gallery = (article.gallery || [])
    .map(g => resolveFileUrl(g.media_id))
    .filter(Boolean) as string[];
  const img = article.featured_image || fallbackImg;
  const categoriesText = categories.join(", ");
  const lead = article.excerpt ? stripHtml(article.excerpt) : "";
  const publishedDate = article.published_at ? new Date(article.published_at) : null;
  const published =
    publishedDate && !isNaN(publishedDate.getTime())
      ? publishedDate.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Not specified";

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareUrl = `${siteUrl}/news/${slug}`;
  const shareText = article.title;
  const prevImage =
    (adjacent.previous?.featured_image &&
      (resolveFileUrl(adjacent.previous.featured_image) ||
        adjacent.previous.featured_image)) ||
    "";
  const nextImage =
    (adjacent.next?.featured_image &&
      (resolveFileUrl(adjacent.next.featured_image) ||
        adjacent.next.featured_image)) ||
    "";
  const shareLinks = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M18.9 3H22l-7.2 8.2L22.6 21H16l-4.7-6-5.3 6H2l7.7-8.7L1.7 3H8l4.2 5.5L18.9 3Z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M13 10h2.8l.2-3H13V5.4c0-.9.3-1.4 1.5-1.4H16V1h-2.6C10.4 1 9 2.6 9 5.1V7H6v3h3v9h4v-9Z" />
        </svg>
      ),
    },
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
        shareUrl
      )}&description=${encodeURIComponent(shareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M12.2 3C7.4 3 5 6.2 5 9.4c0 1.6.9 3.6 2.5 4.2.2.1.3 0 .3-.2l.5-1.9c0-.1 0-.2-.1-.3-.6-.8-.3-2.4.9-2.4 1.5 0 1.4 2.1.3 2.8-.2.1-.3.3-.2.5.2.8.5 2.2.6 2.5.1.5.4.6.6.4.3-.4.9-1.2 1.1-1.8.1-.3.5-1.7.5-1.7.3.6 1.2 1 2.1 1 2.8 0 4.7-2.4 4.7-5.3C18.8 6 16 3 12.2 3Z" />
        </svg>
      ),
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        shareUrl
      )}&title=${encodeURIComponent(shareText)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M5.2 8.5V20H2V8.5h3.2ZM3.6 4c-1 0-1.9.9-1.9 1.9 0 1 .9 1.8 1.9 1.8 1 0 1.8-.8 1.8-1.8C5.5 4.9 4.6 4 3.6 4ZM21 20v-6.3c0-3.1-1.7-4.5-4-4.5-1.8 0-2.6 1-3 1.7V8.5H11c0 .7 0 11.5 0 11.5h3V13c0-.4 0-.8.2-1 .4-.8 1.2-1.6 2.3-1.6 1.5 0 2.1 1.2 2.1 2.8V20H21Z" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        title={article.title}
        eyebrow={categoriesText || "News"}
        description={lead || published}
        imageUrl={img}
        heightClass="min-h-[100vh] md:min-h-[100vh]"
        contentAlignment="bottom"
        contentClassName={contentShell}
      />

      <ProjectAdjacentNav
        prev={
          adjacent.previous
            ? {
                slug: adjacent.previous.slug,
                title: adjacent.previous.title,
                image: prevImage,
                eyebrow: "News",
              }
            : null
        }
        next={
          adjacent.next
            ? {
                slug: adjacent.next.slug,
                title: adjacent.next.title,
                image: nextImage,
                eyebrow: "News",
              }
            : null
        }
        targetId="news-content"
        basePath="news"
      />

      <section id="news-content" className={`${contentShell} py-12 space-y-10`}>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
          <article className="space-y-6">
            {/* {lead ? (
              <Reveal>
                <p className="text-lg text-gray-700 leading-relaxed w-full text-ellipsis ">{lead}</p>
              </Reveal>
            ) : null} */}
            <Reveal>
              <div
                className="prose prose-lg max-w-none text-gray-800"
                dangerouslySetInnerHTML={{ __html: article.content || "" }}
              />
            </Reveal>
            {tags.length ? (
              <Reveal>
                <div className="flex flex-wrap gap-2 pt-4">
                  {tags.map((tag) => (
                    <span
                      key={`tag-${tag}`}
                      className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {gallery && gallery.length ? (
              <Reveal>
                <div className="pt-6 ">
                  <ProjectGalleryCarousel
                    images={gallery}
                    title={article.title}
                  />
                </div>
              </Reveal>
            ) : null}
          </article>

          <aside className="space-y-6 w-full md:max-w-[100px] lg:max-w-[300px] lg:justify-self-end">
            <Reveal>
              <div className="bg-white shadow-md p-5 space-y-3">
                {/* <h3 className="!text-xl font-semibold text-gray-900">Details</h3> */}
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="space-y-2 ">
                    <p className="!text-sm uppercase tracking-[0.2em] text-gray-500">Published</p>
                    <p className="!text-xs font-semibold text-gray-900">{published}</p>
                  </div>
                  {categories.length ? (
                    <div>
                      <p className="!text-sm uppercase tracking-[0.2em] text-gray-500">Categories</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {categories.map((cat) => (
                          <span
                            key={`cat-${cat}`}
                            className="!text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Reveal>

            <Reveal>
              <div className="bg-white p-5 shadow-md space-y-5">
                <div className="space-y-3">
                  {/* <p className="!text-sm uppercase tracking-[0.25em] text-gray-500 font-semibold">
                    Share this article
                  </p> */}
                  <p className="!text-sm text-gray-600">
                    Send the story to your team.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white py-2">
                  {shareLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center shadow-sm text-gray-800 hover:bg-gray-100 transition-colors"
                      aria-label={`Share on ${link.label}`}
                    >
                      {link.icon}
                    </a>
                  ))}
                </div>

                {(adjacent.previous || adjacent.next) && (
                  <div className="space-y-6 pt-1 md:hidden -mb-5">
                    {adjacent.previous ? (
                      <Link
                        href={`/news/${adjacent.previous.slug}`}
                        className="block w-[calc(100%+2.5rem)] -mx-5 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="relative w-full aspect-auto bg-gray-100">
                          {prevImage ? (
                            <img
                              src={prevImage}
                              alt={adjacent.previous.title}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-3 text-white">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">
                                Previous
                              </p>
                              <p className="text-sm font-semibold leading-snug line-clamp-2">
                                {adjacent.previous.title}
                              </p>
                            </div>
                            <ChevronLeft className="h-4 w-4 text-white/80" />
                          </div>
                        </div>
                      </Link>
                    ) : null}

                    {adjacent.next ? (
                      <Link
                        href={`/news/${adjacent.next.slug}`}
                        className="block w-[calc(100%+2.5rem)] -mx-5 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="relative w-full aspect-[16/9] bg-gray-100">
                          {nextImage ? (
                            <img
                              src={nextImage}
                              alt={adjacent.next.title}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-3 text-white">
                            <div>
                              <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">
                                Next
                              </p>
                              <p className="text-sm font-semibold leading-snug line-clamp-2">
                                {adjacent.next.title}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-white/80" />
                          </div>
                        </div>
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </main>
  );
}
