"use client";

import Image from "next/image";
import { useState } from "react";

type ClientLogo = { name: string; url: string };

interface ClientLogosProps {
  logos: ClientLogo[];
}

type Category = "Government of Maldives" | "Local Brands" | "International Brands" | "Bilateral & Multilateral Agencies";

const categories: Category[] = [
  "Government of Maldives",
  "Local Brands",
  "International Brands",
  "Bilateral & Multilateral Agencies"
];

// Categorize logos based on their names - matching WordPress categorization
const categorizeLogos = (logos: ClientLogo[]) => {
  const categorized: Record<Category, ClientLogo[]> = {
    "Government of Maldives": [],
    "Local Brands": [],
    "International Brands": [],
    "Bilateral & Multilateral Agencies": []
  };

  // Based on WordPress HTML categorization
  const governmentOfMaldives = [
    "asset-1"  // The composite government logo image
  ];

  const localBrands = [
    "adk-hospital", "aima", "asandha", "bandos", "bank-of-maldives", "bml",
    "dhiraagu", "fsm", "gan-international-airport", "ensis", "hbl-maldives",
    "hdfc", "housing-development-corporation", "hdc", "indira-gandhi", "igmh",
    "island-aviation", "maldives-airports", "maldives-islamic-bank",
    "maldives-monitary-authority", "maldives-ports", "momentum", "mpao",
    "mtcc", "mtdc", "mwsc", "ooredoo", "rdc", "stelco", "sto",
    "sunland", "universal-enterprises", "villa", "berthold", "gaar"
  ];

  const internationalBrands = [
    "afcons", "amari", "anantara", "ares", "banyan", "brookfield", "cbre",
    "clubmed", "damak", "dubai-holding", "dusit", "four-seasons",
    "gleeds", "grt", "hyatt", "jumeirah", "meinhardt", "mthojgaard",
    "omnium", "oneonly", "reethi-rah", "onyx", "panchshil", "reethi-beach",
    "renaatus", "ithaa", "rlb", "hooloomann", "robinson", "samana",
    "sanken", "soneva", "starwood", "tata", "tui", "vx", "w-maldives",
    "494642433"  // Catch any numeric project images
  ];

  const bilateralAgencies = [
    "abu-dhabi-fund", "adfd", "asian-development", "adb",
    "global-environment-facility", "gef", "green-climate-fund",
    "ifrc", "international-fund", "agricultural", "islamic-development-bank",
    "jica", "saudi-fund", "sfd", "opec-fund", "ofid", "world-bank",
    "undp", "unicef", "usaid", "world-health-organization", "who"
  ];

  logos.forEach(logo => {
    const lowerName = logo.name.toLowerCase();
    const lowerUrl = logo.url.toLowerCase();
    const searchStr = `${lowerName} ${lowerUrl}`;

    if (governmentOfMaldives.some(kw => searchStr.includes(kw))) {
      categorized["Government of Maldives"].push(logo);
    } else if (bilateralAgencies.some(kw => searchStr.includes(kw))) {
      categorized["Bilateral & Multilateral Agencies"].push(logo);
    } else if (localBrands.some(kw => searchStr.includes(kw))) {
      categorized["Local Brands"].push(logo);
    } else if (internationalBrands.some(kw => searchStr.includes(kw))) {
      categorized["International Brands"].push(logo);
    }
    // Don't add uncategorized logos to any category
  });

  return categorized;
};

export default function ClientLogos({ logos }: ClientLogosProps) {
  const [activeTab, setActiveTab] = useState<Category>("Government of Maldives");
  const categorizedLogos = categorizeLogos(logos);

  return (
    <div className="border-t border-gray-300 pt-8">
      <p className="text-sm text-gray-600 mb-6">CLIENT CATEGORIES</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-gray-200">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveTab(category)}
            className={`pb-3 px-2 text-base font-medium transition-colors border-b-2 ${
              activeTab === category
                ? "border-[#781213] text-[#781213]"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Logos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 min-h-[200px]">
        {categorizedLogos[activeTab].map((logo, index) => (
          <div
            key={index}
            className="flex items-center justify-center p-2"
          >
            <Image
              src={logo.url}
              alt={logo.name}
              width={180}
              height={180}
              className="object-contain w-full h-auto max-h-28"
            />
          </div>
        ))}
      </div>

      {categorizedLogos[activeTab].length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No clients in this category yet.
        </div>
      )}
    </div>
  );
}
