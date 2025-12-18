import React from "react";
import Link from "next/link";
import { AboutSection as AboutContent } from "@/data/Data";
import { getAboutCarouselImages } from "@/lib/db-new";

const AboutSection = async () => {
  const carouselImages = await getAboutCarouselImages();
  // Duplicate images to create continuous scroll effect
  const leftImages = [...carouselImages.filter((_, i) => i % 2 === 0), ...carouselImages.filter((_, i) => i % 2 === 0)];
  const rightImages = [...carouselImages.filter((_, i) => i % 2 === 1), ...carouselImages.filter((_, i) => i % 2 === 1)];

  return (
    <section className="py-24 ">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h6 className="text-sm uppercase tracking-wider text-primary font-semibold mb-4">
              About Riyan
            </h6>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {AboutContent.title}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {AboutContent.paragraphs[0] ||
                "Riyan provides comprehensive professional services tailored to meet the unique needs of our clients. With years of experience and a commitment to excellence, we deliver results that exceed expectations."}
            </p>
            <Link
              href="/firm"
              className="inline-block text-primary hover:text-primary/80 font-medium"
            >
              Learn More
            </Link>
          </div>

          <div className="relative h-96 overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute inset-0 grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-3 animate-vertical-up">
                {leftImages.map((src, idx) => (
                  <div
                    key={`left-${src}-${idx}`}
                    className="relative aspect-square overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt="Riyan project"
                      className="w-full h-full object-cover"
                      loading={idx > 8 ? "lazy" : "eager"}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3 animate-vertical-down">
                {rightImages.map((src, idx) => (
                  <div
                    key={`right-${src}-${idx}`}
                    className="relative aspect-square overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
      </div>
    </section>
  );
};

export default AboutSection;
