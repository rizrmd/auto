/**
 * useCarDetail - Hook for fetching single car details
 */

import { useEffect, useState } from 'react';
import { getCarDetail, type Car } from '../api/cars';

export function useCarDetail(idOrSlug: string | number | null) {
  const [data, setData] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idOrSlug) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchCarDetail() {
      setLoading(true);
      setError(null);

      const response = await getCarDetail(idOrSlug);

      if (!isMounted) return;

      if (response.error) {
        setError(response.error);
        setData(null);
      } else if (response.data) {
        setData(response.data);
      }

      setLoading(false);
    }

    fetchCarDetail();

    return () => {
      isMounted = false;
    };
  }, [idOrSlug]);

  return { data, loading, error };
}
