'use client';

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { DirectusSector, DirectusService } from "@/lib/directus";

type Props = {
  sectors: DirectusSector[];
  services: DirectusService[];
  selectedSector: string;
  selectedService: string;
  search: string;
  perPage: number;
};

// const perPageOptions = [20, 40, 60, 100];

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
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);

  const sectorDropdownRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  // Sync with URL params when they change
  useEffect(() => {
    setLocalSector(selectedSector);
  }, [selectedSector]);

  useEffect(() => {
    setLocalService(selectedService);
  }, [selectedService]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sectorDropdownRef.current && !sectorDropdownRef.current.contains(event.target as Node)) {
        setShowSectorDropdown(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const onSectorChange = (value: string) => {
    setLocalSector(value);
    setShowSectorDropdown(false);
    // Auto-filter when sector changes
    updateParams({ sector: value, service: localService, q: search });
  };

  const onServiceChange = (value: string) => {
    setLocalService(value);
    setShowServiceDropdown(false);
    // Auto-filter when service changes
    updateParams({ sector: localSector, service: value, q: search });
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Auto-filter on search with debounce
    updateParams({ sector: localSector, service: localService, q: value });
  };

  const selectedSectorName = sectors.find(s => s.slug === localSector)?.name || 'All Sectors';
  const selectedServiceName = services.find(s => s.slug === localService)?.name || 'All Services';

  return (
    <div className="flex flex-col gap-4 w-full mt-6">
      {/* Search bar */}
      <input
        type="text"
        name="q"
        defaultValue={search}
        onChange={onSearchChange}
        placeholder="Search projects..."
        className="border border-gray-300 rounded px-4 py-2.5 w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
      />

      {/* Prompt-style filter */}
      <div className="flex flex-wrap items-center gap-2 text-base md:text-lg text-gray-700">
        <span>Show projects in</span>

        {/* Sector Dropdown */}
        <div className="relative inline-block" ref={sectorDropdownRef}>
          <button
            type="button"
            onClick={() => setShowSectorDropdown(!showSectorDropdown)}
            disabled={loadingSectors}
            className="inline-flex items-center gap-1 text-primary font-semibold hover:text-primary/80 transition-colors underline decoration-dotted underline-offset-4 disabled:opacity-50"
          >
            {loadingSectors ? 'Loading...' : selectedSectorName}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showSectorDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
              <button
                type="button"
                onClick={() => onSectorChange('')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                All Sectors
              </button>
              {sectors.map((sector) => {
                const count = sectorCounts[sector.slug];
                return (
                  <button
                    key={sector.slug}
                    type="button"
                    onClick={() => onSectorChange(sector.slug)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    {sector.name}{count !== undefined ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span>and</span>

        {/* Service Dropdown */}
        <div className="relative inline-block" ref={serviceDropdownRef}>
          <button
            type="button"
            onClick={() => setShowServiceDropdown(!showServiceDropdown)}
            disabled={loadingServices}
            className="inline-flex items-center gap-1 text-primary font-semibold hover:text-primary/80 transition-colors underline decoration-dotted underline-offset-4 disabled:opacity-50"
          >
            {loadingServices ? 'Loading...' : selectedServiceName}
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showServiceDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
              <button
                type="button"
                onClick={() => onServiceChange('')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                All Services
              </button>
              {services.map((svc) => {
                const count = serviceCounts[svc.slug];
                return (
                  <button
                    key={svc.slug}
                    type="button"
                    onClick={() => onServiceChange(svc.slug)}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    {svc.name}{count !== undefined ? ` (${count})` : ''}
                  </button>
                );
              })}
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
