import { NextResponse } from "next/server";
import { getProjects } from "@/lib/directus";

const resolveLimit = (value: string | null) => {
  const parsed = value ? Number(value) : 24;
  return [20, 40, 60, 100].includes(parsed) ? parsed : 24;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get("sector") || undefined;
    const service = searchParams.get("service") || undefined;
    const search = searchParams.get("q") || undefined;
    const limit = resolveLimit(searchParams.get("limit"));
    const offset = Math.max(0, Number(searchParams.get("offset") || 0));

    const projects = await getProjects({
      sectorSlug: sector,
      serviceSlug: service,
      search,
      limit,
      offset,
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}
