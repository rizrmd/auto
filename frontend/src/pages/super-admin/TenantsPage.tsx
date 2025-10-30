/**
 * Super Admin Tenants Management Page
 *
 * Comprehensive tenant management interface with CRUD operations,
 * search, filtering, and bulk actions.
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
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdminApi } from '@/context/SuperAdminAuthContext';
import { TenantCard } from '@/components/super-admin/TenantCard';
import { TenantProfile, TenantFilter, TenantCreateData, TenantUpdateData } from '@/types/super-admin';

interface FilterOptions extends TenantFilter {
  search: string;
}

function TenantsPage() {
  const navigate = useNavigate();
  const { apiCall } = useSuperAdminApi();

  // State
  const [tenants, setTenants] = useState<TenantProfile[]>([]);
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
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [selectedTenants, setSelectedTenants] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load tenants
  useEffect(() => {
    loadTenants();
  }, [filters]);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append('search', filters.search);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.plan) queryParams.append('plan', filters.plan);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      queryParams.append('page', filters.page?.toString() || '1');
      queryParams.append('limit', filters.limit?.toString() || '12');

      const response = await apiCall(`/tenants?${queryParams.toString()}`);

      if (response.success) {
        setTenants(response.data.items);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError('Failed to load tenants');
      console.error('Tenants loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, search: query, page: 1 }));
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTenantEdit = (tenant: TenantProfile) => {
    navigate(`/super-admin/tenants/${tenant.id}/edit`);
  };

  const handleTenantSuspend = async (tenant: TenantProfile) => {
    if (!confirm(`Are you sure you want to suspend ${tenant.name}?`)) return;

    try {
      const response = await apiCall(`/tenants/${tenant.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'suspended' })
      });

      if (response.success) {
        loadTenants();
      } else {
        alert(response.error || 'Failed to suspend tenant');
      }
    } catch (err) {
      console.error('Tenant suspend error:', err);
      alert('Failed to suspend tenant');
    }
  };

  const handleTenantActivate = async (tenant: TenantProfile) => {
    try {
      const response = await apiCall(`/tenants/${tenant.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'active' })
      });

      if (response.success) {
        loadTenants();
      } else {
        alert(response.error || 'Failed to activate tenant');
      }
    } catch (err) {
      console.error('Tenant activate error:', err);
      alert('Failed to activate tenant');
    }
  };

  const handleTenantViewAnalytics = (tenant: TenantProfile) => {
    navigate(`/super-admin/analytics/tenants/${tenant.id}`);
  };

  const handleTenantDelete = async (tenant: TenantProfile) => {
    if (!confirm(`Are you sure you want to delete ${tenant.name}? This action cannot be undone.`)) return;

    try {
      const response = await apiCall(`/tenants/${tenant.id}`, {
        method: 'DELETE'
      });

      if (response.success) {
        loadTenants();
      } else {
        alert(response.error || 'Failed to delete tenant');
      }
    } catch (err) {
      console.error('Tenant delete error:', err);
      alert('Failed to delete tenant');
    }
  };

  const handleBulkAction = async (action: 'activate' | 'suspend' | 'delete') => {
    if (selectedTenants.length === 0) return;

    const confirmMessage = {
      activate: `Are you sure you want to activate ${selectedTenants.length} tenant(s)?`,
      suspend: `Are you sure you want to suspend ${selectedTenants.length} tenant(s)?`,
      delete: `Are you sure you want to delete ${selectedTenants.length} tenant(s)? This action cannot be undone.`
    };

    if (!confirm(confirmMessage[action])) return;

    try {
      const response = await apiCall('/tenants/bulk-action', {
        method: 'POST',
        body: JSON.stringify({
          action,
          tenantIds: selectedTenants
        })
      });

      if (response.success) {
        setSelectedTenants([]);
        loadTenants();
      } else {
        alert(response.error || `Failed to ${action} tenants`);
      }
    } catch (err) {
      console.error('Bulk action error:', err);
      alert(`Failed to ${action} tenants`);
    }
  };

  const handleExport = async () => {
    try {
      const response = await apiCall('/tenants/export', {
        method: 'POST',
        body: JSON.stringify({ filters })
      });

      if (response.success && response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export tenants');
    }
  };

  const toggleTenantSelection = (tenantId: number) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const toggleAllTenants = () => {
    if (selectedTenants.length === tenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(tenants.map(t => t.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tenants</h1>
          <p className="text-slate-400">
            Manage all {pagination.total} tenants and their configurations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedTenants.length > 0 && (
            <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
              <span className="text-slate-300 text-sm">
                {selectedTenants.length} selected
              </span>
              <button
                onClick={() => handleBulkAction('activate')}
                className="text-green-400 hover:text-green-300"
                title="Activate selected"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="text-yellow-400 hover:text-yellow-300"
                title="Suspend selected"
              >
                <AlertTriangle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="text-red-400 hover:text-red-300"
                title="Delete selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => navigate('/super-admin/tenants/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tenant</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tenants by name, domain, or email..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadTenants}
            disabled={loading}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="trial">Trial</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Plan
              </label>
              <select
                value={filters.plan}
                onChange={(e) => handleFilterChange('plan', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Plans</option>
                <option value="trial">Trial</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="pro">Pro</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="name">Name</option>
                <option value="createdAt">Created Date</option>
                <option value="lastActivity">Last Activity</option>
                <option value="carsCount">Cars Count</option>
                <option value="leadsCount">Leads Count</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Sort Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && tenants.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="w-12 h-12 bg-slate-700 rounded-lg mb-4" />
                <div className="w-24 h-4 bg-slate-700 rounded mb-2" />
                <div className="w-16 h-4 bg-slate-700 rounded mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="w-12 h-8 bg-slate-700 rounded" />
                  <div className="w-12 h-8 bg-slate-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Select All and Results Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedTenants.length === tenants.length && tenants.length > 0}
                  onChange={toggleAllTenants}
                  className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Select All</span>
              </label>
              <span className="text-slate-400 text-sm">
                Showing {tenants.length} of {pagination.total} tenants
              </span>
            </div>
          </div>

          {/* Tenants Grid */}
          {tenants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((tenant) => (
                <div key={tenant.id} className="relative">
                  <input
                    type="checkbox"
                    checked={selectedTenants.includes(tenant.id)}
                    onChange={() => toggleTenantSelection(tenant.id)}
                    className="absolute top-4 left-4 z-10 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                  />
                  <TenantCard
                    tenant={tenant}
                    onEdit={handleTenantEdit}
                    onSuspend={handleTenantSuspend}
                    onActivate={handleTenantActivate}
                    onViewAnalytics={handleTenantViewAnalytics}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tenants found</h3>
              <p className="text-slate-400 mb-6">
                {filters.search || filters.status || filters.plan
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first tenant'
                }
              </p>
              <button
                onClick={() => navigate('/super-admin/tenants/create')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Tenant</span>
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Page {filters.page} of {pagination.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleFilterChange('page', filters.page! - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1;
                  const isCurrentPage = page === filters.page;
                  const isNearCurrent = Math.abs(page - filters.page!) <= 2 || page === 1 || page === pagination.totalPages;

                  if (!isNearCurrent && page !== 1 && page !== pagination.totalPages) {
                    if (page === filters.page! - 3 || page === filters.page! + 3) {
                      return <span key={page} className="text-slate-500">...</span>;
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => handleFilterChange('page', page)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        isCurrentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handleFilterChange('page', filters.page! + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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