/**
 * AdminLogin - Login form for tenant admin access
 */

import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

export function AdminLogin() {
  const { login, isLoading, error, clearError } = useAdminAuth();
  const [email, setEmail] = useState('admin@autolumiku.com');
  const [password, setPassword] = useState('admin123456');
  const [showPassword, setShowPassword] = useState(false);
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
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter your password"
                    disabled={loading || isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    disabled={loading || isLoading}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.41 6.41M14.121 14.121L17.59 17.59" />
                      </svg>
                    )}
                  </button>
                </div>
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

            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-center">
                <p className="text-orange-900 font-medium text-sm mb-2">
                  🚀 Quick Access Credentials
                </p>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-xs text-gray-600 mb-1">
                    <strong>Email:</strong> admin@autolumiku.com
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Password:</strong> admin123456
                  </p>
                  <p className="text-xs text-orange-600 mt-2">
                    (Click 👁️ to show/hide password)
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Need help?</strong> Contact your system administrator
                </p>
              </div>
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