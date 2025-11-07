/**
 * Admin API Service
 * Minimal API calls for tenant admin functionality
 */

// Types for API responses
export interface WhatsAppStatus {
  success: boolean;
  data: {
    tenant: {
      id: number;
      name: string;
      slug: string;
      whatsappNumber: string;
      whatsappBotEnabled: boolean;
      whatsappStatus: string;
      whatsappPort?: number;
    };
    health: {
      connected: boolean;
      paired: boolean;
      version: string;
      webhook_configured: boolean;
    };
    webhook: {
      configured: boolean;
      url: string;
    };
  };
}

export interface WhatsAppQR {
  success: boolean;
  data: {
    qr: string;
    expires: number;
    device_id: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  role: 'owner' | 'admin' | 'sales';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  whatsappNumber?: string;
  role: 'admin' | 'sales';
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  whatsappNumber?: string;
  role?: 'admin' | 'sales';
  status?: 'active' | 'inactive';
  password?: string;
}

class AdminAPI {
  private baseURL = '/api/admin';

  private getAuthHeaders() {
    const token = localStorage.getItem('admin_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private interpretWhatsAppError(error: any): { message: string; action?: string; severity: 'error' | 'warning' | 'info' } {
    const errorMessage = error.message?.toLowerCase() || '';

    // WhatsApp Web API specific error patterns
    if (errorMessage.includes('not paired') || errorMessage.includes('use /pair endpoint first') || errorMessage.includes('please use /pair endpoint first')) {
      return {
        message: '📱 WhatsApp is not paired. Please scan the QR code to connect.',
        action: 'Generate QR code and scan with WhatsApp',
        severity: 'warning'
      };
    }

    if (errorMessage.includes('session corrupted') || errorMessage.includes('invalid session')) {
      return {
        message: '🔧 WhatsApp session is corrupted. Clearing corrupted session...',
        action: 'Use "Force Reconnect" to clear and start fresh',
        severity: 'error'
      };
    }

    if (errorMessage.includes('qr code expired') || errorMessage.includes('expired')) {
      return {
        message: '⏰ QR code has expired. Please generate a new one.',
        action: 'Click "Refresh QR" to generate a new QR code',
        severity: 'warning'
      };
    }

    if (errorMessage.includes('device limit') || errorMessage.includes('maximum 4 devices')) {
      return {
        message: '📱 WhatsApp device limit exceeded (max 4 devices). Please remove a device first.',
        action: 'Go to WhatsApp Settings > Linked Devices and remove an unused device',
        severity: 'error'
      };
    }

    if (errorMessage.includes('multi-device') || errorMessage.includes('multi device')) {
      return {
        message: '📱 Multi-device is not enabled on your WhatsApp account.',
        action: 'Enable multi-device in WhatsApp Settings > Linked Devices',
        severity: 'error'
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return {
        message: '🌐 Network connectivity issue with WhatsApp.',
        action: 'Check your internet connection and try again',
        severity: 'warning'
      };
    }

    if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
      return {
        message: '🔐 Authentication required. Please refresh the page and login again.',
        action: 'Refresh page and re-login',
        severity: 'error'
      };
    }

    if (errorMessage.includes('permission') || errorMessage.includes('403') || errorMessage.includes('access denied')) {
      return {
        message: '🚫 You do not have permission to access WhatsApp settings.',
        action: 'Contact your administrator for access',
        severity: 'error'
      };
    }

    if (errorMessage.includes('tenant') || errorMessage.includes('TENANT_REQUIRED')) {
      return {
        message: '🏢 Tenant context required. Please contact administrator.',
        action: 'Contact administrator to verify tenant configuration',
        severity: 'error'
      };
    }

    // Generic fallback
    return {
      message: error.message || 'An unknown error occurred',
      action: 'Try refreshing the page or contact support',
      severity: 'error'
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();

      // Preserve the exact WhatsApp API error message
      const errorMessage = error.error?.message ||
                          error.message ||
                          error.data?.message ||
                          `HTTP ${response.status}: ${response.statusText}`;

      // Create enhanced error with WhatsApp-specific context
      const enhancedError = new Error(errorMessage) as any;
      enhancedError.originalError = error;
      enhancedError.isWhatsAppError = true;
      enhancedError.statusCode = response.status;

      throw enhancedError;
    }
    return response.json();
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return this.handleResponse(response);
  }

  // WhatsApp Management
  async getWhatsAppStatus(): Promise<WhatsAppStatus> {
    const response = await fetch(`${this.baseURL}/whatsapp/status`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async getWhatsAppQR(): Promise<WhatsAppQR> {
    const response = await fetch(`${this.baseURL}/whatsapp/qr`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async testWhatsApp(): Promise<{ success: boolean; message: string; interpretedError?: any }> {
    try {
      const response = await fetch(`${this.baseURL}/whatsapp/test`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error: any) {
      if (error.isWhatsAppError) {
        return {
          success: false,
          message: error.message,
          interpretedError: this.interpretWhatsAppError(error)
        };
      }
      throw error;
    }
  }

  async forceReconnectWhatsApp(): Promise<{ success: boolean; message: string; data?: any; interpretedError?: any }> {
    try {
      const response = await fetch(`${this.baseURL}/whatsapp/force-reconnect`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error: any) {
      if (error.isWhatsAppError) {
        return {
          success: false,
          message: error.message,
          interpretedError: this.interpretWhatsAppError(error)
        };
      }
      throw error;
    }
  }

  // Enhanced error-aware WhatsApp methods
  async getWhatsAppStatusWithInterpretation(): Promise<{ success: boolean; data?: WhatsAppStatus; interpretedError?: any }> {
    try {
      const data = await this.getWhatsAppStatus();
      return { success: true, data };
    } catch (error: any) {
      if (error.isWhatsAppError) {
        return {
          success: false,
          interpretedError: this.interpretWhatsAppError(error)
        };
      }
      return {
        success: false,
        interpretedError: {
          message: error.message || 'Unknown error occurred',
          action: 'Try refreshing the page or contact support',
          severity: 'error'
        }
      };
    }
  }

  async getWhatsAppQRWithInterpretation(): Promise<{ success: boolean; data?: WhatsAppQR; interpretedError?: any }> {
    try {
      const data = await this.getWhatsAppQR();
      return { success: true, data };
    } catch (error: any) {
      if (error.isWhatsAppError) {
        return {
          success: false,
          interpretedError: this.interpretWhatsAppError(error)
        };
      }
      return {
        success: false,
        interpretedError: {
          message: error.message || 'Unknown error occurred',
          action: 'Try refreshing the page or contact support',
          severity: 'error'
        }
      };
    }
  }

  // Users Management
  async getUsers(): Promise<{ success: boolean; data: User[] }> {
    const response = await fetch(`${this.baseURL}/users`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  async createUser(userData: CreateUserData): Promise<{ success: boolean; data: User }> {
    const response = await fetch(`${this.baseURL}/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  async updateUser(id: number, userData: UpdateUserData): Promise<{ success: boolean; data: User }> {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    return this.handleResponse(response);
  }

  async deleteUser(id: number): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseURL}/users/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }

  // Dashboard Data
  async getDashboardData(): Promise<{
    success: boolean;
    data: {
      whatsapp: {
        status: string;
        phone: string;
        connected: boolean;
      };
      leads: {
        total: number;
        thisMonth: number;
        lastMonth: number;
        growth: number;
      };
      classification: {
        hot: number;
        warm: number;
        new: number;
        percentages: {
          hot: number;
          warm: number;
          new: number;
        };
      };
    };
  }> {
    try {
      const response = await fetch(`${this.baseURL}/dashboard`, {
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      throw error;
    }
  }

  // Analytics Data
  async getDemandReport(startDate: string, endDate: string, source: 'all' | 'website' | 'whatsapp' | 'compare' = 'all'): Promise<{
    success: boolean;
    data: {
      source: 'all' | 'website' | 'whatsapp' | 'compare';
      topCars: Array<{
        carName: string;
        brand: string;
        model: string;
        year: number | null;
        searchCount: number;
        searchDays: number;
      }>;
      topKeywords: Array<{
        keyword: string;
        searchCount: number;
        searchDays: number;
      }>;
      topUnmetNeeds: Array<{
        keyword: string;
        requestCount: number;
        source: string;
      }>;
      summary: {
        totalSearches: number;
        uniqueCars: number;
        avgSearchesPerDay: number;
        unmetNeeds?: number;
        dateRange: {
          start: string;
          end: string;
          days: number;
        };
        websiteSearches?: number;
        whatsappSearches?: number;
      };
      sourceBreakdown?: {
        website: number;
        whatsapp: number;
      };
      comparison?: {
        website: {
          topCars: Array<{
            carName: string;
            brand: string;
            model: string;
            year: number | null;
            searchCount: number;
            searchDays: number;
          }>;
          topKeywords: Array<{
            keyword: string;
            searchCount: number;
            searchDays: number;
          }>;
          dailyTrends: Array<{
            date: string;
            searchCount: number;
            searchSessions: number;
          }>;
        };
        whatsapp: {
          topCars: Array<{
            carName: string;
            brand: string;
            model: string;
            year: number | null;
            searchCount: number;
            searchDays: number;
          }>;
          topKeywords: Array<{
            keyword: string;
            searchCount: number;
            searchDays: number;
          }>;
          topUnmetNeeds: Array<{
            keyword: string;
            requestCount: number;
            source: string;
          }>;
          dailyTrends: Array<{
            date: string;
            searchCount: number;
            searchSessions: number;
          }>;
        };
      };
      dailyTrends: Array<{
        date: string;
        searchCount: number;
        searchSessions: number;
      }>;
    };
  }> {
    const response = await fetch(`${this.baseURL}/analytics/demand-report?startDate=${startDate}&endDate=${endDate}&source=${source}`, {
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const adminAPI = new AdminAPI();