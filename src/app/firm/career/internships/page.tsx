import Link from "next/link";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/db-new";
import PageHero from "@/components/PageHero";
import { resolveImageUrl } from "@/lib/media";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

const stripHtml = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Parse sections from HTML content
function parseInternshipContent(html: string) {
  const sections: {
    title?: string;
    description?: string;
    keyDetails?: string[];
    criteria?: string[];
  } = {};

  // Extract title (h2, h3, or strong tags with "Riyan" or "Internship")
  const titleMatch = html.match(
    /<(?:h2|h3|strong)[^>]*>(.*?(?:Riyan|Internship|Program).*?)<\/(?:h2|h3|strong)>/i
  );
  if (titleMatch) {
    sections.title = stripHtml(titleMatch[1]);
  }

  // Extract description (first paragraph or content before lists)
  const descMatch = html.match(/<p[^>]*>(.*?)<\/p>/i);
  if (descMatch) {
    sections.description = stripHtml(descMatch[1]);
  }

  // Extract key details (look for lists with "details", "requirements", etc.)
  const keyDetailsSection = html.match(
    /<(?:h3|h4|strong)[^>]*>.*?(?:Key Details|Details|Requirements).*?<\/(?:h3|h4|strong)>([\s\S]*?)(?=<(?:h3|h4|strong)|$)/i
  );
  if (keyDetailsSection) {
    const listItems = keyDetailsSection[1].match(/<li[^>]*>(.*?)<\/li>/gi);
    if (listItems) {
      sections.keyDetails = listItems.map((item) =>
        stripHtml(item.replace(/<\/?li[^>]*>/gi, ""))
      );
    }
  }

  // Extract criteria
  const criteriaSection = html.match(
    /<(?:h3|h4|strong)[^>]*>.*?(?:Criteria|Eligibility|Qualifications).*?<\/(?:h3|h4|strong)>([\s\S]*?)(?=<(?:h3|h4|strong)|$)/i
  );
  if (criteriaSection) {
    const listItems = criteriaSection[1].match(/<li[^>]*>(.*?)<\/li>/gi);
    if (listItems) {
      sections.criteria = listItems.map((item) =>
        stripHtml(item.replace(/<\/?li[^>]*>/gi, ""))
      );
    }
  }

  return sections;
}

const contentShell = "w-full mx-auto px-[11%] md:px-[10%]";
const sectionY = "py-[2.5rem] md:py-[4rem]";
const sectionBottom = "pb-[2.5rem] md:pb-[4rem]";

