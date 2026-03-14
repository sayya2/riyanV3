import { Building2, Clock, Mail, MapPin, Phone, Send, Contact, Route } from "lucide-react";
import Reveal from "@/components/Reveal";
import { FirmPageBySlug } from "../_components/FirmPage";

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
    value: "H. Azim, 3rd Floor, Ameenee Magu, Male', 20054",
    caption: "Find us on Ameenee Magu",
    href: "https://www.google.com/maps?q=4.170965613755108,73.5159096621892&z=17",
    icon: MapPin,
  },
];

export const metadata = {
  title: "Contact - Riyan Pvt. Ltd.",
  description:
    "Connect with Riyan's design, engineering, and research teams in Male. Share your project vision or schedule a consultation with our specialists.",
};

export const dynamic = "force-dynamic";

export default function ContactPage() {
  const contentShell = "w-full mx-auto px-[4%] md:px-[138px]";
  const heroSectionClassName =
    "pt-8 pb-4 mt-0 flex items-center bg-gray-50 bg-primary/5 min-h-[30vh]";

  return (
    <FirmPageBySlug
      slug="contact"
      currentPath="contact"
      titleOverride="Let's build places that endure."
      heroEyebrow="Contact"
      heroDescriptionOverride="Dedicated design, engineering, and research teams based in the Maldives, ready to partner on your next project."
      heroSectionClassName={heroSectionClassName}
      textOnlyHero
      hideContent
      contentShellClassName={contentShell}
      contentSectionClassName="py-6 space-y-6"
      childrenWrapperClassName="max-w-none"
    >
      <section className="mt-4">
        <Reveal>
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            style={{ fontFamily: "var(--font-roboto-condensed)" }}
          >
            {contactChannels.map((channel) => {
              const Icon = channel.icon;
              const isExternal = channel.href.startsWith("http");
              return (
                <a
                  key={channel.label}
                  href={channel.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noreferrer" : undefined}
                  className="group relative overflow-hidden border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex items-stretch"
                >
                  <div className="flex w-12 shrink-0 items-center justify-center bg-primary/10 text-primary self-stretch">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-1 min-w-0 flex-col justify-center p-2.5 space-y-1">
                    <p className="!text-[0.7rem] uppercase tracking-wide text-gray-500 font-semibold">
                      {channel.label}
                    </p>
                    <h3 className="!text-[1.1rem] md:text-[1.05rem] font-semibold text-gray-900 break-words">
                      {channel.value}
                    </h3>
                  </div>
                </a>
              );
            })}
          </div>
        </Reveal>
      </section>

      <section id="contact-form" className="py-8 space-y-8">
        <div className="grid lg:grid-cols-3 gap-8 items-start lg:items-start">
          {/* <Reveal className="lg:h-full">
            <div className="bg-white border border-gray-200 shadow-md p-5 space-y-6 lg:h-full">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                    Project enquiries
                  </p>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight">
                    Tell us about your project
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-700 mt-2">
                    Share a few details and our team will respond within one
                    business day.
                  </p>
                </div>
                <span className="text-[0.65rem] sm:text-xs px-3 py-1 bg-gray-100 text-gray-700 font-semibold">
                  Avg. reply: <span className="text-primary">24h</span>
                </span>
              </div>

              <form
                className="space-y-6"
                action="mailto:info@riyan.com.mv"
                method="post"
                encType="text/plain"
              >
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-3 text-xs font-semibold text-gray-700">
                    <span>Full name</span>
                    <input
                      required
                      name="Name"
                      placeholder="Your name"
                      className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-3 text-xs font-semibold text-gray-700">
                    <span>Email</span>
                    <input
                      required
                      type="email"
                      name="Email"
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-3 text-xs font-semibold text-gray-700">
                  <span>Phone (optional)</span>
                  <input
                    type="tel"
                    name="Phone"
                    placeholder="+960 ..."
                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </label>

                <label className="flex flex-col gap-3 text-xs font-semibold text-gray-700">
                  <span>Project overview</span>
                  <textarea
                    required
                    name="Project overview"
                    rows={3}
                    placeholder="Share goals, timelines, or site details."
                    className="w-full border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/30 outline-none"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>We schedule consultations within 24-48 hours.</span>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 bg-primary px-4 py-2 text-white text-xs font-semibold shadow-sm hover:bg-[#5f0e0f] transition-colors"
                  >
                    Send message
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </Reveal> */}

          <Reveal delay={0.05} className="lg:col-span-2 md:h-[380px]">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm h-full">
              <iframe
                title="Riyan office location"
                src="https://www.google.com/maps?q=4.170965613755108,73.5159096621892&z=17&output=embed"
                allowFullScreen
                loading="lazy"
                className="w-full h-[240px] md:h-full"
              />
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9)_0,_rgba(255,255,255,0)_60%),linear-gradient(135deg,#ffffff,#fffcee_55%,rgba(120,18,19,0.15))] p-4 text-gray-900 shadow-md md:h-[380px] md:flex md:flex-col">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </span>
                <h4 className="text-2xl! font-semibold text-gray-800">
                  Head Office
                </h4>
              </div>

              <div className="mt-5 ml-10 space-y-4 text-base text-gray-700 md:text-[15.75px]">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <p className="font-medium">
                    H. Azim, 3rd Floor, Ameenee Magu, Male 20054
                  </p>
                </div>
                <a
                  href="https://www.google.com/maps?q=4.170965613755108,73.5159096621892&z=17"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
                >
                  <Route className="h-3.5 w-3.5" />
                  Get directions
                </a>
              </div>

              <div className="mt-7 ml-10 space-y-6 text-base text-gray-700 md:text-[15.75px] md:mt-8">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wide text-gray-500 font-semibold">
                      Hours
                    </p>
                    <p className="font-semibold text-gray-900">
                      Sunday - Thursday
                    </p>
                    <p className="text-gray-600">9:00 AM - 5:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Contact className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wide text-gray-500 font-semibold">
                      Quick contact
                    </p>
                    <div className="mt-2 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:gap-6">
                      <a
                        href="tel:+9603315049"
                        className="flex items-center gap-2 font-semibold text-primary hover:text-primary/80"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        +960 331 5049
                      </a>
                      <a
                        href="mailto:info@riyan.com.mv"
                        className="flex items-center gap-2 font-semibold text-primary hover:text-primary/80"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        info@riyan.com.mv
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </FirmPageBySlug>
  );
}
