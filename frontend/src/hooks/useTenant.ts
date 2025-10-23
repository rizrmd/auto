/**
 * useTenant - Hook for fetching tenant branding
 */

import { useEffect, useState } from 'react';
import { getTenant, type Tenant } from '../api/cars';

export function useTenant(tenantId?: number) {
  const [data, setData] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchTenant() {
      setLoading(true);
      setError(null);

      const response = await getTenant(tenantId);

      if (!isMounted) return;

      if (response.error) {
        setError(response.error);
        setData(null);
      } else if (response.data) {
        setData(response.data);
      }

      setLoading(false);
    }

    fetchTenant();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return { data, loading, error };
}
