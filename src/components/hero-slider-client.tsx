"use client";

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
    setActiveIndex(
      (prev) => (prev + delta + preparedSlides.length) % preparedSlides.length
    );

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
      className={`full-bleed relative isolate h-[100vh] md:h-screen overflow-hidden bg-secondary text-white ${
        canNavigate ? "cursor-pointer" : ""
      }`}
      role={canNavigate ? "link" : undefined}
      tabIndex={canNavigate ? 0 : -1}
      aria-label={
        canNavigate ? `Open ${currentSlide?.title || "project"}` : undefined
      }
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
        <div className="container mx-auto px-6 sm:px-10 md:px-2 lg:-px-12 pb-12 md:pb-20">
          <div className="max-w-4xl space-y-4 md:space-y-6 drop-shadow-xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">
              Riyan Pvt Ltd
            </p>
            <h1 className="hero-slide-title font-semibold leading-tight">
              {currentSlide?.title || fallbackSlide.title}
            </h1>
            {currentSlide?.description && (
              <p className="hidden sm:block text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl">
                {currentSlide.description}
              </p>
            )}
          </div>

          <div className="mt-6 grid w-full grid-cols-3 items-center gap-3 md:mt-10 md:flex md:w-full md:items-center md:gap-4">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              className="h-9 w-9 justify-self-start rounded-full border border-white/40 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-12 sm:w-12 md:order-1"
              aria-label="Previous slide"
            >
              {"<"}
            </button>

            <div
              className="flex items-center justify-center gap-2 md:order-3 md:ml-auto"
              aria-label="Hero slides"
            >
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
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === activeIndex
                      ? "w-8 sm:w-10 bg-white"
                      : "w-4 sm:w-5 bg-white/40 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              className="h-9 w-9 justify-self-end rounded-full border border-white/40 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-12 sm:w-12 md:order-2 md:ml-2"
              aria-label="Next slide"
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSliderClient;
