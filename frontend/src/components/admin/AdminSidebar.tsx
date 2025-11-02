/**
 * Admin Sidebar Navigation
 * Simple sidebar with 3 main menu items
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface AdminSidebarProps {
  currentPath: string;
  className?: string;
}

export function AdminSidebar({ currentPath, className = '' }: AdminSidebarProps) {

  const menuItems = [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: '📊',
      description: 'Status overview',
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      icon: '📈',
      description: 'Search demand',
    },
    {
      path: '/admin/whatsapp',
      label: 'WhatsApp',
      icon: '📱',
      description: 'Bot management',
    },
    {
      path: '/admin/users',
      label: 'Users & Sales',
      icon: '👥',
      description: 'Team management',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin' || currentPath === '/admin/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className={`w-64 bg-white border-r border-gray-200 h-full ${className}`}>
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
            <p className="text-xs text-gray-500">Tenant Management</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <a key={item.path} href={item.path}>
              <Button
                variant={isActive(item.path) ? 'default' : 'ghost'}
                className={`w-full justify-start h-auto p-3 ${
                  isActive(item.path)
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${
                      isActive(item.path) ? 'text-orange-100' : 'text-gray-500'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Button>
            </a>
          ))}
        </nav>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">System Status</span>
              </div>
              <p className="text-xs text-gray-500">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <a href="/">
            <Button variant="ghost" className="w-full justify-start text-gray-500 hover:text-gray-700">
              <span className="mr-2">←</span>
              Back to Site
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}