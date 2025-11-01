/**
 * Super Admin Layout Component - Simple Version (Phase 1.1)
 * Provides sidebar navigation and content area for Super Admin Dashboard
 * No complex dependencies - pure React with inline styles
 */

import React, { useState } from 'react';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  console.log('🚀 SuperAdminLayout mounting...');

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      color: '#3b82f6'
    },
    {
      id: 'tenants',
      label: 'Tenants',
      icon: '🏢',
      color: '#10b981'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      color: '#8b5cf6'
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: '🔍',
      color: '#f59e0b'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      color: '#6b7280'
    }
  ];

  const handleMenuItemClick = (itemId: string) => {
    console.log(`🔄 Navigation: ${activeMenuItem} → ${itemId}`);
    setActiveMenuItem(itemId);

    // For now, just log navigation
    // In Phase 1.2, this will switch between actual pages
    if (itemId !== 'dashboard') {
      alert(`Navigation to ${itemId} page - Coming in Phase 2!`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? '80px' : '250px',
        backgroundColor: '#1e293b',
        borderRight: '1px solid #334155',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {!sidebarCollapsed && (
            <div>
              <h2 style={{
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0
              }}>
                Super Admin
              </h2>
              <p style={{
                color: '#94a3b8',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                Control Panel
              </p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {sidebarCollapsed ? '☰' : '◀'}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{
          flex: 1,
          padding: '16px 8px'
        }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: sidebarCollapsed ? '12px 8px' : '12px 16px',
                marginBottom: '4px',
                backgroundColor: activeMenuItem === item.id ? item.color + '20' : 'transparent',
                border: activeMenuItem === item.id ? `1px solid ${item.color}40` : '1px solid transparent',
                borderRadius: '8px',
                color: activeMenuItem === item.id ? item.color : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '14px',
                fontWeight: activeMenuItem === item.id ? '600' : '400'
              }}
              onMouseEnter={(e) => {
                if (activeMenuItem !== item.id) {
                  e.currentTarget.style.backgroundColor = '#33415550';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMenuItem !== item.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span style={{
                fontSize: '18px',
                marginRight: sidebarCollapsed ? '0' : '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && (
                <span>{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #334155'
        }}>
          {!sidebarCollapsed && (
            <div style={{
              textAlign: 'center',
              color: '#64748b',
              fontSize: '11px'
            }}>
              <div style={{ marginBottom: '4px' }}>Version 1.0.0</div>
              <div>Phase 1.1</div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <header style={{
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div>
              <h1 style={{
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 'bold',
                margin: 0,
                textTransform: 'capitalize'
              }}>
                {activeMenuItem}
              </h1>
              <p style={{
                color: '#94a3b8',
                fontSize: '14px',
                margin: '4px 0 0 0'
              }}>
                {menuItems.find(item => item.id === activeMenuItem)?.label || 'Dashboard'}
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* User Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 16px',
              backgroundColor: '#0f172a',
              borderRadius: '8px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                SA
              </div>
              <div>
                <div style={{
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Super Admin
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '12px'
                }}>
                  Online
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#10b98120',
              border: '1px solid #10b98140',
              borderRadius: '6px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10b981',
                borderRadius: '50%'
              }}></div>
              <span style={{
                color: '#10b981',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                System OK
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: '#0f172a'
        }}>
          <div style={{
            padding: '24px'
          }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}