/**
 * BlogDetailPage - Premium blog post detail at /blog/:slug
 * Features: Breadcrumbs, markdown content, car references, social share, related posts
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  Eye,
  User,
  Share2,
  ChevronRight,
  Loader2,
  MessageCircle,
  Facebook,
  Twitter,
  Copy,
  Check,
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { BlogSEO } from '../components/BlogSEO';
import { MarkdownRenderer } from '../components/blog/MarkdownRenderer';
import { CarReferenceCard } from '../components/CarReferenceCard';
import { BlogCard } from '../components/blog/BlogCard';
import { Button } from '../components/ui/button';
import {
  getPostBySlug,
  getRelatedPosts,
  incrementPostViews,
  type BlogPost,
} from '../api/blog';

interface BlogDetailPageProps {
  slug: string;
}

export function BlogDetailPage({ slug }: BlogDetailPageProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load blog post
  useEffect(() => {
    async function loadPost() {
      setLoading(true);
      setError(null);

      try {
        const response = await getPostBySlug(slug);

        if (response.data) {
          setPost(response.data);

          // Increment view count (silent fail)
          incrementPostViews(slug);

          // Load related posts
          const relatedResponse = await getRelatedPosts(slug, 4);
          if (relatedResponse.data?.posts) {
            setRelatedPosts(relatedResponse.data.posts);
          }
        } else {
          setError('Artikel tidak ditemukan');
        }
      } catch (err) {
        setError('Gagal memuat artikel. Silakan coba lagi.');
        console.error('Error loading blog post:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [slug]);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;

      const windowHeight = window.innerHeight;
      const documentHeight = contentRef.current.clientHeight;
      const scrollTop = window.scrollY;
      const scrollHeight = documentHeight - windowHeight;
      const progress = (scrollTop / scrollHeight) * 100;

      setReadingProgress(Math.min(Math.max(progress, 0), 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
    if (!post) return;

    const url = window.location.href;
    const title = post.title;
    const text = post.excerpt;

    switch (platform) {
      case 'whatsapp':
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${text}\n\n${url}`)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        break;
    }
  };

  const handleRelatedPostClick = (relatedPost: BlogPost) => {
    window.location.href = `/blog/${relatedPost.slug}`;
  };

  const handleSearch = (query: string) => {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      if (query.trim()) {
        window.location.href = `/cars?search=${encodeURIComponent(query)}`;
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSearch={handleSearch} showSearch={true} />
        <main className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header onSearch={handleSearch} showSearch={true} />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center px-4">
            <h2 className="text-3xl font-bold mb-4">Artikel Tidak Ditemukan</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <a href="/blog">Kembali ke Blog</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentUrl = window.location.href;

  return (
    <div className="min-h-screen flex flex-col">
      <BlogSEO
        title={post.seo.metaTitle}
        description={post.seo.metaDescription}
        keywords={post.seo.keywords}
        ogImage={post.seo.ogImage || post.coverImage}
        url={currentUrl}
        publishedAt={post.publishedAt}
        updatedAt={post.updatedAt}
        author={post.author.name}
        type="article"
      />

      <Header onSearch={handleSearch} showSearch={true} />

      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-primary z-50 transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
      />

      {/* Breadcrumb */}
      <div className="bg-muted/30 border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <a
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Beranda
            </a>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <a
              href="/blog"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Blog
            </a>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground font-medium truncate max-w-xs md:max-w-md">
              {post.title}
            </span>
          </nav>
        </div>
      </div>

      <main className="flex-1 py-12" ref={contentRef}>
        <article className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Article Header */}
            <header className="mb-12">
              {/* Category Badge */}
              <div className="mb-6">
                <a
                  href={`/blog?category=${encodeURIComponent(post.category)}`}
                  className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm hover:bg-primary/20 transition-colors"
                >
                  {post.category}
                </a>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                {post.excerpt}
              </p>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pb-8 border-b">
                {/* Author */}
                <div className="flex items-center gap-3">
                  {post.author.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-foreground">
                      {post.author.name}
                    </div>
                    <div className="text-xs">Penulis</div>
                  </div>
                </div>

                <div className="h-8 w-px bg-border" />

                {/* Date */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>

                {/* Reading Time */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readingTimeMinutes} menit baca</span>
                </div>

                {/* Views */}
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{post.views.toLocaleString('id-ID')} kali dilihat</span>
                </div>
              </div>
            </header>

            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-12 rounded-2xl overflow-hidden shadow-xl">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
            )}

            {/* Main Content */}
            <div className="mb-12">
              <MarkdownRenderer content={post.content} />
            </div>

            {/* Car References */}
            {post.carReferences && post.carReferences.length > 0 && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold mb-6">Mobil yang Disebutkan</h3>
                <div className="space-y-6">
                  {post.carReferences.map((car) => (
                    <CarReferenceCard key={car.carId} car={car} />
                  ))}
                </div>
              </div>
            )}

            {/* Social Share */}
            <div className="mb-12 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Share2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold">Bagikan Artikel</h3>
                    <p className="text-sm text-muted-foreground">
                      Berbagi informasi bermanfaat
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('copy')}
                    className="gap-2"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="h-4 w-4" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Salin Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-12">
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground">
                  TAG ARTIKEL
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <a
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className="px-4 py-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors text-sm font-medium border border-border hover:border-primary/20"
                    >
                      #{tag}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="py-16 bg-muted/30 border-t">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-8">Artikel Terkait</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {relatedPosts.map((relatedPost) => (
                    <BlogCard
                      key={relatedPost.id}
                      post={relatedPost}
                      onClick={() => handleRelatedPostClick(relatedPost)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
