import { createDirectus, rest, readItems, readItem, staticToken } from '@directus/sdk';
import { resolveImageUrl } from './media';

// Directus URL - use Docker internal hostname in production
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN;

const DIRECTUS_NEWS_TAG = 'directus:news';
const DIRECTUS_PROJECTS_TAG = 'directus:projects';
const DIRECTUS_HERO_TAG = 'directus:hero';
const DIRECTUS_CAREERS_TAG = 'directus:careers';

const taggedFetch: typeof fetch = (input: any, init?: any) => {
  const nextInit = {
    ...(init || {}),
    next: {
      ...(init?.next || {}),
      tags: Array.from(
        new Set([
          ...(init?.next?.tags || []),
          DIRECTUS_NEWS_TAG,
          DIRECTUS_PROJECTS_TAG,
          DIRECTUS_HERO_TAG,
          DIRECTUS_CAREERS_TAG,
        ])
      ),
    },
  };

  return fetch(input, nextInit);
};

// Create Directus client (public access by default, static token when provided)
const directusBase = createDirectus(DIRECTUS_URL, {
  globals: { fetch: taggedFetch as any },
}).with(rest());
const directus = DIRECTUS_TOKEN
  ? directusBase.with(staticToken(DIRECTUS_TOKEN))
  : directusBase;

