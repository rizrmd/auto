/**
 * Admin Blog Management Page
 * Premium table view with filters, search, and bulk actions
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminBlogAPI } from '../services/adminBlogApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  authorName: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: string;
  scheduledAt?: string;
  views: number;
  createdAt: string;
}

type StatusFilter = 'all' | 'draft' | 'published' | 'scheduled' | 'archived';

export function AdminBlogPage() {
  const { tenant } = useAdminAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const postsPerPage = 10;

  useEffect(() => {
    loadPosts();
  }, [statusFilter, categoryFilter, searchQuery, currentPage]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminBlogAPI.getAllPosts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchQuery || undefined,
        page: currentPage,
        limit: postsPerPage,
      });

      if (response && response.data) {
        setPosts(response.data.posts || []);
        setTotalPages(response.data.pagination?.totalPages || 1);

        // Extract unique categories
        const uniqueCategories = Array.from(new Set((response.data.posts || []).map(p => p.category).filter(Boolean)));
        setCategories(uniqueCategories);
      } else {
        setPosts([]);
        setTotalPages(1);
        setCategories([]);
      }
    } catch (err) {
      console.error('[AdminBlogPage] Error loading posts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load blog posts';
      setError(errorMessage);
      setPosts([]);
      setTotalPages(1);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    try {
      await adminBlogAPI.deletePost(id);
      loadPosts();
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const handlePublishToggle = async (id: number, currentStatus: string) => {
    try {
      if (currentStatus === 'published') {
        await adminBlogAPI.unpublishPost(id);
      } else {
        await adminBlogAPI.publishPost(id);
      }
      loadPosts();
    } catch (err) {
      alert('Failed to update post status');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'archived':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading blog posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-500 mt-1">Manage your blog content and SEO</p>
        </div>
        <a href="/admin/blog/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <span className="mr-2">+</span>
            Create New Post
          </Button>
        </a>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {(['all', 'published', 'draft', 'scheduled', 'archived'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    statusFilter === status
                      ? 'bg-orange-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Search and Category Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum ada blog post</h3>
              <p className="text-gray-500 mb-6">Mulai buat konten blog untuk menarik lebih banyak pengunjung</p>
              <a href="/admin/blog/new">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <span className="mr-2">+</span>
                  Create Your First Post
                </Button>
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium text-gray-900">{post.title}</div>
                            <div className="text-sm text-gray-500">/{post.slug}</div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(post.status)}`}>
                            {post.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.authorName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(post.publishedAt || post.scheduledAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.views.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <a href={`/admin/blog/${post.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublishToggle(post.id, post.status)}
                          >
                            {post.status === 'published' ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(post.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
