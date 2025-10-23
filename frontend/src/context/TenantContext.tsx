/**
 * TenantContext - Provides tenant branding throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTenant } from '../hooks/useTenant';
import type { Tenant } from '../api/cars';

interface TenantContextValue {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  primaryColor: string;
  secondaryColor: string;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { data: tenant, loading, error } = useTenant();
  const [primaryColor, setPrimaryColor] = useState('#FF5722');
  const [secondaryColor, setSecondaryColor] = useState('#000000');

  useEffect(() => {
    if (tenant) {
      setPrimaryColor(tenant.primaryColor);
      setSecondaryColor(tenant.secondaryColor);

      // Apply CSS custom properties for dynamic theming
      document.documentElement.style.setProperty('--color-primary', tenant.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', tenant.secondaryColor);
    }
  }, [tenant]);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        loading,
        error,
        primaryColor,
        secondaryColor,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenantContext must be used within a TenantProvider');
  }
  return context;
}
