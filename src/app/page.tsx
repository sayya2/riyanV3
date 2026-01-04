import Image from "next/image";
import Link from "next/link";
import React from "react";
import Hero from "../components/hero";
import AboutSection from "../components/sections/aboutSection";
import KeySectors from "../components/sections/keySectors";
import LatestNewsSection from "../components/sections/latestNews";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Reveal>
        <Hero />
      </Reveal>
      <div className="ml-[138px] mr-[138px]">
        <Reveal>
          <AboutSection />
        </Reveal>
        <Reveal>
          <KeySectors />
        </Reveal>
        <Reveal>
          <LatestNewsSection />
        </Reveal>
      </div>
    </main>
  );
}
