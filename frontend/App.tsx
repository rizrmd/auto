/**
 * AutoLeads - Car Catalog App
 * Main app component with routing
 */

import React from 'react';
import "./index.css";
import { TenantProvider } from './src/context/TenantContext';
import { HomePage } from './src/pages/HomePage';
import { CarListingPage } from './src/pages/CarListingPage';
import { CarDetailPage } from './src/pages/CarDetailPage';
import { AdminIntelligencePage } from './src/pages/AdminIntelligencePage';
import { SuperAdminBridge } from './src/components/SuperAdminBridge';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ErrorTest } from './src/components/ErrorTest';

export function App() {
  // Simple client-side routing based on URL path
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Check if this is a Super Admin route
  if (path.startsWith('/super-admin')) {
    // Render Super Admin app (has its own routing)
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Super Admin App Error:', error, errorInfo);
        }}
      >
        <SuperAdminBridge />
      </ErrorBoundary>
    );
  }

  // Determine which page to render for main app
  let PageComponent = HomePage;
  let pageProps = {};

  if (path === '/test-error') {
    // Error test page (development/testing only)
    PageComponent = ErrorTest;
    pageProps = {};
  } else if (path === '/admin/intelligence') {
    // Admin intelligence dashboard
    PageComponent = AdminIntelligencePage;
    pageProps = {};
  } else if (path.startsWith('/cars/')) {
    // Car detail page: /cars/avanza-2020-hitam-a01
    const slug = path.replace('/cars/', '');
    PageComponent = CarDetailPage;
    pageProps = { carSlug: slug };
  } else if (path === '/cars' || path === '/catalog') {
    // Car listing page: /cars?brand=Toyota
    PageComponent = CarListingPage;
    pageProps = {
      initialFilters: {
        brand: params.get('brand') || undefined,
        minYear: params.get('minYear') ? parseInt(params.get('minYear')!) : undefined,
        maxYear: params.get('maxYear') ? parseInt(params.get('maxYear')!) : undefined,
        transmission: params.get('transmission') || undefined,
        minPrice: params.get('minPrice') ? parseInt(params.get('minPrice')!) : undefined,
        maxPrice: params.get('maxPrice') ? parseInt(params.get('maxPrice')!) : undefined,
        search: params.get('search') || undefined,
      }
    };
  }
  // Default: HomePage at /

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service in production
        console.error('App Error:', error, errorInfo);

        // TODO: Send to Sentry or similar error tracking service
        // if (import.meta.env.PROD) {
        //   Sentry.captureException(error, {
        //     contexts: { react: { componentStack: errorInfo.componentStack } },
        //   });
        // }
      }}
    >
      <TenantProvider>
        <PageComponent {...pageProps} />
      </TenantProvider>
    </ErrorBoundary>
  );
}

export default App;
