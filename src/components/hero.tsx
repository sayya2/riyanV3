import HeroSliderClient from "./hero-slider-client";
import { getHeroSlides, type HeroSlide } from "@/lib/db-new";

const Hero = async () => {
  let slides: HeroSlide[] = [];

  try {
    slides = await getHeroSlides();
  } catch (error) {
    console.error("Failed to load hero slides:", error);
  }

  return <HeroSliderClient slides={slides} />;
};

export default Hero;
