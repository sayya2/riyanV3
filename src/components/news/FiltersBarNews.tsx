'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { FormEvent } from "react";
import { DirectusNewsCategory } from "@/lib/directus";

type Props = {
  categories: DirectusNewsCategory[];
  selectedCategory: string;
  search: string;
  perPage: number;
};

const perPageOptions = [12, 24, 36, 48];

export default function FiltersBarNews({
  categories,
  selectedCategory,
  search,
  perPage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextCategory = (formData.get("category") as string) || "";
    const nextSearch = (formData.get("q") as string) || "";
    const nextPerPage = (formData.get("perPage") as string) || "";
    updateParams({
      category: nextCategory,
      q: nextSearch,
      perPage: nextPerPage,
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3 w-full md:w-auto text-[80%]">
      <input
        type="text"
        name="q"
        defaultValue={search}
        placeholder="Search news"
        className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <select
        name="category"
        defaultValue={selectedCategory}
        className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>
      <select
        name="perPage"
        defaultValue={perPage}
        className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
        onChange={(e) => updateParams({ perPage: e.target.value })}
      >
        {perPageOptions.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="inline-flex items-center justify-center px-5 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        Filter
      </button>
    </form>
  );
}
