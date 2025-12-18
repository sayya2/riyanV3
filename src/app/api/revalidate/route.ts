import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

const NEWS_TAG = "directus:news";

function isValidSecret(request: NextRequest): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected) return false;

  const provided =
    request.nextUrl.searchParams.get("secret") ??
    request.headers.get("x-revalidate-secret") ??
    "";

  return provided === expected;
}

async function tryResolveNewsSlug(key: unknown): Promise<string | null> {
  if (key === null || key === undefined) return null;

  const keyString = String(key).trim();
  if (!keyString) return null;

  if (!/^\d+$/.test(keyString)) {
    return keyString;
  }

  const directusUrl = process.env.DIRECTUS_URL || "http://localhost:8055";

  try {
    const response = await fetch(
      `${directusUrl}/items/news/${encodeURIComponent(
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

  // Always invalidate the Directus news data cache
  revalidateTag(NEWS_TAG, "default");

  // Revalidate main surfaces that show news
  revalidatePath("/news");
  revalidatePath("/");

  // If this came from a Directus news change, also revalidate the detail page
  if (body?.collection === "news") {
    const keys = Array.isArray(body?.keys)
      ? body.keys
      : body?.key !== undefined
        ? [body.key]
        : [];

    for (const key of keys) {
      const slug = await tryResolveNewsSlug(key);
      if (slug) revalidatePath(`/news/${slug}`);
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  if (!isValidSecret(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const path = request.nextUrl.searchParams.get("path");

  revalidateTag(NEWS_TAG, "default");
  revalidatePath("/news");
  revalidatePath("/");
  if (path) revalidatePath(path);

  return NextResponse.json({ ok: true });
}
