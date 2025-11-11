/**
 * Cars API - All car-related API calls
 */

import { apiClient } from './client';

export interface Car {
  id: number;
  tenantId: number;
  displayCode: string;
  publicName: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  transmission: 'Manual' | 'Matic';
  km: number;
  price: string | number;
  fuelType: string | null;
  keyFeatures: string[];
  conditionNotes: string | null;
  photos: string[];
  primaryPhotoIndex: number;
  description: string | null;
  status: 'available' | 'sold' | 'booking' | 'draft';
  slug: string;
  createdAt: string;
  updatedAt: string;
  soldAt: string | null;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  whatsappNumber: string;
  email: string | null;
  address: string | null;
  city: string | null;
  mapsUrl: string | null;
  businessHours: Record<string, string> | null;
  headerTagline: string | null;
  headerTitle: string | null;
  headerSubtitle: string | null;
  headerCtaText: string | null;
}

export interface CarFilters {
  brand?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  transmission?: 'Manual' | 'Matic';
  search?: string;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'km_asc';
  page?: number;
  limit?: number;
}

export interface CarsResponse {
  cars: Car[];
  total: number;
  page: number;
  totalPages: number;
  brands: string[];
  availableYears: number[];
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
}

/**
 * Fetch cars with filters and pagination
 */
export async function getCars(filters: CarFilters = {}) {
  const params = new URLSearchParams();

  if (filters.brand) params.append('brand', filters.brand);
  if (filters.minYear) params.append('minYear', filters.minYear.toString());
  if (filters.maxYear) params.append('maxYear', filters.maxYear.toString());
  if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
  if (filters.transmission) params.append('transmission', filters.transmission);
  if (filters.search) params.append('search', filters.search);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const endpoint = `/api/cars${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient<any>(endpoint);

  // Handle backend's response structure: { success, data, meta }
  if (response.data?.success && response.data?.data) {
    // Extract unique brands from cars
    const cars = response.data.data;
    const brands = Array.from(new Set(cars.map((car: Car) => car.brand))).sort();

    // Calculate year and price ranges
    const years = cars.map((car: Car) => car.year);
    const prices = cars.map((car: Car) => typeof car.price === 'string' ? parseInt(car.price) : car.price);

    return {
      data: {
        cars: cars,
        total: response.data.meta?.total || 0,
        page: response.data.meta?.page || 1,
        totalPages: response.data.meta?.totalPages || 1,
        brands: brands,
        availableYears: response.data.data.availableYears || years.sort((a, b) => a - b),
        yearRange: {
          min: years.length > 0 ? Math.min(...years) : 2000,
          max: years.length > 0 ? Math.max(...years) : new Date().getFullYear(),
        },
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 1000000000,
        },
      },
      status: response.status,
    };
  }

  return response;
}

/**
 * Fetch single car by ID or slug
 */
export async function getCarDetail(idOrSlug: string | number) {
  const response = await apiClient<any>(`/api/cars/${idOrSlug}`);

  // Handle backend's response structure: { success, data }
  if (response.data?.success && response.data?.data) {
    return {
      data: response.data.data,
      status: response.status,
    };
  }

  return response;
}

/**
 * Fetch tenant information
 */
export async function getTenant(tenantId?: number) {
  const endpoint = tenantId ? `/api/tenant/${tenantId}` : '/api/tenant';
  return apiClient<Tenant>(endpoint);
}

/**
 * Search cars with autocomplete
 */
export async function searchCars(query: string, limit = 5) {
  const params = new URLSearchParams({
    search: query,
    limit: limit.toString(),
  });

  const response = await apiClient<any>(`/api/cars/search?${params.toString()}`);

  // Handle backend's response structure
  if (response.data?.success && response.data?.data) {
    return {
      data: response.data.data,
      status: response.status,
    };
  }

  return response;
}

/**
 * Get featured cars for homepage
 */
export async function getFeaturedCars(limit = 6) {
  const response = await apiClient<any>(`/api/cars/featured?limit=${limit}`);

  // Handle backend's response structure: { success, data: { cars, total } }
  if (response.data?.success && response.data?.data) {
    return {
      data: {
        cars: response.data.data.cars || [],
        total: response.data.data.total || 0,
      },
      status: response.status,
    };
  }

  return {
    data: {
      cars: [],
      total: 0,
    },
    status: response.status,
    error: response.error,
  };
}
