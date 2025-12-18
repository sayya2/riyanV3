'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { DirectusProjectCategory, DirectusService } from "@/lib/directus";

type Props = {
  categories: DirectusProjectCategory[];
  services: DirectusService[];
  selectedCategory: string;
  selectedService: string;
  search: string;
  perPage: number;
};

const perPageOptions = [20, 40, 60, 100];

export default function FiltersBar({
  categories,
  services,
  selectedCategory,
  selectedService,
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

  const onSubmit = (formData: FormData) => {
    const nextCategory = (formData.get("category") as string) || "";
    const nextService = (formData.get("service") as string) || "";
    const nextSearch = (formData.get("q") as string) || "";
    const nextPerPage = (formData.get("perPage") as string) || "";
    updateParams({
      category: nextCategory,
      service: nextService,
      q: nextSearch,
      perPage: nextPerPage,
    });
  };

  return (
    <form action={onSubmit} className="flex flex-col md:flex-row gap-3 w-full md:w-auto text-[80%]">
      <input
        type="text"
        name="q"
        defaultValue={search}
        placeholder="Search projects"
        className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <select
        name="category"
        defaultValue={selectedCategory}
        className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">All Sectors</option>
        {categories.map((cat) => (
          <option key={cat.slug} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>
      <select
        name="service"
        defaultValue={selectedService}
        className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="">All Services</option>
        {services.map((svc) => (
          <option key={svc.slug} value={svc.slug}>
            {svc.name}
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
