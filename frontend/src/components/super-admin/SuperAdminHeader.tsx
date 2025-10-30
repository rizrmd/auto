/**
 * Super Admin Header Component
 *
 * Top navigation header with breadcrumbs, notifications, and user menu.
 * Features dark theme and responsive design.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Settings,
  LogOut,
  User,
  ChevronDown,
  HelpCircle,
  Moon,
  Sun
} from 'lucide-react';
import { useSuperAdminAuth } from '@/context/SuperAdminAuthContext';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SuperAdminHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
}

export function SuperAdminHeader({ breadcrumbs = [], title }: SuperAdminHeaderProps) {
  const navigate = useNavigate();
  const { superAdmin, logout } = useSuperAdminAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/super-admin/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      console.log('Searching for:', searchQuery);
    }
  };

  // Mock notifications
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'New tenant created',
      message: 'Showroom Motor Jaya has been successfully onboarded',
      time: '2 minutes ago',
      read: false,
    },
    {
      id: 2,
      type: 'warning',
      title: 'High memory usage',
      message: 'Server memory usage is above 80%',
      time: '15 minutes ago',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      title: 'WhatsApp bot maintenance',
      message: 'Scheduled maintenance in 2 hours',
      time: '1 hour ago',
      read: true,
    },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      {/* Left side: Title and Breadcrumbs */}
      <div className="flex-1">
        {breadcrumbs.length > 0 ? (
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="text-slate-500">/</span>
                )}
                {item.href ? (
                  <button
                    onClick={() => navigate(item.href!)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-white font-medium">{item.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="text-xl font-semibold text-white">{title}</h1>
        )}
      </div>

      {/* Right side: Search, Notifications, User Menu */}
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tenants, settings..."
              className="w-64 pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg
                       text-white placeholder-slate-400 focus:outline-none focus:border-blue-500
                       transition-colors"
            />
          </div>
        </form>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs
                               rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700
                          rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-white font-medium">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 border-b border-slate-700 last:border-b-0
                        hover:bg-slate-700/50 transition-colors cursor-pointer
                        ${!notification.read ? 'bg-slate-700/20' : ''}
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`
                          w-2 h-2 rounded-full mt-2 flex-shrink-0
                          ${notification.type === 'success' ? 'bg-green-500' : ''}
                          ${notification.type === 'warning' ? 'bg-yellow-500' : ''}
                          ${notification.type === 'info' ? 'bg-blue-500' : ''}
                        `} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-slate-400 text-sm mt-1">
                            {notification.message}
                          </p>
                          <p className="text-slate-500 text-xs mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-800
                     transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {superAdmin?.name?.charAt(0)?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-white text-sm font-medium">
                {superAdmin?.name || 'Super Admin'}
              </p>
              <p className="text-slate-400 text-xs">
                {superAdmin?.role || 'super_admin'}
              </p>
            </div>
            <ChevronDown className={`
              w-4 h-4 text-slate-400 transition-transform
              ${showUserMenu ? 'rotate-180' : ''}
            `} />
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700
                          rounded-lg shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <p className="text-white font-medium">
                  {superAdmin?.name || 'Super Admin'}
                </p>
                <p className="text-slate-400 text-sm">
                  {superAdmin?.email || 'admin@autoleads.com'}
                </p>
              </div>

              <div className="py-2">
                <button
                  onClick={() => navigate('/super-admin/settings/profile')}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-slate-300
                           hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={() => navigate('/super-admin/settings')}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-slate-300
                           hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>System Settings</span>
                </button>

                <button
                  onClick={() => window.open('/docs', '_blank')}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-slate-300
                           hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Documentation</span>
                </button>
              </div>

              <div className="border-t border-slate-700 py-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-red-400
                           hover:text-red-300 hover:bg-slate-700/50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}