import Image from "next/image";
import Link from "next/link";
import { getProjects } from "@/lib/directus";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

function formatProjectStatus(project: {
  year?: string | null;
  completed_year?: string | null;
}) {
  const rawStatus = (project.year || "").trim().toLowerCase();
  const yearIsNumeric = /^\d{4}$/.test(project.year?.trim() || "");

  if (rawStatus === "ongoing") return "Ongoing";
  if (rawStatus === "completed") return "Completed";
  if (yearIsNumeric) return "Completed";
  return project.year ? project.year : "Ongoing";
}

export default async function LatestProjectsSection() {
  const projects = await getProjects({ limit: 4 });

  return (
    <section className="container mx-auto px-4 py-12 md:py-16 bg-white">
        <div className="space-y-8 md:space-y-10">
          <div className="max-w-4xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 font-roboto">
              Latest Projects
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {projects.map((project, idx) => {
            const slug = project.slug || String(project.id);
            const href = typeof slug === "string" ? `/projects/${slug}` : "#";
            const sectorsText = (project.sectors || [])
              .map((c) => c.sector_id?.name)
              .filter(Boolean)[0];
            const servicesText = (project.services || [])
              .map((s) => s.service_id?.name)
              .filter(Boolean)[0];
            const categoryText = sectorsText || servicesText || "Project";
            const clientText = project.client || "";
            const statusText = formatProjectStatus(project);
            const thumb = project.featured_image || fallbackImg;

            return (
              <Link
                key={project.id ?? idx}
                href={href}
                className="group flex flex-col "
              >
                <div className="relative w-full overflow-hidden aspect-[4/3]">
                  <Image
                    src={thumb}
                    alt={project.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="pt-5 space-y-2.5 px-2">
                  <h3 className="text-lg! md:text-xl font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {project.title}
                  </h3>
                  <div className="space-y-1">
                    {clientText && (
                      <p className="text-xs md:text-sm font-medium text-gray-800">
                        {clientText}
                      </p>
                    )}
                    <p className="text-xs md:text-sm text-primary font-medium">
                      {statusText}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500 italic">
                      {categoryText}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        </div>
    </section>
  );
}
