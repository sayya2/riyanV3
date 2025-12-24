import { createDirectus, rest, readItems, readItem } from '@directus/sdk';
import { resolveImageUrl } from './media';

// Directus URL - use Docker internal hostname in production
const DIRECTUS_URL = process.env.DIRECTUS_URL || 'http://localhost:8055';

const DIRECTUS_NEWS_TAG = 'directus:news';

const taggedFetch: typeof fetch = (input: any, init?: any) => {
  const nextInit = {
    ...(init || {}),
    next: {
      ...(init?.next || {}),
      tags: Array.from(
        new Set([...(init?.next?.tags || []), DIRECTUS_NEWS_TAG])
      ),
    },
  };

  return fetch(input, nextInit);
};

// Create Directus client (public access, no authentication needed)
const directus = createDirectus(DIRECTUS_URL, {
  globals: { fetch: taggedFetch as any },
}).with(rest());

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

    // Filter by category slug if provided
    if (categorySlug) {
      filter.categories = {
        category_id: {
          slug: { _eq: categorySlug },
        },
      };
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
          'categories.category_id.id',
          'categories.category_id.name',
          'categories.category_id.slug',
          'tags.tag_id.id',
          'tags.tag_id.name',
          'tags.tag_id.slug',
        ],
        filter,
        sort: ['-published_at'],
        limit,
      })
    );

    return (news as any[]).map(normalizeNewsPost);
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
          'categories.category_id.id',
          'categories.category_id.name',
          'categories.category_id.slug',
          'tags.tag_id.id',
          'tags.tag_id.name',
          'tags.tag_id.slug',
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
              'categories.category_id.id',
              'categories.category_id.name',
              'categories.category_id.slug',
              'tags.tag_id.id',
              'tags.tag_id.name',
              'tags.tag_id.slug',
              'gallery.media_id.id',
              'gallery.media_id.title',
              'gallery.media_id.filename_disk',
            ],
          })
        );

        if (item && (item as any).status === 'published') {
          return normalizeNewsPost(item);
        }
      }

      return null;
    }

    return normalizeNewsPost(news[0]);
  } catch (error) {
    console.error('[getNewsBySlug] Directus API error:', error);
    return null;
  }
}

// Get adjacent news posts (previous and next)
export async function getAdjacentNews(slug: string): Promise<{
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
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
        fields: ['slug', 'title'],
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
  location: string | null;
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

export interface DirectusProjectCategory {
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

const normalizeProject = (project: any): DirectusProject => ({
  ...(project as DirectusProject),
  featured_image: resolveImageUrl(project?.featured_image),
});

// Get all project categories
export async function getProjectCategories(): Promise<DirectusProjectCategory[]> {
  try {
    const categories = await directus.request(
      readItems('project_categories', {
        fields: ['id', 'name', 'slug', 'description'],
        sort: ['name'],
      })
    );
    return categories as DirectusProjectCategory[];
  } catch (error) {
    console.error('[getProjectCategories] Directus API error:', error);
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

// Get projects with optional filtering
export async function getProjects({
  categorySlug,
  serviceSlug,
  search,
  limit = 24,
}: {
  categorySlug?: string;
  serviceSlug?: string;
  search?: string;
  limit?: number;
} = {}): Promise<DirectusProject[]> {
  try {
    const filter: any = {
      status: { _eq: 'published' },
    };

    // Filter by category slug if provided
    if (categorySlug) {
      filter.categories = {
        category_id: {
          slug: { _eq: categorySlug },
        },
      };
    }

    // Filter by service slug if provided
    if (serviceSlug) {
      filter.services = {
        service_id: {
          slug: { _eq: serviceSlug },
        },
      };
    }

    // Search in title, excerpt, and content if provided
    if (search) {
      filter._or = [
        { title: { _contains: search } },
        { excerpt: { _contains: search } },
        { content: { _contains: search } },
      ];
    }

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
          'location',
          'status',
          'published_at',
          'created_at',
          'updated_at',
          'categories.category_id.id',
          'categories.category_id.name',
          'categories.category_id.slug',
          'services.service_id.id',
          'services.service_id.name',
          'services.service_id.slug',
        ],
        filter,
        sort: ['-published_at'],
        limit,
      })
    );

    return (projects as any[]).map(normalizeProject);
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
          'location',
          'status',
          'published_at',
          'created_at',
          'updated_at',
          'categories.category_id.id',
          'categories.category_id.name',
          'categories.category_id.slug',
          'services.service_id.id',
          'services.service_id.name',
          'services.service_id.slug',
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
              'location',
              'status',
              'published_at',
              'created_at',
              'updated_at',
              'categories.category_id.id',
              'categories.category_id.name',
              'categories.category_id.slug',
              'services.service_id.id',
              'services.service_id.name',
              'services.service_id.slug',
              'gallery.media_id.id',
              'gallery.media_id.title',
              'gallery.media_id.filename_disk',
            ],
          })
        );

        if (item && (item as any).status === 'published') {
          return normalizeProject(item);
        }
      }

      return null;
    }

    return normalizeProject(projects[0]);
  } catch (error) {
    console.error('[getProjectBySlug] Directus API error:', error);
    return null;
  }
}

// Get adjacent projects (previous and next)
export async function getAdjacentProjects(slug: string): Promise<{
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
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
        fields: ['slug', 'title'],
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
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
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
          'slug',
          'title',
          'excerpt',
          'content',
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
          'slug',
          'title',
          'excerpt',
          'content',
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
              'slug',
              'title',
              'excerpt',
              'content',
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
