import Link from "next/link";
import type { SVGProps } from "react";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { getAdjacentCareers, getCareerBySlug } from "@/lib/directus";
import { parseCareerSections } from "@/lib/parseCareerSections";
import { resolveFileUrl } from "@/lib/media";
import Reveal from "@/components/Reveal";

const sanitizeContent = (input: string) =>
  input
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");

const escapeHtml = (input: string) =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatSectionContent = (input: string) => {
  const sanitized = sanitizeContent(input || "");
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(sanitized);
  if (hasHtml) return sanitized;

  const blocks = sanitized
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const listLines = lines.filter((line) => /^[-*•]\s+/.test(line));

      if (listLines.length && listLines.length === lines.length) {
        const items = listLines
          .map((line) => line.replace(/^[-*•]\s+/, ""))
          .filter(Boolean)
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      return `<p>${escapeHtml(lines.join(" "))}</p>`;
    })
    .join("");
};

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

const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M18.244 2H21.1l-6.25 7.142L22.5 22h-6.463l-4.597-6.18L5.95 22H3.09l6.71-7.67L2.5 2H9.12l4.154 5.56L18.244 2Zm-1.02 18.2h1.583L7.95 3.7H6.28l10.944 16.5Z"
    />
  </svg>
);

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
  const jobId = role.job_id?.trim() || `ID ${role.id}`;
  const posted = formatDate(role.published_at);
  const closing = formatDate(role.closing_date, "Open until filled");

  const parsedSections = parseCareerSections(role.content || "");

  const jobDescription = role.job_description || parsedSections.description;
  const responsibilities =
    role.responsibilities || parsedSections.responsibilities;
  const requirements = role.requirements || parsedSections.requirements;
  const qualifications = role.qualifications || parsedSections.qualifications;
  const benefits = role.benefits || parsedSections.benefits;

  const safeContent = formatSectionContent(role.content || "");

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
      content: formatSectionContent(jobDescription),
    },
    responsibilities && {
      key: "responsibilities",
      heading: "Responsibilities",
      content: formatSectionContent(responsibilities),
    },
    requirements && {
      key: "requirements",
      heading: "Requirements",
      content: formatSectionContent(requirements),
    },
    qualifications && {
      key: "qualifications",
      heading: "Qualifications",
      content: formatSectionContent(qualifications),
    },
    benefits && {
      key: "benefits",
      heading: "Benefits",
      content: formatSectionContent(benefits),
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
      icon: XIcon,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      icon: Facebook,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/riyanprivatelimited",
      icon: Instagram,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
        shareUrl
      )}&title=${encodeURIComponent(shareText)}`,
      icon: Linkedin,
    },
  ];

  const metaItems = [
    { label: "Job ID", value: jobId },
    { label: "Location", value: role.location || "Not specified" },
    { label: "Type", value: role.employment_type || "Not specified" },
    { label: "Department", value: role.department || "Not specified" },
    { label: "Posted", value: posted },
    { label: "Application deadline", value: closing },
  ];

  const documentUrl = resolveFileUrl(role.document);
  const documentName =
    (typeof role.document === "object" && role.document?.filename_download) ||
    (typeof role.document === "object" && role.document?.title) ||
    "Role document";
  const documentType =
    typeof role.document === "object" ? role.document?.type : null;
  const isPdf =
    (documentType && documentType.toLowerCase().includes("pdf")) ||
    documentName.toLowerCase().endsWith(".pdf");

  return (
    <main className="min-h-screen bg-white ml-[10%] mr-[10%] pt-26">
      <section className="container mx-auto px-4 py-10 space-y-10">
        {/* Header */}
        <Reveal>
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-6 pt-6">
            <div className="space-y-3 max-w-3xl">
              <p className="text-xs uppercase tracking-[0.25em] text-gray-500">
                Career Opportunity
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {jobId}
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900">
                {role.title}
              </h1>
              {lead && (
                <p className="text-base text-gray-700 leading-relaxed">{lead}</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                {/* {role.location && (
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
                )} */}

                <span className="text-xs font-semibold text-gray-600">
                  Posted: {posted} -{" "}
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
        </Reveal>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[2fr,1fr] gap-10">
          {/* Left Section */}
          <article className="space-y-8 max-w-4xl">
            {hasMetaFields ? (
              structuredSections.map((section, index) => (
                <Reveal key={section.key} delay={index * 0.08}>
                  <div className="bg-white p-6 md:p-8 text-gray-800 space-y-4">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {section.heading}
                    </h2>

                    <div
                      className="rich-content text-gray-700 space-y-4"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                </Reveal>
              ))
            ) : (
              <Reveal>
                <div className="bg-white p-6 md:p-8 text-gray-800">
                  <div
                    dangerouslySetInnerHTML={{ __html: safeContent }}
                    className="rich-content text-gray-700 space-y-4"
                  />
                </div>
              </Reveal>
            )}
          </article>

          {/* Right Sidebar */}
          <aside className="space-y-6 lg:pl-4 w-full lg:max-w-[300px] lg:justify-self-end lg:col-start-2">
            {/* Role Details */}
            <Reveal>
              <div className="border border-gray-100 bg-white shadow-sm p-6 md:p-7 space-y-4">
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
            </Reveal>

            {documentUrl ? (
              <Reveal delay={0.04}>
                <div className="border border-gray-200 bg-white shadow-sm p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Role Document
                  </h3>
                  <a
                    href={documentUrl}
                    className="text-sm font-semibold text-primary hover:underline break-words"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {documentName}
                  </a>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={documentUrl}
                      download
                      className="inline-flex items-center justify-center border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100"
                    >
                      Download
                    </a>
                    {isPdf ? (
                      <a
                        href={documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-100"
                      >
                        Preview PDF
                      </a>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ) : null}

            {/* Share */}
            <Reveal delay={0.08}>
              <div className="border border-gray-200 bg-white shadow-sm p-4 space-y-3">
                <span className="text-sm font-semibold text-gray-800">Share</span>

                <div className="flex flex-wrap items-center gap-3">
                  {shareLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-800 hover:bg-gray-100"
                        aria-label={link.label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </Reveal>

            {/* Navigation */}
            <Reveal delay={0.16}>
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
            </Reveal>
          </aside>
        </div>
      </section>
      <section className="container mx-auto px-4 pb-12">
       
      </section>
    </main>
  );
}
