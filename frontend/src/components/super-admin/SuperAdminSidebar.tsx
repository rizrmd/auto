/**
 * Super Admin Sidebar Navigation
 *
 * Provides navigation for all Super Admin sections with active state tracking
 * and responsive design. Features dark theme and smooth transitions.
 */

import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Monitor,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Users,
  Palette,
  Shield
} from 'lucide-react';
import { useSuperAdminAuth } from '@/context/SuperAdminAuthContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  subItems?: Array<{
    label: string;
    href: string;
  }>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/super-admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Tenants',
    href: '/super-admin/tenants',
    icon: Building2,
    subItems: [
      { label: 'All Tenants', href: '/super-admin/tenants' },
      { label: 'Create New', href: '/super-admin/tenants/create' },
    ],
  },
  {
    label: 'Analytics',
    href: '/super-admin/analytics',
    icon: BarChart3,
    subItems: [
      { label: 'Global Overview', href: '/super-admin/analytics' },
      { label: 'Performance', href: '/super-admin/analytics/performance' },
      { label: 'Revenue', href: '/super-admin/analytics/revenue' },
    ],
  },
  {
    label: 'Monitoring',
    href: '/super-admin/monitoring',
    icon: Monitor,
    subItems: [
      { label: 'System Health', href: '/super-admin/monitoring' },
      { label: 'WhatsApp Bot', href: '/super-admin/monitoring/whatsapp' },
      { label: 'Performance', href: '/super-admin/monitoring/performance' },
    ],
  },
  {
    label: 'Settings',
    href: '/super-admin/settings',
    icon: Settings,
    subItems: [
      { label: 'General', href: '/super-admin/settings/general' },
      { label: 'Security', href: '/super-admin/settings/security' },
      { label: 'WhatsApp', href: '/super-admin/settings/whatsapp' },
      { label: 'Features', href: '/super-admin/settings/features' },
    ],
  },
];

interface SuperAdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function SuperAdminSidebar({ isOpen, onToggle }: SuperAdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { superAdmin, logout } = useSuperAdminAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleSubItems = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string): boolean => {
    if (href === '/super-admin/tenants' || href === '/super-admin/analytics' ||
        href === '/super-admin/monitoring' || href === '/super-admin/settings') {
      return location.pathname.startsWith(href);
    }
    return location.pathname === href;
  };

  const isSubItemActive = (href: string): boolean => {
    return location.pathname === href;
  };

  const handleLogout = async () => {
    logout();
    navigate('/super-admin/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen bg-slate-900 border-r border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
        w-64 flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">Super Admin</h1>
              <p className="text-slate-400 text-xs">AutoLeads</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {superAdmin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {superAdmin?.name || 'Super Admin'}
              </p>
              <p className="text-slate-400 text-sm truncate">
                {superAdmin?.email || 'admin@autoleads.com'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const isExpanded = expandedItems.has(item.label);
            const active = isActive(item.href);

            return (
              <div key={item.label}>
                <Link
                  to={item.href}
                  onClick={(e) => {
                    if (hasSubItems) {
                      e.preventDefault();
                      toggleSubItems(item.label);
                    }
                  }}
                  className={`
                    flex items-center justify-between w-full px-4 py-3 rounded-lg
                    transition-all duration-200 group
                    ${active
                      ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`
                      w-5 h-5 transition-colors
                      ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}
                    `} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {hasSubItems && (
                      <ChevronDown className={`
                        w-4 h-4 transition-transform duration-200
                        ${isExpanded ? 'rotate-180' : ''}
                      `} />
                    )}
                  </div>
                </Link>

                {/* Sub-items */}
                {hasSubItems && isExpanded && (
                  <div className="mt-1 ml-4 space-y-1">
                    {item.subItems!.map((subItem) => (
                      <Link
                        key={subItem.href}
                        to={subItem.href}
                        className={`
                          flex items-center px-4 py-2 rounded-lg text-sm
                          transition-all duration-200
                          ${isSubItemActive(subItem.href)
                            ? 'text-blue-400 bg-slate-800'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                          }
                        `}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-current mr-3" />
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg
                     text-slate-300 hover:text-white hover:bg-slate-800
                     transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-white" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// Mobile menu button component
export function SuperAdminMobileMenuButton({ onToggle }: { onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-slate-800 rounded-lg
               border border-slate-700 text-slate-300 hover:text-white
               transition-colors shadow-lg"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
}