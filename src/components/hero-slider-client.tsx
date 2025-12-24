'use client';

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import type { HeroSlide } from "@/lib/db-new";

type Props = {
  slides: HeroSlide[];
};

const fallbackSlide: HeroSlide = {
  id: -1,
  title: "Integrated Solutions.",
  description:
    "Design, engineering, project management, and research expertise from a Maldives-based team.",
  image_url: "/wp-content/uploads/2022/06/hd-1800x900-1.png",
  link_url: "",
  sort_order: 0,
  status: "published",
};

const HeroSliderClient = ({ slides }: Props) => {
  const preparedSlides = useMemo<HeroSlide[]>(
    () => (slides && slides.length > 0 ? slides : [fallbackSlide]),
    [slides]
  );

  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [preparedSlides.length]);

  useEffect(() => {
    if (preparedSlides.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % preparedSlides.length);
    }, 7000);

    return () => clearInterval(timer);
  }, [preparedSlides.length]);

  const currentSlide = preparedSlides[activeIndex];
  const canNavigate = Boolean(currentSlide?.link_url);

  const goTo = (index: number) => setActiveIndex(index);
  const step = (delta: number) =>
    setActiveIndex((prev) => (prev + delta + preparedSlides.length) % preparedSlides.length);

  const handleSlideClick = () => {
    if (!canNavigate || !currentSlide?.link_url) return;
    router.push(currentSlide.link_url);
  };

  const handleSlideKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!canNavigate || !currentSlide?.link_url) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(currentSlide.link_url);
    }
  };

  return (
    <section
      className={`full-bleed relative isolate h-[80vh] md:h-screen overflow-hidden bg-secondary text-white ${
        canNavigate ? "cursor-pointer" : ""
      }`}
      role={canNavigate ? "link" : undefined}
      tabIndex={canNavigate ? 0 : -1}
      aria-label={canNavigate ? `Open ${currentSlide?.title || "project"}` : undefined}
      onClick={handleSlideClick}
      onKeyDown={handleSlideKeyDown}
    >
      <div className="absolute inset-0">
        {preparedSlides.map((slide, idx) => (
          <div
            key={slide.id ?? idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === activeIndex ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={idx !== activeIndex}
          >
            <Image
              src={slide.image_url || fallbackSlide.image_url}
              alt={slide.title || "Riyan project"}
              fill
              priority={idx === 0}
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/60" />
          </div>
        ))}
      </div>

      <div className="relative z-10 h-full flex items-end">
        <div className="container mx-auto px-16 pb-12 md:pb-20">
          <div className="max-w-4xl space-y-4 md:space-y-6 drop-shadow-xl">
            <p className="text-xs uppercase tracking-[0.35em] text-white/70">Riyan Pvt Ltd</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight">
              {currentSlide?.title || fallbackSlide.title}
            </h1>
            {currentSlide?.description && (
              <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl">
                {currentSlide.description}
              </p>
            )}
          </div>

          <div className="mt-10 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                className="h-12 w-12 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                aria-label="Previous slide"
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                className="h-12 w-12 rounded-full border border-white/40 bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
                aria-label="Next slide"
              >
                {">"}
              </button>
            </div>

            <div className="flex items-center gap-3" aria-label="Hero slides">
              {preparedSlides.map((slide, idx) => (
                <button
                  key={slide.id ?? idx}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goTo(idx);
                  }}
                  aria-label={`Go to slide ${idx + 1}`}
                  aria-current={idx === activeIndex}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === activeIndex ? "w-10 bg-white" : "w-5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSliderClient;
