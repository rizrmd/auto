/**
 * Admin WhatsApp Page
 * Complete WhatsApp management interface
 */

import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { WhatsAppQR } from '../components/admin/WhatsAppQR';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function AdminWhatsAppPage() {
  const { tenant } = useAdminAuth();
  const [isConnected, setIsConnected] = useState(false);

  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
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

      {/* WhatsApp QR Scanner */}
      <WhatsAppQR onConnectionChange={handleConnectionChange} />

      {/* Instructions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <span>📖</span>
            <span>WhatsApp Bot Setup Guide</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">🔧 Setup Instructions</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Ensure your tenant has a dedicated WhatsApp number</li>
                  <li>2. Click "Connect WhatsApp" and scan the QR code</li>
                  <li>3. Keep the browser tab open during pairing</li>
                  <li>4. Test the connection using the test button</li>
                  <li>5. Configure webhook settings if needed</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">⚡ Features Available</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Automatic message handling</li>
                  <li>• Customer inquiry processing</li>
                  <li>• Lead capture and management</li>
                  <li>• Real-time message sync</li>
                  <li>• Multi-device support</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">⚠️ Important Notes</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• WhatsApp Business API is required for production use</li>
                <li>• Only one device can be connected per tenant</li>
                <li>• Messages older than 24 hours may not receive replies</li>
                <li>• Rate limits apply to prevent spam</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🛠️</span>
            <span>Troubleshooting</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Common Issues</h4>
              <div className="space-y-3">
                <div className="border-l-4 border-yellow-400 pl-4">
                  <p className="font-medium text-gray-900">QR Code Not Working</p>
                  <p className="text-sm text-gray-600">Try refreshing the QR code or ensure your WhatsApp app is updated</p>
                </div>
                <div className="border-l-4 border-yellow-400 pl-4">
                  <p className="font-medium text-gray-900">Connection Fails</p>
                  <p className="text-sm text-gray-600">Check your internet connection and WhatsApp server status</p>
                </div>
                <div className="border-l-4 border-yellow-400 pl-4">
                  <p className="font-medium text-gray-900">Messages Not Received</p>
                  <p className="text-sm text-gray-600">Verify webhook URL is configured correctly in WhatsApp Business settings</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1">
                📧 Contact Support
              </Button>
              <Button variant="outline" className="flex-1">
                📚 View Documentation
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}