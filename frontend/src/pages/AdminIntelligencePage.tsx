/**
 * Admin Intelligence Page
 * 
 * Business intelligence dashboard for admin users
 */

import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Car, DollarSign, Activity, BarChart3, PieChart, LineChart } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTenantContext } from '../context/TenantContext';

interface OverviewData {
  totalLeads: number;
  activeLeads: number;
  conversionRate: number;
  totalRevenue: number;
  monthlyGrowth: number;
  topPerformingCars: Array<{
    id: number;
    name: string;
    leads: number;
    conversion: number;
  }>;
  recentActivity: Array<{
    type: string;
    message: string;
    time: string;
  }>;
}

interface LeadsAnalytics {
  period: string;
  totalLeads: number;
  conversionRate: number;
  averageResponseTime: number;
  leadSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  dailyTrends: Array<{
    date: string;
    leads: number;
    conversions: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

interface SalesPerformance {
  totalRevenue: number;
  carsSold: number;
  averageSalePrice: number;
  topSalespeople: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    sales: number;
  }>;
  conversionFunnel: {
    leads: number;
    qualified: number;
    proposals: number;
    closed: number;
  };
}

export function AdminIntelligencePage() {
  const { tenant } = useTenantContext();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [leadsAnalytics, setLeadsAnalytics] = useState<LeadsAnalytics | null>(null);
  const [salesPerformance, setSalesPerformance] = useState<SalesPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIntelligenceData() {
      setLoading(true);
      setError(null);

      try {
        // Load overview data
        const overviewResponse = await fetch('/api/admin/intelligence/overview');
        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json();
          setOverview(overviewData.data);
        }

        // Load leads analytics
        const leadsResponse = await fetch('/api/admin/intelligence/leads/analytics?period=30d');
        if (leadsResponse.ok) {
          const leadsData = await leadsResponse.json();
          setLeadsAnalytics(leadsData.data);
        }

        // Load sales performance
        const salesResponse = await fetch('/api/admin/intelligence/sales/performance');
        if (salesResponse.ok) {
          const salesData = await salesResponse.json();
          setSalesPerformance(salesData.data);
        }
      } catch (err) {
        setError('Failed to load intelligence data');
        console.error('Error loading intelligence data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadIntelligenceData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-2"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Intelligence Dashboard</h1>
          <p className="text-gray-600 mt-2">Business analytics and performance insights</p>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.totalLeads}</div>
                <p className="text-xs text-muted-foreground">
                  {overview.activeLeads} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(overview.conversionRate)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatPercentage(overview.monthlyGrowth)} from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  All time sales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">+{formatPercentage(overview.monthlyGrowth)}</div>
                <p className="text-xs text-muted-foreground">
                  vs last month
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lead Sources */}
          {leadsAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Lead Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leadsAnalytics.leadSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{source.source}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${source.percentage * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{source.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          {overview && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overview.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'lead' ? 'bg-blue-500' :
                        activity.type === 'sale' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top Performing Cars */}
        {overview && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Top Performing Cars
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Car Model</th>
                      <th className="text-center py-2">Leads</th>
                      <th className="text-center py-2">Conversion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.topPerformingCars.map((car, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 font-medium">{car.name}</td>
                        <td className="text-center py-2">{car.leads}</td>
                        <td className="text-center py-2">{formatPercentage(car.conversion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}