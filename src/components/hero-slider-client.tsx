"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import { useRouter } from "next/navigation";
import type { HeroSlide } from "@/lib/db-new";
import { motion } from "framer-motion";
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
    [slides],
  );

  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeHandledRef = useRef(false);

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
      (prev) => (prev + delta + preparedSlides.length) % preparedSlides.length,
    );

  const handleSlideClick = () => {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false;
      return;
    }
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

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (preparedSlides.length < 2) return;
    const touch = event.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    swipeHandledRef.current = false;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (preparedSlides.length < 2 || !touchStartRef.current) return;
    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    swipeHandledRef.current = true;
    step(deltaX < 0 ? 1 : -1);
  };

  return (
    <section
      className={`full-bleed relative isolate h-[94vh]  md:h-[100vh] overflow-hidden bg-secondary text-white ${
        canNavigate ? "cursor-pointer" : ""
      }`}
      role={canNavigate ? "link" : undefined}
      tabIndex={canNavigate ? 0 : -1}
      aria-label={
        canNavigate ? `Open ${currentSlide?.title || "project"}` : undefined
      }
      onClick={handleSlideClick}
      onKeyDown={handleSlideKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
            <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/30 to-black/60" />
          </div>
        ))}
      </div>

      <div className="absolute inset-y-0 left-0 right-0 z-20 hidden md:block">
        <div className="group absolute inset-y-0 left-0 w-[40%]">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            className="absolute left-6 top-1/2 flex h-11 w-11 -translate-y-1/2 -translate-x-full items-center justify-center rounded-full border border-white/50 bg-white/10 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 group-hover:translate-x-0 group-hover:opacity-100"
            aria-label="Previous slide"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
        <div className="group absolute inset-y-0 right-0 w-[40%]">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            className="absolute right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 translate-x-full items-center justify-center rounded-full border border-white/50 bg-white/10 text-white opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 group-hover:translate-x-0 group-hover:opacity-100"
            aria-label="Next slide"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-10 h-full flex items-end">
        <div className="mx-auto w-full hero-gutter pb-12 md:pb-10 items-center">
          <div className="max-w-4xl space-y-4 md:space-y-6 drop-shadow-xl   ">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">
              Riyan Pvt Ltd
            </p>
            <h1 className="hero-slide-title font-semibold leading-tight">
              {currentSlide?.title || fallbackSlide.title}
            </h1>
            {currentSlide?.description && (
              <p className="hidden sm:block text-base sm:text-lg md:text-xl text-white/80 leading-relaxed max-w-3xl">
                {/* {currentSlide.description} */}
              </p>
            )}
          </div>

          <div className="mt-6 grid w-full grid-cols-3 items-center gap-3 md:mt-0 md:flex md:w-full md:items-center md:gap-4">
            {/* <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(-1);
              }}
              className="h-9 w-9 justify-self-start rounded-full border border-white/40 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-12 sm:w-12 md:order-1"
              aria-label="Previous slide"
            >
              {"<"}
            </button> */}

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

            {/* <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                step(1);
              }}
              className="h-9 w-9 justify-self-end rounded-full border border-white/40 bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20 sm:h-12 sm:w-12 md:order-2 md:ml-2"
              aria-label="Next slide"
            >
              {">"}
            </button> */}
          </div>
          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
              <div className="w-1 h-3 bg-white rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSliderClient;
