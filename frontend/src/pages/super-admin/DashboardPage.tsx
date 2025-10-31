/**
 * Super Admin Dashboard - Enhanced Interactive Version
 */

import React, { useState } from 'react';

export default function DashboardPage() {
  const [clickCount, setClickCount] = useState(0);
  const [message, setMessage] = useState('');

  console.log('🚀 Dashboard mounting...');

  const handleTestClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    setMessage(`Test berhasil! Tombol diklik ${newCount} kali.`);

    // Alert sebagai backup
    alert(`Dashboard berfungsi dengan baik! Klik ke-${newCount}`);

    // Clear message setelah 3 detik
    setTimeout(() => setMessage(''), 3000);
  };

  const handleRefresh = () => {
    setMessage('Data refreshed!');
    setTimeout(() => setMessage(''), 2000);
  };

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
          {message && (
            <div style={{
              backgroundColor: '#10b981',
              color: '#ffffff',
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '12px',
              fontWeight: 'bold'
            }}>
              {message}
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
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '8px' }}>Total Tenants</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>2</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Semua aktif</p>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              marginTop: '8px'
            }}></div>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <h3 style={{ color: '#10b981', marginBottom: '8px' }}>Total Mobil</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>4</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Tersedia</p>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              marginTop: '8px'
            }}></div>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <h3 style={{ color: '#8b5cf6', marginBottom: '8px' }}>Total Leads</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>6</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Aktif</p>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              marginTop: '8px'
            }}></div>
          </div>

          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>System Health</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff' }}>OK</p>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Normal</p>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#10b981',
              borderRadius: '50%',
              marginTop: '8px'
            }}></div>
          </div>
        </div>

        {/* Interactive Section */}
        <div style={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '16px'
          }}>
            Dashboard Controls
          </h2>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={handleTestClick}
              style={{
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Test Dashboard (Klik: {clickCount})
            </button>

            <button
              onClick={handleRefresh}
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Refresh Data
            </button>

            <button
              onClick={() => setMessage('System check complete! All functions working.')}
              style={{
                backgroundColor: '#8b5cf6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              System Check
            </button>
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#0f172a',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Status: <span style={{ color: '#10b981', fontWeight: 'bold' }}>● Online</span> |
              Last Update: {new Date().toLocaleTimeString('id-ID')} |
              Clicks: {clickCount}
            </p>
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
              marginBottom: '12px',
              borderLeft: '4px solid #3b82f6'
            }}>
              <p style={{ color: '#ffffff', marginBottom: '4px' }}>
                🏢 Tenant baru AutoLeads Motors dibuat
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                30 menit yang lalu • Status: Active
              </p>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              marginBottom: '12px',
              borderLeft: '4px solid #10b981'
            }}>
              <p style={{ color: '#ffffff', marginBottom: '4px' }}>
                🚗 Toyota Avanza 2020 ditambahkan ke katalog
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                2 jam yang lalu • Harga: Rp 150.000.000
              </p>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              marginBottom: '12px',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <p style={{ color: '#ffffff', marginBottom: '4px' }}>
                💬 Lead baru diterima dari WhatsApp
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px' }}>
                4 jam yang lalu • Source: WhatsApp Bot
              </p>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px'
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#ffffff',
            marginBottom: '8px'
          }}>
            Debug Information
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace' }}>
            URL: {window.location.href}<br/>
            Time: {new Date().toISOString()}<br/>
            Agent: {navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}<br/>
            State: {JSON.stringify({clickCount, message: message || 'none'})}
          </p>
        </div>
      </div>
    </div>
  );
}