import Link from "next/link";
import { getAdjacentCareers, getCareerBySlug } from "@/lib/directus";
import { parseCareerSections } from "@/lib/parseCareerSections";

const sanitizeContent = (input: string) =>
  input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

const stripHtml = (input: string) =>
  input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

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

type PageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export default async function CareerDetailPage({ params }: PageProps) {
  const resolvedParams =
    params && typeof (params as Promise<any>).then === "function"
      ? await (params as Promise<{ slug: string }>)
      : (params as { slug: string });

  const slug = resolvedParams?.slug;

  if (!slug) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Position not found.</p>
      </main>
    );
  }

  const [role, adjacent] = await Promise.all([
    getCareerBySlug(slug),
    getAdjacentCareers(slug),
  ]);

  if (!role) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Position not found.</p>
      </main>
    );
  }

  const lead = role.excerpt ? stripHtml(role.excerpt) : "";
  const posted = formatDate(role.published_at);
  const closing = formatDate(role.closing_date, "Open until filled");

  const parsedSections = parseCareerSections(role.content || "");

  const jobDescription = role.job_description || parsedSections.description;
  const responsibilities =
    role.responsibilities || parsedSections.responsibilities;
  const requirements = role.requirements || parsedSections.requirements;
  const qualifications = role.qualifications || parsedSections.qualifications;
  const benefits = role.benefits || parsedSections.benefits;

  const safeContent = sanitizeContent(role.content || "");

  const hasMetaFields = !!(
    jobDescription ||
    responsibilities ||
    requirements ||
    qualifications ||
    benefits
  );

  const structuredSections = [
    jobDescription && {
      key: "description",
      heading: "Job Description",
      content: sanitizeContent(jobDescription),
    },
    responsibilities && {
      key: "responsibilities",
      heading: "Responsibilities",
      content: sanitizeContent(responsibilities),
    },
    requirements && {
      key: "requirements",
      heading: "Requirements",
      content: sanitizeContent(requirements),
    },
    qualifications && {
      key: "qualifications",
      heading: "Qualifications",
      content: sanitizeContent(qualifications),
    },
    benefits && {
      key: "benefits",
      heading: "Benefits",
      content: sanitizeContent(benefits),
    },
  ].filter(Boolean) as Array<{
    key: string;
    heading: string;
    content: string;
  }>;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const shareUrl = `${siteUrl}/firm/career/${slug}`;
  const shareText = role.title;

  const shareLinks = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        shareUrl
      )}&text=${encodeURIComponent(shareText)}`,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
    },
    {
      label: "Pinterest",
      href: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
        shareUrl
      )}&description=${encodeURIComponent(shareText)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        shareUrl
      )}&title=${encodeURIComponent(shareText)}`,
    },
  ];

  const metaItems = [
    { label: "Location", value: role.location || "Not specified" },
    { label: "Type", value: role.employment_type || "Not specified" },
    { label: "Department", value: role.department || "Not specified" },
    { label: "Posted", value: posted },
    { label: "Application deadline", value: closing },
  ];

  return (
    <main className="min-h-screen bg-white ml-[10%] mr-[10%] pt-26">
      <section className="container mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6 pt-6">
          <div className="space-y-3 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
              Career Opportunity
            </p>
            <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
              {role.title}
            </h1>
            {lead && (
              <p className="text-base text-gray-700 leading-relaxed">{lead}</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {role.location && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                  <span className="h-2 w-2 rounded-full bg-red-800" />
                  {role.location}
                </span>
              )}

              {role.employment_type && (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                  <span className="h-2 w-2 rounded-full bg-gray-700" />
                  {role.employment_type}
                </span>
              )}

              <span className="text-xs font-semibold text-gray-600">
                Posted: {posted} •{" "}
                {role.closing_date
                  ? `Apply by ${closing}`
                  : "Open until filled"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/firm/contact"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-red-800 to-gray-800 px-4 py-2 text-sm font-semibold text-white hover:from-red-900 hover:to-gray-900"
            >
              Apply Now
            </Link>

            <Link
              href="/firm/career"
              className="inline-flex items-center justify-center rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
            >
              Back to Careers
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[2fr,1fr] gap-10">
          {/* Left Section */}
          <article className="space-y-8 max-w-4xl">
            {hasMetaFields ? (
              structuredSections.map((section) => (
                <div
                  key={section.key}
                  className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8 text-gray-800 space-y-4"
                >
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {section.heading}
                  </h2>

                  <div
                    className="space-y-4"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-8 text-gray-800">
                <div
                  dangerouslySetInnerHTML={{ __html: safeContent }}
                  className="space-y-4"
                />
              </div>
            )}
          </article>

          {/* Right Sidebar */}
          <aside className="space-y-6 lg:pl-4">
            {/* Role Details */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 shadow-sm p-5 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Role Details
              </h3>

              <div className="space-y-3 text-sm text-gray-700">
                {metaItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-500">
                      {item.label}
                    </p>
                    <p className="text-base font-semibold text-gray-900 text-right">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/firm/contact"
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-red-800 to-gray-800 px-4 py-2 text-sm font-semibold text-white hover:from-red-900 hover:to-gray-900"
              >
                Apply Now
              </Link>
            </div>

            {/* Share */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
              <span className="text-sm font-semibold text-gray-800">Share</span>

              <div className="flex flex-wrap items-center gap-3">
                {shareLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-800 hover:bg-gray-100"
                  >
                    {link.label[0]}
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap justify-between items-center gap-3">
              {adjacent.previous ? (
                <Link
                  href={`/firm/career/${adjacent.previous.slug}`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                >
                  &larr; {adjacent.previous.title}
                </Link>
              ) : (
                <span />
              )}

              {adjacent.next ? (
                <Link
                  href={`/firm/career/${adjacent.next.slug}`}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                >
                  {adjacent.next.title} &rarr;
                </Link>
              ) : (
                <span />
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
