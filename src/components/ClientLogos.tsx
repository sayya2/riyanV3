"use client";

import Image from "next/image";
import { useState } from "react";

type ClientLogo = { name: string; url: string };

type Category =
  | "Government of Maldives"
  | "Local Brands"
  | "International Brands"
  | "Bilateral & Multilateral Agencies";

interface ClientLogosProps {
  logosByCategory: Record<Category, ClientLogo[]>;
}

const categories: Category[] = [
  "Government of Maldives",
  "Local Brands",
  "International Brands",
  "Bilateral & Multilateral Agencies"
];

export default function ClientLogos({ logosByCategory }: ClientLogosProps) {
  const [activeTab, setActiveTab] = useState<Category>("Government of Maldives");
  const activeLogos = logosByCategory[activeTab] || [];

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
        {activeLogos.map((logo, index) => (
          <div
            key={index}
            className="group flex min-h-[140px] items-center justify-center  border border-gray-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:scale-105 hover:shadow-md"
          >
            <Image
              src={logo.url}
              alt={logo.name}
              width={240}
              height={240}
              className="object-contain w-full h-auto max-h-36"
            />
          </div>
        ))}
      </div>

      {activeLogos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No clients in this category yet.
        </div>
      )}
    </div>
  );
}
