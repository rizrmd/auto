/**
 * WhatsApp QR Scanner Component
 * Handles QR code display and WhatsApp connection status
 */

import React, { useState, useEffect, useRef } from 'react';
import { adminAPI, WhatsAppQR as WhatsAppQRType, WhatsAppStatus } from '../../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface WhatsAppQRProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export function WhatsAppQR({ onConnectionChange }: WhatsAppQRProps) {
  const [qrData, setQrData] = useState<WhatsAppQRType | null>(null);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const [connectionTestLoading, setConnectionTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const statusRefreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWhatsAppStatus();
    startStatusPolling();

    return () => {
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
      if (statusRefreshInterval.current) {
        clearInterval(statusRefreshInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    const isConnected = status?.data?.health?.connected || false;
    onConnectionChange?.(isConnected);
  }, [status, onConnectionChange]);

  const loadWhatsAppStatus = async () => {
    try {
      setError(null);
      const statusData = await adminAPI.getWhatsAppStatus();
      setStatus(statusData);

      // If not connected, try to get QR code
      if (!statusData.data.health.connected) {
        await loadQRCode();
      } else {
        // Stop QR refresh if connected
        if (qrRefreshInterval.current) {
          clearInterval(qrRefreshInterval.current);
          qrRefreshInterval.current = null;
        }
        setQrData(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load WhatsApp status';
      setError(errorMessage);
    }
  };

  const loadQRCode = async () => {
    try {
      setQrRefreshing(true);
      setError(null);
      const qrData = await adminAPI.getWhatsAppQR();
      setQrData(qrData);

      // Start QR refresh interval (every 30 seconds)
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
      }
      qrRefreshInterval.current = setInterval(loadQRCode, 30000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load QR code';
      setError(errorMessage);
    } finally {
      setQrRefreshing(false);
    }
  };

  const startStatusPolling = () => {
    // Poll status every 10 seconds
    if (statusRefreshInterval.current) {
      clearInterval(statusRefreshInterval.current);
    }
    statusRefreshInterval.current = setInterval(loadWhatsAppStatus, 10000);
  };

  const refreshQR = async () => {
    await loadQRCode();
  };

  const testConnection = async () => {
    try {
      setConnectionTestLoading(true);
      setTestResult(null);
      const result = await adminAPI.testWhatsApp();
      setTestResult(result.message || 'Test completed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test failed';
      setTestResult(errorMessage);
    } finally {
      setConnectionTestLoading(false);
    }
  };

  const disconnect = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp? You will need to scan QR code again to reconnect.')) {
      return;
    }

    try {
      setLoading(true);
      // For MVP, we'll just reload status
      await loadWhatsAppStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = status?.data?.health?.connected || false;
  const isPaired = status?.data?.health?.paired || false;

  if (error && !status) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Connection Error</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadWhatsAppStatus} variant="outline" className="w-full">
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>WhatsApp Connection Status</span>
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Status</p>
                <p className={`text-lg font-semibold ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Paired</p>
                <p className={`text-lg font-semibold ${
                  isPaired ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {isPaired ? 'Yes' : 'No'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Device Number</p>
                <p className="text-lg font-semibold text-gray-900">
                  {status?.data?.tenant?.whatsappNumber || 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Version</p>
                <p className="text-lg font-semibold text-gray-900">
                  {status?.data?.health?.version || 'Unknown'}
                </p>
              </div>
            </div>

            {isConnected && (
              <div className="flex space-x-2">
                <Button onClick={testConnection} disabled={connectionTestLoading} className="flex-1">
                  {connectionTestLoading ? 'Testing...' : '🧪 Test Connection'}
                </Button>
                <Button onClick={loadWhatsAppStatus} variant="outline" disabled={loading}>
                  🔄 Refresh
                </Button>
              </div>
            )}

            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.includes('success') || testResult.includes('successfully')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                <strong>Test Result:</strong> {testResult}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Scanner */}
      {!isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connect WhatsApp Bot</span>
              <Button onClick={refreshQR} variant="outline" size="sm" disabled={qrRefreshing}>
                {qrRefreshing ? '🔄' : '🔄'} Refresh QR
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                {qrData ? (
                  <div className="space-y-4">
                    <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                      <img
                        src={qrData.data.qr}
                        alt="WhatsApp QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Scan this QR code with your WhatsApp app
                      </p>
                      <ol className="text-left text-sm text-gray-500 space-y-1 max-w-md mx-auto">
                        <li>1. Open WhatsApp on your phone</li>
                        <li>2. Go to Settings → Linked Devices</li>
                        <li>3. Tap "Link a device"</li>
                        <li>4. Point your camera at the QR code</li>
                      </ol>
                      <div className="text-xs text-orange-600 font-medium">
                        QR code expires in {Math.floor((qrData.data.expires - Date.now()) / 1000)} seconds
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8">
                    <div className="text-6xl mb-4">📱</div>
                    <p className="text-gray-600 mb-4">Loading QR code...</p>
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Important Notes:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Keep this page open until the connection is established</li>
                  <li>• The QR code will automatically refresh when expired</li>
                  <li>• Only one WhatsApp device can be connected per tenant</li>
                  <li>• Make sure your phone has an active internet connection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhook Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className={`text-lg font-semibold ${
                    status.data.webhook.configured ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {status.data.webhook.configured ? 'Configured' : 'Not Configured'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">URL</p>
                  <p className="text-sm font-mono text-gray-900 break-all">
                    {status.data.webhook.url}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}