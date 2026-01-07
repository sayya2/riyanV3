import Image from "next/image";
import Link from "next/link";
import { Linkedin, Instagram, Facebook } from "lucide-react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/firm/about" },
  { label: "Contact", href: "/firm/contact" },
  { label: "Careers", href: "/firm/career" },
];

const isoBadges = [
  "/wp-content/uploads/2021/05/ISO-CERTIFIED-LOGO1.png",
  "/wp-content/uploads/2021/05/ISO-CERTIFIED-LOGO1.png",
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://mv.linkedin.com/company/riyan-pvt-ltd",
    icon: Linkedin,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/riyanprivatelimited",
    icon: Instagram,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/RiyanPvtLtd/",
    icon: Facebook,
  },
];

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-[var(--gutter-phi-1)] py-12 grid gap-10 grid-cols-1 place-items-center text-center sm:grid-cols-1 sm:place-items-center sm:text-center md:grid-cols-4 md:items-center md:place-items-center md:text-center">
        {/* Column 1 — Brand */}
        <div className="space-y-4 text-center sm:text-center md:text-center">
          <Link href="/" aria-label="Riyan Home">
            <div className="relative md:h-24 w-full my-8 h-28 mx-auto sm:mx-auto md:mx-auto">
              <Image
                src="/wp-content/uploads/2021/06/logoWhite.png"
                alt="Riyan Pvt Ltd logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <p className="text-sm text-white/80 leading-relaxed max-w-lg mx-auto md:ml-0 sm:mx-auto md:mx-auto">
            Integrated solutions in design, engineering, project management, and
            research tailored for the Maldives and beyond.
          </p>
        </div>

        {/* Column 2 — Quick Links */}
        <div className="text-center sm:text-center md:text-center">
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="grid grid-cols-2 gap-x-7 gap-y-2 text-sm max-w-xs mx-auto sm:mx-auto md:mx-auto justify-items-center sm:justify-items-center md:justify-items-center">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:text-secondary transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — Social */}
        <div className="text-center sm:text-center md:text-center">
          <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
          <div className="flex flex-col gap-3 text-sm items-center sm:items-center md:items-center">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/80 hover:text-secondary transition-colors justify-center sm:justify-center md:justify-center"
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Column 4 — Certifications */}
        <div className="text-center sm:text-center md:text-center">
          <h4 className="text-lg font-semibold mb-4">Certifications</h4>
          <div className="flex flex-wrap gap-4 justify-center sm:justify-center md:justify-center">
            {isoBadges.map((src, idx) => (
              <div key={idx} className="relative h-20 w-20">
                <Image
                  src={src}
                  alt="ISO Certification badge"
                  fill
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} Riyan Pvt Ltd. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
