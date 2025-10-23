/**
 * CarFilters - Premium filter sidebar/modal
 */

import React, { useState } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '@/lib/utils';
import type { CarFilters as CarFiltersType } from '../../api/cars';

interface CarFiltersProps {
  filters: CarFiltersType;
  onFiltersChange: (filters: CarFiltersType) => void;
  brands: string[];
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  className?: string;
  isMobile?: boolean;
}

export function CarFilters({
  filters,
  onFiltersChange,
  brands,
  yearRange,
  priceRange,
  className,
  isMobile = false,
}: CarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof CarFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    filters.brand ||
    filters.minYear ||
    filters.maxYear ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.transmission;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort By */}
      <div className="space-y-2">
        <Label htmlFor="sortBy">Sort By</Label>
        <Select
          value={filters.sortBy || 'newest'}
          onValueChange={(value) => handleFilterChange('sortBy', value)}
        >
          <SelectTrigger id="sortBy">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
            <SelectItem value="km_asc">Lowest Mileage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Brand */}
      <div className="space-y-2">
        <Label htmlFor="brand">Brand</Label>
        <Select
          value={filters.brand || 'all'}
          onValueChange={(value) =>
            handleFilterChange('brand', value === 'all' ? undefined : value)
          }
        >
          <SelectTrigger id="brand">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div className="space-y-2">
        <Label htmlFor="transmission">Transmission</Label>
        <Select
          value={filters.transmission || 'all'}
          onValueChange={(value) =>
            handleFilterChange(
              'transmission',
              value === 'all' ? undefined : (value as 'Manual' | 'Matic')
            )
          }
        >
          <SelectTrigger id="transmission">
            <SelectValue placeholder="All transmissions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Matic">Automatic</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Year Range */}
      <div className="space-y-2">
        <Label>Year Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.minYear?.toString() || 'any'}
            onValueChange={(value) =>
              handleFilterChange(
                'minYear',
                value === 'any' ? undefined : parseInt(value)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {Array.from(
                { length: yearRange.max - yearRange.min + 1 },
                (_, i) => yearRange.min + i
              ).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.maxYear?.toString() || 'any'}
            onValueChange={(value) =>
              handleFilterChange(
                'maxYear',
                value === 'any' ? undefined : parseInt(value)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Max" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {Array.from(
                { length: yearRange.max - yearRange.min + 1 },
                (_, i) => yearRange.min + i
              ).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <Label>Price Range (IDR)</Label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.minPrice?.toString() || 'any'}
            onValueChange={(value) =>
              handleFilterChange(
                'minPrice',
                value === 'any' ? undefined : parseInt(value)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="50000000">50 jt</SelectItem>
              <SelectItem value="100000000">100 jt</SelectItem>
              <SelectItem value="150000000">150 jt</SelectItem>
              <SelectItem value="200000000">200 jt</SelectItem>
              <SelectItem value="300000000">300 jt</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.maxPrice?.toString() || 'any'}
            onValueChange={(value) =>
              handleFilterChange(
                'maxPrice',
                value === 'any' ? undefined : parseInt(value)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Max" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="100000000">100 jt</SelectItem>
              <SelectItem value="200000000">200 jt</SelectItem>
              <SelectItem value="300000000">300 jt</SelectItem>
              <SelectItem value="500000000">500 jt</SelectItem>
              <SelectItem value="1000000000">1 M</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClearFilters}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  // Mobile: Sheet/Modal
  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setIsOpen(true)}
          className="w-full sm:w-auto"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
              Active
            </span>
          )}
        </Button>

        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 animate-in fade-in duration-200">
            <div className="fixed inset-x-0 bottom-0 bg-background rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <FilterContent />

              <Button
                className="w-full mt-6"
                onClick={() => setIsOpen(false)}
              >
                Show Results
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: Sidebar
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        {hasActiveFilters && (
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
            Active
          </span>
        )}
      </div>
      <FilterContent />
    </div>
  );
}
