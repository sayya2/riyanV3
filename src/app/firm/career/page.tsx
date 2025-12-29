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
  const contentShell = "w-full mx-auto px-[11%] md:px-[10%]";

  return (
    <FirmPageBySlug
      slug="career"
      currentPath="career"
      titleOverride="Careers at Riyan"
      heroEyebrow="Join our team"
      heroDescriptionOverride="Grow with a multidisciplinary team delivering resilient, high-performance projects across the Maldives."
      heroHeightClass="min-h-[100vh] "
      hideContent
    >
      {/* Intro */}
      <section className={`${contentShell} py-4 md:py-0`}>
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-10 items-start">
          <Reveal>
            <div className="space-y-6">
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
                Life at Riyan
              </p>
              <h2 className="text-3xl md:text-5xl font-semibold text-gray-900">
                Where project diversity meets a supportive culture
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed">
                We provide career development opportunities through comprehensive learning and development initiatives.
                Exposure to a wide range of projects ensures our team gains diverse knowledge and experience, while a
                flat hierarchy and welcoming atmosphere foster collaboration and growth.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Project diversity",
                value: "Buildings, resorts, infrastructure, research",
                icon: Briefcase,
              },
              { label: "Culture", value: "Flat hierarchy, mentorship, learning", icon: CalendarClock },
              { label: "Location", value: "Male, Maldives", icon: MapPin },
              { label: "Balance", value: "Flexible, people-first environment", icon: CalendarClock },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <Reveal key={item.label} delay={index * 0.05}>
                  <div className="flex items-start gap-4 rounded-lg border border-gray-200 bg-gray-50 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#781213] text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
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
              <h3 className="text-3xl md:text-5xl font-semibold text-gray-900">
                Open roles
              </h3>
            </div>
            <p className="text-sm text-gray-600">
              {roles.length
                ? `${roles.length} position${roles.length > 1 ? "s" : ""} available`
                : "No active listings"}
            </p>
          </div>
        </Reveal>

        {roles.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role, index) => {
              const href = role.slug
                ? `/firm/career/${role.slug}`
                : "#";
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
                <Reveal key={role.id} delay={index * 0.05}>
                  <div className="group flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
                    <div className="space-y-4">
                      {role.closing_date && (
                        <span className="text-xs font-semibold text-gray-700 bg-white px-4 py-2 rounded inline-block border border-gray-200">
                          Deadline: {deadline}
                        </span>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                            {role.department || "Role"}
                          </p>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {role.title}
                          </h2>
                          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                            {excerpt}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      </div>

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

                    <Link
                      href={href}
                      className="mt-6 inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg transition-all duration-200 hover:bg-[#5f0e0f] hover:-translate-y-0.5"
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-gray-700">
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
    </FirmPageBySlug>
  );
}
