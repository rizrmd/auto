/**
 * BlogListingPage - Premium public blog listing at /blog
 * Features: Grid layout, search, category/tag filters, pagination
 */

import React, { useState, useEffect } from 'react';
import { Loader2, BookOpen } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { BlogCard } from '../components/blog/BlogCard';
import { BlogFilters } from '../components/blog/BlogFilters';
import { Pagination } from '../components/shared/Pagination';
import { getPublishedPosts, type BlogFilters as BlogFiltersType, type BlogPost } from '../api/blog';

interface BlogListingPageProps {
  initialFilters?: {
    category?: string;
    tag?: string;
    search?: string;
  };
}

export function BlogListingPage({ initialFilters }: BlogListingPageProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([]);
  const [popularTags, setPopularTags] = useState<Array<{ name: string; count: number }>>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] = useState<BlogFiltersType>({
    page: 1,
    limit: 10,
    category: initialFilters?.category,
    tags: initialFilters?.tag ? [initialFilters.tag] : [],
    search: initialFilters?.search,
  });

  // Load blog posts when filters change
  useEffect(() => {
    async function loadPosts() {
      setLoading(true);
      setError(null);

      try {
        const response = await getPublishedPosts(filters);

        if (response.data) {
          setPosts(response.data.posts);
          setTotal(response.data.total);
          setCurrentPage(response.data.page);
          setTotalPages(response.data.totalPages);
          setCategories(response.data.categories);
          setPopularTags(response.data.popularTags);
        }
      } catch (err) {
        setError('Gagal memuat artikel blog. Silakan coba lagi.');
        console.error('Error loading blog posts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPosts();
  }, [filters]);

  // Get initial filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFilters: BlogFiltersType = { ...filters };

    if (params.get('search')) newFilters.search = params.get('search') || undefined;
    if (params.get('category')) newFilters.category = params.get('category') || undefined;
    if (params.get('tag')) {
      const tag = params.get('tag');
      newFilters.tags = tag ? [tag] : [];
    }
    if (params.get('page')) {
      newFilters.page = parseInt(params.get('page')!) || 1;
    }

    setFilters(newFilters);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.tags && filters.tags.length > 0) {
      params.set('tag', filters.tags[0]); // Only first tag for URL simplicity
    }
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const handlePostClick = (post: BlogPost) => {
    window.location.href = `/blog/${post.slug}`;
  };

  const handleCategoryChange = (category: string | undefined) => {
    setFilters({ ...filters, category, page: 1 });
  };

  const handleTagsChange = (tags: string[]) => {
    setFilters({ ...filters, tags, page: 1 });
  };

  const handleSearchChange = (search: string) => {
    setFilters({ ...filters, search, page: 1 });
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      category: undefined,
      tags: [],
      search: undefined,
    });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (query.trim()) {
        setFilters({ ...filters, search: query, page: 1 });
      }
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} showSearch={true} />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-6">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              Blog & Artikel
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Tips, panduan, dan informasi seputar dunia otomotif
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24">
                <BlogFilters
                  categories={categories}
                  popularTags={popularTags}
                  selectedCategory={filters.category}
                  selectedTags={filters.tags || []}
                  searchQuery={filters.search || ''}
                  onCategoryChange={handleCategoryChange}
                  onTagsChange={handleTagsChange}
                  onSearchChange={handleSearchChange}
                  onClearFilters={handleClearFilters}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Filters */}
              <div className="lg:hidden mb-8">
                <BlogFilters
                  categories={categories}
                  popularTags={popularTags}
                  selectedCategory={filters.category}
                  selectedTags={filters.tags || []}
                  searchQuery={filters.search || ''}
                  onCategoryChange={handleCategoryChange}
                  onTagsChange={handleTagsChange}
                  onSearchChange={handleSearchChange}
                  onClearFilters={handleClearFilters}
                />
              </div>

              {/* Results Header */}
              {!loading && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold">
                    {filters.category || filters.search ? 'Hasil Pencarian' : 'Semua Artikel'}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {total > 0 ? `${total} artikel ditemukan` : 'Belum ada artikel'}
                  </p>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl overflow-hidden"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
                      <div className="p-5 space-y-3">
                        <div className="h-6 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-20 px-4">
                  <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-12 w-12 text-destructive" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h3>
                  <p className="text-muted-foreground mb-6">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* Blog Posts Grid */}
              {!loading && !error && posts.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                    {posts.map((post) => (
                      <BlogCard
                        key={post.id}
                        post={post}
                        onClick={() => handlePostClick(post)}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!loading && !error && posts.length === 0 && (
                <div className="text-center py-20 px-4">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Belum ada artikel blog</h3>
                  <p className="text-muted-foreground mb-6">
                    {filters.category || filters.search
                      ? 'Coba sesuaikan filter atau kata kunci pencarian Anda'
                      : 'Artikel blog akan segera hadir'}
                  </p>
                  {(filters.category || filters.search || (filters.tags && filters.tags.length > 0)) && (
                    <button
                      onClick={handleClearFilters}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Hapus Filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
