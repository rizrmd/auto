/**
 * Admin Blog API Service
 * API client for blog management and AI content generation
 */

// Types for Blog API
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string[];
  authorId: number;
  authorName: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  views: number;
  publishedAt?: string;
  scheduledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlogPostData {
  title: string;
  slug?: string;
  content: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogImage?: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt?: string;
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  // All fields optional for updates
}

export interface GetAllPostsFilters {
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface GenerateContentParams {
  prompt: string;
  tone: string;
  keywords: string[];
  carIds?: number[];
}

class AdminBlogAPI {
  private baseURL = '/api/admin/blog';

  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Get all posts with filters
  async getAllPosts(filters: GetAllPostsFilters = {}): Promise<{
    success: boolean;
    data: {
      posts: BlogPost[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalPosts: number;
        postsPerPage: number;
      };
    };
  }> {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.set('status', filters.status);
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.page) queryParams.set('page', filters.page.toString());
    if (filters.limit) queryParams.set('limit', filters.limit.toString());

    const url = `${this.baseURL}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get single post by ID
  async getPost(id: number): Promise<{
    success: boolean;
    data: BlogPost;
  }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Create new post
  async createPost(data: CreateBlogPostData): Promise<{
    success: boolean;
    data: BlogPost;
  }> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Update existing post
  async updatePost(id: number, data: UpdateBlogPostData): Promise<{
    success: boolean;
    data: BlogPost;
  }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  // Delete post
  async deletePost(id: number): Promise<{
    success: boolean;
  }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Publish post
  async publishPost(id: number): Promise<{
    success: boolean;
    data: BlogPost;
  }> {
    const response = await fetch(`${this.baseURL}/${id}/publish`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Unpublish post
  async unpublishPost(id: number): Promise<{
    success: boolean;
    data: BlogPost;
  }> {
    const response = await fetch(`${this.baseURL}/${id}/unpublish`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Generate content with AI
  async generateContent(params: GenerateContentParams): Promise<{
    success: boolean;
    data: {
      content: string;
      metadata: {
        tone: string;
        keywords: string[];
        generatedAt: string;
      };
    };
  }> {
    const response = await fetch(`${this.baseURL}/generate-content`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });
    return this.handleResponse(response);
  }

  // Get categories (for dropdown)
  async getCategories(): Promise<{
    success: boolean;
    data: string[];
  }> {
    const response = await fetch(`${this.baseURL}/categories`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get analytics for blog
  async getBlogAnalytics(startDate: string, endDate: string): Promise<{
    success: boolean;
    data: {
      totalViews: number;
      totalPosts: number;
      topPosts: Array<{
        id: number;
        title: string;
        views: number;
      }>;
      viewsByDate: Array<{
        date: string;
        views: number;
      }>;
    };
  }> {
    const response = await fetch(
      `${this.baseURL}/analytics?startDate=${startDate}&endDate=${endDate}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const adminBlogAPI = new AdminBlogAPI();
