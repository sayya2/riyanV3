import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/db-new";
import Reveal from "@/components/Reveal";
import { FirmPageBySlug } from "../../_components/FirmPage";

export const dynamic = "force-dynamic";

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const contentShell = "";
const sectionY = "py-[2.5rem] md:py-[1rem]";
const mdBoxHeight = "md:min-h-[240px]";
const heroSectionClassName =
  "mt-0 flex items-center bg-gray-50 bg-primary/5 min-h-[40vh]";
const keyDetails = [
  "Duration: 3 to 6 months",
  "Interns will be assigned to a mentor",
  "Tailored performance objectives in line with their education requirements",
];
const eligibilityCriteria = [
  "Applicants must be a Maldivian",
  "Applicants must possess an education qualification of Diploma or higher",
  "Applicants must be current students",
];

export default async function InternshipsPage() {
  const page = await getPageBySlug("internships");

  if (!page) {
    return notFound();
  }

  const title = stripHtml(page.title || "Riyan Internship Program");
  const description =
    stripHtml(page.excerpt || "") ||
    "Join our internship program and gain hands-on experience in a dynamic professional environment.";

  return (
    <FirmPageBySlug
      slug="internships"
      currentPath="career/internships"
      titleOverride={title}
      heroEyebrow="Career Opportunities"
      heroDescriptionOverride={description}
      heroSectionClassName={heroSectionClassName}
      textOnlyHero
      hideContent
      contentShellClassName={contentShell}
      childrenWrapperClassName="max-w-none"
    >
      {/* Introduction Section */}
      <section className={sectionY}>
        <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:gap-10">
          <Reveal>
            <div className="prose prose-lg max-w-none text-gray-800 space-y-4">
              {/* <p className="text-lg leading-relaxed">{description}</p> */}
              <p className="text-lg leading-relaxed">
                At Riyan, we believe in nurturing the next generation of
                architects, engineers, planners, and consultants. Our internship
                program offers students and recent graduates a unique
                opportunity to work alongside experienced professionals on
                real-world projects that shape the built environment of the
                Maldives and beyond.
              </p>
              <p className="text-lg leading-relaxed">
                Riyan Internship program is an excellent opportunity for new
                graduates and students pursuing graduate programs to gain
                valuable work experience in the field of built environment at
                one of the leading consultancy firms in the country. Interns
                will be given opportunity to earn as they receive their
                on-the-job training. Successful completion of the program
                promises a level of proficiency that will greatly benefit their
                career prospects, with priority consideration for permanent
                positions upon graduation.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="space-y-6">
              <div className="rounded-lg bg-gray-50 p-6 shadow-sm md:p-7">
                <h3 className="text-[1.875rem]! font-semibold text-gray-900 mb-4">
                  Key Details
                </h3>
                <ul className="space-y-3">
                  {keyDetails.map((detail) => (
                    <li key={detail} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#781213]" />
                      <span className="text-gray-800 leading-relaxed">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`rounded-lg bg-gray-50 p-6 shadow-sm md:p-7 ${mdBoxHeight}`}
              >
                <h3 className="text-[1.875rem]! font-semibold text-gray-900 mb-4">
                  Eligibility Criteria
                </h3>
                <ul className="space-y-3">
                  {eligibilityCriteria.map((criterion) => (
                    <li key={criterion} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#781213]" />
                      <span className="text-gray-800 leading-relaxed">
                        {criterion}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How to Apply Section - Prominent CTA */}
      <section className={sectionY}>
        <Reveal>
          <div
            className={`bg-gradient-to-br from-gray-900 to-[#781213] text-white rounded-lg p-8 md:p-7 text-center md:flex md:items-center md:justify-between md:gap-8 md:text-left ${mdBoxHeight}`}
          >
            <div className="md:max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-semibold mb-3">
                Ready to Start Your Journey?
              </h2>
              <p className="text-lg md:text-base text-white/90 mb-6 md:mb-0 leading-relaxed">
                We welcome applications throughout the year. Submit your CV,
                cover letter, and portfolio (if applicable) to join our team of
                passionate professionals shaping the future of the Maldives.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center md:justify-end">
              <Link
                href="/firm/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-[#781213] font-semibold rounded-lg hover:bg-gray-100 transition-colors text-lg shadow-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/firm/career"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-lg"
              >
                View All Careers
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </FirmPageBySlug>
  );
}
