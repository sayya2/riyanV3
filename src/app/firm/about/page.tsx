import Image from "next/image";
import { getClientLogos } from "@/lib/db-new";
import ClientLogos from "@/components/ClientLogos";
import Reveal from "@/components/Reveal";
import SectorSlider from "@/components/SectorSlider";
import { FirmPageBySlug } from "../_components/FirmPage";

export const metadata = {
  title: "About - Riyan Pvt. Ltd.",
  description:
    "Founded in 1997, Riyan Pvt. Ltd. is a leading multi-disciplinary consultancy firm based in the Maldives.",
};

export const dynamic = "force-dynamic";

const heroSectionClassName =
  "pt-12 pb-6 mt-0 flex items-center bg-gray-50 bg-primary/5 min-h-[40vh]";

export default async function AboutPage() {
  const clientLogos = await getClientLogos();
  return (
    <FirmPageBySlug
      slug="about"
      currentPath="about"
      titleOverride="Riyan Pvt. Ltd."
      heroEyebrow="About"
      heroDescriptionOverride="Founded in 1997, Riyan Pvt. Ltd. is a leading multi-disciplinary consultancy firm based in the Maldives."
      heroSectionClassName={heroSectionClassName}
      textOnlyHero
      hideContent
      childrenWrapperClassName="max-w-none"
    >
      {/* Introduction Section */}
      <section className="py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Text Content - Left Column */}
          <Reveal>
            <div className="space-y-4 md:space-y-5">
              <p className="text-base md:text-lg leading-relaxed text-gray-800">
                Founded in 1997, Riyan Pvt. Ltd. is a leading multi-disciplinary
                consultancy firm based in the Maldives. With expertise spanning
                design consultancy, engineering, project management, and
                research & planning, we deliver integrated solutions that shape
                sustainable and resilient environments.
              </p>
              <p className="text-base md:text-lg leading-relaxed text-gray-800">
                From luxury resorts and landmark buildings to critical
                infrastructure, urban planning, and socio-economic research, we
                bring together creativity, technical excellence, and strategic
                insight. Backed by decades of local knowledge and enriched by
                our experience working with international clients and delivering
                projects funded by global donor agencies, we consistently
                deliver outcomes that meet international standards across
                diverse sectors.
              </p>
              <p className="text-base md:text-lg leading-relaxed text-gray-800">
                At Riyan, we are committed to innovation, sustainability, and
                client-focused delivery making us a trusted partner in
                transforming visions into lasting impact across the Maldives and
                beyond.
              </p>
            </div>
          </Reveal>

          {/* Riyan Logo - Right Column */}
          <Reveal delay={0.1}>
            <div className="relative w-full flex items-center justify-center py-8 md:py-0">
              <div className="relative w-full max-w-md aspect-[2/1]">
                <Image
                  src="/riyan-logo.png"
                  alt="Riyan Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Multidisciplinary Services Section */}
      <section className="py-12 md:py-16">
        <Reveal>
          <div className="mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-3 md:mb-4">
              Multidisciplinary Services
            </h2>
            <p className="text-base md:text-lg text-gray-700 max-w-4xl">
              We provide a diverse range of services tailored to meet the
              specific needs of built environment and socioeconomic research and
              planning. Our comprehensive portfolio caters to different stages
              of the project, ensuring thorough and effective support at every
              step.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="reveal-stagger">
          <div className="bg-[#781213] text-white p-6 md:p-8 lg:p-10 rounded-2xl border border-white/10 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {[
                {
                  key: "planning",
                  groups: [
                    {
                      title: "Planning",
                      items: [
                        "Site Investigation",
                        "Due Diligence",
                        "Hydrographic & Land Surveying",
                        "Feasibility Studies",
                        "Socioeconomic Assessments",
                        "Sustainability Analysis",
                        "Urban Planning",
                        "Development Planning",
                      ],
                    },
                  ],
                },
                {
                  key: "design",
                  groups: [
                    {
                      title: "Design",
                      items: [
                        "Interior Design",
                        "Architectural Design",
                        "Civil Engineering",
                        "Structural Engineering",
                        "MEP Design",
                        "Coastal Engineering",
                        "Quantity Surveying",
                        "Water & Sanitation Design",
                        "Ports & Transportation",
                        "Solid Waste Management",
                      ],
                    },
                  ],
                },
                {
                  key: "delivery",
                  groups: [
                    {
                      title: "Implementation",
                      items: ["Project Management & Supervision"],
                    },
                    {
                      title: "Operational",
                      items: ["Management Consultancy", "Valuation"],
                    },
                  ],
                },
              ].map((column, columnIndex) => (
                <div key={column.key} className="space-y-8">
                  {column.groups.map((group, groupIndex) => {
                    const baseDelay =
                      0.1 + columnIndex * 0.08 + groupIndex * 0.12;
                    const lineDuration = Math.max(
                      0.5,
                      group.items.length * 0.08 + 0.3
                    );

                    return (
                      <div key={group.title} className="space-y-3 md:space-y-4">
                        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold">
                          {group.title}
                        </h3>
                        <div className="relative pl-5 md:pl-6">
                          <span
                            className="absolute left-0 top-1 h-full w-px bg-white/35"
                            data-reveal-line
                            style={{
                              transitionDelay: `${baseDelay}s`,
                              transitionDuration: `${lineDuration}s`,
                            }}
                          />
                          <ul className="space-y-1.5 md:space-y-2 text-sm md:text-base text-white/90">
                            {group.items.map((item, itemIndex) => (
                              <li
                                key={item}
                                data-reveal-item
                                style={{
                                  transitionDelay: `${
                                    baseDelay + itemIndex * 0.08
                                  }s`,
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
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Projects Section */}
      <section className="py-12 md:py-16">
        <Reveal>
          <div className="mb-8 md:mb-12 mx-auto">
            <h2
              className="
      !text-4xl
      md:!text-5xl
      lg:!text-6xl
      !leading-tight
      !font-semibold
      text-gray-900
      pb-4 md:pb-6
      text-center
      max-w-5xl
      mx-auto
    "
            >
              Over <span className="text-primary  ">1,000</span> successful
              projects spanning diverse sectors.
            </h2>

            <p className="text-base   md:text-lg text-gray-700 text-center max-w-4xl mx-auto">
              Over the past 28 years, we have successfully delivered projects
              across diverse sectors including Buildings, Resorts,
              Infrastructure, Water & Sewerage, Urban Planning & Research. Our
              multi-disciplinary expertise allows us to provide integrated,
              sustainable solutions tailored to the unique needs of the Maldives
              and beyond.
            </p>
          </div>
        </Reveal>

        <SectorSlider
          sectors={[
            {
              name: "Buildings",
              image: "/wp-content/uploads/2018/12/IAS-FINAL-1024x568-1.jpg",
            },
            {
              name: "Resorts",
              image:
                "/wp-content/uploads/2009/01/Pic-13-Park-Hyatt-rotated.jpg",
            },
            {
              name: "Infrastructure",
              image: "/wp-content/uploads/2007/02/mpl.jpg",
            },
            {
              name: "Urban Planning",
              image: "/wp-content/uploads/2021/09/bodufolhadhoo-LUP-1.jpg",
            },
            {
              name: "Research",
              image:
                "/wp-content/uploads/2022/08/IMG20210407113813-1800x900-1.jpg",
            },
          ]}
          speed={50}
        />
      </section>

      {/* Clients Section */}
      <section className="py-12 md:py-16">
        <Reveal>
          <div className="mb-8 md:mb-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-3 md:mb-4">
              Clients
            </h2>
            <p className="text-base md:text-lg text-gray-700 max-w-4xl">
              We possess a wealth of experience in forging fruitful partnerships
              with the Maldivian government, local and international companies,
              as well as esteemed bilateral and multilateral agencies, resulting
              in a proven track record of success.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <ClientLogos logosByCategory={clientLogos} />
        </Reveal>
      </section>
    </FirmPageBySlug>
  );
}
