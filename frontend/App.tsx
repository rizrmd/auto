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
import { SuperAdminBridge } from './src/components/SuperAdminBridge';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ErrorTest } from './src/components/ErrorTest';
import { AdminAuthProvider, useAdminAuth } from './src/context/AdminAuthContext';
import { AdminLogin } from './src/components/AdminLogin';
import { AdminLayout } from './src/components/admin/AdminLayout';
import { AdminDashboardPage } from './src/pages/AdminDashboardPage';
import { AdminAnalyticsPage } from './src/pages/AdminAnalyticsPage';
import { AdminWhatsAppPage } from './src/pages/AdminWhatsAppPage';
import { AdminUsersPage } from './src/pages/AdminUsersPage';
import { BlogListingPage } from './src/pages/BlogListingPage';
import { BlogDetailPage } from './src/pages/BlogDetailPage';

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

  // Check if this is an Admin route
  if (path.startsWith('/admin')) {
    return (
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('Admin App Error:', error, errorInfo);
        }}
      >
        <AdminAuthProvider>
          <AdminAppRouter currentPath={path} />
        </AdminAuthProvider>
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
  } else if (path.startsWith('/blog/')) {
    // Blog detail page: /blog/tips-membeli-avanza-bekas
    const slug = path.replace('/blog/', '');
    PageComponent = BlogDetailPage;
    pageProps = { slug };
  } else if (path === '/blog') {
    // Blog listing page: /blog?category=tips&search=avanza
    PageComponent = BlogListingPage;
    pageProps = {
      initialFilters: {
        category: params.get('category') || undefined,
        tag: params.get('tag') || undefined,
        search: params.get('search') || undefined,
      }
    };
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

/**
 * Admin App Router Component
 * Handles routing for admin pages with authentication
 */
function AdminAppRouter({ currentPath }: { currentPath: string }) {
  const { isAuthenticated, isLoading, user } = useAdminAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (currentPath !== '/admin/login') {
      // Store the intended destination for redirect after login
      sessionStorage.setItem('admin_redirect', currentPath);
      window.location.href = '/admin/login';
      return null;
    }
    return <AdminLogin />;
  }

  // Redirect authenticated users away from login page
  if (currentPath === '/admin/login') {
    const redirectPath = sessionStorage.getItem('admin_redirect') || '/admin';
    sessionStorage.removeItem('admin_redirect');
    window.location.href = redirectPath;
    return null;
  }

  // Determine which admin page to render
  let AdminPageComponent = AdminDashboardPage;

  if (currentPath === '/admin' || currentPath === '/admin/') {
    AdminPageComponent = AdminDashboardPage;
  } else if (currentPath.startsWith('/admin/analytics')) {
    AdminPageComponent = AdminAnalyticsPage;
  } else if (currentPath.startsWith('/admin/whatsapp')) {
    AdminPageComponent = AdminWhatsAppPage;
  } else if (currentPath.startsWith('/admin/users')) {
    AdminPageComponent = AdminUsersPage;
  }
  // Add more admin routes here as needed

  return (
    <AdminLayout currentPath={currentPath}>
      <AdminPageComponent />
    </AdminLayout>
  );
}

export default App;
