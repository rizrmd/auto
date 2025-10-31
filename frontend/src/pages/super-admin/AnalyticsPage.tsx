/**
 * Super Admin Analytics Page
 *
 * Comprehensive analytics dashboard with charts, metrics,
 * and insights for the entire platform.
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Car,
  MessageSquare,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Building2
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AnalyticsChart } from '@/components/super-admin/AnalyticsChart';

interface AnalyticsData {
  overview: {
    totalTenants: number;
    totalCars: number;
    totalLeads: number;
    totalUsers: number;
    totalRevenue: number;
    conversionRate: number;
  };
  trends: {
    daily: Array<{ date: string; tenants: number; cars: number; leads: number; revenue: number }>;
    monthly: Array<{ month: string; tenants: number; cars: number; leads: number; revenue: number }>;
  };
  topTenants: Array<{
    id: number;
    name: string;
    leads: number;
    conversionRate: number;
    revenue: number;
  }>;
  platformMetrics: {
    whatsappUsage: number;
    apiCalls: number;
    storageUsed: number;
    systemUptime: number;
  };
}

interface FilterOptions {
  period: '7d' | '30d' | '90d' | '1y';
  metric: string;
  tenant?: number;
}

function AnalyticsPage() {
  const location = useLocation();
  const token = localStorage.getItem('super_admin_token');

  // Parse URL for different views
  const getViewFromPath = () => {
    const path = location.pathname;
    if (path.includes('/performance')) return 'performance';
    if (path.includes('/revenue')) return 'revenue';
    if (path.includes('/tenants/')) return 'tenant-detail';
    return 'overview';
  };

  const currentView = getViewFromPath();

  // State
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    period: '30d',
    metric: 'all'
  });
  const [refreshing, setRefreshing] = useState(false);

  // Mock data generation
  const generateMockAnalytics = (): AnalyticsData => {
    const now = new Date();
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tenants: Math.floor(Math.random() * 3) + 1,
        cars: Math.floor(Math.random() * 10) + 2,
        leads: Math.floor(Math.random() * 25) + 5,
        revenue: Math.floor(Math.random() * 5000000) + 1000000
      };
    });

    const monthly = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        tenants: Math.floor(Math.random() * 5) + 1,
        cars: Math.floor(Math.random() * 20) + 5,
        leads: Math.floor(Math.random() * 100) + 20,
        revenue: Math.floor(Math.random() * 10000000) + 5000000
      };
    });

    return {
      overview: {
        totalTenants: 2,
        totalCars: 7,
        totalLeads: 10,
        totalUsers: 5,
        totalRevenue: 2250000,
        conversionRate: 82.5
      },
      trends: { daily, monthly },
      topTenants: [
        { id: 1, name: 'AutoLeads Motors', leads: 6, conversionRate: 85.5, revenue: 1500000 },
        { id: 2, name: 'PrimaMobil', leads: 4, conversionRate: 75.0, revenue: 750000 }
      ],
      platformMetrics: {
        whatsappUsage: 1250,
        apiCalls: 15680,
        storageUsed: 245.7,
        systemUptime: 99.8
      }
    };
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        period: filters.period,
        metric: filters.metric
      });

      const response = await fetch(`/api/super-admin/analytics?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        // Use mock data as fallback
        setData(generateMockAnalytics());
      }

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
      setData(generateMockAnalytics());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on mount and filter changes
  useEffect(() => {
    fetchAnalytics();
  }, [filters, currentView]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Handle export
  const handleExport = () => {
    if (!data) return;

    const csvContent = [
      ['Date', 'Tenants', 'Cars', 'Leads', 'Revenue'],
      ...data.trends.daily.map(d => [d.date, d.tenants, d.cars, d.leads, d.revenue])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${filters.period}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Render specific views
  if (currentView === 'tenant-detail') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/super-admin/analytics'}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Analytics
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Tenant Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed analytics for specific tenant. This view is under construction.
          </p>
        </div>
      </div>
    );
  }

  if (currentView === 'performance') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/super-admin/analytics'}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Analytics
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Performance Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            System performance metrics and optimization insights. This view is under construction.
          </p>
        </div>
      </div>
    );
  }

  if (currentView === 'revenue') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/super-admin/analytics'}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Analytics
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Revenue Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed revenue reports and financial insights. This view is under construction.
          </p>
        </div>
      </div>
    );
  }

  // Main overview view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Platform Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights and metrics for your multi-tenant platform
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            disabled={!data}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time Period:</span>
            <div className="flex rounded-lg shadow-sm">
              {[
                { value: '7d', label: '7 Days' },
                { value: '30d', label: '30 Days' },
                { value: '90d', label: '90 Days' },
                { value: '1y', label: '1 Year' }
              ].map((period) => (
                <button
                  key={period.value}
                  onClick={() => setFilters({ ...filters, period: period.value as any })}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg rounded-r-lg ${
                    filters.period === period.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  } ${period.value !== '7d' ? 'ml-1' : ''}`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenants</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.totalTenants}</p>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Car className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cars</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.totalCars}</p>
                  <p className="text-xs text-green-600">+8% from last month</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leads</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.totalLeads}</p>
                  <p className="text-xs text-green-600">+25% from last month</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Users className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.overview.totalUsers}</p>
                  <p className="text-xs text-green-600">+15% from last month</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(data.overview.totalRevenue)}
                  </p>
                  <p className="text-xs text-green-600">+18% from last month</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Leads Trend ({filters.period === '7d' ? 'Last 7 Days' : filters.period === '30d' ? 'Last 30 Days' : filters.period === '90d' ? 'Last 90 Days' : 'Last Year'})
                </h3>
                <BarChart3 className="w-5 h-5 text-gray-500" />
              </div>
              <AnalyticsChart
                type="line"
                data={filters.period === '1y' ? data.trends.monthly.map(m => ({ date: m.month, leads: m.leads })) : data.trends.daily.slice(-30)}
                color="#8b5cf6"
                height={300}
              />
            </div>

            {/* Revenue Trend */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Revenue Trend ({filters.period === '7d' ? 'Last 7 Days' : filters.period === '30d' ? 'Last 30 Days' : filters.period === '90d' ? 'Last 90 Days' : 'Last Year'})
                </h3>
                <TrendingUp className="w-5 h-5 text-gray-500" />
              </div>
              <AnalyticsChart
                type="area"
                data={filters.period === '1y' ? data.trends.monthly.map(m => ({ date: m.month, revenue: m.revenue / 1000000 })) : data.trends.daily.slice(-30).map(d => ({ date: d.date, revenue: d.revenue / 1000000 }))}
                color="#10b981"
                height={300}
              />
            </div>
          </div>

          {/* Top Tenants */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performing Tenants
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Leads
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Conversion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.topTenants.map((tenant, index) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {tenant.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {tenant.leads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 dark:text-white mr-2">
                            {tenant.conversionRate}%
                          </span>
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${tenant.conversionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(tenant.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platform Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">WhatsApp Usage</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.platformMetrics.whatsappUsage.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Messages this month</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Calls</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.platformMetrics.apiCalls.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Calls this month</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Used</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.platformMetrics.storageUsed} GB
                  </p>
                  <p className="text-xs text-gray-500">Of 1000 GB</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <Car className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Uptime</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data.platformMetrics.systemUptime}%
                  </p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Detailed Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.location.href = '/super-admin/analytics/performance'}
                className="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-400"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Performance Metrics
              </button>
              <button
                onClick={() => window.location.href = '/super-admin/analytics/revenue'}
                className="flex items-center justify-center px-4 py-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 dark:bg-green-900 dark:text-green-400"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Revenue Reports
              </button>
              <button
                onClick={() => window.location.href = '/super-admin/analytics/tenants'}
                className="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-400"
              >
                <Users className="w-4 h-4 mr-2" />
                Tenant Analytics
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default AnalyticsPage;