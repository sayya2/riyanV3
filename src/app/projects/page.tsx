import {
  getProjectSectors,
  getProjectServices,
  getProjects,
} from "@/lib/directus";
import FiltersBar from "@/components/FiltersBar";
import Reveal from "@/components/Reveal";
import ProjectsInfiniteGrid from "@/components/ProjectsInfiniteGrid";
import ScrollToTopButton from "@/components/ScrollToTopButton";

const contentShell = "w-full mx-auto px-[6%] md:px-[138px]";

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
      <div className={`${contentShell} py-16 space-y-10 mt-17`}>
        <Reveal>
          <div className="flex flex-col gap-1">
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

        <ProjectsInfiniteGrid
          initialProjects={projects}
          limit={limit}
          sector={selectedSector || undefined}
          service={service || undefined}
          search={search || undefined}
        />
      </div>
      <ScrollToTopButton />
    </main>
  );
}
