import React from "react";
import Link from "next/link";
import { AboutSection as AboutContent } from "@/data/Data";
import { getAboutCarouselImages } from "@/lib/db-new";

const AboutSection = async () => {
  const carouselImages = await getAboutCarouselImages();
  // Duplicate images to create continuous scroll effect
  const leftImages = [
    ...carouselImages.filter((_, i) => i % 2 === 0),
    ...carouselImages.filter((_, i) => i % 2 === 0),
  ];
  const rightImages = [
    ...carouselImages.filter((_, i) => i % 2 === 1),
    ...carouselImages.filter((_, i) => i % 2 === 1),
  ];

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-4 md:space-y-5">
            <h6 className="text-xs md:text-sm uppercase tracking-wider text-primary font-semibold">
              About Riyan
            </h6>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              {AboutContent.title}
            </h2>
            <div className="space-y-3 md:space-y-4">
              {AboutContent.paragraphs?.map((text, index) => (
                <p
                  key={index}
                  className="text-sm md:text-base text-gray-600 leading-relaxed"
                >
                  {text}
                </p>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Link
                href="/firm/about"
                className="relative inline-flex text-primary font-medium transition-colors hover:text-primary/80 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative h-80 md:h-96 lg:h-[28rem] overflow-hidden rounded-lg shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none z-10" />
            <div className="absolute inset-0 grid grid-cols-2 gap-2 md:gap-3">
              <div className="flex flex-col gap-2 md:gap-3 animate-vertical-up">
                {leftImages.map((src, idx) => (
                  <div
                    key={`left-${src}-${idx}`}
                    className="relative aspect-square overflow-hidden rounded-md"
                  >
                    <img
                      src={src}
                      alt="Riyan project"
                      className="w-full h-full object-cover"
                      loading={idx > 8 ? "lazy" : "eager"}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 md:gap-3 animate-vertical-down">
                {rightImages.map((src, idx) => (
                  <div
                    key={`right-${src}-${idx}`}
                    className="relative aspect-square overflow-hidden rounded-md"
                  >
                    <img
                      src={src}
                      alt="Riyan project"
                      className="w-full h-full object-cover"
                      loading={idx > 8 ? "lazy" : "eager"}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </section>
  );
};

export default AboutSection;
