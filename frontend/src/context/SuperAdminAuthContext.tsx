/**
 * Super Admin Authentication Context
 *
 * Provides authentication state and methods for Super Admin functionality.
 * Handles JWT tokens, session management, and role-based access control.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SuperAdminProfile, SuperAdminLoginResponse } from '../types/super-admin';

interface SuperAdminAuthContextValue {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  superAdmin: SuperAdminProfile | null;
  token: string | null;

  // Authentication methods
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;

  // Utility methods
  verifyToken: () => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextValue | undefined>(undefined);

interface SuperAdminAuthProviderProps {
  children: ReactNode;
}

export function SuperAdminAuthProvider({ children }: SuperAdminAuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [superAdmin, setSuperAdmin] = useState<SuperAdminProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  // API base URL
  const API_BASE = '/api/super-admin';

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
    return () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, []);

  const initializeAuth = async () => {
    // Add overall timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      console.warn('Auth initialization timeout - forcing completion');
      setIsLoading(false);
    }, 10000); // 10 second overall timeout

    try {
      const storedToken = localStorage.getItem('super_admin_token');
      const storedRefreshToken = localStorage.getItem('super_admin_refresh_token');
      const storedProfile = localStorage.getItem('super_admin_profile');

      if (storedToken && storedRefreshToken && storedProfile) {
        // Verify token validity
        const isValid = await verifyTokenInternal(storedToken);

        if (isValid) {
          try {
            setToken(storedToken);
            setSuperAdmin(JSON.parse(storedProfile));
            setIsAuthenticated(true);

            // Set up token refresh
            scheduleTokenRefresh(storedToken);
          } catch (error) {
            console.error('Failed to parse stored profile:', error);
            clearAuthData();
          }
        } else {
          // Token invalid, try refresh
          const refreshed = await refreshAuthToken(storedRefreshToken);
          if (!refreshed) {
            clearAuthData();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      clearAuthData();
    } finally {
      clearTimeout(authTimeout);
      setIsLoading(false);
    }
  };

  const verifyTokenInternal = async (tokenToVerify: string): Promise<boolean> => {
    try {
      // Add timeout to prevent infinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE}/auth/verify-token`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

   const scheduleTokenRefresh = (currentToken: string) => {
     if (!currentToken || typeof currentToken !== 'string' || !currentToken.includes('.')) {
       console.error('Invalid token for refresh scheduling:', currentToken);
       return;
     }
     try {
       // Parse JWT payload to get expiration
       const payload = JSON.parse(atob(currentToken.split('.')[1]));
       const expiresAt = payload?.exp * 1000; // Convert to milliseconds
       if (!expiresAt || isNaN(expiresAt)) {
         console.error('Invalid token payload:', payload);
         return;
       }
       const refreshAt = expiresAt - 5 * 60 * 1000; // Refresh 5 minutes before expiration
       const delay = refreshAt - Date.now();

       if (delay > 0) {
         const timeout = setTimeout(async () => {
           const refreshed = await refreshToken();
           if (!refreshed) {
             // Refresh failed, logout
             logout();
           }
         }, delay);

         setRefreshTimeout(timeout);
       }
     } catch (error) {
       console.error('Failed to schedule token refresh:', error);
     }
   };

  const refreshAuthToken = async (refreshTokenValue: string): Promise<boolean> => {
    try {
      // Add timeout to prevent infinite hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

       const data = await response.json();
       if (data.success && data.data) {
         const { token: newToken, refreshToken: newRefreshToken, superAdmin: profile } = data.data;

         if (!newToken || !newRefreshToken || !profile) {
           return false;
         }

         // Update state and storage
         setToken(newToken);
         setSuperAdmin(profile);
         setIsAuthenticated(true);

         localStorage.setItem('super_admin_token', newToken);
         localStorage.setItem('super_admin_refresh_token', newRefreshToken);
         localStorage.setItem('super_admin_profile', JSON.stringify(profile));

         // Schedule next refresh
         scheduleTokenRefresh(newToken);

         return true;
       }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

       if (data.success && data.data) {
         const { token: newToken, refreshToken: newRefreshToken, superAdmin: profile } = data.data;

         if (!newToken || !newRefreshToken || !profile) {
           return {
             success: false,
             error: 'Invalid response from server'
           };
         }

         // Update state
         setToken(newToken);
         setSuperAdmin(profile);
         setIsAuthenticated(true);

         // Store in localStorage
         localStorage.setItem('super_admin_token', newToken);
         localStorage.setItem('super_admin_refresh_token', newRefreshToken);
         localStorage.setItem('super_admin_profile', JSON.stringify(profile));

         // Schedule token refresh
         scheduleTokenRefresh(newToken);

         return { success: true };
       }
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const logout = () => {
    // Call logout endpoint to invalidate refresh token
    const refreshToken = localStorage.getItem('super_admin_refresh_token');
    if (refreshToken) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {
        // Ignore errors during logout
      });
    }

    clearAuthData();
  };

  const clearAuthData = () => {
    // Clear state
    setIsAuthenticated(false);
    setSuperAdmin(null);
    setToken(null);

    // Clear storage
    localStorage.removeItem('super_admin_token');
    localStorage.removeItem('super_admin_refresh_token');
    localStorage.removeItem('super_admin_profile');

    // Clear refresh timeout
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      setRefreshTimeout(null);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const storedRefreshToken = localStorage.getItem('super_admin_refresh_token');
    if (!storedRefreshToken) {
      return false;
    }

    return await refreshAuthToken(storedRefreshToken);
  };

  const verifyToken = async (): Promise<boolean> => {
    if (!token) {
      return false;
    }
    return await verifyTokenInternal(token);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        return { success: true };
      } else {
        return {
          success: false,
          error: data.error || 'Password change failed'
        };
      }
    } catch (error) {
      console.error('Password change failed:', error);
      return {
        success: false,
        error: 'Network error. Please try again.'
      };
    }
  };

  const value: SuperAdminAuthContextValue = {
    isAuthenticated,
    isLoading,
    superAdmin,
    token,
    login,
    logout,
    refreshToken,
    verifyToken,
    changePassword,
  };

  return (
    <SuperAdminAuthContext.Provider value={value}>
      {children}
    </SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth() {
  const context = useContext(SuperAdminAuthContext);
  if (context === undefined) {
    console.warn('useSuperAdminAuth used outside SuperAdminAuthProvider, returning fallback state');
    // Return fallback state instead of throwing error
    return {
      isAuthenticated: false,
      isLoading: false,
      superAdmin: null,
      token: null,
      login: async () => ({ success: false, error: 'Not available' }),
      logout: () => {},
      refreshToken: async () => false,
      verifyToken: async () => false,
      changePassword: async () => ({ success: false, error: 'Not available' }),
    };
  }
  return context;
}

// Hook for API calls with authentication
export function useSuperAdminApi() {
  const { token, logout } = useSuperAdminAuth();

  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `/api/super-admin${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle unauthorized responses
      if (response.status === 401) {
        logout();
        throw new Error('Authentication required');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  };

  return { apiCall };
}