import Image from "next/image";
import Link from "next/link";
import { getProjects } from "@/lib/directus";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  return text.slice(0, length).trimEnd() + "...";
}

function formatProjectStatus(project: {
  year?: string | null;
  completed_year?: string | null;
}) {
  const rawStatus = (project.year || "").trim().toLowerCase();
  const completedYear = project.completed_year?.trim();
  const yearIsNumeric = /^\d{4}$/.test(project.year?.trim() || "");

  if (rawStatus === "ongoing") return "Ongoing";
  if (rawStatus === "completed") {
    return completedYear ? `Completed ${completedYear}` : "Completed";
  }
  if (yearIsNumeric) return `Completed ${project.year}`;
  return project.year ? project.year : "Ongoing";
}

export default async function LatestProjectsSection() {
  const projects = await getProjects({ limit: 4 });

  return (
    <section className="container mx-auto px-4 py-12 md:py-16 bg-white">
        <div className="space-y-5 md:space-y-6">
          <div className="max-w-4xl space-y-2">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 font-roboto">
              Latest Projects
            </h2>
            <p className="text-sm md:text-base text-gray-700 leading-relaxed max-w-3xl font-roboto">
              Explore recent work across our sectors, highlighting the outcomes
              and impact we deliver.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
          {projects.map((project, idx) => {
            const slug = project.slug || String(project.id);
            const href = typeof slug === "string" ? `/projects/${slug}` : "#";
            const excerpt =
              project.excerpt && project.excerpt.trim().length > 0
                ? stripHtml(project.excerpt)
                : truncate(stripHtml(project.content || ""), 140);
            const sectorsText = (project.sectors || [])
              .map((c) => c.sector_id?.name)
              .filter(Boolean)
              .join(", ");
            const servicesText = (project.services || [])
              .map((s) => s.service_id?.name)
              .filter(Boolean)
              .join(", ");
            const statusText = formatProjectStatus(project);
            const clientText = project.client || "Client";
            const categoryText = sectorsText || servicesText || "Project";
            const metaLine = [clientText, statusText]
              .filter(Boolean)
              .join(" • ");
            const thumb = project.featured_image || fallbackImg;

            return (
              <article
                key={project.id ?? idx}
                className="widget-card group border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white flex flex-col"
              >
                <div className="relative w-full overflow-hidden h-[6.6rem] md:h-[7.7rem]">
                  <Image
                    src={thumb}
                    alt={project.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="p-3 space-y-1.5 flex-shrink-0">
                  <h6 className="widget-meta tracking-widest text-primary uppercase">
                    {metaLine}
                  </h6>
                  <Link href={href} className="block">
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
                      {project.title}
                    </h3>
                  </Link>
                  <p className="widget-category italic text-gray-600">{categoryText}</p>
                  {/* <p className="text-gray-700 line-clamp-2">
                    {excerpt}
                  </p> */}
                </div>
                <div className="px-3 pb-3 flex-shrink-0">
                  <Link
                    href={href}
                    className="inline-flex items-center text-primary font-semibold hover:text-primary/80 transition-colors"
                  >
                    Read More
                  </Link>
                </div>
              </article>
            );
          })}
          </div>
        </div>
    </section>
  );
}
