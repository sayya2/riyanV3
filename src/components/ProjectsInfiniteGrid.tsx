"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { DirectusProject } from "@/lib/directus";

const fallbackImg =
  "/wp-content/uploads/about_gallery/1_Collaboration-Space.jpg";

const cardHeights = [
  "h-52 md:h-60",
  "h-96 md:h-[32rem]",
  "h-72 md:h-[24rem]",
  "h-56 md:h-64",
  "h-80 md:h-[26rem]",
  "h-52 md:h-60",
  "h-[18rem] md:h-[28rem]",
  "h-60 md:h-[20rem]",
];

function stripHtml(input: string) {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatProjectStatus(project: {
  year?: string | null;
  completed_year?: string | null;
}) {
  const rawStatus = (project.year || "").trim().toLowerCase();
  const completedYear = project.completed_year?.trim();
  const yearIsNumeric = /^\d{4}$/.test(project.year?.trim() || "");

  if (rawStatus === "ongoing") return "Ongoing";
  if (rawStatus === "completed") {
    return completedYear ? `Completed ${completedYear}` : "Completed";
  }
  if (yearIsNumeric) return `Completed ${project.year}`;
  return project.year ? project.year : "Ongoing";
}

type ProjectsInfiniteGridProps = {
  initialProjects: DirectusProject[];
  limit: number;
  sector?: string;
  service?: string;
  search?: string;
};

export default function ProjectsInfiniteGrid({
  initialProjects,
  limit,
  sector,
  service,
  search,
}: ProjectsInfiniteGridProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProjects.length === limit);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProjects(initialProjects);
    setHasMore(initialProjects.length === limit);
    setIsLoading(false);
  }, [initialProjects, limit, sector, service, search]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (sector) params.set("sector", sector);
      if (service) params.set("service", service);
      if (search) params.set("q", search);
      params.set("limit", String(limit));
      params.set("offset", String(projects.length));

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch projects (${response.status})`);
      }

      const data = await response.json();
      const nextProjects: DirectusProject[] = Array.isArray(data?.projects)
        ? data.projects
        : [];

      setProjects((prev) => [...prev, ...nextProjects]);
      setHasMore(nextProjects.length === limit);
    } catch (error) {
      console.error("Failed to load more projects:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, limit, projects.length, sector, service, search]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <>
      <div className="columns-1 md:columns-2 xl:columns-3 gap-x-4">
        {projects.map((project, index) => {
          const href = project.slug ? `/projects/${project.slug}` : "#";
          const sectorsText = (project.sectors || [])
            .map((c) => c.sector_id?.name)
            .filter(Boolean)
            .join(", ");
          const servicesText = (project.services || [])
            .map((s) => s.service_id?.name)
            .filter(Boolean)
            .join(", ");
          const statusText = formatProjectStatus(project);
          const clientText = project.client || "Client";
          const categoryText = sectorsText || servicesText || "Project";
          const metaLine = [clientText, statusText]
            .filter(Boolean)
            .join(" - ");
          const img = project.featured_image || fallbackImg;
          const heightIndex =
            (Number(project.id || 0) * 3 + index * 5) % cardHeights.length;
          const cardHeight = cardHeights[Math.abs(heightIndex)];

          return (
            <div key={project.id} className="mb-4 break-inside-avoid">
              <Link
                href={href}
                className={`group relative block overflow-hidden ${cardHeight} bg-gray-100 shadow-sm hover:shadow-lg transition-all duration-300`}
              >
                <Image
                  src={img}
                  alt={project.title}
                  fill
                  sizes="(min-width:1024px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end gap-2 p-5 text-[98%]">
                  <p className="!text-[0.7rem] tracking-widest text-white/80 font-semibold">
                    {metaLine}
                  </p>
                  <h3 className="project-card-title font-semibold text-white drop-shadow-sm">
                    {project.title}
                  </h3>
                  <p className="!text-[0.65rem] italic text-white/80">
                    {categoryText}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
      <div ref={sentinelRef} className="flex justify-center py-8">
        {isLoading ? (
          <span className="text-sm text-gray-600">Loading more projects...</span>
        ) : !hasMore ? (
          <span className="text-sm text-gray-500">No more projects.</span>
        ) : null}
      </div>
    </>
  );
}
