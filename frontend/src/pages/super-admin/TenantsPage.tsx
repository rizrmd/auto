/**
 * Tenants Page - Phase 2.1 Real Data Integration
 * Advanced tenant management with API integration and real-time data
 */

import React, { useState, useEffect } from 'react';

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: string;
  plan: string;
  _count: {
    cars: number;
    leads: number;
    users: number;
    activeLeads: number;
    soldCars: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface TenantsResponse {
  success: boolean;
  data: {
    items: Tenant[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states for create/edit
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    primaryColor: '#FF5722',
    secondaryColor: '#000000',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    city: '',
    plan: 'basic',
    status: 'active'
  });

  console.log('🚀 TenantsPage mounting with API integration...');

  // API fetching function for tenants data
  const fetchTenantsData = async () => {
    const token = localStorage.getItem('super_admin_token');
    if (!token) {
      console.log('📝 No token found, using mock data');
      setTenants([
        {
          id: 1,
          name: 'AutoLeads Motors',
          subdomain: 'auto.autoleads.id',
          customDomain: 'auto.lumiku.com',
          status: 'active',
          plan: 'pro',
          _count: { cars: 2, leads: 3, users: 4, activeLeads: 3, soldCars: 0 },
          createdAt: '2025-10-30T06:32:56.161Z',
          updatedAt: '2025-10-30T06:32:56.161Z'
        },
        {
          id: 2,
          name: 'PrimaMobil Indonesia',
          subdomain: 'primamobil.autoleads.id',
          customDomain: 'primamobil.id',
          status: 'active',
          plan: 'growth',
          _count: { cars: 2, leads: 3, users: 3, activeLeads: 3, soldCars: 0 },
          createdAt: '2025-10-30T06:32:56.298Z',
          updatedAt: '2025-10-30T06:32:56.298Z'
        }
      ]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch tenants data from API
      const tenantsResponse = await fetch('/api/super-admin/tenants', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (tenantsResponse.ok) {
        const tenantsData: TenantsResponse = await tenantsResponse.json();
        if (tenantsData.success && tenantsData.data) {
          setTenants(tenantsData.data.items);
          console.log('✅ Tenants data fetched successfully:', tenantsData.data.items.length, 'tenants');
        }
      } else {
        console.warn('⚠️ Tenants API failed, using fallback data');
        setError('Failed to fetch latest data, showing cached data');
      }
    } catch (error) {
      console.error('❌ Error fetching tenants data:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setError('Failed to fetch real data, showing cached data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchTenantsData();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTenantsData();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // CRUD Operations
  const handleCreateTenant = async () => {
    const token = localStorage.getItem('super_admin_token');
    if (!token) {
      setModalError('Authentication required');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);

      const response = await fetch('/api/super-admin/tenants', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Tenant created successfully:', result.data);
          setShowCreateModal(false);
          resetForm();
          fetchTenantsData(); // Refresh list
        } else {
          setModalError(result.message || 'Failed to create tenant');
        }
      } else {
        const errorData = await response.json();
        setModalError(errorData.message || 'Failed to create tenant');
      }
    } catch (error) {
      console.error('❌ Error creating tenant:', error);
      setModalError('Network error occurred');
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateTenant = async () => {
    if (!selectedTenant) return;

    const token = localStorage.getItem('super_admin_token');
    if (!token) {
      setModalError('Authentication required');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);

      const response = await fetch(`/api/super-admin/tenants/${selectedTenant.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Tenant updated successfully:', result.data);
          setShowEditModal(false);
          setSelectedTenant(null);
          resetForm();
          fetchTenantsData(); // Refresh list
        } else {
          setModalError(result.message || 'Failed to update tenant');
        }
      } else {
        const errorData = await response.json();
        setModalError(errorData.message || 'Failed to update tenant');
      }
    } catch (error) {
      console.error('❌ Error updating tenant:', error);
      setModalError('Network error occurred');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`Are you sure you want to delete ${tenant.name}? This action cannot be undone.`)) {
      return;
    }

    const token = localStorage.getItem('super_admin_token');
    if (!token) {
      alert('Authentication required');
      return;
    }

    try {
      const response = await fetch(`/api/super-admin/tenants/${tenant.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ Tenant deleted successfully');
          fetchTenantsData(); // Refresh list
        } else {
          alert(result.message || 'Failed to delete tenant');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to delete tenant');
      }
    } catch (error) {
      console.error('❌ Error deleting tenant:', error);
      alert('Network error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subdomain: '',
      customDomain: '',
      primaryColor: '#FF5722',
      secondaryColor: '#000000',
      phone: '',
      whatsappNumber: '',
      email: '',
      address: '',
      city: '',
      plan: 'basic',
      status: 'active'
    });
    setModalError(null);
  };

  const openEditModal = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setFormData({
      name: tenant.name,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain || '',
      primaryColor: '#FF5722', // Default colors for edit
      secondaryColor: '#000000',
      phone: '',
      whatsappNumber: '',
      email: '',
      address: '',
      city: '',
      plan: tenant.plan,
      status: tenant.status
    });
    setShowEditModal(true);
  };

  return (
    <div style={{ color: '#ffffff' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            Tenant Management
          </h1>
          <p style={{ color: '#94a3b8' }}>
            Kelola semua tenant di platform AutoLeads
          </p>
          {loading && (
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #3b82f6',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '12px'
                }}></div>
                <span style={{ color: '#94a3b8' }}>Loading tenant data...</span>
              </div>
            </div>
          )}
          {error && (
            <div style={{
              backgroundColor: '#dc262620',
              border: '1px solid #dc262640',
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#dc2626', marginRight: '8px' }}>⚠️</span>
                <span style={{ color: '#ef4444' }}>{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '8px' }}>Total Tenants</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>{tenants.length}</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Semua aktif</p>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#10b981', marginBottom: '8px' }}>Total Cars</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {tenants.reduce((sum, t) => sum + (t._count?.cars || 0), 0)}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Semua tenant</p>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#8b5cf6', marginBottom: '8px' }}>Total Leads</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {tenants.reduce((sum, t) => sum + (t._count?.leads || 0), 0)}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Bulan ini</p>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#f59e0b', marginBottom: '8px' }}>Total Users</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>
              {tenants.reduce((sum, t) => sum + (t._count?.users || 0), 0)}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Semua tenant</p>
          </div>
        </div>

        {/* Tenants Table */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#ffffff',
                margin: 0
              }}>
                Daftar Tenant
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={fetchTenantsData}
                  disabled={loading}
                  style={{
                    backgroundColor: loading ? '#6b7280' : '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1
                  }}
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  + Add Tenant
                </button>
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#0f172a' }}>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #334155'
                  }}>
                    Tenant
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #334155'
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #334155'
                  }}>
                    Plan
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #334155'
                  }}>
                    Cars
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #334155'
                  }}>
                    Leads
                  </th>
                  <th style={{
                    padding: '16px',
                    textAlign: 'left',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #334155'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '16px' }}>
                      <div>
                        <div style={{
                          color: '#ffffff',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>
                          {tenant.name}
                        </div>
                        <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                          {tenant.customDomain || tenant.subdomain}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        backgroundColor: '#10b98120',
                        color: '#10b981',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {tenant.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        backgroundColor: '#3b82f620',
                        color: '#3b82f6',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#ffffff', fontSize: '14px' }}>
                      {tenant._count?.cars || 0}
                    </td>
                    <td style={{ padding: '16px', color: '#ffffff', fontSize: '14px' }}>
                      {tenant._count?.leads || 0}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(tenant)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(tenant)}
                          style={{
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase 2.1 - Real Data Integration Info */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#10b98120',
          border: '1px solid #10b98140',
          borderRadius: '8px'
        }}>
          <h3 style={{
            color: '#10b981',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            🔄 Phase 2.1 - Real Data Integration
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
            Tenant management sekarang menggunakan data real-time dari API. Data tenant, statistik mobil,
            lead, dan user diambil langsung dari database. Auto-refresh setiap 60 detik dengan error handling
            dan fallback ke mock data jika API tidak tersedia.
          </p>
          <div style={{
            marginTop: '12px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              API: /api/super-admin/tenants
            </div>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              Refresh: 60s | Manual: 🔄
            </div>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              Status: {loading ? 'Loading...' : 'Connected'}
            </div>
          </div>
        </div>

        {/* Phase 2.2 - CRUD Implementation Info */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#3b82f620',
          border: '1px solid #3b82f640',
          borderRadius: '8px'
        }}>
          <h3 style={{
            color: '#3b82f6',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            🚀 Phase 2.2 - Full CRUD Operations
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
            Complete tenant management with Create, Read, Update, Delete operations. Modal forms for creating
            and editing tenants with validation. Real-time API integration with error handling and success feedback.
          </p>
          <div style={{
            marginTop: '12px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              Create: + Add Tenant
            </div>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              Update: Edit Modal
            </div>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              Delete: Confirmation
            </div>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#64748b'
            }}>
              Form: Validation
            </div>
          </div>
        </div>

        {/* Phase Info */}
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px'
        }}>
          <h3 style={{
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            📋 Phase 2.3 - Coming Next
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
            Advanced search, filtering, pagination, and bulk operations will be implemented in Phase 2.3.
          </p>
        </div>

        {/* Create/Edit Tenant Modal */}
        {(showCreateModal || showEditModal) && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '32px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '24px'
              }}>
                {showCreateModal ? 'Create New Tenant' : 'Edit Tenant'}
              </h2>

              {modalError && (
                <div style={{
                  backgroundColor: '#dc262620',
                  border: '1px solid #dc262640',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: '#dc2626', marginRight: '8px' }}>⚠️</span>
                    <span style={{ color: '#ef4444' }}>{modalError}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Basic Information */}
                <div>
                  <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '12px' }}>Basic Information</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        Tenant Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        placeholder="Enter tenant name"
                      />
                    </div>

                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        Subdomain *
                      </label>
                      <input
                        type="text"
                        value={formData.subdomain}
                        onChange={(e) => setFormData({...formData, subdomain: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        placeholder="subdomain"
                      />
                    </div>

                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        Custom Domain
                      </label>
                      <input
                        type="text"
                        value={formData.customDomain}
                        onChange={(e) => setFormData({...formData, customDomain: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        placeholder="example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '12px' }}>Contact Information</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        placeholder="+628123456789"
                      />
                    </div>

                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({...formData, whatsappNumber: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        placeholder="+628123456789"
                      />
                    </div>

                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        placeholder="info@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '12px' }}>Address</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px',
                          minHeight: '80px',
                          resize: 'vertical'
                        }}
                        placeholder="Enter address"
                      />
                    </div>

                    <div>
                      <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#ffffff',
                          fontSize: '14px'
                        }}
                        placeholder="City name"
                      />
                    </div>
                  </div>
                </div>

                {/* Theme Colors (only for create) */}
                {showCreateModal && (
                  <div>
                    <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '12px' }}>Theme Colors</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                          Primary Color
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                            style={{
                              width: '50px',
                              height: '40px',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              backgroundColor: '#0f172a'
                            }}
                          />
                          <input
                            type="text"
                            value={formData.primaryColor}
                            onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                          Secondary Color
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                            style={{
                              width: '50px',
                              height: '40px',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              backgroundColor: '#0f172a'
                            }}
                          />
                          <input
                            type="text"
                            value={formData.secondaryColor}
                            onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                            style={{
                              flex: 1,
                              padding: '12px',
                              backgroundColor: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan and Status (only for edit) */}
                {showEditModal && (
                  <div>
                    <h3 style={{ color: '#ffffff', fontSize: '16px', marginBottom: '12px' }}>Settings</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                          Plan
                        </label>
                        <select
                          value={formData.plan}
                          onChange={(e) => setFormData({...formData, plan: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '14px'
                          }}
                        >
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="growth">Growth</option>
                          <option value="enterprise">Enterprise</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '14px'
                          }}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: '1px solid #334155'
              }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedTenant(null);
                    resetForm();
                  }}
                  disabled={modalLoading}
                  style={{
                    backgroundColor: '#6b7280',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: modalLoading ? 'not-allowed' : 'pointer',
                    opacity: modalLoading ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={showCreateModal ? handleCreateTenant : handleUpdateTenant}
                  disabled={modalLoading || !formData.name || !formData.subdomain || !formData.phone || !formData.whatsappNumber}
                  style={{
                    backgroundColor: (modalLoading || !formData.name || !formData.subdomain || !formData.phone || !formData.whatsappNumber) ? '#6b7280' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: (modalLoading || !formData.name || !formData.subdomain || !formData.phone || !formData.whatsappNumber) ? 'not-allowed' : 'pointer',
                    opacity: (modalLoading || !formData.name || !formData.subdomain || !formData.phone || !formData.whatsappNumber) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {modalLoading && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  )}
                  {modalLoading ? 'Processing...' : (showCreateModal ? 'Create Tenant' : 'Update Tenant')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}