// Type definitions for Directus collections
export interface DirectusNewsPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
  updated_at: string;
  categories?: {
    category_id: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
  tags?: {
    tag_id: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
  gallery?: {
    media_id: {
      id?: string | number | null;
      title?: string | null;
      filename_disk?: string | null;
    };
  }[];
}

export interface DirectusNewsCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface DirectusTag {
  id: number;
  name: string;
  slug: string;
}

const normalizeNewsPost = (post: any): DirectusNewsPost => ({
  ...(post as DirectusNewsPost),
  featured_image: resolveImageUrl(post?.featured_image),
});

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const uniqueNumbers = (values: Array<number | null | undefined>): number[] =>
  Array.from(
    new Set(values.filter((value): value is number => typeof value === 'number'))
  );

async function fetchByIds<T>(
  collection: string,
  ids: number[],
  fields: string[]
): Promise<T[]> {
  if (!ids.length) return [];
  const rows = await directus.request(
    readItems(collection as any, {
      fields,
      filter: { id: { _in: ids } },
      limit: -1,
    })
  );
  return rows as T[];
}

async function getNewsIdsForCategorySlug(categorySlug: string): Promise<number[]> {
  const categories = await directus.request(
    readItems('news_categories', {
      fields: ['id'],
      filter: { slug: { _eq: categorySlug } },
      limit: 1,
    })
  );
  const categoryId = toNumber((categories as any[])[0]?.id);
  if (!categoryId) return [];

  const rows = await directus.request(
    readItems('news_news_categories', {
      fields: ['news_id'],
      filter: { category_id: { _eq: categoryId } },
      limit: -1,
    })
  );

  return uniqueNumbers((rows as any[]).map((row) => toNumber(row?.news_id)));
}

async function attachNewsRelations(
  posts: DirectusNewsPost[]
): Promise<DirectusNewsPost[]> {
  if (!posts.length) return posts;

  const newsIds = uniqueNumbers(posts.map((post) => toNumber(post.id)));
  if (!newsIds.length) return posts;

  const [categoryRows, tagRows] = await Promise.all([
    directus.request(
      readItems('news_news_categories', {
        fields: ['news_id', 'category_id'],
        filter: { news_id: { _in: newsIds } },
        limit: -1,
      })
    ),
    directus.request(
      readItems('news_tags', {
        fields: ['news_id', 'tag_id'],
        filter: { news_id: { _in: newsIds } },
        limit: -1,
      })
    ),
  ]);

  const categoryIds = uniqueNumbers(
    (categoryRows as any[]).map((row) => toNumber(row?.category_id))
  );
  const tagIds = uniqueNumbers(
    (tagRows as any[]).map((row) => toNumber(row?.tag_id))
  );

  const [categories, tags] = await Promise.all([
    fetchByIds<DirectusNewsCategory>('news_categories', categoryIds, [
      'id',
      'name',
      'slug',
    ]),
    fetchByIds<DirectusTag>('tags', tagIds, ['id', 'name', 'slug']),
  ]);

  const categoryById = new Map(categories.map((cat) => [cat.id, cat]));
  const tagById = new Map(tags.map((tag) => [tag.id, tag]));

  const categoriesByNews = new Map<number, DirectusNewsPost['categories']>();
  (categoryRows as any[]).forEach((row) => {
    const newsId = toNumber(row?.news_id);
    const categoryId = toNumber(row?.category_id);
    if (!newsId || !categoryId) return;
    const category = categoryById.get(categoryId);
    if (!category) return;
    const list = categoriesByNews.get(newsId) || [];
    list.push({ category_id: category });
    categoriesByNews.set(newsId, list);
  });

  const tagsByNews = new Map<number, DirectusNewsPost['tags']>();
  (tagRows as any[]).forEach((row) => {
    const newsId = toNumber(row?.news_id);
    const tagId = toNumber(row?.tag_id);
    if (!newsId || !tagId) return;
    const tag = tagById.get(tagId);
    if (!tag) return;
    const list = tagsByNews.get(newsId) || [];
    list.push({ tag_id: tag });
    tagsByNews.set(newsId, list);
  });

  return posts.map((post) => {
    const postId = toNumber(post.id);
    const mappedCategories = postId ? categoriesByNews.get(postId) : undefined;
    const mappedTags = postId ? tagsByNews.get(postId) : undefined;
    return {
      ...post,
      categories: mappedCategories?.length ? mappedCategories : post.categories,
      tags: mappedTags?.length ? mappedTags : post.tags,
    };
  });
}

// Get all news categories
export async function getNewsCategories(): Promise<DirectusNewsCategory[]> {
  try {
    const categories = await directus.request(
      readItems('news_categories', {
        fields: ['id', 'name', 'slug', 'description'],
        sort: ['name'],
      })
    );
    return categories as DirectusNewsCategory[];
  } catch (error) {
    console.error('[getNewsCategories] Directus API error:', error);
    return [];
  }
}

// Get news posts with optional filtering
export async function getNewsPosts({
  categorySlug,
  search,
  limit = 12,
}: {
  categorySlug?: string;
  search?: string;
  limit?: number;
} = {}): Promise<DirectusNewsPost[]> {
  try {
    const filter: any = {
      status: { _eq: 'published' },
    };

    if (categorySlug) {
      const newsIds = await getNewsIdsForCategorySlug(categorySlug);
      if (!newsIds.length) return [];
      filter.id = { _in: newsIds };
    }

    // Search in title, excerpt, and content if provided
    if (search) {
      filter._or = [
        { title: { _contains: search } },
        { excerpt: { _contains: search } },
        { content: { _contains: search } },
      ];
    }

    const news = await directus.request(
      readItems('news', {
        fields: [
          'id',
          'slug',
          'title',
          'excerpt',
          'content',
          'featured_image',
          'status',
          'published_at',
          'created_at',
          'updated_at',
        ],
        filter,
        sort: ['-published_at'],
        limit,
      })
    );

    const withRelations = await attachNewsRelations(news as DirectusNewsPost[]);
    return withRelations.map(normalizeNewsPost);
  } catch (error) {
    console.error('[getNewsPosts] Directus API error:', error);
    return [];
  }
}

// Get single news post by slug
export async function getNewsBySlug(slug: string): Promise<DirectusNewsPost | null> {
  try {
    const news = await directus.request(
      readItems('news', {
        fields: [
          'id',
          'slug',
          'title',
          'excerpt',
          'content',
          'featured_image',
          'status',
          'published_at',
          'created_at',
          'updated_at',
          'gallery.media_id.id',
          'gallery.media_id.title',
          'gallery.media_id.filename_disk',
        ],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
      })
    );

    if (!news || news.length === 0) {
      if (/^\d+$/.test(slug)) {
        const item = await directus.request(
          readItem('news', Number(slug), {
            fields: [
              'id',
              'slug',
              'title',
              'excerpt',
              'content',
              'featured_image',
              'status',
              'published_at',
              'created_at',
              'updated_at',
              'gallery.media_id.id',
              'gallery.media_id.title',
              'gallery.media_id.filename_disk',
            ],
          })
        );

        if (item && (item as any).status === 'published') {
          const [withRelations] = await attachNewsRelations([item as DirectusNewsPost]);
          return withRelations ? normalizeNewsPost(withRelations) : normalizeNewsPost(item);
        }
      }

      return null;
    }

    const [withRelations] = await attachNewsRelations(news as DirectusNewsPost[]);
    return withRelations ? normalizeNewsPost(withRelations) : normalizeNewsPost(news[0]);
  } catch (error) {
    console.error('[getNewsBySlug] Directus API error:', error);
    return null;
  }
}

// Get adjacent news posts (previous and next)
export async function getAdjacentNews(slug: string): Promise<{
  previous: { slug: string; title: string; featured_image?: string | null } | null;
  next: { slug: string; title: string; featured_image?: string | null } | null;
}> {
  try {
    // Get current post's published_at date
    const current = await directus.request(
      readItems('news', {
        fields: ['published_at'],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
      })
    );

    let currentDate = current && current.length > 0 ? (current[0] as any).published_at : null;

    if (!currentDate && /^\d+$/.test(slug)) {
      try {
        const item = await directus.request(
          readItem('news', Number(slug), { fields: ['published_at', 'status'] })
        );
        if (item && (item as any).status === 'published') {
          currentDate = (item as any).published_at;
        }
      } catch {
        // fall through
      }
    }

    if (!currentDate) return { previous: null, next: null };

    // Get previous (older) post
    const prevPosts = await directus.request(
      readItems('news', {
        fields: ['slug', 'title', 'featured_image'],
        filter: {
          status: { _eq: 'published' },
          published_at: { _lt: currentDate },
        },
        sort: ['-published_at'],
        limit: 1,
      })
    );

    // Get next (newer) post
    const nextPosts = await directus.request(
      readItems('news', {
        fields: ['slug', 'title', 'featured_image'],
        filter: {
          status: { _eq: 'published' },
          published_at: { _gt: currentDate },
        },
        sort: ['published_at'],
        limit: 1,
      })
    );

    return {
      previous: prevPosts && prevPosts.length > 0 ? prevPosts[0] as any : null,
      next: nextPosts && nextPosts.length > 0 ? nextPosts[0] as any : null,
    };
  } catch (error) {
    console.error('[getAdjacentNews] Directus API error:', error);
    return { previous: null, next: null };
  }
}

// ============================================================================
// PROJECTS FUNCTIONS
// ============================================================================

export interface DirectusProject {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  client: string | null;
  year: string | null;
  completed_year: string | null;
  location: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string;
  created_at: string;
  updated_at: string;
  sectors?: {
    sector_id: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
  services?: {
    service_id: {
      id: number;
      name: string;
      slug: string;
    };
  }[];
  gallery?: {
    media_id: {
      id?: string | number | null;
      title?: string | null;
      filename_disk?: string | null;
    };
  }[];
}

export interface DirectusSector {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface DirectusService {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

type DirectusHeroSlideProject = {
  id: number;
  slug: string | null;
  title: string | null;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
};

export interface DirectusHeroSlide {
  id: number;
  title: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  status: 'draft' | 'published';
  project_id?: DirectusHeroSlideProject | number | null;
}

const normalizeProject = (project: any): DirectusProject => ({
  ...(project as DirectusProject),
  featured_image: resolveImageUrl(project?.featured_image),
});

const normalizeHeroSlide = (slide: DirectusHeroSlide): DirectusHeroSlide => ({
  ...slide,
  image_url: resolveImageUrl(slide?.image_url),
  project_id:
    slide && typeof slide.project_id === 'object' && slide.project_id !== null
      ? {
          ...(slide.project_id as DirectusHeroSlideProject),
          featured_image: resolveImageUrl(
            (slide.project_id as DirectusHeroSlideProject).featured_image
          ),
        }
      : slide.project_id,
});

export async function getHeroSlides(): Promise<DirectusHeroSlide[]> {
  try {
    const slides = await directus.request(
      readItems('hero_slides', {
        fields: [
          'id',
          'title',
          'description',
          'image_url',
          'link_url',
          'sort_order',
          'status',
          'project_id.id',
          'project_id.slug',
          'project_id.title',
          'project_id.excerpt',
          'project_id.content',
          'project_id.featured_image',
          'project_id.status',
        ],
        filter: {
          status: { _eq: 'published' },
        },
        sort: ['sort_order', 'id'],
        limit: -1,
      })
    );

    return (slides as DirectusHeroSlide[])
      .map(normalizeHeroSlide)
      .filter((slide) => {
        if (!slide.project_id || typeof slide.project_id !== 'object') return true;
        return slide.project_id.status === 'published';
      });
  } catch (error) {
    console.error('[getHeroSlides] Directus API error:', error);
    return [];
  }
}

async function getProjectIdsForSectorSlug(sectorSlug: string): Promise<number[]> {
  const [sectorRowsResult, categoryRowsResult] = await Promise.allSettled([
    directus.request(
      readItems('sectors', {
        fields: ['id'],
        filter: { slug: { _eq: sectorSlug } },
        limit: 1,
      })
    ),
    directus.request(
      readItems('project_categories', {
        fields: ['id'],
        filter: { slug: { _eq: sectorSlug } },
        limit: 1,
      })
    ),
  ]);

  const sectorRows =
    sectorRowsResult.status === 'fulfilled' ? sectorRowsResult.value : [];
  const categoryRows =
    categoryRowsResult.status === 'fulfilled' ? categoryRowsResult.value : [];

  const sectorIds = uniqueNumbers([
    toNumber((sectorRows as any[])[0]?.id),
    toNumber((categoryRows as any[])[0]?.id),
  ]);
  if (!sectorIds.length) return [];

  const [projectsSectorRowsResult, projectsCategoryRowsResult] =
    await Promise.allSettled([
      directus.request(
        readItems('projects_sectors', {
          fields: ['projects_id'],
          filter: { sectors_id: { _in: sectorIds } },
          limit: -1,
        })
      ),
      directus.request(
        readItems('project_project_categories', {
          fields: ['project_id'],
          filter: { category_id: { _in: sectorIds } },
          limit: -1,
        })
      ),
    ]);

  const projectsSectorRows =
    projectsSectorRowsResult.status === 'fulfilled'
      ? projectsSectorRowsResult.value
      : [];
  const projectsCategoryRows =
    projectsCategoryRowsResult.status === 'fulfilled'
      ? projectsCategoryRowsResult.value
      : [];

  return uniqueNumbers([
    ...(projectsSectorRows as any[]).map((row) => toNumber(row?.projects_id)),
    ...(projectsCategoryRows as any[]).map((row) => toNumber(row?.project_id)),
  ]);
}

async function getProjectIdsForServiceSlug(serviceSlug: string): Promise<number[]> {
  const services = await directus.request(
    readItems('services', {
      fields: ['id'],
      filter: { slug: { _eq: serviceSlug } },
      limit: 1,
    })
  );
  const serviceId = toNumber((services as any[])[0]?.id);
  if (!serviceId) return [];

  const [projectsServicesRowsResult, projectServicesRowsResult] =
    await Promise.allSettled([
      directus.request(
        readItems('projects_services', {
          fields: ['projects_id'],
          filter: { services_id: { _eq: serviceId } },
          limit: -1,
        })
      ),
      directus.request(
        readItems('project_services', {
          fields: ['project_id'],
          filter: { service_id: { _eq: serviceId } },
          limit: -1,
        })
      ),
    ]);

  const projectsServicesRows =
    projectsServicesRowsResult.status === 'fulfilled'
      ? projectsServicesRowsResult.value
      : [];
  const projectServicesRows =
    projectServicesRowsResult.status === 'fulfilled'
      ? projectServicesRowsResult.value
      : [];

  return uniqueNumbers([
    ...(projectsServicesRows as any[]).map((row) => toNumber(row?.projects_id)),
    ...(projectServicesRows as any[]).map((row) => toNumber(row?.project_id)),
  ]);
}

async function attachProjectRelations(
  projects: DirectusProject[]
): Promise<DirectusProject[]> {
  if (!projects.length) return projects;
  const projectIds = uniqueNumbers(projects.map((project) => toNumber(project.id)));
  if (!projectIds.length) return projects;

  const [
    projectSectorRowsResult,
    projectCategoryRowsResult,
    projectServicesRowsResult,
    legacyServiceRowsResult,
  ] = await Promise.allSettled([
    directus.request(
      readItems('projects_sectors', {
        fields: ['projects_id', 'sectors_id'],
        filter: { projects_id: { _in: projectIds } },
        limit: -1,
      })
    ),
    directus.request(
      readItems('project_project_categories', {
        fields: ['project_id', 'category_id'],
        filter: { project_id: { _in: projectIds } },
        limit: -1,
      })
    ),
    directus.request(
      readItems('projects_services', {
        fields: ['projects_id', 'services_id'],
        filter: { projects_id: { _in: projectIds } },
        limit: -1,
      })
    ),
    directus.request(
      readItems('project_services', {
        fields: ['project_id', 'service_id'],
        filter: { project_id: { _in: projectIds } },
        limit: -1,
      })
    ),
  ]);

  const projectSectorRows =
    projectSectorRowsResult.status === 'fulfilled'
      ? projectSectorRowsResult.value
      : [];
  const projectCategoryRows =
    projectCategoryRowsResult.status === 'fulfilled'
      ? projectCategoryRowsResult.value
      : [];
  const projectServicesRows =
    projectServicesRowsResult.status === 'fulfilled'
      ? projectServicesRowsResult.value
      : [];
  const legacyServiceRows =
    legacyServiceRowsResult.status === 'fulfilled'
      ? legacyServiceRowsResult.value
      : [];

  const sectorIds = uniqueNumbers([
    ...(projectSectorRows as any[]).map((row) => toNumber(row?.sectors_id)),
    ...(projectCategoryRows as any[]).map((row) => toNumber(row?.category_id)),
  ]);
  const serviceIds = uniqueNumbers([
    ...(projectServicesRows as any[]).map((row) => toNumber(row?.services_id)),
    ...(legacyServiceRows as any[]).map((row) => toNumber(row?.service_id)),
  ]);

  const [sectors, projectCategories, services] = await Promise.all([
    fetchByIds<DirectusSector>('sectors', sectorIds, ['id', 'name', 'slug']),
    fetchByIds<DirectusSector>('project_categories', sectorIds, [
      'id',
      'name',
      'slug',
    ]),
    fetchByIds<DirectusService>('services', serviceIds, ['id', 'name', 'slug']),
  ]);

  const sectorById = new Map<number, DirectusSector>();
  projectCategories.forEach((sector) => sectorById.set(sector.id, sector));
  sectors.forEach((sector) => sectorById.set(sector.id, sector));

  const serviceById = new Map(services.map((service) => [service.id, service]));

  type SectorRelation = { sector_id: DirectusSector };
  type ServiceRelation = { service_id: DirectusService };

  const sectorsByProject = new Map<number, SectorRelation[]>();
  (projectSectorRows as any[]).forEach((row) => {
    const projectId = toNumber(row?.projects_id);
    const sectorId = toNumber(row?.sectors_id);
    if (!projectId || !sectorId) return;
    const sector = sectorById.get(sectorId);
    if (!sector) return;
    const list = sectorsByProject.get(projectId) || [];
    list.push({ sector_id: sector });
    sectorsByProject.set(projectId, list);
  });
  (projectCategoryRows as any[]).forEach((row) => {
    const projectId = toNumber(row?.project_id);
    const sectorId = toNumber(row?.category_id);
    if (!projectId || !sectorId) return;
    const sector = sectorById.get(sectorId);
    if (!sector) return;
    const list = sectorsByProject.get(projectId) || [];
    list.push({ sector_id: sector });
    sectorsByProject.set(projectId, list);
  });

  const servicesByProject = new Map<number, ServiceRelation[]>();
  (projectServicesRows as any[]).forEach((row) => {
    const projectId = toNumber(row?.projects_id);
    const serviceId = toNumber(row?.services_id);
    if (!projectId || !serviceId) return;
    const service = serviceById.get(serviceId);
    if (!service) return;
    const list = servicesByProject.get(projectId) || [];
    list.push({ service_id: service });
    servicesByProject.set(projectId, list);
  });
  (legacyServiceRows as any[]).forEach((row) => {
    const projectId = toNumber(row?.project_id);
    const serviceId = toNumber(row?.service_id);
    if (!projectId || !serviceId) return;
    const service = serviceById.get(serviceId);
    if (!service) return;
    const list = servicesByProject.get(projectId) || [];
    list.push({ service_id: service });
    servicesByProject.set(projectId, list);
  });

  const dedupeSectorRelations = (items: SectorRelation[]) => {
    const map = new Map<number, SectorRelation>();
    items.forEach((item) => {
      map.set(item.sector_id.id, item);
    });
    return Array.from(map.values());
  };

  const dedupeServiceRelations = (items: ServiceRelation[]) => {
    const map = new Map<number, ServiceRelation>();
    items.forEach((item) => {
      map.set(item.service_id.id, item);
    });
    return Array.from(map.values());
  };

  return projects.map((project) => {
    const projectId = toNumber(project.id);
    const sectors = projectId ? sectorsByProject.get(projectId) : undefined;
    const services = projectId ? servicesByProject.get(projectId) : undefined;
    return {
      ...project,
      sectors: sectors ? dedupeSectorRelations(sectors) : project.sectors,
      services: services ? dedupeServiceRelations(services) : project.services,
    };
  });
}

// Get all project sectors
export async function getProjectSectors(): Promise<DirectusSector[]> {
  try {
    const sectors = await directus.request(
      readItems('sectors', {
        fields: ['id', 'name', 'slug', 'description'],
        sort: ['name'],
      })
    );
    return sectors as DirectusSector[];
  } catch (error) {
    console.error('[getProjectSectors] Directus API error:', error);
    return [];
  }
}

// Get all services
export async function getProjectServices(): Promise<DirectusService[]> {
  try {
    const services = await directus.request(
      readItems('services', {
        fields: ['id', 'name', 'slug', 'description'],
        sort: ['name'],
      })
    );
    return services as DirectusService[];
  } catch (error) {
    console.error('[getProjectServices] Directus API error:', error);
    return [];
  }
}

// Get project counts by sector, optionally filtered by service
export async function getProjectCountsBySector(serviceSlug?: string): Promise<Record<string, number>> {
  try {
    const sectors = await directus.request(
      readItems('sectors', {
        fields: ['id', 'slug'],
      })
    );

    const counts: Record<string, number> = {};

    // If service is selected, get projects for that service first
    let serviceProjectIds: number[] | null = null;
    if (serviceSlug) {
      serviceProjectIds = await getProjectIdsForServiceSlug(serviceSlug);
      if (!serviceProjectIds.length) return counts; // No projects with this service
    }

    for (const sector of sectors as any[]) {
      const sectorProjectIds = await getProjectIdsForSectorSlug(sector.slug);

      if (serviceProjectIds) {
        // Calculate intersection - projects with both service AND sector
        const sectorSet = new Set(sectorProjectIds);
        const intersection = serviceProjectIds.filter((id) => sectorSet.has(id));
        counts[sector.slug] = intersection.length;
      } else {
        // No service filter, just return sector counts
        counts[sector.slug] = sectorProjectIds.length;
      }
    }

    return counts;
  } catch (error) {
    console.error('[getProjectCountsBySector] Directus API error:', error);
    return {};
  }
}

// Get project counts by service, optionally filtered by sector
export async function getProjectCountsByService(sectorSlug?: string): Promise<Record<string, number>> {
  try {
    const services = await directus.request(
      readItems('services', {
        fields: ['id', 'slug'],
      })
    );

    const counts: Record<string, number> = {};

    // If sector is selected, get projects for that sector first
    let sectorProjectIds: number[] | null = null;
    if (sectorSlug) {
      sectorProjectIds = await getProjectIdsForSectorSlug(sectorSlug);
      if (!sectorProjectIds.length) return counts; // No projects in this sector
    }

    for (const service of services as any[]) {
      const serviceProjectIds = await getProjectIdsForServiceSlug(service.slug);

      if (sectorProjectIds) {
        // Calculate intersection - projects with both sector AND service
        const serviceSet = new Set(serviceProjectIds);
        const intersection = sectorProjectIds.filter((id) => serviceSet.has(id));
        counts[service.slug] = intersection.length;
      } else {
        // No sector filter, just return service counts
        counts[service.slug] = serviceProjectIds.length;
      }
    }

    return counts;
  } catch (error) {
    console.error('[getProjectCountsByService] Directus API error:', error);
    return {};
  }
}

// Get projects with optional filtering
export async function getProjects({
  sectorSlug,
  serviceSlug,
  search,
  limit = 24,
  offset = 0,
}: {
  sectorSlug?: string;
  serviceSlug?: string;
  search?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<DirectusProject[]> {
  try {
    const filter: any = {
      status: { _eq: 'published' },
    };

    let projectIds: number[] | null = null;
    if (sectorSlug) {
      projectIds = await getProjectIdsForSectorSlug(sectorSlug);
      console.log('[getProjects] Sector filter:', sectorSlug, '→', projectIds.length, 'projects');
      if (!projectIds.length) return [];
    }
    if (serviceSlug) {
      const serviceProjectIds = await getProjectIdsForServiceSlug(serviceSlug);
      console.log('[getProjects] Service filter:', serviceSlug, '→', serviceProjectIds.length, 'projects');
      if (!serviceProjectIds.length) return [];
      if (projectIds) {
        console.log('[getProjects] Before intersection:', projectIds.length, 'sector projects');
        const serviceSet = new Set(serviceProjectIds);
        projectIds = projectIds.filter((id) => serviceSet.has(id));
        console.log('[getProjects] After intersection:', projectIds.length, 'projects (both filters)');
      } else {
        projectIds = serviceProjectIds;
      }
      if (!projectIds.length) return [];
    }
    if (projectIds) {
      filter.id = { _in: projectIds };
      console.log('[getProjects] Final filter:', projectIds.length, 'project IDs');
    }

    // Search in title, excerpt, and content if provided
    if (search) {
      filter._or = [
        { title: { _contains: search } },
        { excerpt: { _contains: search } },
        { content: { _contains: search } },
      ];
    }

    const query: Record<string, any> = {
      fields: [
        'id',
        'slug',
        'title',
        'excerpt',
        'content',
        'featured_image',
        'client',
        'year',
        'completed_year',
        'location',
        'status',
        'published_at',
        'created_at',
        'updated_at',
      ],
      filter,
      sort: ['-published_at'],
      limit,
    };

    if (offset) {
      query.offset = offset;
    }

    const projects = await directus.request(readItems('projects', query));

    const withRelations = await attachProjectRelations(projects as DirectusProject[]);
    return withRelations.map(normalizeProject);
  } catch (error) {
    console.error('[getProjects] Directus API error:', error);
    return [];
  }
}

// Get single project by slug
export async function getProjectBySlug(slug: string): Promise<DirectusProject | null> {
  try {
    const projects = await directus.request(
      readItems('projects', {
        fields: [
          'id',
          'slug',
          'title',
          'excerpt',
          'content',
          'featured_image',
          'client',
          'year',
          'completed_year',
          'location',
          'status',
          'published_at',
          'created_at',
          'updated_at',
          'gallery.media_id.id',
          'gallery.media_id.title',
          'gallery.media_id.filename_disk',
        ],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
      })
    );

    if (!projects || projects.length === 0) {
      // Try by ID if slug is numeric
      if (/^\d+$/.test(slug)) {
        const item = await directus.request(
          readItem('projects', Number(slug), {
            fields: [
              'id',
              'slug',
              'title',
              'excerpt',
              'content',
              'featured_image',
              'client',
              'year',
              'completed_year',
              'location',
              'status',
              'published_at',
              'created_at',
              'updated_at',
              'gallery.media_id.id',
              'gallery.media_id.title',
              'gallery.media_id.filename_disk',
            ],
          })
        );

        if (item && (item as any).status === 'published') {
          const [withRelations] = await attachProjectRelations([item as DirectusProject]);
          return withRelations ? normalizeProject(withRelations) : normalizeProject(item);
        }
      }

      return null;
    }

    const [withRelations] = await attachProjectRelations(projects as DirectusProject[]);
    return withRelations ? normalizeProject(withRelations) : normalizeProject(projects[0]);
  } catch (error) {
    console.error('[getProjectBySlug] Directus API error:', error);
    return null;
  }
}

// Get adjacent projects (previous and next)
export async function getAdjacentProjects(slug: string): Promise<{
  previous: { slug: string; title: string; featured_image?: string | null } | null;
  next: { slug: string; title: string; featured_image?: string | null } | null;
}> {
  try {
    // Get current project's published_at date
    const current = await directus.request(
      readItems('projects', {
        fields: ['published_at'],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
      })
    );

    let currentDate = current && current.length > 0 ? (current[0] as any).published_at : null;

    if (!currentDate && /^\d+$/.test(slug)) {
      try {
        const item = await directus.request(
          readItem('projects', Number(slug), { fields: ['published_at', 'status'] })
        );
        if (item && (item as any).status === 'published') {
          currentDate = (item as any).published_at;
        }
      } catch {
        // fall through
      }
    }

    if (!currentDate) return { previous: null, next: null };

    // Get previous (older) project
    const prevProjects = await directus.request(
      readItems('projects', {
        fields: ['slug', 'title', 'featured_image'],
        filter: {
          status: { _eq: 'published' },
          published_at: { _lt: currentDate },
        },
        sort: ['-published_at'],
        limit: 1,
      })
    );

    // Get next (newer) project
    const nextProjects = await directus.request(
      readItems('projects', {
        fields: ['slug', 'title', 'featured_image'],
        filter: {
          status: { _eq: 'published' },
          published_at: { _gt: currentDate },
        },
        sort: ['published_at'],
        limit: 1,
      })
    );

    return {
      previous: prevProjects && prevProjects.length > 0 ? prevProjects[0] as any : null,
      next: nextProjects && nextProjects.length > 0 ? nextProjects[0] as any : null,
    };
  } catch (error) {
    console.error('[getAdjacentProjects] Directus API error:', error);
    return { previous: null, next: null };
  }
}

// ============================================================================
// CAREERS FUNCTIONS
// ============================================================================

export interface DirectusCareer {
  id: number;
  job_id: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  document: {
    id?: string | number | null;
    title?: string | null;
    filename_download?: string | null;
    type?: string | null;
    filesize?: number | null;
  } | string | null;
  location: string | null;
  employment_type: string | null;
  department: string | null;
  closing_date: string | null;
  job_description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  qualifications: string | null;
  benefits: string | null;
  status: 'draft' | 'published' | 'archived' | 'closed';
  published_at: string;
  created_at: string;
  updated_at: string;
}

const normalizeCareer = (career: any): DirectusCareer => ({
  ...(career as DirectusCareer),
});

// Get careers with optional filtering
export async function getCareerPosts({
  search,
  limit = 30,
}: {
  search?: string;
  limit?: number;
} = {}): Promise<DirectusCareer[]> {
  try {
    const filter: any = {
      status: { _eq: 'published' },
    };

    if (search) {
      filter._or = [
        { title: { _contains: search } },
        { excerpt: { _contains: search } },
        { content: { _contains: search } },
        { job_description: { _contains: search } },
      ];
    }

    const careers = await directus.request(
      readItems('careers', {
        fields: [
          'id',
          'job_id',
          'slug',
          'title',
          'excerpt',
          'content',
          'document',
          'location',
          'employment_type',
          'department',
          'closing_date',
          'job_description',
          'responsibilities',
          'requirements',
          'qualifications',
          'benefits',
          'status',
          'published_at',
          'created_at',
          'updated_at',
        ],
        filter,
        sort: ['-published_at'],
        limit,
      })
    );

    return (careers as any[]).map(normalizeCareer);
  } catch (error) {
    console.error('[getCareerPosts] Directus API error:', error);
    return [];
  }
}

// Get single career by slug
export async function getCareerBySlug(slug: string): Promise<DirectusCareer | null> {
  try {
    const careers = await directus.request(
      readItems('careers', {
        fields: [
          'id',
          'job_id',
          'slug',
          'title',
          'excerpt',
          'content',
          'document',
          'location',
          'employment_type',
          'department',
          'closing_date',
          'job_description',
          'responsibilities',
          'requirements',
          'qualifications',
          'benefits',
          'status',
          'published_at',
          'created_at',
          'updated_at',
        ],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
      })
    );

    if (!careers || careers.length === 0) {
      if (/^\d+$/.test(slug)) {
        const item = await directus.request(
          readItem('careers', Number(slug), {
            fields: [
              'id',
              'job_id',
              'slug',
              'title',
              'excerpt',
              'content',
              'document',
              'location',
              'employment_type',
              'department',
              'closing_date',
              'job_description',
              'responsibilities',
              'requirements',
              'qualifications',
              'benefits',
              'status',
              'published_at',
              'created_at',
              'updated_at',
            ],
          })
        );

        if (item && (item as any).status === 'published') {
          return normalizeCareer(item);
        }
      }

      return null;
    }

    return normalizeCareer(careers[0]);
  } catch (error) {
    console.error('[getCareerBySlug] Directus API error:', error);
    return null;
  }
}

// Get adjacent careers (previous and next)
export async function getAdjacentCareers(slug: string): Promise<{
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}> {
  try {
    const current = await directus.request(
      readItems('careers', {
        fields: ['published_at'],
        filter: {
          slug: { _eq: slug },
          status: { _eq: 'published' },
        },
        limit: 1,
      })
    );

    let currentDate = current && current.length > 0 ? (current[0] as any).published_at : null;

    if (!currentDate && /^\d+$/.test(slug)) {
      try {
        const item = await directus.request(
          readItem('careers', Number(slug), { fields: ['published_at', 'status'] })
        );
        if (item && (item as any).status === 'published') {
          currentDate = (item as any).published_at;
        }
      } catch {
        // fall through
      }
    }

    if (!currentDate) return { previous: null, next: null };

    const prevPosts = await directus.request(
      readItems('careers', {
        fields: ['slug', 'title'],
        filter: {
          status: { _eq: 'published' },
          published_at: { _lt: currentDate },
        },
        sort: ['-published_at'],
        limit: 1,
      })
    );

    const nextPosts = await directus.request(
      readItems('careers', {
        fields: ['slug', 'title'],
        filter: {
          status: { _eq: 'published' },
          published_at: { _gt: currentDate },
        },
        sort: ['published_at'],
        limit: 1,
      })
    );

    return {
      previous: prevPosts && prevPosts.length > 0 ? prevPosts[0] as any : null,
      next: nextPosts && nextPosts.length > 0 ? nextPosts[0] as any : null,
    };
  } catch (error) {
    console.error('[getAdjacentCareers] Directus API error:', error);
    return { previous: null, next: null };
  }
}

export default directus;
