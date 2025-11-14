/**
 * Blog API - All blog-related API calls
 */

import { apiClient } from './client';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  coverImage: string | null;
  publishedAt: string;
  updatedAt: string;
  author: {
    name: string;
    avatar: string | null;
  };
  views: number;
  readingTimeMinutes: number;
  carReferences: Array<{
    carId: number;
    slug: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    price: string;
    primaryPhoto: string | null;
  }>;
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    ogImage: string | null;
  };
}

export interface BlogFilters {
  category?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  totalPages: number;
  categories: Array<{ name: string; count: number }>;
  popularTags: Array<{ name: string; count: number }>;
}

/**
 * Fetch published blog posts with filters and pagination
 */
export async function getPublishedPosts(filters: BlogFilters = {}) {
  const params = new URLSearchParams();

  if (filters.category) params.append('category', filters.category);
  if (filters.tags && filters.tags.length > 0) {
    filters.tags.forEach(tag => params.append('tags[]', tag));
  }
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const endpoint = `/api/blog/list${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient<any>(endpoint);

  // Handle backend's response structure: { success, data, meta }
  if (response.data?.success && response.data?.data) {
    return {
      data: {
        posts: response.data.data.posts || [],
        total: response.data.meta?.total || 0,
        page: response.data.meta?.page || 1,
        totalPages: response.data.meta?.totalPages || 1,
        categories: response.data.data.categories || [],
        popularTags: response.data.data.popularTags || [],
      },
      status: response.status,
    };
  }

  return {
    data: {
      posts: [],
      total: 0,
      page: 1,
      totalPages: 1,
      categories: [],
      popularTags: [],
    },
    status: response.status,
    error: response.error,
  };
}

/**
 * Fetch single blog post by slug
 */
export async function getPostBySlug(slug: string) {
  const response = await apiClient<any>(`/api/blog/${slug}`);

  // Handle backend's response structure: { success, data }
  if (response.data?.success && response.data?.data) {
    return {
      data: response.data.data as BlogPost,
      status: response.status,
    };
  }

  return response;
}

/**
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(slug: string, limit = 4) {
  const response = await apiClient<any>(`/api/blog/${slug}/related?limit=${limit}`);

  // Handle backend's response structure: { success, data: { posts } }
  if (response.data?.success && response.data?.data) {
    return {
      data: {
        posts: response.data.data.posts || [],
      },
      status: response.status,
    };
  }

  return {
    data: {
      posts: [],
    },
    status: response.status,
    error: response.error,
  };
}

/**
 * Increment blog post view count
 */
export async function incrementPostViews(slug: string) {
  try {
    await apiClient(`/api/blog/${slug}/view`, { method: 'POST' });
  } catch (error) {
    // Silent fail - view counting is not critical
    console.debug('Failed to increment blog post views:', error);
  }
}
