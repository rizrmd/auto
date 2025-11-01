/**
 * Admin Dashboard Page
 * Simple dashboard with status overview and quick actions
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminAPI } from '../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  whatsappStatus: string;
  recentActivity: Array<{
    id: number;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export function AdminDashboardPage() {
  const { tenant, user } = useAdminAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getDashboardData();
      setDashboardData(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  const getWhatsAppStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pairing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getWhatsAppStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return '✅';
      case 'disconnected':
        return '❌';
      case 'pairing':
        return '⏳';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name || 'Admin'}!
        </h1>
        <p className="text-orange-100">
          Here's the current status of your tenant: <strong>{tenant?.name}</strong>
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WhatsApp Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>WhatsApp Status</span>
              <span className="text-2xl">
                {getWhatsAppStatusIcon(dashboardData?.whatsappStatus || 'disconnected')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getWhatsAppStatusColor(dashboardData?.whatsappStatus || 'disconnected')}`}>
                {dashboardData?.whatsappStatus || 'disconnected'}
              </div>
              <p className="text-sm text-gray-600">
                {dashboardData?.whatsappStatus === 'connected'
                  ? 'Your WhatsApp bot is active and ready to receive messages.'
                  : 'WhatsApp bot is not connected. Scan QR code to connect.'
                }
              </p>
              <a href="/admin/whatsapp">
                <Button variant="outline" size="sm" className="w-full">
                  {dashboardData?.whatsappStatus === 'connected' ? 'Manage WhatsApp' : 'Connect WhatsApp'}
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Users Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Team Members</span>
              <span className="text-2xl">👥</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData?.activeUsers || 0}
              </div>
              <p className="text-sm text-gray-600">
                {dashboardData?.totalUsers || 0} total users, {dashboardData?.activeUsers || 0} active
              </p>
              <a href="/admin/users">
                <Button variant="outline" size="sm" className="w-full">
                  Manage Team
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Quick Actions</span>
              <span className="text-2xl">⚡</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/admin/whatsapp">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <span className="mr-2">📱</span>
                  Setup WhatsApp Bot
                </Button>
              </a>
              <a href="/admin/users">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <span className="mr-2">➕</span>
                  Add Team Member
                </Button>
              </a>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={refreshData}>
                <span className="mr-2">🔄</span>
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <p>No recent activity</p>
              <p className="text-sm">Start using your admin panel to see activity here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Getting Started</h3>
              <p className="text-sm text-blue-700 mb-3">
                To get the most out of your admin panel, start by connecting your WhatsApp bot and adding team members.
              </p>
              <div className="flex space-x-2">
                <a href="/admin/whatsapp">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Setup WhatsApp
                  </Button>
                </a>
                <a href="/admin/users">
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                    Add Users
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}