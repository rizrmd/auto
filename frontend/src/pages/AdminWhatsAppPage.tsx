/**
 * Admin WhatsApp Page
 * Complete WhatsApp management interface
 */

import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { WhatsAppQR } from '../components/admin/WhatsAppQR';
import { RateLimitWarning } from '../components/admin/RateLimitWarning';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface RateLimitStatus {
  isRateLimited: boolean;
  failureCount: number;
  suspectedRateLimit: boolean;
  lastAttempt: string | null;
  rateLimitedUntil: string | null;
  whatsappNumber: string;
  recommendations: string[];
}

export function AdminWhatsAppPage() {
  const { tenant } = useAdminAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);

  // Fetch rate limit status on mount and when connection changes
  useEffect(() => {
    fetchRateLimitStatus();
  }, [isConnected]);

  const fetchRateLimitStatus = async () => {
    try {
      const response = await fetch('/api/admin/whatsapp/rate-limit-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRateLimitStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch rate limit status:', error);
    }
  };

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    // Refresh rate limit status when connection changes
    if (connected) {
      fetchRateLimitStatus();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 -mx-6 -mt-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Management</h1>
            <p className="text-sm text-gray-500">
              Manage your tenant's WhatsApp bot connection and settings
            </p>
          </div>
          {isConnected && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">Connected</span>
            </div>
          )}
        </div>
      </div>

      {/* Tenant Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏢</span>
            <span>Tenant Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Tenant Name</p>
              <p className="text-lg font-semibold text-gray-900">{tenant?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Domain</p>
              <p className="text-lg font-semibold text-gray-900">
                {tenant?.customDomain || tenant?.subdomain || 'Not configured'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">WhatsApp Number</p>
              <p className="text-lg font-semibold text-gray-900">{tenant?.whatsappNumber || 'Not configured'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Bot Status</p>
              <p className="text-lg font-semibold text-gray-900">
                {tenant?.whatsappBotEnabled ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limit Warning - Show if pairing failures detected */}
      {rateLimitStatus && rateLimitStatus.failureCount >= 2 && (
        <RateLimitWarning
          failureCount={rateLimitStatus.failureCount}
          rateLimitedUntil={rateLimitStatus.rateLimitedUntil}
          whatsappNumber={rateLimitStatus.whatsappNumber}
          recommendations={rateLimitStatus.recommendations}
        />
      )}

      {/* WhatsApp QR Scanner */}
      <WhatsAppQR onConnectionChange={handleConnectionChange} />
    </div>
  );
}