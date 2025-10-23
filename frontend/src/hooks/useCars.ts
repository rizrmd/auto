/**
 * useCars - Hook for fetching cars with filters
 */

import { useEffect, useState } from 'react';
import { getCars, type CarFilters, type CarsResponse } from '../api/cars';

export function useCars(filters: CarFilters = {}) {
  const [data, setData] = useState<CarsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCars() {
      setLoading(true);
      setError(null);

      const response = await getCars(filters);

      if (!isMounted) return;

      if (response.error) {
        setError(response.error);
        setData(null);
      } else if (response.data) {
        setData(response.data);
      }

      setLoading(false);
    }

    fetchCars();

    return () => {
      isMounted = false;
    };
  }, [
    filters.brand,
    filters.minYear,
    filters.maxYear,
    filters.minPrice,
    filters.maxPrice,
    filters.transmission,
    filters.search,
    filters.sortBy,
    filters.page,
    filters.limit,
  ]);

  return { data, loading, error };
}
