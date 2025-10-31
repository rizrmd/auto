/**
 * Simple Super Admin Dashboard - Clean Working Version
 */

import React, { useState } from 'react';

export default function DashboardPage() {
  console.log('🚀 Dashboard mounting...');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            Super Admin Dashboard
          </h1>
          <p style={{ color: '#94a3b8' }}>
            Selamat datang di dashboard admin sistem
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
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>2</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Semua aktif</p>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#10b981', marginBottom: '8px' }}>Total Mobil</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>4</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Tersedia</p>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#8b5cf6', marginBottom: '8px' }}>Total Leads</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>6</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Aktif</p>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>System Health</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>OK</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Normal</p>
          </div>
        </div>

        {/* Activity Section */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '16px'
          }}>
            Aktifitas Terkini
          </h2>

          <div style={{ spaceY: '12px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <p style={{ color: '#ffffff', marginBottom: '4px' }}>
                🏢 Tenant baru AutoLeads Motors dibuat
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                30 menit yang lalu
              </p>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <p style={{ color: '#ffffff', marginBottom: '4px' }}>
                🚗 Toyota Avanza 2020 ditambahkan ke katalog
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                2 jam yang lalu
              </p>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              marginBottom: '12px'
            }}>
              <p style={{ color: '#ffffff', marginBottom: '4px' }}>
                💬 Lead baru diterima dari WhatsApp
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                4 jam yang lalu
              </p>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={() => alert('Dashboard berfungsi dengan baik!')}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Test Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}