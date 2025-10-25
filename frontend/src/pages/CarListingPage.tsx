/**
 * CarListingPage - Premium car catalog with filters
 */

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { CarGrid } from '../components/car/CarGrid';
import { CarFilters } from '../components/car/CarFilters';
import { Pagination } from '../components/shared/Pagination';
import { EmptyState } from '../components/shared/EmptyState';
import { useCars } from '../hooks/useCars';
import type { CarFilters as CarFiltersType, Car } from '../api/cars';

export function CarListingPage() {
  const [filters, setFilters] = useState<CarFiltersType>({
    page: 1,
    limit: 12,
    sortBy: 'newest',
  });

  const { data, loading, error } = useCars(filters);

  // Get search params from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newFilters: CarFiltersType = { ...filters };

    if (params.get('search')) newFilters.search = params.get('search') || undefined;
    if (params.get('brand')) newFilters.brand = params.get('brand') || undefined;
    if (params.get('transmission')) {
      newFilters.transmission = params.get('transmission') as 'Manual' | 'Matic';
    }
    if (params.get('sortBy')) {
      newFilters.sortBy = params.get('sortBy') as any;
    }

    setFilters(newFilters);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    if (filters.brand) params.set('brand', filters.brand);
    if (filters.transmission) params.set('transmission', filters.transmission);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  const handleCarClick = (car: Car) => {
    window.location.href = `/cars/${car.slug}`;
  };

  const handleSearch = (query: string) => {
    setFilters({ ...filters, search: query, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    window.location.href = '/cars';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSearch={handleSearch} showSearch={true} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Cari Mobil</h1>
            <p className="text-muted-foreground">
              {data ? `${data.total} mobil tersedia` : 'Memuat...'}
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar - Desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              {data && (
                <div className="sticky top-24">
                  <CarFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    brands={data.brands}
                    yearRange={data.yearRange}
                    priceRange={data.priceRange}
                  />
                </div>
              )}
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Filters */}
              <div className="lg:hidden mb-6">
                {data && (
                  <CarFilters
                    filters={filters}
                    onFiltersChange={setFilters}
                    brands={data.brands}
                    yearRange={data.yearRange}
                    priceRange={data.priceRange}
                    isMobile={true}
                  />
                )}
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <EmptyState
                  title="Terjadi Kesalahan"
                  description={error}
                  icon="car"
                  actionLabel="Coba Lagi"
                  onAction={() => window.location.reload()}
                />
              )}

              {/* Cars Grid */}
              {!loading && !error && data && (
                <>
                  {data.cars.length > 0 ? (
                    <>
                      <CarGrid cars={data.cars} onCarClick={handleCarClick} />

                      {/* Pagination */}
                      <div className="mt-12">
                        <Pagination
                          currentPage={data.page}
                          totalPages={data.totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    </>
                  ) : (
                    <EmptyState
                      title="Tidak ada mobil ditemukan"
                      description="Coba sesuaikan filter atau kata kunci pencarian Anda"
                      icon="search"
                      actionLabel="Hapus Filter"
                      onAction={handleClearFilters}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
