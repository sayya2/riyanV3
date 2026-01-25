import React from "react";
import { keySectors, keySectorsIntro } from "@/data/keySectors";
import { resolveImageUrl } from "@/lib/media";
import SectorSlider from "@/components/SectorSlider";

const KeySectors = () => {
  const sliderSectors = keySectors.map((sector) => ({
    name: sector.title,
    image: resolveImageUrl(sector.image) || sector.image,
  }));

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

      <SectorSlider sectors={sliderSectors} speed={50} />
    </section>
  );
};

export default KeySectors;
