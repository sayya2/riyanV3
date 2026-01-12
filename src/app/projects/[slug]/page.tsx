import React from "react";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import {
  Building2,
  CalendarClock,
  MapPin,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getAdjacentProjects, getProjectBySlug } from "@/lib/directus";
import { resolveFileUrl } from "@/lib/media";
import Reveal from "@/components/Reveal";
import ProjectGalleryCarousel from "@/components/ProjectGalleryCarousel";
import ProjectAdjacentNav from "@/components/ProjectAdjacentNav";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

const contentShell = "w-full  px-[6%] md:px-[138px] lg:px-[138px]";

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const formatProjectStatus = (project: {
  year?: string | null;
  completed_year?: string | null;
}) => {
  const rawStatus = (project.year || "").trim().toLowerCase();
  const completedYear = project.completed_year?.trim();
  const yearIsNumeric = /^\d{4}$/.test(project.year?.trim() || "");

  if (rawStatus === "ongoing") return "Ongoing";
  if (rawStatus === "completed") {
    return completedYear ? `Completed ${completedYear}` : "Completed";
  }
  if (yearIsNumeric) return `Completed ${project.year}`;
  return project.year ? project.year : "Ongoing";
};

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams =
    params && typeof (params as Promise<any>).then === "function"
      ? await (params as Promise<{ slug: string }>)
      : (params as { slug: string });

  const slug = resolvedParams?.slug;

  if (!slug) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Project not found.</p>
      </main>
    );
  }

  const project = await getProjectBySlug(slug);
  const adjacent = await getAdjacentProjects(slug);

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Project not found.</p>
      </main>
    );
  }

  const sectors = (project.sectors || [])
    .map((c) => c.sector_id?.name)
    .filter(Boolean) as string[];
  const services = (project.services || [])
    .map((s) => s.service_id?.name)
    .filter(Boolean) as string[];
  const gallery = (project.gallery || [])
    .map((g) => resolveFileUrl(g.media_id))
    .filter(Boolean) as string[];
  const sectorsText = sectors.join(", ");
  const servicesText = services.join(", ");
  const img = project.featured_image || fallbackImg;
  const statusText = formatProjectStatus(project);
  const stats = [
    { label: "Client", value: project.client || "Not specified" },
    { label: "Status", value: statusText || "Not specified" },
    { label: "Location", value: project.location || "Not specified" },
  ];
  const lead =
    project.excerpt && project.excerpt.trim().length > 0
      ? stripHtml(project.excerpt)
      : "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareUrl = `${siteUrl}/projects/${slug}`;
  const shareText = project.title;
  const statIcons: Record<string, React.ReactElement> = {
    Client: <Building2 className="h-5 w-5" />,
    Status: <CalendarClock className="h-5 w-5" />,
    Location: <MapPin className="h-5 w-5" />,
  };
  const shareLinks = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareText)}`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M18.9 3H22l-7.2 8.2L22.6 21H16l-4.7-6-5.3 6H2l7.7-8.7L1.7 3H8l4.2 5.5L18.9 3Z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        >
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
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        >
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
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.2 8.5V20H2V8.5h3.2ZM3.6 4c-1 0-1.9.9-1.9 1.9 0 1 .9 1.8 1.9 1.8 1 0 1.8-.8 1.8-1.8C5.5 4.9 4.6 4 3.6 4ZM21 20v-6.3c0-3.1-1.7-4.5-4-4.5-1.8 0-2.6 1-3 1.7V8.5H11c0 .7 0 11.5 0 11.5h3V13c0-.4 0-.8.2-1 .4-.8 1.2-1.6 2.3-1.6 1.5 0 2.1 1.2 2.1 2.8V20H21Z" />
        </svg>
      ),
    },
  ];
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

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        title={project.title}
        eyebrow={sectorsText || servicesText || "Project"}
        // description={lead}
        imageUrl={img}
        heightClass="min-h-[100vh] md:min-h-[100vh]"
      />

      <ProjectAdjacentNav
        prev={
          adjacent.previous
            ? {
                slug: adjacent.previous.slug,
                title: adjacent.previous.title,
                image: prevImage,
                eyebrow: "Project",
              }
            : null
        }
        next={
          adjacent.next
            ? {
                slug: adjacent.next.slug,
                title: adjacent.next.title,
                image: nextImage,
                eyebrow: "Project",
              }
            : null
        }
        targetId="project-content"
      />

      <section
        id="project-content"
        className={`${contentShell} py-12 space-y-10`}
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-10 items-start">
          <article className="space-y-6">
            <Reveal>
              <div
                className="rich-content text-gray-800 space-y-4"
                dangerouslySetInnerHTML={{ __html: project.content || "" }}
              />
            </Reveal>
            {gallery && gallery.length ? (
              <Reveal>
                <div className="pt-6">
                  <ProjectGalleryCarousel
                    images={gallery}
                    title={project.title}
                  />
                </div>
              </Reveal>
            ) : null}
          </article>

          <aside className="space-y-6 w-full lg:max-w-[300px] lg:justify-self-end">
            <Reveal>
              <div className="border border-gray-200/70 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold">
                  Project details
                </p>
                <div className="mt-4 space-y-4">
                  {stats.map((item) => (
                    <div key={item.label} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-9 w-9 items-center justify-center bg-primary/10 text-primary">
                        {statIcons[item.label] || (
                          <Building2 className="h-5 w-5" />
                        )}
                      </span>
                      <div className="space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {(sectors.length > 0 || services.length > 0) && (
              <Reveal>
                <div className="border border-gray-200/70 bg-white p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold">
                    Sectors &amp; services
                  </p>
                  <div className="mt-4 space-y-4">
                    {sectors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
                          Sectors
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {sectors.map((sector) => (
                            <span
                              key={`sector-${sector}`}
                              className="text-[11px] px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200"
                            >
                              {sector}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {services.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-semibold">
                          Services
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {services.map((svc) => (
                            <span
                              key={`svc-${svc}`}
                              className="text-[11px] px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            )}
            <Reveal>
              <div className="border border-gray-200  bg-white p-5 shadow-sm space-y-5 ">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-gray-500 font-semibold">
                      Share this project
                    </p>
                    <p className="text-[0.8rem] text-gray-600">
                      Send the story to your team.
                    </p>
                  </div>

                  <div className="flex items-center gap-4  bg-white  py-2">
                    {shareLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-800 hover:bg-gray-100 transition-colors"
                        aria-label={`Share on ${link.label}`}
                      >
                        {link.icon}
                      </a>
                    ))}
                  </div>
                </div>

                {(adjacent.previous || adjacent.next) && (
                  <div className="space-y-6 pt-1 md:hidden -mb-5">
                    {adjacent.previous ? (
                      <Link
                        href={`/projects/${adjacent.previous.slug}`}
                        className="block w-[calc(100%+2.5rem)] -mx-5 bg-white shadow-sm overflow-hidden"
                      >
                        <div className="relative w-full aspect-[16/9] bg-gray-100">
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
                        href={`/projects/${adjacent.next.slug}`}
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
