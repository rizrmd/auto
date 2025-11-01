/**
 * AdminLogin - Login form for tenant admin access
 */

import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export function AdminLogin() {
  const { login, isLoading, error, clearError } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }

    setLoading(true);
    clearError();

    try {
      await login(email, password);
      // Navigation will be handled by AdminAppRouter
    } catch (err) {
      // Error is handled by AdminAuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-600">Sign in to manage your tenant</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Welcome Back
            </CardTitle>
            <p className="text-center text-gray-600">
              Enter your credentials to access the admin panel
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="admin@example.com"
                  disabled={loading || isLoading}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter your password"
                  disabled={loading || isLoading}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600">⚠️</span>
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-medium"
                disabled={loading || isLoading}
              >
                {loading || isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                ← Back to Website
              </a>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-xs text-center">
                <strong>Need help?</strong> Contact your system administrator for access credentials.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 AutoLeads Admin Portal</p>
        </div>
      </div>
    </div>
  );
}