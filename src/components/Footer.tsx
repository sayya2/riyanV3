import Image from "next/image";
import Link from "next/link";
import type { SVGProps } from "react";
import { Linkedin, Instagram, Facebook } from "lucide-react";

const XIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M18.244 2H21.1l-6.25 7.142L22.5 22h-6.463l-4.597-6.18L5.95 22H3.09l6.71-7.67L2.5 2H9.12l4.154 5.56L18.244 2Zm-1.02 18.2h1.583L7.95 3.7H6.28l10.944 16.5Z"
    />
  </svg>
);

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "News", href: "/news" },
  { label: "About", href: "/firm/about" },
  { label: "Career", href: "/firm/career" },
  { label: "Internships", href: "/firm/career/internships" },
  { label: "Contact", href: "/firm/contact" },
];

const isoBadges = [
  "/wp-content/uploads/2021/05/ISO-CERTIFIED-LOGO1.png",
  "/wp-content/uploads/2021/05/ISO-CERTIFIED-LOGO2.png",
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
  {
    label: "X",
    href: "https://twitter.com/riyanpvtltd",
    icon: XIcon,
  },
];

const Footer = () => {
  return (
    <footer className="bg-primary text-white">
      <div className="w-full mx-auto px-[6%] md:px-[138px] py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <nav aria-label="Footer site links" className="w-full">
            <ul className="flex flex-wrap justify-center gap-x-12 gap-y-3 text-base text-white/85 md:text-md">
              {navLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div
            aria-label="ISO certifications"
            className="flex flex-wrap items-center justify-center gap-6 md:translate-y-6"
          >
            {isoBadges.map((src, idx) => (
              <div
                key={idx}
                className="relative h-18 w-18 opacity-90 md:h-22 md:w-22"
              >
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

        <div className="mt-12 grid gap-6 justify-items-center md:grid-cols-[1fr_auto_1fr] md:items-center md:justify-items-stretch">
          <Link
            href="/"
            aria-label="Riyan Home"
            className="block justify-self-center md:justify-self-start"
          >
            <div className="relative h-20 w-44 md:h-24 md:w-46">
              <Image
                src="/wp-content/uploads/2021/06/lg60wn.png"
                alt="Riyan Pvt Ltd logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <div
            aria-label="Footer socials"
            className="flex flex-wrap justify-center gap-4"
          >
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/80 transition-colors hover:text-white md:h-12 md:w-12"
                aria-label={label}
              >
                <Icon className="h-5 w-5 md:h-4 md:w-4" />
              </Link>
            ))}
          </div>

          <div className="text-center text-sm text-white/65 md:text-right md:text-base">
            Copyright @ {new Date().getFullYear()} Riyan Private Limited.
            <br />
            Established 1997 Maldives
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
