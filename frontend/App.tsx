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

export function App() {
  // Simple client-side routing based on URL path
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  // Determine which page to render
  let PageComponent = HomePage;
  let pageProps = {};

  if (path.startsWith('/cars/')) {
    // Car detail page: /cars/avanza-2020-hitam-a01
    const slug = path.replace('/cars/', '');
    PageComponent = CarDetailPage;
    pageProps = { slug };
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
    <TenantProvider>
      <PageComponent {...pageProps} />
    </TenantProvider>
  );
}

export default App;
