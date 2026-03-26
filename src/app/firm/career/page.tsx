import Link from "next/link";
import { getCareerPosts } from "@/lib/directus";
import { FirmPageBySlug } from "../_components/FirmPage";
import { ArrowRight, Briefcase, CalendarClock, MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeContent = (input: string) =>
  input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

const formatDate = (
  value?: string | null,
  fallback: string = "Not specified"
) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return value;
};

export const dynamic = "force-dynamic";

export default async function CareerPage() {
  const roles = await getCareerPosts({ limit: 30 });
  const contentShell = "w-full mx-auto px-[2%] md:px-[0%]";

  return (
    <FirmPageBySlug
      slug="career"
      currentPath="career"
      titleOverride="Careers at Riyan"
      heroEyebrow="Join our team"
      heroDescriptionOverride="We provide career development opportunities through our comprehensive in-house learning and development initiatives. Offering exposure to a wide range of projects in the built environment, we ensure our staff gain diverse knowledge and experience. With a flat hierarchy and a welcoming atmosphere, we cultivate a friendly work environment."
      heroSectionClassName="mt-0 flex items-center bg-gray-50 bg-primary/5 min-h-[40vh]"
      hideContent
      childrenWrapperClassName="max-w-none "
      textOnlyHero={true}
    >
      {/* Job Cards & Early Careers */}
      <section className={`${contentShell} pb-8`}>
        <div className="grid lg:grid-cols-[1fr,320px] gap-6 lg:gap-8 items-start">
          <div>
            <Reveal>
              <div className="flex flex-col gap-2 mb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.15em] text-primary font-semibold">
                    Opportunities
                  </p>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-900">
                    Open roles
                  </h2>
                </div>
                <p className="text-[0.7rem] text-gray-600">
                  {roles.length
                    ? `${roles.length} position${
                        roles.length > 1 ? "s" : ""
                      } available`
                    : "No active listings"}
                </p>
              </div>
            </Reveal>

            {roles.length ? (
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory items-stretch">
                {roles.map((role, index) => {
                  const href = role.slug ? `/firm/career/${role.slug}` : "#";
                  const jobId = role.job_id?.trim() || `ID ${role.id}`;
                  const cleanedContent = sanitizeContent(role.content || "");
                  const excerpt =
                    role.excerpt && role.excerpt.trim().length > 0
                      ? stripHtml(sanitizeContent(role.excerpt))
                      : stripHtml(cleanedContent).slice(0, 100);
                  const deadline = formatDate(
                    role.closing_date,
                    "Open until filled"
                  );

                  return (
                    <Reveal
                      key={role.id}
                      delay={index * 0.05}
                      className="h-full self-stretch snap-start flex-none w-[240px] sm:w-[260px] md:w-[280px]"
                    >
                      <div className="group flex min-h-[280px] sm:min-h-[300px] md:min-h-[320px] flex-col border border-gray-200 bg-gray-50 p-4 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                        <div className="flex flex-1 flex-col space-y-2">
                          <div className="min-h-[14px]">
                            {role.closing_date ? (
                              <span className="text-[0.65rem] font-semibold text-gray-700">
                                Deadline: {deadline}
                              </span>
                            ) : (
                              <span
                                aria-hidden="true"
                                className="text-[0.65rem] font-semibold text-gray-700 opacity-0"
                              >
                                Deadline: placeholder
                              </span>
                            )}
                          </div>

                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1 min-w-0">
                              <p className="text-[0.65rem] uppercase tracking-wider text-gray-500 font-semibold">
                                {role.department || "Role"}
                              </p>
                              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-primary font-semibold">
                                {jobId}
                              </p>
                              <h2 className="project-card-title text-primary font-semibold text-gray-900 line-clamp-2">
                                {role.title}
                              </h2>
                              <p className="text-[0.7rem] text-gray-600 leading-relaxed line-clamp-2">
                                {excerpt}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-primary opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 flex-shrink-0" />
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 border border-gray-200">
                              <MapPin className="h-3 w-3 text-primary" />
                              <span className="text-[0.65rem]">{role.location || "Maldives"}</span>
                            </span>
                            {role.employment_type ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 border border-gray-200">
                                <Briefcase className="h-3 w-3 text-primary" />
                                <span className="text-[0.65rem]">{role.employment_type}</span>
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <Link
                          href={href}
                          className="mt-4 inline-flex items-center justify-center gap-2 bg-primary text-white text-[0.7rem] font-semibold px-4 py-2 transition-all duration-200 hover:bg-[#5f0e0f] hover:-translate-y-0.5"
                        >
                          View details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            ) : (
              <Reveal>
                <div className="border border-gray-200 bg-gray-50 p-6 text-gray-700">
                  <p className="font-semibold text-gray-900 text-base mb-2">
                    No current openings
                  </p>
                  <p className="text-sm">
                    We&apos;re always interested in meeting talented people. Check
                    back soon or{" "}
                    <Link
                      href="/firm/contact"
                      className="text-red-800 font-semibold hover:underline"
                    >
                      reach out to our team
                    </Link>
                    .
                  </p>
                </div>
              </Reveal>
            )}
          </div>

          {/* Early Careers Sidebar */}
          {/* <Reveal delay={0.1}>
            <div className="border border-primary/20 bg-primary/5 p-4 rounded-lg sticky top-24">
              <p className="text-[0.65rem] uppercase tracking-wider text-primary font-semibold mb-1.5">
                Early careers
              </p>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
                Starting out? Explore internships and entry roles.
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed mb-3">
                We welcome graduates and students ready to learn through real
                projects, guided by experienced mentors.
              </p>
              <Link
                href="/firm/career/internships"
                className="inline-flex items-center justify-center gap-2 bg-primary text-white text-xs font-semibold px-4 py-2 transition-all duration-200 hover:bg-[#5f0e0f] w-full"
              >
                Explore internships
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Reveal> */}
        </div>
      </section>
    </FirmPageBySlug>
  );
}
