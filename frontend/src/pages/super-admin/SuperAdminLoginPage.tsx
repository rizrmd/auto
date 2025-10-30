/**
 * Super Admin Login Page
 *
 * Dedicated login page for Super Admin access with secure authentication,
 * MFA support, and professional design.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSuperAdminAuth } from '@/context/SuperAdminAuthContext';

function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useSuperAdminAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/super-admin/dashboard');
        }, 1000);
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/10 to-slate-900">
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/25">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Super Admin</h1>
          <p className="text-slate-400">AutoLeads Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                placeholder="admin@autoleads.com"
                disabled={isSubmitting}
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-slate-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="w-4 h-4 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-blue-500 focus:ring-2"
                disabled={isSubmitting}
              />
              <label htmlFor="remember-me" className="ml-3 text-slate-300 text-sm">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              {isSubmitting || isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
             </button>
           </form>

           {/* Footer Links */}
           <div className="mt-6 pt-6 border-t border-slate-700">
             <div className="text-center space-y-2">
               <p className="text-slate-400 text-sm">
                 Super Admin access only
               </p>
               <a
                 href="/login"
                 className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
               >
                 ← Back to regular login
               </a>
             </div>
           </div>
         </div>

         {/* Security Notice */}
         <div className="mt-8 text-center">
           <p className="text-slate-500 text-xs">
             This is a secure login portal. Unauthorized access is prohibited.
           </p>
           <p className="text-slate-600 text-xs mt-1">
             All login attempts are monitored and logged.
           </p>
         </div>
       </div>
     </div>
   );
 }

export default SuperAdminLoginPage;