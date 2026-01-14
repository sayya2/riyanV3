"use client";
import {
  ChevronDown,
  ChevronRightCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface MenuItem {
  id: number;
  title: string;
  url: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { id: 1, title: "Home", url: "/" },
  { id: 2, title: "Projects", url: "/projects" },
  { id: 3, title: "News", url: "/news" },
  {
    id: 4,
    title: "Firm",
    url: "/firm",
    children: [
      { id: 41, title: "About", url: "/firm/about" },
      { id: 42, title: "Career", url: "/firm/career" },
      { id: 43, title: "Internships", url: "/firm/career/internships" },
      { id: 44, title: "Contact", url: "/firm/contact" },
    ],
  },
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

export default function Navbar() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isFirmOpen, setIsFirmOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isFirm = pathname?.startsWith("/firm");
  const isStaticNavbar = isFirm;
  const isLightNavbar = isSticky && !isStaticNavbar;
  const panelItems = menuItems.flatMap((item) =>
    item.children && item.children.length > 0 ? item.children : [item]
  );

  useEffect(() => {
    if (isStaticNavbar) {
      setIsSticky(false);
      return;
    }
    const handleScroll = () => setIsSticky(window.scrollY > 100);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isStaticNavbar]);

  useEffect(() => {
    setIsFirmOpen(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const clearFirmCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openFirmMenu = () => {
    clearFirmCloseTimer();
    setIsFirmOpen(true);
  };

  const scheduleCloseFirmMenu = () => {
    clearFirmCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsFirmOpen(false);
    }, 150);
  };

  const borderColor = isLightNavbar ? "border-white" : "border-red-700/0";
  const textColor = isLightNavbar ? "text-gray-900" : "text-white";
  const baseBg =
    isStaticNavbar
      ? "bg-primary"
      : isHome && !isLightNavbar
      ? "bg-white/10 w-full bg-clip-padding backdrop-filter backdrop-blur-sm border border-white/15"
      : "bg-gradient-to-r from-[#7a1c1a] via-[#7a1c1a] to-[#9b2c28]";
  const headerBg = isLightNavbar ? "bg-white shadow-md" : baseBg;

  return (
    <header
      className={`${isStaticNavbar ? "relative" : "fixed top-0 left-0 right-0"} z-50 border-b ${borderColor} ${
        isStaticNavbar ? "" : "transition-all duration-300"
      } ${headerBg}`}
    >
      <div className="mx-auto w-full px-[var(--gutter-phi-0)] lg:px-[124px]">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex ">
            <Link href="/" className="flex items-center">
              <div className="relative w-36 h-22">
                <Image
                  src={
                    isLightNavbar
                      ? "/wp-content/uploads/2021/06/lg60n.png"
                      : "/wp-content/uploads/2021/06/lg60wn.png"
                  }
                  alt="Riyan"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div
            className="hidden lg:block relative"
            onMouseLeave={scheduleCloseFirmMenu}
          >
            <nav className="flex items-center space-x-12 md:pr-23">
              {menuItems.map((item) =>
                item.children ? (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      clearFirmCloseTimer();
                      setIsFirmOpen((prev) => !prev);
                    }}
                    onMouseEnter={openFirmMenu}
                    onFocus={openFirmMenu}
                    className={`group inline-flex items-center text-sm font-medium transition-colors ${
                      isLightNavbar
                        ? "text-gray-900 hover:text-primary"
                        : "text-white hover:text-white/80"
                    }`}
                    aria-expanded={isFirmOpen}
                  >
                    {item.title}
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${
                        isFirmOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <Link
                    key={item.id}
                    href={item.url}
                    className={`text-sm font-medium transition-colors ${
                      isLightNavbar
                        ? "text-gray-900 hover:text-primary"
                        : "text-white hover:text-white/80"
                    }`}
                  >
                    {item.title}
                  </Link>
                )
              )}
            </nav>

            <div
              className={`absolute left-20 top-full pt-3 transition-all duration-200 ${
                isFirmOpen
                  ? "opacity-100 translate-y-4.5 pointer-events-auto"
                  : "opacity-0 -translate-y-2 pointer-events-none"
              }`}
              style={{ zIndex: 60 }}
              onMouseEnter={openFirmMenu}
              onMouseLeave={scheduleCloseFirmMenu}
            >
              <div className="w-64  border border-gray-200 bg-white shadow-lg overflow-hidden">
                <div className="flex flex-col divide-y divide-gray-100">
                  {menuItems
                    .find((m) => m.children)
                    ?.children?.map((child) => (
                      <Link
                        key={child.id}
                        href={child.url}
                        className="px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <p className="text-sm font-semibold text-gray-900">
                          {child.title}
                        </p>
                        {/* <p className="text-xs text-gray-600">
                          Learn more about {child.title.toLowerCase()} at Riyan.
                        </p> */}
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Panel Toggle */}
          <button
            onClick={() => setIsPanelOpen(true)}
            className="flex flex-col items-center justify-center w-10 h-10 space-y-1.5 rounded-full border border-transparent hover:border-white/40 hover:bg-white/10 transition-colors"
            aria-label="Open contact panel"
            aria-expanded={isPanelOpen}
          >
            <div className="flex gap-2 items-center justify-center">
              <span
                className={`block w-1.5 h-1.5 rounded transition-all ${
                  isLightNavbar ? "bg-gray-900" : "bg-white"
                }`}
              />
              <span
                className={`block w-1.5 h-1.5 rounded transition-all ${
                  isLightNavbar ? "bg-gray-900" : "bg-white"
                }`}
              />
            </div>
            <div className="flex gap-2 items-center justify-center">
              <span
                className={`block w-1.5 h-1.5 rounded transition-all ${
                  isLightNavbar ? "bg-gray-900" : "bg-white"
                }`}
              />
              <span
                className={`block w-1.5 h-1.5 rounded transition-all ${
                  isLightNavbar ? "bg-gray-900" : "bg-white"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Contact Slide Panel */}
      <div
        className={`fixed inset-0 z-50 transition duration-300 ease-in-out ${
          isPanelOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!isPanelOpen}
      >
        <div
          className={`absolute inset-0 top-20 bg-black/60 transition-opacity duration-300 ${
            isPanelOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsPanelOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 h-[100dvh] flex flex-col ${
            isPanelOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-start justify-between px-6 py-10 border-b border-gray-200">
            <div
              className={`flex flex-col items-start gap-4 transition-all duration-500 ease-out ${
                isPanelOpen
                  ? "translate-x-0 opacity-100 delay-[300ms]"
                  : "translate-x-6 opacity-0"
              }`}
            >
              <p className="text-3xl uppercase tracking-[0.35em] text-primary">
                Contact Us
              </p>
              <p className="text-md font-semibold text-gray-900">
                Great things in business are never done by one.
              </p>
            </div>
            <button
              onClick={() => setIsPanelOpen(false)}
              aria-label="Close contact panel"
              className={`flex items-center justify-center h-[1.75rem] w-[2.75rem] text-primary transition-all duration-200 ease-out hover:scale-110 hover:text-primary-dark active:scale-95 ${
                isPanelOpen
                  ? "translate-x-0 opacity-100 delay-[100ms]"
                  : "translate-x-4 opacity-0"
              }`}
            >
              <span className="text-4xl leading-none mb- ml-4">X</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto panel-scroll">
            <div className="px-6 py-6 space-y-6 max-w-xl pb-24">
              <div
                className={`space-y-2 md:hidden transition-all duration-500 ease-out ${
                  isPanelOpen
                    ? "translate-x-0 opacity-100 delay-[500ms]"
                    : "translate-x-6 opacity-0"
                }`}
              >
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Navigation
                </p>
                <div className="flex flex-col gap-2">
                  {panelItems.map((item, idx) => (
                    <Link
                      key={item.id}
                      href={item.url}
                      className={`text-gray-900 hover:text-primary font-medium block py-1 transition-all duration-500 ease-out ${
                        isPanelOpen
                          ? "translate-x-0 opacity-100"
                          : "translate-x-4 opacity-0"
                      }`}
                      style={{ transitionDelay: `${540 + idx * 50}ms` }}
                      onClick={() => setIsPanelOpen(false)}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>

              <p
                className={`text-gray-700 leading-relaxed transition-all duration-500 ease-out ${
                  isPanelOpen
                    ? "translate-x-0 opacity-100 delay-[600ms]"
                    : "translate-x-6 opacity-0"
                }`}
              >
                Reach out to us, let&apos;s discuss about how we can help you.
              </p>

              <div
                className={`space-y-2 transition-all duration-500 ease-out ${
                  isPanelOpen
                    ? "translate-x-0 opacity-100 delay-[700ms]"
                    : "translate-x-6 opacity-0"
                }`}
              >
                <h3 className="text-3xl font-semibold text-gray-600 uppercase tracking-wide">
                  Need Help?
                </h3>
              </div>

              <div
                className={`space-y-4 transition-all duration-500 ease-out ${
                  isPanelOpen
                    ? "translate-x-0 opacity-100 delay-[800ms]"
                    : "translate-x-6 opacity-0"
                }`}
              >
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Email us directly
                  </p>
                  <a
                    href="mailto:info@riyan.com.mv"
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    info@riyan.com.mv
                  </a>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Call us directly
                  </p>
                  <a
                    href="tel:+9603315049"
                    className="text-lg font-semibold text-primary hover:underline"
                  >
                    +960 331 5049
                  </a>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                    On Social Media
                  </p>
                  <div className="flex gap-6 flex-wrap">
                    {socialLinks.map(({ label, href, icon: Icon }) => (
                      <Link
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-primary hover:scale-105 transition-transform"
                      >
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              
            </div>
          </div>
          <div className="border-t border-gray-200 px-6 py-5">
            <Link
              href="/firm/contact#contact-form"
              className="w-full text-xs tracking-[0.25em] uppercase text-gray-300 h-12 sm:h-14 bg-primary flex items-center justify-center hover:bg-primary-dark transition-colors rounded-md shadow-md"
              onClick={() => setIsPanelOpen(false)}
            >
              Get in Touch
              <ChevronRightCircle className="ml-3 h-6 w-6 sm:h-7 sm:w-7 animate-wiggle-right" />
            </Link>
          </div>
        </aside>
      </div>
    </header>
  );
}
