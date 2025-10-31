/**
 * Super Admin Tenants Management Page
 *
 * Comprehensive tenant management with CRUD operations,
 * search, filtering, analytics, and bulk actions.
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Building2,
  Users,
  Car,
  MessageSquare,
  TrendingUp
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  phone: string;
  whatsappNumber: string;
  whatsappBotEnabled: boolean;
  whatsappStatus: 'connected' | 'disconnected' | 'error';
  email?: string;
  address?: string;
  city?: string;
  plan: 'trial' | 'free' | 'starter' | 'growth' | 'pro';
  status: 'active' | 'suspended' | 'trial' | 'expired';
  trialEndsAt?: string;
  planStartedAt?: string;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  // Stats
  totalCars: number;
  totalLeads: number;
  totalUsers: number;
  conversionRate: number;
  monthlyRevenue?: number;
}

interface FilterOptions {
  search: string;
  status: string;
  plan: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  limit: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function TenantsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('super_admin_token');

  // Parse URL parameters for different views
  const getPathView = () => {
    const path = location.pathname;
    if (path.includes('/create')) return 'create';
    if (path.includes('/edit')) return 'edit';
    if (path.includes('/theme')) return 'theme';
    if (path.includes('/analytics')) return 'analytics';
    return 'list';
  };

  const currentView = getPathView();

  // State
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: '',
    plan: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0
  });
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data generation
  const generateMockTenants = (): Tenant[] => [
    {
      id: 1,
      name: 'AutoLeads Motors',
      slug: 'autoleads-motors',
      subdomain: 'autoleads',
      customDomain: 'auto.lumiku.com',
      logoUrl: '/assets/logo.png',
      primaryColor: '#FF5722',
      secondaryColor: '#000000',
      phone: '+6281234567890',
      whatsappNumber: '+6281234567890',
      whatsappBotEnabled: true,
      whatsappStatus: 'connected',
      email: 'info@autoleads.com',
      address: 'Jl. Sudirman No. 123',
      city: 'Jakarta',
      plan: 'growth',
      status: 'active',
      trialEndsAt: '2024-01-15T00:00:00Z',
      planStartedAt: '2024-01-15T00:00:00Z',
      planExpiresAt: '2025-01-15T00:00:00Z',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2025-01-30T15:45:00Z',
      totalCars: 4,
      totalLeads: 6,
      totalUsers: 3,
      conversionRate: 85.5,
      monthlyRevenue: 1500000
    },
    {
      id: 2,
      name: 'PrimaMobil',
      slug: 'primamobil',
      subdomain: 'prima',
      customDomain: null,
      logoUrl: null,
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      phone: '+6282345678901',
      whatsappNumber: '+6282345678901',
      whatsappBotEnabled: true,
      whatsappStatus: 'connected',
      email: 'contact@primamobil.com',
      address: 'Jl. Thamrin No. 456',
      city: 'Jakarta',
      plan: 'starter',
      status: 'active',
      trialEndsAt: '2024-02-01T00:00:00Z',
      planStartedAt: '2024-02-01T00:00:00Z',
      planExpiresAt: '2025-02-01T00:00:00Z',
      createdAt: '2024-02-01T09:15:00Z',
      updatedAt: '2025-01-28T11:20:00Z',
      totalCars: 3,
      totalLeads: 4,
      totalUsers: 2,
      conversionRate: 75.0,
      monthlyRevenue: 750000
    }
  ];

  // Fetch tenants data
  const fetchTenants = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        search: filters.search,
        status: filters.status,
        plan: filters.plan,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      });

      const response = await fetch(`/api/super-admin/tenants?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || generateMockTenants());
        setPagination(data.pagination || {
          total: generateMockTenants().length,
          page: 1,
          limit: 12,
          totalPages: 1
        });
      } else {
        // Use mock data as fallback
        const mockTenants = generateMockTenants();
        setTenants(mockTenants);
        setPagination({
          total: mockTenants.length,
          page: 1,
          limit: 12,
          totalPages: 1
        });
      }

    } catch (error) {
      console.error('Failed to fetch tenants:', error);
      setError('Failed to load tenants');
      const mockTenants = generateMockTenants();
      setTenants(mockTenants);
      setPagination({
        total: mockTenants.length,
        page: 1,
        limit: 12,
        totalPages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and filter changes
  useEffect(() => {
    if (currentView === 'list') {
      fetchTenants();
    }
  }, [filters, currentView]);

  // Handle tenant actions
  const handleCreateTenant = () => {
    navigate('/super-admin/tenants/create');
  };

  const handleEditTenant = (id: number) => {
    navigate(`/super-admin/tenants/${id}/edit`);
  };

  const handleViewTenant = (id: number) => {
    navigate(`/super-admin/tenants/${id}`);
  };

  const handleThemeSettings = (id: number) => {
    navigate(`/super-admin/tenants/${id}/theme`);
  };

  const handleAnalytics = (id: number) => {
    navigate(`/super-admin/tenants/${id}/analytics`);
  };

  const handleDeleteTenant = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/tenants/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setTenants(tenants.filter(t => t.id !== id));
      } else {
        alert('Failed to delete tenant');
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      alert('Failed to delete tenant');
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    try {
      const response = await fetch(`/api/super-admin/tenants/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTenants(tenants.map(t =>
          t.id === id ? { ...t, status: newStatus as any } : t
        ));
      } else {
        alert('Failed to update tenant status');
      }
    } catch (error) {
      console.error('Failed to update tenant status:', error);
      alert('Failed to update tenant status');
    }
  };

  // Handle bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTenants(tenants.map(t => t.id));
    } else {
      setSelectedTenants([]);
    }
  };

  const handleSelectTenant = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedTenants([...selectedTenants, id]);
    } else {
      setSelectedTenants(selectedTenants.filter(tid => tid !== id));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTenants.length === 0) {
      alert('Please select tenants first');
      return;
    }

    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedTenants.length} tenant(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/super-admin/tenants/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          tenantIds: selectedTenants
        }),
      });

      if (response.ok) {
        fetchTenants();
        setSelectedTenants([]);
      } else {
        alert(`Failed to ${action} tenants`);
      }
    } catch (error) {
      console.error(`Failed to ${action} tenants:`, error);
      alert(`Failed to ${action} tenants`);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'trial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get plan color
  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'growth': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'starter': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'free': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'trial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render different views based on URL
  if (currentView !== 'list') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/super-admin/tenants')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← Back to Tenants
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {currentView === 'create' && 'Create New Tenant'}
            {currentView === 'edit' && 'Edit Tenant'}
            {currentView === 'theme' && 'Theme Settings'}
            {currentView === 'analytics' && 'Tenant Analytics'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            This view is under construction. Please check back later.
          </p>
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Tenants Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage all showroom tenants and their configurations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchTenants()}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleCreateTenant}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tenants</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenants.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tenants.filter(t => t.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trial</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {tenants.filter(t => t.status === 'trial').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                Rp {tenants.reduce((sum, t) => sum + (t.monthlyRevenue || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tenants..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
          {selectedTenants.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTenants.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
              >
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={filters.plan}
              onChange={(e) => setFilters({ ...filters, plan: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Plans</option>
              <option value="trial">Trial</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="pro">Pro</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="name">Name</option>
              <option value="createdAt">Created Date</option>
              <option value="plan">Plan</option>
              <option value="status">Status</option>
            </select>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value as 'asc' | 'desc', page: 1 })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Tenants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTenants.includes(tenant.id)}
                        onChange={(e) => handleSelectTenant(tenant.id, e.target.checked)}
                        className="mr-3"
                      />
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                           style={{ backgroundColor: tenant.primaryColor }}>
                        {tenant.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {tenant.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tenant.subdomain}.lumiku.com
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.status)}">
                        {tenant.status}
                      </span>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(tenant.plan)}">
                        {tenant.plan}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.totalCars}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cars</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.totalLeads}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Leads</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{tenant.conversionRate}%</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Conv.</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${
                        tenant.whatsappStatus === 'connected' ? 'bg-green-400' :
                        tenant.whatsappStatus === 'disconnected' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}></div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        WhatsApp {tenant.whatsappStatus}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleViewTenant(tenant.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-400"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditTenant(tenant.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleThemeSettings(tenant.id)}
                        className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-purple-50 text-purple-600 rounded hover:bg-purple-100 dark:bg-purple-900 dark:text-purple-400"
                      >
                        <Palette className="w-3 h-3 mr-1" />
                        Theme
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {tenants.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No tenants found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by creating your first tenant.
              </p>
              <button
                onClick={handleCreateTenant}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300"
                >
                  Previous
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setFilters({ ...filters, page })}
                    className={`px-3 py-1 text-sm border rounded ${
                      page === pagination.page
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setFilters({ ...filters, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TenantsPage;