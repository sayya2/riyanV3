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
      heroDescriptionOverride="Grow with a multidisciplinary team delivering resilient, high-performance projects across the Maldives."
      heroHeightClass="min-h-[100vh] "
      hideContent
      childrenWrapperClassName="max-w-none"
    >
      {/* Intro */}
      <section className={`${contentShell} pt-2 pb-4`}>
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-10 items-start">
          <Reveal>
            <div className="space-y- ">
              {/* <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
                Life at Riyan
              </p> */}
              <h2 className="text-3xl md:text-5xl font-semibold text-gray-900">
                Where project diversity meets a supportive culture
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                We provide career development opportunities through our
                comprehensive in-house learning and development initiatives.
                Offering exposure to a wide range of projects in the built
                environment, we ensure our staff gain diverse knowledge and
                experience. With a flat hierarchy and a welcoming atmosphere, we
                cultivate a friendly work environment.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 w-full mx-auto sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 items-stretch">
            {[
              {
                label: "Project diversity",
                value: "Buildings, resorts, infrastructure, research",
                icon: Briefcase,
              },
              {
                label: "Culture",
                value: "Flat hierarchy, mentorship, learning",
                icon: CalendarClock,
              },
              { label: "Location", value: "Male, Maldives", icon: MapPin },
              {
                label: "Balance",
                value: "Flexible, people-first environment",
                icon: CalendarClock,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.label} delay={index * 0.05}>
                  <div className="flex h-full items-start gap-4 border border-gray-200 bg-gray-50 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center  bg-[#781213] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug min-h-[2.5rem] line-clamp-2">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>



      {/* Job Cards */}
      <section className={`${contentShell} py-12 md:py-20`}>
        <Reveal>
          <div className="flex flex-col gap-4 mb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
                Opportunities
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold text-gray-900">
                Open roles
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              {roles.length
                ? `${roles.length} position${
                    roles.length > 1 ? "s" : ""
                  } available`
                : "No active listings"}
            </p>
          </div>
        </Reveal>

        {roles.length ? (
          <div className="flex gap-6 overflow-x-auto pb-2 snap-x snap-mandatory items-stretch">
            {roles.map((role, index) => {
              const href = role.slug ? `/firm/career/${role.slug}` : "#";
              const cleanedContent = sanitizeContent(role.content || "");
              const excerpt =
                role.excerpt && role.excerpt.trim().length > 0
                  ? stripHtml(sanitizeContent(role.excerpt))
                  : stripHtml(cleanedContent).slice(0, 140);
              const deadline = formatDate(
                role.closing_date,
                "Open until filled"
              );

              return (
                <Reveal
                  key={role.id}
                  delay={index * 0.05}
                  className="h-full self-stretch snap-start flex-none w-[260px] sm:w-[300px] md:w-[330px] lg:w-[330px]"
                >
                  <div className="group flex h-[280px] sm:h-[300px] md:h-[320px] flex-col border border-gray-200 bg-gray-50 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="flex flex-1 flex-col space-y-3">
                      <div className="min-h-[18px]">
                        {role.closing_date ? (
                          <span className="text-xs font-semibold text-gray-700">
                            Deadline: {deadline}
                          </span>
                        ) : (
                          <span
                            aria-hidden="true"
                            className="text-xs font-semibold text-gray-700 opacity-0"
                          >
                            Deadline: placeholder
                          </span>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3 min-h-[110px] md:min-h-[120px]">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                            {role.department || "Role"}
                          </p>
                          <h2 className="text-base !text-2xl text-primary font-semibold text-gray-900 line-clamp-2 min-h-[44px]">
                            {role.title}
                          </h2>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 sm:line-clamp-3 min-h-[40px] sm:min-h-[52px]">
                            {excerpt}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      </div>

                      <div className="min-h-[32px]">
                        <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-gray-200">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {role.location || "Maldives"}
                          </span>
                          {role.employment_type ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 border border-gray-200">
                              <Briefcase className="h-3.5 w-3.5 text-primary" />
                              {role.employment_type}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                      <Link
                        href={href}
                        className="mt-auto inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 transition-all duration-200 hover:bg-[#5f0e0f] hover:-translate-y-0.5"
                      >
                        View details
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <Reveal>
            <div className=" border border-gray-200 bg-gray-50 p-8 text-gray-700">
              <p className="font-semibold text-gray-900 text-lg mb-2">
                No current openings
              </p>
              <p>
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
      </section>

      {/* Early Careers CTA */}
      <section className={`${contentShell} pb-12 md:pb-16`}>
        <Reveal>
          <div className="border border-gray-200 bg-gray-50 p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
                Early careers
              </p>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
                Starting out? Explore internships and entry roles.
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                We welcome graduates and students ready to learn through real
                projects, guided by experienced mentors.
              </p>
            </div>
            <Link
              href="/firm/career/internships"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 transition-all duration-200 hover:bg-[#5f0e0f] hover:-translate-y-0.5"
            >
              Explore internships
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
      </section>
    </FirmPageBySlug>
  );
}
