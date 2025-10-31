/**
 * Simple Debug Dashboard - Bypasses authentication context for debugging
 */

import React, { useState, useEffect } from 'react';
import { Building2, Car, MessageSquare, Users, Heart } from 'lucide-react';

interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalCars: number;
  availableCars: number;
  totalLeads: number;
  activeLeads: number;
  totalUsers: number;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  whatsappStatus: 'connected' | 'disconnected' | 'error';
}

function DebugDashboardPage() {
  console.log('🔍 Debug Dashboard mounting...');

  const [stats, setStats] = useState<DashboardStats>({
    totalTenants: 2,
    activeTenants: 2,
    totalCars: 4,
    availableCars: 4,
    totalLeads: 6,
    activeLeads: 6,
    totalUsers: 5,
    activeUsers: 4,
    systemHealth: 'healthy',
    whatsappStatus: 'connected'
  });

  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Debug Dashboard (No Auth)
            </h1>
            <p className="text-slate-400 mt-1">
              Simple dashboard for debugging purposes
            </p>
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <p className="text-slate-300">• Authentication context bypassed</p>
            <p className="text-slate-300">• Using hardcoded data</p>
            <p className="text-slate-300">• No API calls</p>
            <p className="text-slate-300">• Basic rendering test</p>
          </div>
        </div>

        {/* Simple Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="w-8 h-8 text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Total Tenants</h3>
                <p className="text-2xl font-bold text-blue-400">{stats.totalTenants}</p>
                <p className="text-sm text-slate-400">{stats.activeTenants} active</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="w-8 h-8 text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Total Cars</h3>
                <p className="text-2xl font-bold text-green-400">{stats.totalCars}</p>
                <p className="text-sm text-slate-400">{stats.availableCars} available</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">Total Leads</h3>
                <p className="text-2xl font-bold text-purple-400">{stats.totalLeads}</p>
                <p className="text-sm text-slate-400">{stats.activeLeads} active</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="w-8 h-8 text-red-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">System Health</h3>
                <p className="text-2xl font-bold text-green-400">{stats.systemHealth}</p>
                <p className="text-sm text-slate-400">All systems operational</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Test Content</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-green-400 rounded-full"></div>
              <span className="text-white">If you can see this, React is working</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
              <span className="text-white">CSS classes are loading correctly</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-purple-400 rounded-full"></div>
              <span className="text-white">Lucide icons are working</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Test Actions</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => alert('Debug button clicked!')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Test Button
            </button>
            <button
              onClick={() => setStats({...stats, totalTenants: stats.totalTenants + 1})}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Increment Tenants
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DebugDashboardPage;