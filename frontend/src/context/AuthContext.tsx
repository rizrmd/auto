/**
 * AuthContext - Simple authentication for admin access
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextValue {
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token on mount
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (token) {
          // In a real app, you'd validate the token with the backend
          setIsAuthenticated(true);
          setIsAdmin(true);
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, accept any non-empty credentials
      // In production, this would be a real API call
      if (username && password) {
        // Mock successful login
        const mockToken = 'mock_admin_token_' + Date.now();
        localStorage.setItem('admin_token', mockToken);
        setIsAuthenticated(true);
        setIsAdmin(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}