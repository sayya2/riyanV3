import Image from "next/image";
import Link from "next/link";
import { getClientLogos } from "@/lib/db-new";
import ClientLogos from "@/components/ClientLogos";
import PageHero from "@/components/PageHero";

export const metadata = {
  title: "About - Riyan Pvt. Ltd.",
  description:
    "Founded in 1997, Riyan Pvt. Ltd. is a leading multi-disciplinary consultancy firm based in the Maldives.",
};

export const dynamic = "force-dynamic";

const contentShell = "w-full mx-auto px-[10%]";

export default async function AboutPage() {
  const clientLogos = await getClientLogos();
  return (
    <main className="min-h-screen bg-white">
      <PageHero
        title="Riyan Pvt. Ltd."
        eyebrow="About"
        description="Founded in 1997, Riyan Pvt. Ltd. is a leading multi-disciplinary consultancy firm based in the Maldives."
        // imageUrl="https://www.riyan.com.mv/wp-content/uploads/2018/05/Riyan-About.gif"
        imageUrl= "/wp-content/uploads/2024/12/Sonevafushi-e1759852363152-1140x740.jpg"
        heightClass="min-h-[60vh] md:min-h-[80vh]"
        bgColor="bg-[#1a1a2e]"
      />

      {/* Introduction Section */}
      <section className={`${contentShell} py-12 md:py-20`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-16 items-start">
          {/* Text Content - Left Column */}
          <div className="space-y-6">
            <p className="text-lg leading-relaxed text-gray-800">
              Founded in 1997, Riyan Pvt. Ltd. is a leading multi-disciplinary
              consultancy firm based in the Maldives. With expertise spanning
              design consultancy, engineering, project management, and research
              & planning, we deliver integrated solutions that shape sustainable
              and resilient environments.
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              From luxury resorts and landmark buildings to critical
              infrastructure, urban planning, and socio-economic research, we
              bring together creativity, technical excellence, and strategic
              insight. Backed by decades of local knowledge and enriched by our
              experience working with international clients and delivering
              projects funded by global donor agencies, we consistently deliver
              outcomes that meet international standards across diverse sectors.
            </p>
            <p className="text-lg leading-relaxed text-gray-800">
              At Riyan, we are committed to innovation, sustainability, and
              client-focused delivery making us a trusted partner in
              transforming visions into lasting impact across the Maldives and
              beyond.
            </p>
          </div>

          {/* Riyan Logo - Right Column */}
          <div className="relative w-full h-full min-h-[300px] md:min-h-[400px] flex items-center justify-center">
            <div className="relative w-full max-w-sm aspect-[2/1]">
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
        </div>
      </section>

      {/* Multidisciplinary Services Section */}
      <section className={`${contentShell} py-12 md:py-20`}>
        <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-4">
          Multidisciplinary Services
        </h2>
        <p className="text-lg text-gray-700 mb-10">
          We provide a diverse range of services tailored to meet the specific
          needs of built environment and socioeconomic research and planning.
          Our comprehensive portfolio caters to different stages of the project,
          ensuring thorough and effective support at every step.
        </p>

        <div className="bg-[#781213] text-white p-8 md:p-10 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">
                Planning
              </h3>
              <ul className="space-y-2 text-white/90">
                <li>Site Investigation</li>
                <li>Due Diligence</li>
                <li>Hydrographic &amp; Land Surveying</li>
                <li>Feasibility Studies</li>
                <li>Socioeconomic Assessments</li>
                <li>Sustainability Analysis</li>
                <li>Urban Planning</li>
                <li>Development Planning</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">Design</h3>
              <ul className="space-y-2 text-white/90">
                <li>Interior Design</li>
                <li>Architectural Design</li>
                <li>Civil Engineering</li>
                <li>Structural Engineering</li>
                <li>MEP Design</li>
                <li>Coastal Engineering</li>
                <li>Quantity Surveying</li>
                <li>Water &amp; Sanitation Design</li>
                <li>Ports &amp; Transportation</li>
                <li>Solid Waste Management</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl md:text-2xl font-semibold mb-4">
                Implementation
              </h3>
              <ul className="space-y-2 text-white/90">
                <li>Project Management &amp; Supervision</li>
              </ul>

              <h3 className="text-xl md:text-2xl font-semibold mt-8 mb-4">
                Operational
              </h3>
              <ul className="space-y-2 text-white/90">
                <li>Management Consultancy</li>
                <li>Valuation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section className={`${contentShell} py-12 md:py-20`}>
        <div className=" mb-12  mx-auto">
          <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-4">
            Over 1,000 successful projects spanning diverse sectors.
          </h2>
          <p className="text-lg text-gray-700">
            Over the past 28 years, we have successfully delivered projects
            across diverse sectors including Buildings, Resorts, Infrastructure,
            Water &amp; Sewerage, Urban Planning &amp; Research. Our
            multi-disciplinary expertise allows us to provide integrated,
            sustainable solutions tailored to the unique needs of the Maldives
            and beyond.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="relative h-[40vh] overflow-hidden rounded-lg group cursor-pointer">
            <Image
              src="/wp-content/uploads/2018/12/IAS-FINAL-1024x568-1.jpg"
              alt="Buildings"
              fill
              className="object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl md:text-3xl font-semibold text-white">
                Buildings
              </h3>
            </div>
          </div>

          <div className="relative h-[40vh] overflow-hidden rounded-lg group cursor-pointer">
            <Image
              src="/wp-content/uploads/2009/01/Pic-13-Park-Hyatt-rotated.jpg"
              alt="Resorts"
              fill
              className="object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl md:text-3xl font-semibold text-white">
                Resorts
              </h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative h-[40vh] overflow-hidden rounded-lg group cursor-pointer">
            <Image
              src="/wp-content/uploads/2007/02/mpl.jpg"
              alt="Infrastructure"
              fill
              className="object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl md:text-3xl font-semibold text-white">
                Infrastructure
              </h3>
            </div>
          </div>

          <div className="relative h-[40vh] overflow-hidden rounded-lg group cursor-pointer">
            <Image
              src="/wp-content/uploads/2021/09/bodufolhadhoo-LUP-1.jpg"
              alt="Urban Planning"
              fill
              className="object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl md:text-3xl font-semibold text-white">
                Urban Planning
              </h3>
            </div>
          </div>

          <div className="relative h-[40vh] overflow-hidden rounded-lg group cursor-pointer">
            <Image
              src="/wp-content/uploads/2022/08/IMG20210407113813-1800x900-1.jpg"
              alt="Research"
              fill
              className="object-cover transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-2xl md:text-3xl font-semibold text-white">
                Research
              </h3>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <section className={`${contentShell} py-12 md:py-20`}>
        <h2 className="text-3xl md:text-5xl font-semibold text-gray-900 mb-4">
          Clients
        </h2>
        <p className="text-lg text-gray-700 mb-10">
          We possess a wealth of experience in forging fruitful partnerships
          with the Maldivian government, local and international companies, as
          well as esteemed bilateral and multilateral agencies, resulting in a
          proven track record of success.
        </p>

        <ClientLogos logos={clientLogos} />
      </section>

      {/* Navigation to other Firm pages */}
      <section className={`${contentShell} pb-12`}>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/firm/career"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
          >
            Career
          </Link>
          <Link
            href="/firm/career/internships"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
          >
            Internships
          </Link>
          <Link
            href="/firm/contact"
            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
          >
            Contact
          </Link>
        </div>
      </section>
    </main>
  );
}
