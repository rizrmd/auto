/**
 * BlogCard - Premium blog post preview card
 */

import React from 'react';
import { Calendar, Eye, User, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface BlogCardProps {
  post: {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    coverImage: string | null;
    publishedAt: string;
    author: {
      name: string;
      avatar: string | null;
    };
    views: number;
    readingTimeMinutes: number;
  };
  onClick?: () => void;
  className?: string;
}

export function BlogCard({ post, onClick, className }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    } else {
      window.location.href = `/blog/${post.slug}`;
    }
  };

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden border shadow-md hover:shadow-2xl transition-all duration-500 bg-card',
        'hover:-translate-y-2 hover:border-primary/20',
        className
      )}
    >
      <a href={`/blog/${post.slug}`} onClick={handleClick} className="block">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Calendar className="h-16 w-16 text-primary opacity-20" />
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm">
            {post.category}
          </div>

          {/* Glass Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        <CardContent className="p-5 space-y-3">
          {/* Title - Max 2 lines */}
          <h3 className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3.5rem]">
            {post.title}
          </h3>

          {/* Excerpt - Max 3 lines */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 min-h-[4.5rem]">
            {post.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-6 h-6 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
              )}
              <span className="font-medium">{post.author.name}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>

            {/* Reading Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{post.readingTimeMinutes} menit</span>
            </div>

            {/* Views */}
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>{post.views.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </a>
    </Card>
  );
}
