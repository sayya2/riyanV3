const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getDirectusPublicBase = () => {
  const base =
    process.env.NEXT_PUBLIC_DIRECTUS_URL ||
    process.env.DIRECTUS_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.DIRECTUS_URL ||
    "";

  return base ? base.replace(/\/+$/, "") : "";
};

export const isDirectusFileId = (value: string) => UUID_REGEX.test(value);

const isAbsoluteUrl = (value: string) =>
  value.startsWith("http://") ||
  value.startsWith("https://") ||
  value.startsWith("data:") ||
  value.startsWith("blob:");

export const resolveImageUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (isAbsoluteUrl(trimmed)) return trimmed;

  if (isDirectusFileId(trimmed)) {
    const base = getDirectusPublicBase();
    return base ? `${base}/assets/${trimmed}` : `/assets/${trimmed}`;
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
};

export const resolveFileUrl = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === "string" || typeof value === "number") {
    return resolveImageUrl(String(value));
  }

  if (typeof value === "object") {
    const file = value as Record<string, unknown>;

    const url = file.url || file.src || file.asset_url;
    if (typeof url === "string") return resolveImageUrl(url);

    const id = file.id || file.file_id || file.fileId;
    if (id) return resolveImageUrl(String(id));

    const filepath = file.filepath;
    if (typeof filepath === "string") return resolveImageUrl(filepath);

    const filename = file.filename;
    if (typeof filename === "string" && filename.includes("/")) {
      return resolveImageUrl(filename);
    }
  }

  return null;
};
