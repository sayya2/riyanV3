import React from "react";
import Link from "next/link";
import Image from "next/image";
import { keySectors, keySectorsIntro } from "@/data/keySectors";
import { resolveImageUrl } from "@/lib/media";

const KeySectors = () => {
  const firstRow = keySectors.slice(0, 2);
  const secondRow = keySectors.slice(2);

  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-8xl space-y-3 md:space-y-4 mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
            Key Sectors
          </h2>
          <p className="text-base md:text-lg text-gray-700 max-w-5xl">
            {keySectorsIntro}
          </p>
        </div>

        <div className="grid gap-4 md:gap-5 lg:gap-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
            {firstRow.map((sector) => (
              <SectorCard key={sector.title} {...sector} />
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
            {secondRow.map((sector) => (
              <SectorCard key={sector.title} {...sector} />
            ))}
          </div>
        </div>
    </section>
  );
};

type SectorCardProps = {
  title: string;
  image: string;
  href?: string;
};

function SectorCard({ title, image, href }: SectorCardProps) {
  const resolvedImage = resolveImageUrl(image) || image;

  return (
    <Link
      href={href || "#"}
      className="group relative block overflow-hidden h-48 md:h-52 lg:h-56 bg-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
    >
      <Image
        src={resolvedImage}
        alt={title}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-0 flex items-end p-4 md:p-5 lg:p-6">
        <h3 className="text-xl md:text-2xl font-semibold text-white">{title}</h3>
      </div>
    </Link>
  );
}

export default KeySectors;
