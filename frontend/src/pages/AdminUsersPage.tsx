/**
 * Admin Users Page
 * User management interface for admin and sales team
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { adminAPI, User } from '../services/adminApi';
import { UserTable } from '../components/admin/UserTable';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function AdminUsersPage() {
  const { user: currentUser } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getUsers();
      const usersData = response?.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users';
      setError(errorMessage);
      setUsers([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleUsersChange = () => {
    loadUsers();
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const getRoleStats = () => {
    const usersArray = Array.isArray(users) ? users : [];
    const stats = {
      total: usersArray.length,
      admin: usersArray.filter(u => u.role === 'admin').length,
      sales: usersArray.filter(u => u.role === 'sales').length,
      owner: usersArray.filter(u => u.role === 'owner').length,
      active: usersArray.filter(u => u.status === 'active').length,
      inactive: usersArray.filter(u => u.status === 'inactive').length,
    };
    return stats;
  };

  const stats = getRoleStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users & Sales Team</h1>
            <p className="text-sm text-gray-500">
              Manage your tenant's admin and sales team members
            </p>
          </div>
          <Button onClick={() => document.getElementById('userTable-add-btn')?.click()} className="bg-orange-500 hover:bg-orange-600">
            <span className="mr-2">➕</span>
            Add User
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600">⚠️</span>
              <p className="text-red-700">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                ✕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-sm text-gray-500">Total Users</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-sm text-gray-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.admin}</div>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.sales}</div>
              <p className="text-sm text-gray-500">Sales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current User Info */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-900 flex items-center space-x-2">
            <span>👤</span>
            <span>Current Session</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-900">
                Logged in as: <span className="text-orange-700">{currentUser?.name}</span>
              </p>
              <p className="text-sm text-orange-700">
                Email: {currentUser?.email} • Role: {currentUser?.role}
              </p>
            </div>
            <div className="text-orange-600">
              <div className="w-2 h-2 bg-green-500 rounded-full inline-block mr-2"></div>
              Active
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <UserTable
        users={users}
        onUsersChange={handleUsersChange}
        onError={handleError}
      />

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <span>📖</span>
            <span>User Management Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">👥 User Roles</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-600">●</span>
                    <div>
                      <strong>Owner:</strong> Full access to all tenant settings and billing
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-blue-600">●</span>
                    <div>
                      <strong>Admin:</strong> Can manage users, cars, leads, and WhatsApp settings
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-600">●</span>
                    <div>
                      <strong>Sales:</strong> Can manage assigned leads and view car inventory
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">📱 WhatsApp Integration</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Set WhatsApp numbers for team members</li>
                  <li>• Enable lead assignment via WhatsApp</li>
                  <li>• Track team communication</li>
                  <li>• Automatic lead distribution</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚡ Pro Tips</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Assign dedicated WhatsApp numbers to sales team for better tracking</li>
                <li>• Keep user profiles updated with current phone numbers</li>
                <li>• Regularly review user access and deactivate unused accounts</li>
                <li>• Use strong passwords for admin accounts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}