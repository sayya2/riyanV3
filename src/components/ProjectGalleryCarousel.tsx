"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ProjectGalleryCarouselProps = {
  images: string[];
  title: string;
};

export default function ProjectGalleryCarousel({
  images,
  title,
}: ProjectGalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const total = images.length;
  const currentSrc = useMemo(
    () => images[currentIndex],
    [images, currentIndex]
  );

  const goTo = (index: number) => {
    if (!total) return;
    const normalized = (index + total) % total;
    setCurrentIndex(normalized);
  };

  if (!total) {
    return null;
  }

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSrc}
          className="absolute inset-0"
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 1.02 }
          }
          transition={{
            duration: prefersReducedMotion ? 0 : 0.35,
            ease: "easeOut",
          }}
        >
          <Image
            src={currentSrc}
            alt={`${title} gallery image ${currentIndex + 1}`}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 65vw, 90vw"
          />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

      <button
        type="button"
        onClick={() => goTo(currentIndex - 1)}
        className="hidden: absolute left-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
        aria-label="Previous image"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => goTo(currentIndex + 1)}
        className="absolute right-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur transition hover:bg-black/60"
        aria-label="Next image"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="hidden md:absolute md:bottom-4 md:left-1/2 md:z-10 md:flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur">
        {images.map((_, index) => (
          <button
            key={`gallery-dot-${index}`}
            type="button"
            onClick={() => goTo(index)}
            className={`h-2.5 rounded-full transition ${
              index === currentIndex
                ? "w-8 bg-white"
                : "w-2.5 bg-white/50 hover:bg-white/70"
            }`}
            aria-label={`Go to image ${index + 1}`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
  );
}
