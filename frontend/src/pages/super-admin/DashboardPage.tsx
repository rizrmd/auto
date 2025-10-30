/**
 * Super Admin Dashboard Page
 *
 * Main dashboard providing global overview of all tenants, system health,
 * and key metrics. Features real-time data and interactive charts.
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Car,
  Users,
  TrendingUp,
  Activity,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useSuperAdminApi } from '@/context/SuperAdminAuthContext';
import { StatsCard } from '@/components/super-admin/StatsCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface GlobalAnalytics {
  overview: {
    totalTenants: number;
    activeTenants: number;
    totalCars: number;
    availableCars: number;
    soldCars: number;
    totalLeads: number;
    activeLeads: number;
    closedLeads: number;
    totalUsers: number;
    activeUsers: number;
  };
  growth: {
    newTenantsThisMonth: number;
    newTenantsThisYear: number;
    tenantGrowthRate: number;
    newLeadsThisMonth: number;
    newLeadsThisYear: number;
    leadGrowthRate: number;
    carsSoldThisMonth: number;
    carsSoldThisYear: number;
    salesGrowthRate: number;
  };
  trends: Array<{
    period: string;
    tenants: number;
    leads: number;
    sales: number;
    revenue: string;
  }>;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  services: {
    database: { status: string; responseTime?: number };
    api: { status: string; responseTime?: number };
    whatsapp: { status: string; responseTime?: number };
    storage: { status: string; responseTime?: number };
    cache: { status: string; responseTime?: number };
  };
  performance: {
    avgResponseTime: number;
    errorRate: number;
    requestRate: number;
    uptime: number;
  };
}

interface RecentActivity {
  id: number;
  type: 'tenant_created' | 'tenant_updated' | 'system_alert' | 'user_login';
  description: string;
  tenantName?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error';
}

export function DashboardPage() {
  const { apiCall } = useSuperAdminApi();
  const [analytics, setAnalytics] = useState<GlobalAnalytics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [analyticsRes, healthRes, activityRes] = await Promise.all([
        apiCall('/analytics/global').catch(() => null),
        apiCall('/monitoring/health').catch(() => null),
        apiCall('/monitoring/logs?limit=10').catch(() => null)
      ]);

      if (analyticsRes?.success) {
        setAnalytics(analyticsRes.data);
      }

      if (healthRes?.success) {
        setSystemHealth(healthRes.data);
      }

      // Mock recent activity if API doesn't exist yet
      const mockActivity: RecentActivity[] = [
        {
          id: 1,
          type: 'tenant_created',
          description: 'New tenant onboarded',
          tenantName: 'Showroom Motor Jaya',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          severity: 'info'
        },
        {
          id: 2,
          type: 'system_alert',
          description: 'High memory usage detected',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          severity: 'warning'
        },
        {
          id: 3,
          type: 'user_login',
          description: 'Super admin login',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          severity: 'info'
        },
      ];

      setRecentActivity(activityRes?.data?.items || mockActivity);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="w-12 h-12 bg-slate-700 rounded-lg mb-4" />
                <div className="w-24 h-4 bg-slate-700 rounded mb-2" />
                <div className="w-16 h-8 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getActivityIcon = (type: string, severity: string) => {
    switch (type) {
      case 'tenant_created':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'system_alert':
        return <AlertTriangle className={`w-4 h-4 ${severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`} />;
      case 'user_login':
        return <Users className="w-4 h-4 text-green-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Global overview of all tenants and system health</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Tenants"
          value={analytics?.overview.totalTenants || 0}
          icon={Building2}
          trend={{
            value: analytics?.growth.tenantGrowthRate || 0,
            period: 'vs last month'
          }}
          color="blue"
        />
        <StatsCard
          title="Total Cars"
          value={analytics?.overview.totalCars || 0}
          icon={Car}
          description={`${analytics?.overview.availableCars || 0} available`}
          color="green"
        />
        <StatsCard
          title="Total Leads"
          value={analytics?.overview.totalLeads || 0}
          icon={Users}
          trend={{
            value: analytics?.growth.leadGrowthRate || 0,
            period: 'vs last month'
          }}
          color="purple"
        />
        <StatsCard
          title="Cars Sold"
          value={analytics?.overview.soldCars || 0}
          icon={TrendingUp}
          trend={{
            value: analytics?.growth.salesGrowthRate || 0,
            period: 'vs last month'
          }}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trends Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Growth Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="period" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Line
                type="monotone"
                dataKey="tenants"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="leads"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6' }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* System Health */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
          <div className="space-y-4">
            {systemHealth ? (
              <>
                <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white">Overall Status</span>
                  </div>
                  <span className={`font-medium ${getHealthStatusColor(systemHealth.status)}`}>
                    {systemHealth.status.toUpperCase()}
                  </span>
                </div>

                {Object.entries(systemHealth.services).map(([service, health]) => (
                  <div key={service} className="flex items-center justify-between">
                    <span className="text-slate-400 capitalize">{service}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`
                        w-2 h-2 rounded-full
                        ${health.status === 'healthy' ? 'bg-green-400' : ''}
                        ${health.status === 'degraded' ? 'bg-yellow-400' : ''}
                        ${health.status === 'down' ? 'bg-red-400' : ''}
                      `} />
                      <span className="text-slate-300 text-sm">
                        {health.responseTime ? `${health.responseTime}ms` : health.status}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-slate-700">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Avg Response Time</p>
                      <p className="text-white font-medium">{systemHealth.performance.avgResponseTime}ms</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Error Rate</p>
                      <p className="text-white font-medium">{systemHealth.performance.errorRate}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Uptime</p>
                      <p className="text-white font-medium">{systemHealth.performance.uptime}%</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Request Rate</p>
                      <p className="text-white font-medium">{systemHealth.performance.requestRate}/s</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading system health...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 hover:bg-slate-700/30 rounded-lg transition-colors">
                {getActivityIcon(activity.type, activity.severity)}
                <div className="flex-1">
                  <p className="text-white">{activity.description}</p>
                  {activity.tenantName && (
                    <p className="text-slate-400 text-sm">{activity.tenantName}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-slate-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}