"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type AdjacentLink = {
  slug: string;
  title: string;
  image?: string;
  eyebrow?: string;
};

type ProjectAdjacentNavProps = {
  prev?: AdjacentLink | null;
  next?: AdjacentLink | null;
  targetId: string;
  basePath?: string;
};

export default function ProjectAdjacentNav({
  prev,
  next,
  targetId,
  basePath = "projects",
}: ProjectAdjacentNavProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.12, rootMargin: "-15% 0px -55% 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);


  if (!prev && !next) return null;

  return (
    <>
      <div
        className={`hidden lg:block fixed top-1/2 left-0 right-0 z-40 -translate-y-1/2 transition-opacity duration-300 ${
          isVisible
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
      {prev && (
        <div className="group fixed top-1/2 left-0 -translate-y-1/2">
          <Link
            href={`/${basePath}/${prev.slug}`}
            className="flex h-10 w-10 items-center justify-center border border-transparent text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={`Previous ${(prev.eyebrow || "Project").toLowerCase()}: ${prev.title}`}
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
            {prev.image ? (
              <div
                className="pointer-events-none fixed top-1/2 left-[10%] -translate-y-1/2 z-40 w-[30vw] max-w-[380px] h-[52vh] bg-gray-100 bg-cover bg-center shadow-lg opacity-0 transition-transform duration-300 -translate-x-full group-hover:translate-x-0 group-hover:opacity-100 will-change-transform"
                style={{ backgroundImage: `url(${prev.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 to-black/0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">
                    {prev.eyebrow || "Project"}
                  </p>
                  <p className="text-lg font-semibold text-white leading-tight">
                    {prev.title}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

      {next && (
        <div className="group fixed top-1/2 right-0 -translate-y-1/2">
          <Link
            href={`/${basePath}/${next.slug}`}
            className="flex h-10 w-10 items-center justify-center border border-transparent text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={`Next ${(next.eyebrow || "Project").toLowerCase()}: ${next.title}`}
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
            {next.image ? (
              <div
                className="pointer-events-none fixed top-1/2 right-[10%] -translate-y-1/2 z-40 w-[30vw] max-w-[380px] h-[52vh] bg-gray-100 bg-cover bg-center shadow-lg opacity-0 transition-transform duration-300 translate-x-full group-hover:translate-x-0 group-hover:opacity-100 will-change-transform"
                style={{ backgroundImage: `url(${next.image})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-l from-black/35 to-black/0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">
                    {next.eyebrow || "Project"}
                  </p>
                  <p className="text-lg font-semibold text-white leading-tight">
                    {next.title}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="lg:hidden" />
    </>
  );
}