export default async function InternshipsPage() {
  const page = await getPageBySlug("internships");

  if (!page) {
    return notFound();
  }

  const sections = parseInternshipContent(page.content || "");
  const title = sections.title || page.title || "Riyan Internship Program";
  const description =
    sections.description ||
    stripHtml(page.excerpt || "") ||
    "Join our internship program and gain hands-on experience in a dynamic professional environment.";
  const heroImage =
    resolveImageUrl(page.featured_image) ||
    "/wp-content/uploads/2025/05/5h-floor-Multipurpose-room_1.png";

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        title={title}
        eyebrow="Career Opportunities"
        description={description}
        imageUrl={heroImage}
        heightClass="min-h-[100vh] md:min-h-[100vh]"
      />

      {/* Introduction Section */}
      <section className={`${contentShell} ${sectionY}`}>
        <Reveal>
          <div className="space-y-[1rem]">
            <div className="prose prose-lg max-w-none text-gray-800">
              <p className="text-lg leading-relaxed">{description}</p>
              <p className="text-lg leading-relaxed">
                At Riyan, we believe in nurturing the next generation of
                architects, engineers, planners, and consultants. Our internship
                program offers students and recent graduates a unique opportunity
                to work alongside experienced professionals on real-world projects
                that shape the built environment of the Maldives and beyond.
              </p>
              <p className="text-lg leading-relaxed">
                Through hands-on experience across our multi-disciplinary teams,
                interns gain valuable insights into the consulting industry while
                contributing meaningfully to projects spanning architecture,
                engineering, urban planning, and research.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* What We Offer Section */}
      <section className={`${contentShell} ${sectionY}`}>
        <Reveal>
          <div>
            <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-[1rem]">
              What We Offer
            </h2>
            <p className="text-lg text-gray-700 mb-[1.5rem]">
              Our internship program is designed to provide comprehensive learning
              experiences that bridge academic knowledge with professional practice.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="reveal-stagger">
          <div className="bg-[#781213] text-white p-8 md:p-10 rounded-2xl border border-white/10 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  title: "Professional Development",
                  items: [
                    "Real project experience",
                    "Mentorship from senior professionals",
                    "Skill development workshops",
                    "Industry networking opportunities",
                    "Career guidance and support",
                  ],
                },
                {
                  title: "Work Experience",
                  items: [
                    "Multi-disciplinary exposure",
                    "Client interaction experience",
                    "Technical software training",
                    "Site visits and field work",
                    "Team collaboration",
                  ],
                },
                {
                  title: "Benefits",
                  items: [
                    "Competitive stipend",
                    "Flexible working arrangements",
                    "Modern office environment",
                    "Professional references",
                    "Potential for full-time opportunities",
                  ],
                },
              ].map((group, groupIndex) => {
                const baseDelay = 0.1 + groupIndex * 0.12;
                const lineDuration = Math.max(
                  0.5,
                  group.items.length * 0.08 + 0.3
                );

                return (
                  <div key={group.title} className="space-y-4">
                    <h3 className="text-xl md:text-2xl font-semibold">
                      {group.title}
                    </h3>
                    <div className="relative pl-6">
                      <span
                        className="absolute left-0 top-1 h-full w-px bg-white/35"
                        data-reveal-line
                        style={{
                          transitionDelay: `${baseDelay}s`,
                          transitionDuration: `${lineDuration}s`,
                        }}
                      />
                      <ul className="space-y-2 text-white/90">
                        {group.items.map((item, itemIndex) => (
                          <li
                            key={item}
                            data-reveal-item
                            style={{
                              transitionDelay: `${baseDelay + itemIndex * 0.08}s`,
                            }}
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Eligibility Criteria Section */}
      {sections.criteria && sections.criteria.length > 0 ? (
        <section className={`${contentShell} ${sectionY}`}>
          <Reveal>
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-[1rem]">
                Eligibility Criteria
              </h2>
              <p className="text-lg text-gray-700 mb-[1.5rem]">
                We welcome applications from motivated individuals who meet the
                following requirements.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {sections.criteria.map((criterion, index) => (
              <Reveal key={index} delay={index * 0.05}>
                <div className="flex items-start gap-4 bg-gray-50 rounded-lg p-6">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#781213] text-white font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-800 leading-relaxed pt-1">
                    {criterion}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : (
        <section className={`${contentShell} ${sectionY}`}>
          <Reveal>
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-[1rem]">
                Eligibility Criteria
              </h2>
              <p className="text-lg text-gray-700 mb-[1.5rem]">
                We welcome applications from motivated individuals who meet the
                following requirements.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Currently enrolled in or recently graduated from a relevant degree program (Architecture, Engineering, Planning, etc.)",
              "Strong academic record and genuine interest in the built environment sector",
              "Proficiency in relevant software (AutoCAD, Revit, SketchUp, or similar) is advantageous",
              "Excellent communication skills and ability to work in a collaborative team environment",
            ].map((criterion, index) => (
              <Reveal key={criterion} delay={index * 0.05}>
                <div className="flex items-start gap-4 bg-gray-50 rounded-lg p-6">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-[#781213] text-white font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-800 leading-relaxed pt-1">
                    {criterion}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Key Details Section */}
      {sections.keyDetails && sections.keyDetails.length > 0 && (
        <section className={`${contentShell} ${sectionY}`}>
          <Reveal>
            <div>
              <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-[1rem]">
                Program Details
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="bg-gray-50 rounded-lg p-8 md:p-10">
              <ul className="grid md:grid-cols-2 gap-6">
                {sections.keyDetails.map((detail, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#781213]" />
                    <span className="text-gray-800 leading-relaxed">
                      {detail}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>
      )}

      {/* Full Content Fallback (if parsing didn't work well) */}
      {/* {(!sections.keyDetails || sections.keyDetails.length === 0) &&
        (!sections.criteria || sections.criteria.length === 0) &&
        page.post_content && (
          <section className={`${contentShell} py-12 md:py-20`}>
            <div
              className="prose prose-lg max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: page.post_content }}
            />
          </section>
        )} */}

      {/* How to Apply Section - Prominent CTA */}
      <section className={`${contentShell} ${sectionY}`}>
        <Reveal>
          <div className="bg-gradient-to-br from-gray-900 to-[#781213] text-white rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-5xl font-semibold mb-[1rem]">
              Ready to Start Your Journey?
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-[1.5rem] max-w-3xl mx-auto leading-relaxed">
              We welcome applications throughout the year. Submit your CV, cover
              letter, and portfolio (if applicable) to join our team of passionate
              professionals shaping the future of the Maldives.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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

      {/* Navigation Links */}
      <section className={`${contentShell} ${sectionBottom}`}>
        <Reveal>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/firm/about"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
            >
              About
            </Link>
            <Link
              href="/firm/career"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
            >
              Career
            </Link>
            <Link
              href="/firm/contact"
              className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
