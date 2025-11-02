/**
 * Admin Layout Component
 * Main layout with sidebar, header, and content area
 */

import React, { useState, ReactNode } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

interface AdminLayoutProps {
  currentPath: string;
  children: ReactNode;
}

export function AdminLayout({ currentPath, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, tenant, logout } = useAdminAuth();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const getPageTitle = () => {
    if (currentPath === '/admin' || currentPath === '/admin/') {
      return 'Dashboard';
    } else if (currentPath.startsWith('/admin/analytics')) {
      return 'Analytics';
    } else if (currentPath.startsWith('/admin/whatsapp')) {
      return 'WhatsApp Management';
    } else if (currentPath.startsWith('/admin/users')) {
      return 'Users & Sales Team';
    }
    return 'Admin Panel';
  };

  const getPageDescription = () => {
    if (currentPath === '/admin' || currentPath === '/admin/') {
      return 'Overview of your tenant status';
    } else if (currentPath.startsWith('/admin/analytics')) {
      return 'Track customer search demand and trends';
    } else if (currentPath.startsWith('/admin/whatsapp')) {
      return 'Manage WhatsApp bot connection and settings';
    } else if (currentPath.startsWith('/admin/users')) {
      return 'Add and manage your sales team members';
    }
    return 'Tenant administration';
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 lg:relative lg:inset-0 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <AdminSidebar currentPath={currentPath} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>

              {/* Page title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                <p className="text-sm text-gray-500">{getPageDescription()}</p>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {/* Tenant info */}
              <div className="hidden md:block">
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-orange-700">
                        {tenant?.name || 'Loading...'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* User dropdown */}
              <div className="relative group">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.name || 'Admin'}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {/* Dropdown menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-orange-600 mt-1">{user?.role}</p>
                  </div>
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-gray-700 hover:text-gray-900"
                      onClick={handleLogout}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}