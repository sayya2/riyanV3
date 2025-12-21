import Link from "next/link";
import { getCareerPosts } from "@/lib/directus";
import { FirmPageBySlug } from "../_components/FirmPage";
import { ArrowRight, Briefcase, CalendarClock, MapPin } from "lucide-react";

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
  const contentShell = "w-full mx-auto px-[6%]";

  return (
    <FirmPageBySlug
      slug="career"
      currentPath="career"
      titleOverride="Careers at Riyan"
      heroEyebrow="Join our team"
      heroDescriptionOverride="Grow with a multidisciplinary team delivering resilient, high-performance projects across the Maldives."
      heroHeightClass="min-h-[80vh] "
      hideContent
    >
      {/* Intro */}
      <section className={`${contentShell} py-12 md:py-16`}>
        <div className="grid lg:grid-cols-[1.4fr,1fr] gap-10 items-start">
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold">
              Life at Riyan
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">
              Where project diversity meets a supportive culture
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              We provide career development opportunities through comprehensive learning and development initiatives.
              Exposure to a wide range of projects ensures our team gains diverse knowledge and experience, while a
              flat hierarchy and welcoming atmosphere foster collaboration and growth.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                label: "Project diversity",
                value: "Buildings, resorts, infrastructure, research",
                icon: Briefcase,
              },
              { label: "Culture", value: "Flat hierarchy, mentorship, learning", icon: CalendarClock },
              { label: "Location", value: "Male, Maldives", icon: MapPin },
              { label: "Balance", value: "Flexible, people-first environment", icon: CalendarClock },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-md hover:shadow-xl transition-shadow duration-300"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">{item.value}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Job Cards */}
      <section className={`${contentShell} pb-16 space-y-8`}>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-2xl font-semibold text-gray-900">Open roles</h3>
          <p className="text-sm text-gray-600">
            {roles.length
              ? `${roles.length} position${
                  roles.length > 1 ? "s" : ""
                } available`
              : "No active listings"}
          </p>
        </div>

        {roles.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
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
                <div
                  key={role.id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md hover:shadow-xl transition-shadow duration-300"
                  style={{
                    clipPath:
                      "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
                  }}
                >
                  <div className="p-6 space-y-4">
                    {role.closing_date && (
                      <div className="inline-block">
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded inline-block">
                          Deadline: {deadline}
                        </span>
                      </div>
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {role.location || "Maldives"}
                      </span>
                      {role.employment_type ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1">
                          <Briefcase className="h-3.5 w-3.5 text-primary" />
                          {role.employment_type}
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={href}
                      className="inline-flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#5f0e0f] transition-colors duration-200"
                    >
                      View details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-gray-700 shadow-sm">
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
        )}
      </section>
    </FirmPageBySlug>
  );
}
