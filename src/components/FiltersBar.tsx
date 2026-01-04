'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { DirectusSector, DirectusService } from "@/lib/directus";

type Props = {
  sectors: DirectusSector[];
  services: DirectusService[];
  selectedSector: string;
  selectedService: string;
  search: string;
  perPage: number;
};

const perPageOptions = [20, 40, 60, 100];

export default function FiltersBar({
  sectors,
  services,
  selectedSector,
  selectedService,
  search,
  perPage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [sectorCounts, setSectorCounts] = useState<Record<string, number>>({});
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});
  const [localSector, setLocalSector] = useState(selectedSector);
  const [localService, setLocalService] = useState(selectedService);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSectors, setLoadingSectors] = useState(true);

  // Sync with URL params when they change
  useEffect(() => {
    setLocalSector(selectedSector);
  }, [selectedSector]);

  useEffect(() => {
    setLocalService(selectedService);
  }, [selectedService]);

  // Fetch sector counts when service changes
  useEffect(() => {
    async function fetchSectorCounts() {
      setLoadingSectors(true);
      try {
        const url = localService
          ? `/api/project-counts/sectors?service=${localService}`
          : '/api/project-counts/sectors';
        const response = await fetch(url);
        const data = await response.json();
        setSectorCounts(data);
        setLoadingSectors(false);
      } catch (error) {
        console.error('Failed to fetch sector counts:', error);
        setLoadingSectors(false);
      }
    }
    fetchSectorCounts();
  }, [localService]);

  // Fetch service counts when sector changes
  useEffect(() => {
    async function fetchServiceCounts() {
      setLoadingServices(true);
      try {
        const url = localSector
          ? `/api/project-counts/services?sector=${localSector}`
          : '/api/project-counts/services';
        const response = await fetch(url);
        const data = await response.json();
        setServiceCounts(data);
        setLoadingServices(false);
      } catch (error) {
        console.error('Failed to fetch service counts:', error);
        setLoadingServices(false);
      }
    }
    fetchServiceCounts();
  }, [localSector]);

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

  const onSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalSector(value);
    // Optionally auto-submit when sector changes
    // Uncomment the next line if you want instant filtering
    // updateParams({ sector: value, service: localService, q: search, perPage: String(perPage) });
  };

  const onServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalService(e.target.value);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({
      sector: localSector,
      category: undefined,
      service: localService,
      q: (event.currentTarget.querySelector('[name="q"]') as HTMLInputElement)?.value || "",
      perPage: (event.currentTarget.querySelector('[name="perPage"]') as HTMLSelectElement)?.value || String(perPage),
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3 w-full md:w-auto text-[80%]">
      <input
        type="text"
        name="q"
        defaultValue={search}
        placeholder="Search projects"
        className="border border-gray-300  px-4 py-2 w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <select
        name="sector"
        value={localSector}
        onChange={onSectorChange}
        disabled={loadingSectors}
        className="border border-gray-300  px-3 py-2 w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
      >
        <option value="">{loadingSectors ? 'Loading...' : 'All Sectors'}</option>
        {sectors.map((sector) => {
          const count = sectorCounts[sector.slug];
          return (
            <option key={sector.slug} value={sector.slug}>
              {sector.name}{count !== undefined ? ` (${count})` : ''}
            </option>
          );
        })}
      </select>
      <select
        name="service"
        value={localService}
        onChange={onServiceChange}
        disabled={loadingServices}
        className="border border-gray-300  px-3 py-2 w-full md:w-56 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
      >
        <option value="">{loadingServices ? 'Loading...' : 'All Services'}</option>
        {services.map((svc) => {
          const count = serviceCounts[svc.slug];
          return (
            <option key={svc.slug} value={svc.slug}>
              {svc.name}{count !== undefined ? ` (${count})` : ''}
            </option>
          );
        })}
      </select>
      <select
        name="perPage"
        defaultValue={perPage}
        className="border border-gray-300  px-3 py-2 w-full md:w-40 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
        className="inline-flex items-center justify-center px-5 py-2  bg-primary text-white hover:bg-primary/90 transition-colors"
      >
        Filter
      </button>
    </form>
  );
}
