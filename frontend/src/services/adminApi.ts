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

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
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

  async testWhatsApp(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/whatsapp/test`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse(response);
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
}

// Export singleton instance
export const adminAPI = new AdminAPI();