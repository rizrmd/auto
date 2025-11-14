/**
 * BlogFilters - Filter UI for blog listing page
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface BlogFiltersProps {
  categories: Array<{ name: string; count: number }>;
  popularTags: Array<{ name: string; count: number }>;
  selectedCategory?: string;
  selectedTags?: string[];
  searchQuery?: string;
  onCategoryChange: (category: string | undefined) => void;
  onTagsChange: (tags: string[]) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  className?: string;
}

export function BlogFilters({
  categories,
  popularTags,
  selectedCategory,
  selectedTags = [],
  searchQuery = '',
  onCategoryChange,
  onTagsChange,
  onSearchChange,
  onClearFilters,
  className,
}: BlogFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    selectedTags.length +
    (searchQuery ? 1 : 0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Cari artikel blog..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      <div className="flex items-center justify-between lg:hidden">
        <Button
          variant="outline"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          className="flex-1"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="ml-2"
          >
            <X className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Filters Container */}
      <div className={cn(
        'space-y-6',
        'lg:block',
        !isFilterExpanded && 'hidden lg:block'
      )}>
        {/* Category Filters */}
        {categories.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground/80">Kategori</h3>
              {selectedCategory && (
                <button
                  onClick={() => onCategoryChange(undefined)}
                  className="text-xs text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => onCategoryChange(selectedCategory === cat.name ? undefined : cat.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    'border border-border hover:border-primary/50',
                    selectedCategory === cat.name
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  {cat.name}
                  <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tag Filters */}
        {popularTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground/80">Tag Populer</h3>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => onTagsChange([])}
                  className="text-xs text-primary hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => handleTagToggle(tag.name)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                    'border border-border hover:border-primary/50',
                    selectedTags.includes(tag.name)
                      ? 'bg-primary/10 text-primary border-primary'
                      : 'bg-background hover:bg-muted'
                  )}
                >
                  #{tag.name}
                  <span className="ml-1.5 text-xs opacity-70">({tag.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Summary - Desktop Only */}
        {activeFilterCount > 0 && (
          <div className="hidden lg:block pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {activeFilterCount} filter aktif
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                <X className="h-4 w-4 mr-1" />
                Hapus Semua
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
