import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const NEWS_TAG = "directus:news";
const PROJECTS_TAG = "directus:projects";

function isValidSecret(request: NextRequest): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false;

  const provided =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-revalidate-secret") ??
    "";

  return provided === expected;
}

async function tryResolveSlug(
  collection: string,
  key: unknown
): Promise<string | null> {
  if (key === null || key === undefined) return null;

  const keyString = String(key).trim();
  if (!keyString) return null;

  if (!/^\d+$/.test(keyString)) {
    return keyString;
  }

  const directusUrl = process.env.DIRECTUS_URL || "http://localhost:8055";

  try {
    const response = await fetch(
      `${directusUrl}/items/${collection}/${encodeURIComponent(
        keyString
      )}?fields=slug,status`,
      { cache: "no-store" }
    );

    if (!response.ok) return null;
    const json = (await response.json()) as any;
    const slug = json?.data?.slug;
    const status = json?.data?.status;
    if (status !== "published") return null;
    return typeof slug === "string" && slug.trim().length > 0 ? slug : null;
  } catch {
    return null;
  }
}

async function tryResolveNewsSlug(key: unknown): Promise<string | null> {
  return tryResolveSlug("news", key);
}

async function tryResolveProjectSlug(key: unknown): Promise<string | null> {
  return tryResolveSlug("projects", key);
}

type DirectusWebhookPayload = {
  event?: string;
  collection?: string;
  key?: string | number;
  keys?: Array<string | number>;
  payload?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  if (!isValidSecret(request)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Unauthorized. Provide ?secret=... or x-revalidate-secret header, and set REVALIDATE_SECRET in the web container.",
      },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as DirectusWebhookPayload;
  const collection = body?.collection;

  // Always invalidate Directus caches
  revalidateTag(NEWS_TAG, "default");
  revalidateTag(PROJECTS_TAG, "default");

  // Revalidate main surfaces
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/projects");

  const keys = Array.isArray(body?.keys)
    ? body.keys
    : body?.key !== undefined
      ? [body.key]
      : [];

  // If this came from a Directus news change, also revalidate the detail page
  if (collection === "news") {
    for (const key of keys) {
      const slug = await tryResolveNewsSlug(key);
      if (slug) revalidatePath(`/news/${slug}`);
    }
  }

  // If this came from a Directus projects change, also revalidate the detail page
  if (collection === "projects") {
    for (const key of keys) {
      const slug = await tryResolveProjectSlug(key);
      if (slug) revalidatePath(`/projects/${slug}`);
    }
  }

  return NextResponse.json({ ok: true, collection, revalidated: keys.length });
}

export async function GET(request: NextRequest) {
  if (!isValidSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");

  revalidateTag(NEWS_TAG, "default");
  revalidateTag(PROJECTS_TAG, "default");
  revalidatePath("/");
  revalidatePath("/news");
  revalidatePath("/projects");
  if (path) revalidatePath(path);

  return NextResponse.json({ ok: true });
}
