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
    <footer className="bg-secondary text-white">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4 items-center place-items-center">
        {/* Column 1 — Brand */}
        <div className="space-y-4 md:ml-12">
          <Link href="/" aria-label="Riyan Home">
            <div className="relative h-24 w-80 my-4">
              <Image
                src="/wp-content/uploads/2021/06/logoWhite.png"
                alt="Riyan Pvt Ltd logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <p className="text-sm text-white/80 leading-relaxed max-w-lg ml-10">
            Integrated solutions in design, engineering, project management, and
            research tailored for the Maldives and beyond.
          </p>
        </div>

        {/* Column 2 — Quick Links */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm max-w-xs">
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3 — Social */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Connect With Us</h4>
          <div className="flex flex-col gap-3 text-sm">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/80 hover:text-primary transition-colors"
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Column 4 — Certifications */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Certifications</h4>
          <div className="flex flex-wrap gap-4">
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
