'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { DirectusNewsCategory } from "@/lib/directus";

type Props = {
  categories: DirectusNewsCategory[];
  selectedCategory: string;
  search: string;
  perPage: number;
};

// const perPageOptions = [12, 24, 36, 48];

export default function FiltersBarNews({
  categories,
  selectedCategory,
  search,
  perPage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localCategory, setLocalCategory] = useState(selectedCategory);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Sync with URL params when they change
  useEffect(() => {
    setLocalCategory(selectedCategory);
  }, [selectedCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
  };

  const onCategoryChange = (value: string) => {
    setLocalCategory(value);
    setShowCategoryDropdown(false);
    // Auto-filter when category changes
    updateParams({ category: value, q: search });
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Auto-filter on search
    updateParams({ category: localCategory, q: value });
  };

  const selectedCategoryName = categories.find(c => c.slug === localCategory)?.name || 'All Categories';

  return (
    <div className="flex flex-col gap-4 w-full mt-6">
      {/* Search bar */}
      <input
        type="text"
        name="q"
        defaultValue={search}
        onChange={onSearchChange}
        placeholder="Search news..."
        className="border border-gray-300 rounded px-4 py-2.5 w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      />

      {/* Prompt-style filter */}
      <div className="flex flex-wrap items-center gap-2 text-base md:text-lg text-gray-700">
        <span>Show news in</span>

        {/* Category Dropdown */}
        <div className="relative inline-block" ref={categoryDropdownRef}>
          <button
            type="button"
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className="inline-flex items-center gap-1 text-primary font-semibold hover:text-primary/80 transition-colors underline decoration-dotted underline-offset-4"
          >
            {selectedCategoryName}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCategoryDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
              <button
                type="button"
                onClick={() => onCategoryChange('')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => onCategoryChange(cat.slug)}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commented out perPage selector */}
      {/* <select
        name="perPage"
        defaultValue={perPage}
        className="border border-gray-300 rounded px-3 py-2 w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        onChange={(e) => updateParams({ perPage: e.target.value })}
      >
        {perPageOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select> */}
    </div>
  );
}
