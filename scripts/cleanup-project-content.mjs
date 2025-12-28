const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";
const DIRECTUS_EMAIL = process.env.DIRECTUS_EMAIL || "admin@riyan.com.mv";
const DIRECTUS_PASSWORD =
  process.env.DIRECTUS_PASSWORD || "ChangeThisPassword123!";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const PAGE_SIZE = Number(getArgValue("--page-size", "100"));
const MAX_PAGES = Number(getArgValue("--max-pages", "0"));
const VERBOSE = argv.includes("--verbose");

function getArgValue(flag, fallback) {
  const index = argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = argv[index + 1];
  return value ? value : fallback;
}

function stripTrailingBlock(content) {
  if (typeof content !== "string" || !content.trim()) return content;

  const patterns = [
    // HTML labels (h5) block
    /^([\s\S]*)(<h5[^>]*>\s*Client\s*<\/h5>[\s\S]*?<h5[^>]*>\s*Services\s*Offered\s*<\/h5>[\s\S]*)$/i,
    // Plain-text labels block
    /^([\s\S]*)(\bClient\b[\s\S]*?\bYear\b[\s\S]*?\bLocation\b[\s\S]*?\bSector\b[\s\S]*?\bServices\s*Offered\b[\s\S]*)$/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && typeof match[1] === "string") {
      return match[1].trimEnd();
    }
  }

  return content;
}

async function login() {
  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: DIRECTUS_EMAIL,
      password: DIRECTUS_PASSWORD,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  const token = json?.data?.access_token;
  if (!token) {
    throw new Error("Login response missing access_token.");
  }

  return token;
}

async function fetchProjects(token, offset) {
  const url =
    `${DIRECTUS_URL}/items/projects` +
    `?fields=id,slug,content&limit=${PAGE_SIZE}&offset=${offset}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Fetch failed (${res.status}): ${text}`);
  }

  const json = await res.json();
  return json?.data || [];
}

async function updateProject(token, id, content) {
  const res = await fetch(`${DIRECTUS_URL}/items/projects/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Update failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function main() {
  if (!Number.isFinite(PAGE_SIZE) || PAGE_SIZE <= 0) {
    throw new Error(`Invalid --page-size ${PAGE_SIZE}`);
  }

  const token = await login();
  let offset = 0;
  let page = 0;
  let totalScanned = 0;
  let totalChanged = 0;
  const sample = [];

  while (true) {
    const items = await fetchProjects(token, offset);
    if (!items.length) break;

    for (const item of items) {
      totalScanned += 1;
      const original = item?.content ?? "";
      const cleaned = stripTrailingBlock(original);

      if (cleaned !== original) {
        totalChanged += 1;
        if (sample.length < 5) {
          sample.push({
            id: item.id,
            slug: item.slug,
            before: original.slice(0, 120),
            after: cleaned.slice(0, 120),
          });
        }

        if (APPLY) {
          await updateProject(token, item.id, cleaned);
        } else if (VERBOSE) {
          console.log(`Would update ${item.id} (${item.slug || "no-slug"})`);
        }
      }
    }

    page += 1;
    if (MAX_PAGES > 0 && page >= MAX_PAGES) break;
    offset += PAGE_SIZE;
  }

  console.log(
    JSON.stringify(
      {
        apply: APPLY,
        scanned: totalScanned,
        changed: totalChanged,
        sample,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
