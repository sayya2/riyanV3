import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import PageHero from "@/components/PageHero";
import { firmPages } from "../_components/FirmPage";
import Reveal from "@/components/Reveal";

const contactChannels = [
  {
    label: "Call us",
    value: "+960 331 5049",
    caption: "Speak directly with our team",
    href: "tel:+9603315049",
    icon: Phone,
  },
  {
    label: "Email",
    value: "info@riyan.com.mv",
    caption: "We reply within one business day",
    href: "mailto:info@riyan.com.mv",
    icon: Mail,
  },
  {
    label: "Visit",
    value: "H. Azim, 3rd Floor, Ameenee Magu, Male 20054",
    caption: "Find us on Ameenee Magu",
    href: "https://www.google.com/maps?q=4.170965613755108,73.5159096621892&z=17",
    icon: MapPin,
  },
];

const focusTags = [
  "Design & Engineering",
  "Project Management",
  "Research & Planning",
  "Sustainability",
  "Advisory",
];

export const metadata = {
  title: "Contact - Riyan Pvt. Ltd.",
  description:
    "Connect with Riyan's design, engineering, and research teams in Male. Share your project vision or schedule a consultation with our specialists.",
};

export default function ContactPage() {
  const contentShell = "w-full mx-auto px-[4%] md:px-[138px]";

  return (
    <main className="min-h-screen bg-white">
      <PageHero
        title="Let's build places that endure."
        eyebrow="Contact"
        description="Dedicated design, engineering, and research teams based in the Maldives, ready to partner on your next project."
        imageUrl="/wp-content/uploads/2015/05/13-1600x900-1.jpg"
        heightClass="min-h-[100vh] md:min-h-[100vh]"
      />

      <section className={`${contentShell} mt-8 md:mt-10 relative z-10`}>
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              const isExternal = channel.href.startsWith("http");
              return (
                <a
                  key={channel.label}
                  href={channel.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="group relative overflow-hidden  border border-gray-200 bg-white p-5 shadow-md hover:shadow-xl transition-shadow duration-300"
                  
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center  bg-primary/10 text-primary">
                          <Icon className="h-5 w-5" />
                        </span>
                        <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                          {channel.label}
                        </p>
                      </div>
                      <h3 className="!text-[1.35rem] font-semibold text-gray-900">
                        {channel.value}
                      </h3>
                      <p className="text-sm text-gray-600">{channel.caption}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                  </div>
                </a>
              );
            })}
          </div>
        </Reveal>
      </section>

      <section
        id="contact-form"
        className={`${contentShell} py-16 md:py-20 space-y-12`}
      >
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <Reveal>
            <div className="bg-white border border-gray-200 shadow-lg p-6 sm:p-8 space-y-5 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                    Project enquiries
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 leading-tight">
                    Tell us about your project
                  </h2>
                  <p className="text-sm sm:text-base text-gray-700 mt-2">
                    Share a few details and our team will respond within one
                    business day.
                  </p>
                </div>
                <span className="text-[0.7rem] sm:text-xs px-3 py-1 bg-gray-100 text-gray-700 font-semibold">
                  Avg. reply: <span className="text-primary">24h</span>
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {focusTags.map((tag) => (
                  <span
                    key={tag}
                    className=" border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <form
                className="space-y-4"
                action="mailto:info@riyan.com.mv"
                method="post"
                encType="text/plain"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    <span>Full name</span>
                    <input
                      required
                      name="Name"
                      placeholder="Your name"
                      className="w-full  border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    <span>Email</span>
                    <input
                      required
                      type="email"
                      name="Email"
                      placeholder="you@example.com"
                      className="w-full  border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </label>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    <span>Phone</span>
                    <input
                      type="tel"
                      name="Phone"
                      placeholder="+960 ..."
                      className="w-full  border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-semibold text-gray-700">
                    <span>Company</span>
                    <input
                      name="Company"
                      placeholder="Company / Organization"
                      className="w-full  border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm font-semibold text-gray-700 block">
                  <span>What do you need help with?</span>
                  <input
                    name="Focus area"
                    placeholder="e.g. resort masterplan, infrastructure, feasibility"
                    className="w-full  border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm font-semibold text-gray-700 block">
                  <span>Project overview</span>
                  <textarea
                    required
                    name="Project overview"
                    rows={4}
                    placeholder="Share goals, timelines, or site details so we can prepare for the conversation."
                    className="w-full  border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>We schedule consultations within 24-48 hours.</span>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2  bg-primary px-6 py-3 text-white font-semibold shadow-md hover:bg-[#5f0e0f] transition-colors"
                  >
                    Send message
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          </Reveal>

          <div className="space-y-6 md:flex md:h-full md:flex-col">
            <Reveal>
              <div className=" bg-gradient-to-br from-gray-900 via-gray-800 to-primary/70 text-white p-8 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center  bg-white/10">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                      HQ
                    </p>
                    <h3 className="text-xl font-semibold">Head Office</h3>
                  </div>
                </div>
                <p className="text-sm text-white/80">
                  Male, Maldives - our multidisciplinary team works across
                  design, engineering, and research to deliver resilient,
                  high-performance projects.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-white/70">
                      Hours
                    </p>
                    <p className="text-sm font-semibold">
                      Sunday - Thursday, 9:00 AM - 5:00 PM (GMT+5)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-white/70">
                      Quick contact
                    </p>
                    <div className="space-y-1">
                      <a
                        href="tel:+9603315049"
                        className="flex items-center gap-2 text-sm font-semibold hover:text-white/80"
                      >
                        <Phone className="h-4 w-4" />
                        +960 331 5049
                      </a>
                      <a
                        href="mailto:info@riyan.com.mv"
                        className="flex items-center gap-2 text-sm font-semibold hover:text-white/80"
                      >
                        <Mail className="h-4 w-4" />
                        info@riyan.com.mv
                      </a>
                    </div>
                  </div>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
                  <MessageSquare className="h-4 w-4" />
                  Prefer a quick call? We'll schedule it around your time zone.
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="overflow-hidden  border border-gray-200 shadow-md bg-white">
                <iframe
                  title="Riyan office location"
                  src="https://www.google.com/maps?q=4.170965613755108,73.5159096621892&z=17&output=embed"
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-64 md:h-80"
                />
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 gap-4 md:flex-1">
              <Reveal>
                <div className="h-full border border-gray-200 bg-gray-50 p-4 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    Office hours
                  </p>
                  <p className="text-gray-900 font-semibold mt-1">
                    Sunday - Thursday
                  </p>
                  <p className="text-gray-700 text-sm">
                    9:00 AM - 5:00 PM (GMT+5)
                  </p>
                </div>
              </Reveal>
              <Reveal delay={0.05}>
                <div className="h-full border border-gray-200 bg-gray-50 p-4 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    Connect
                  </p>
                  <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
                    <a
                      href="tel:+9603315049"
                      className="inline-flex items-center gap-2  bg-white px-3 py-2 text-xs font-semibold text-primary border border-primary/20 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      Call
                    </a>
                    <a
                      href="mailto:info@riyan.com.mv"
                      className="inline-flex items-center gap-2   bg-white px-3 py-2 text-xs font-semibold text-primary border border-primary/20 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                    <Link
                      href="/firm/career"
                      className="inline-flex items-center gap-2  bg-white px-3 py-2 text-xs font-semibold text-primary border border-primary/20 hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Careers
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        <Reveal>
          <div className="border-t border-gray-200 pt-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Explore more about our firm
              </h3>
              <p className="text-gray-600">
                Learn about our team, open roles, and how we collaborate.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {firmPages
                .filter((link) => link.path !== "contact")
                .map((link) => (
                  <Link
                    key={link.path}
                    href={`/firm/${link.path}`}
                    className="inline-flex items-center  border border-gray-200 bg-white px-4 py-2 text-gray-800 font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {link.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                ))}
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
