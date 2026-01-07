import React from "react";
import Link from "next/link";
import Image from "next/image";
import { keySectors, keySectorsIntro } from "@/data/keySectors";
import { resolveImageUrl } from "@/lib/media";

const KeySectors = () => {
  const firstRow = keySectors.slice(0, 2);
  const secondRow = keySectors.slice(2);

  return (
    <section className="pb-24 md:pb-28">
      <div className="container mx-auto px-4 space-y-12">
        <div className="max-w-8xl space-y-4">
          <h2 className="text-4xl md:text-5xl font-semibold text-gray-900">
            Key Sectors
          </h2>
          <p className="text-lg text-gray-700">
            {keySectorsIntro}
          </p>
        </div>

        <div className="grid gap-6 md:gap-8">
          <div className="grid md:grid-cols-2 gap-6">
            {firstRow.map((sector) => (
              <SectorCard key={sector.title} {...sector} />
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {secondRow.map((sector) => (
              <SectorCard key={sector.title} {...sector} />
            ))}
          </div>
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
      className="group relative block overflow-hidden h-72 md:h-[360px] bg-gray-200"
    >
      <Image
        src={resolvedImage}
        alt={title}
        fill
        sizes="(min-width: 1024px) 33vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
        priority={false}
      />
      {/* <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/20 to-transparent" /> */}
      <div className="absolute inset-0 flex items-end p-6">
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
      </div>
    </Link>
  );
}

export default KeySectors;
