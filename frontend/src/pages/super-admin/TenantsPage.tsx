/**
 * Tenants Page - Phase 1.2 Simple Template
 * Basic tenant management interface for Phase 1.2
 */

import React, { useState } from 'react';

export default function TenantsPage() {
  const [tenants] = useState([
    {
      id: 1,
      name: 'AutoLeads Motors',
      domain: 'autoleads.lumiku.com',
      status: 'Active',
      plan: 'Pro',
      cars: 4,
      leads: 6,
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'PrimaMobil',
      domain: 'prima.lumiku.com',
      status: 'Active',
      plan: 'Basic',
      cars: 3,
      leads: 4,
      createdAt: '2024-01-20'
    }
  ]);

  console.log('🚀 TenantsPage mounting...');

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
              {tenants.reduce((sum, t) => sum + t.cars, 0)}
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
              {tenants.reduce((sum, t) => sum + t.leads, 0)}
            </p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Bulan ini</p>
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
              <button
                onClick={() => alert('Add Tenant - Coming in Phase 2!')}
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
                          {tenant.domain}
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
                      {tenant.cars}
                    </td>
                    <td style={{ padding: '16px', color: '#ffffff', fontSize: '14px' }}>
                      {tenant.leads}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => alert(`Edit ${tenant.name} - Coming in Phase 2!`)}
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
                          onClick={() => alert(`View ${tenant.name} - Coming in Phase 2!`)}
                          style={{
                            backgroundColor: '#6b7280',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phase Info */}
        <div style={{
          marginTop: '32px',
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
            📋 Phase 1.2 - Basic Tenant Interface
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
            This is a basic tenant management interface. Full CRUD operations, search, filtering,
            and advanced features will be implemented in Phase 2.
          </p>
        </div>
      </div>
    </div>
  );
}