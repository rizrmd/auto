/**
 * Super Admin Analytics Page
 *
 * Comprehensive analytics dashboard with global insights,
 * tenant performance metrics, revenue tracking, and growth trends.
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { useSuperAdminApi } from '@/context/SuperAdminAuthContext';
import { StatsCard } from '@/components/super-admin/StatsCard';
import { AnalyticsChart, TenantGrowthChart, RevenueChart, LeadSourcesChart, PerformanceMetricsChart } from '@/components/super-admin/AnalyticsChart';
import { GlobalAnalytics, TenantAnalytics } from '@/types/super-admin';

interface DateRange {
  startDate: string;
  endDate: string;
}

const presetRanges = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 12 months', days: 365 }
];

export function AnalyticsPage() {
  const { apiCall } = useSuperAdminApi();
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'revenue' | 'performance'>('overview');
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  });
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
  const [topTenants, setTopTenants] = useState<TenantAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, activeTab]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        groupBy: activeTab === 'overview' ? 'day' : 'week'
      });

      const [globalRes, tenantsRes] = await Promise.all([
        apiCall(`/analytics/global?${queryParams.toString()}`),
        apiCall(`/analytics/leaderboard?${queryParams.toString()}`).catch(() => null)
      ]);

      if (globalRes?.success) {
        setGlobalAnalytics(globalRes.data);
      }

      if (tenantsRes?.success) {
        setTopTenants(tenantsRes.data.items || []);
      }
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const handleExport = async () => {
    try {
      const response = await apiCall('/analytics/export', {
        method: 'POST',
        body: JSON.stringify({
          dateRange,
          type: activeTab
        })
      });

      if (response.success && response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export analytics');
    }
  };

  const mockGrowthData = [
    { name: 'Jan', tenants: 12, leads: 89, sales: 23, revenue: 125000 },
    { name: 'Feb', tenants: 15, leads: 102, sales: 31, revenue: 156000 },
    { name: 'Mar', tenants: 18, leads: 124, sales: 28, revenue: 142000 },
    { name: 'Apr', tenants: 22, leads: 145, sales: 35, revenue: 178000 },
    { name: 'May', tenants: 25, leads: 167, sales: 42, revenue: 215000 },
    { name: 'Jun', tenants: 28, leads: 189, sales: 38, revenue: 198000 },
  ];

  const mockRevenueData = [
    { name: 'Jan', revenue: 125000, growth: 8.5 },
    { name: 'Feb', revenue: 156000, growth: 12.3 },
    { name: 'Mar', revenue: 142000, growth: 6.2 },
    { name: 'Apr', revenue: 178000, growth: 15.8 },
    { name: 'May', revenue: 215000, growth: 18.4 },
    { name: 'Jun', revenue: 198000, growth: 11.2 },
  ];

  const mockLeadSources = [
    { name: 'WhatsApp', value: 45 },
    { name: 'Website', value: 28 },
    { name: 'Direct', value: 15 },
    { name: 'Social Media', value: 8 },
    { name: 'Referral', value: 4 }
  ];

  const mockPerformanceData = [
    { name: 'Jan', conversion: 3.2, response: 45 },
    { name: 'Feb', conversion: 3.8, response: 42 },
    { name: 'Mar', conversion: 3.5, response: 38 },
    { name: 'Apr', conversion: 4.2, response: 35 },
    { name: 'May', conversion: 4.8, response: 32 },
    { name: 'Jun', conversion: 4.5, response: 30 },
  ];

  if (loading && !globalAnalytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="w-12 h-12 bg-slate-700 rounded-lg mb-4" />
                <div className="w-24 h-4 bg-slate-700 rounded mb-2" />
                <div className="w-16 h-8 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">Global insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={loadAnalyticsData}
            disabled={loading}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 text-sm">Date Range:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {presetRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => handlePresetRange(range.days)}
                className="px-3 py-1 text-sm rounded-lg transition-colors"
                style={{
                  backgroundColor: dateRange.startDate === new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    ? '#3b82f6'
                    : '#374151',
                  color: dateRange.startDate === new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    ? '#ffffff'
                    : '#d1d5db'
                }}
              >
                {range.label}
              </button>
            ))}
            <div className="flex items-center space-x-2 ml-4">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1 text-sm bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'tenants', label: 'Tenants', icon: Building2 },
          { id: 'revenue', label: 'Revenue', icon: DollarSign },
          { id: 'performance', label: 'Performance', icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Tenants"
              value={globalAnalytics?.overview.totalTenants || 0}
              icon={Building2}
              trend={{
                value: globalAnalytics?.growth.tenantGrowthRate || 0,
                period: 'vs last period'
              }}
              color="blue"
            />
            <StatsCard
              title="Total Leads"
              value={globalAnalytics?.overview.totalLeads || 0}
              icon={Users}
              trend={{
                value: globalAnalytics?.growth.leadGrowthRate || 0,
                period: 'vs last period'
              }}
              color="purple"
            />
            <StatsCard
              title="Cars Sold"
              value={globalAnalytics?.overview.soldCars || 0}
              icon={TrendingUp}
              trend={{
                value: globalAnalytics?.growth.salesGrowthRate || 0,
                period: 'vs last period'
              }}
              color="green"
            />
            <StatsCard
              title="Conversion Rate"
              value={`${globalAnalytics?.performance.leadConversionRate || 0}%`}
              icon={Activity}
              description="Avg. across all tenants"
              color="yellow"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TenantGrowthChart data={globalAnalytics?.trends || mockGrowthData} />
            <LeadSourcesChart data={mockLeadSources} />
          </div>
        </div>
      )}

      {/* Tenants Tab */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              type="bar"
              title="Top Performing Tenants"
              subtitle="By lead conversion rate"
              data={globalAnalytics?.performance.topPerformingTenants.map(t => ({
                name: t.name,
                conversion: t.conversionRate,
                leads: t.leadsCount
              })) || []}
              series={[
                { key: 'conversion', name: 'Conversion Rate %', color: '#10b981' },
                { key: 'leads', name: 'Total Leads', color: '#3b82f6' }
              ]}
              height={300}
            />
            <AnalyticsChart
              type="line"
              title="New Tenant Acquisition"
              subtitle="Monthly new tenant registrations"
              data={globalAnalytics?.trends || mockGrowthData}
              series={[
                { key: 'tenants', name: 'New Tenants', color: '#8b5cf6' }
              ]}
              height={300}
            />
          </div>

          {/* Top Tenants Table */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Tenants by Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-slate-400 text-sm">
                    <th className="pb-3 font-medium">Tenant</th>
                    <th className="pb-3 font-medium">Leads</th>
                    <th className="pb-3 font-medium">Conversion</th>
                    <th className="pb-3 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {globalAnalytics?.performance.topPerformingTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-t border-slate-700">
                      <td className="py-3">{tenant.name}</td>
                      <td className="py-3">{tenant.leadsCount}</td>
                      <td className="py-3">{tenant.conversionRate}%</td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-green-400/20 text-green-400 rounded-lg text-sm">
                          {tenant.score}
                        </span>
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No tenant data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <RevenueChart data={mockRevenueData} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatsCard
              title="Total Revenue"
              value="$1.14M"
              icon={DollarSign}
              trend={{
                value: 15.8,
                period: 'vs last period'
              }}
              color="green"
            />
            <StatsCard
              title="Avg. Revenue/Tenant"
              value="$40,714"
              icon={Building2}
              description="Per month average"
              color="blue"
            />
            <StatsCard
              title="Revenue Growth"
              value="18.4%"
              icon={TrendingUp}
              description="Month over month"
              color="purple"
            />
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <PerformanceMetricsChart data={mockPerformanceData} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnalyticsChart
              type="area"
              title="Lead Sources Performance"
              subtitle="Conversion rates by source"
              data={mockLeadSources}
              series={[
                { key: 'value', name: 'Leads', color: '#06b6d4' }
              ]}
              height={250}
            />
            <AnalyticsChart
              type="bar"
              title="Response Time Trends"
              subtitle="Average response time in minutes"
              data={mockPerformanceData}
              series={[
                { key: 'response', name: 'Response Time', color: '#f97316' }
              ]}
              height={250}
            />
          </div>
        </div>
      )}
    </div>
  );
}