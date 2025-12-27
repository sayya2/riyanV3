import Link from "next/link";
import Image from "next/image";
import {
  getProjectSectors,
  getProjectServices,
  getProjects,
} from "@/lib/directus";
import FiltersBar from "@/components/FiltersBar";
import Reveal from "@/components/Reveal";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

const contentShell = "w-full mx-auto px-[10%]";

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const resolvedParams =
    searchParams && typeof (searchParams as Promise<any>).then === "function"
      ? await (searchParams as Promise<
          Record<string, string | string[] | undefined>
        >)
      : ((searchParams || {}) as Record<string, string | string[] | undefined>);

  const sector =
    typeof resolvedParams?.sector === "string" ? resolvedParams.sector : "";
  const legacyCategory =
    typeof resolvedParams?.category === "string" ? resolvedParams.category : "";
  const selectedSector = sector || legacyCategory;
  const service =
    typeof resolvedParams?.service === "string" ? resolvedParams.service : "";
  const search = typeof resolvedParams?.q === "string" ? resolvedParams.q : "";
  const perPage =
    typeof resolvedParams?.perPage === "string"
      ? Number(resolvedParams.perPage)
      : 24;
  const limit = [20, 40, 60, 100].includes(perPage) ? perPage : 24;

  const [sectors, services, projects] = await Promise.all([
    getProjectSectors(),
    getProjectServices(),
    getProjects({
      sectorSlug: selectedSector || undefined,
      serviceSlug: service || undefined,
      search: search || undefined,
      limit,
    }),
  ]);

  if (process.env.NODE_ENV !== "production") {
    console.log("[ProjectsPage] filters", {
      sector: selectedSector,
      service,
      search,
      limit,
    });
    console.log(
      "[ProjectsPage] projects sample",
      projects.slice(0, 3).map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        sectors: p.sectors,
        services: p.services,
      })),
      "total",
      projects.length
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className={`${contentShell} py-16 space-y-10 mt-30`}>
        <Reveal>
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900">
                Projects
              </h1>
              <p className="text-gray-700 mt-2 max-w-2xl">
                Explore completed and ongoing work across buildings, resorts, infrastructure, and planning.
              </p>
            </div>
            <FiltersBar
              sectors={sectors}
              services={services}
              selectedSector={selectedSector}
              selectedService={service}
              search={search}
              perPage={limit}
            />
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-8">
          {projects.map((project, index) => {
            const href = project.slug ? `/projects/${project.slug}` : "#";
            const sectorsText = (project.sectors || [])
              .map((c) => c.sector_id?.name)
              .filter(Boolean)
              .join(", ");
            const servicesText = (project.services || [])
              .map((s) => s.service_id?.name)
              .filter(Boolean)
              .join(", ");
            const excerpt =
              project.excerpt && project.excerpt.trim().length > 0
                ? stripHtml(project.excerpt)
                : stripHtml(project.content || "").slice(0, 140);
            const img = project.featured_image || fallbackImg;

            return (
              <Reveal key={project.id} delay={index * 0.05}>
                <Link
                  href={href}
                  className="group relative block overflow-hidden rounded-xl h-72 md:h-80 bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <Image
                    src={img}
                    alt={project.title}
                    fill
                    sizes="(min-width:1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-5 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">
                      {sectorsText || servicesText || "Project"}
                    </p>
                    <h3 className="project-card-title font-semibold text-white drop-shadow-sm">
                      {project.title}
                    </h3>
                    <p className="hidden sm:block text-sm text-white/80 leading-relaxed md:line-clamp-2">
                      {excerpt}
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </main>
  );
}
