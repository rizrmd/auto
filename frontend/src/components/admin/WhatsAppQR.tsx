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
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const statusRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

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
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
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

      // Only load QR if we don't already have one (to prevent clearing existing QR)
      if (!statusData.data.health.connected && !qrData) {
        await loadQRCode();
      } else if (statusData.data.health.connected) {
        // Stop all QR-related intervals if connected
        if (qrRefreshInterval.current) {
          clearInterval(qrRefreshInterval.current);
          qrRefreshInterval.current = null;
        }
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        setQrData(null);
        setTimeLeft(0);
      }
      // If not connected but we already have QR data, don't reload it
      // This prevents QR from disappearing due to status polling
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

      // Set initial countdown
      const initialTimeLeft = Math.floor((qrData.data.expires - Date.now()) / 1000);
      setTimeLeft(Math.max(0, initialTimeLeft));

      // Clear existing countdown interval
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }

      // Start countdown timer with longer expiry and gentle refresh
      countdownInterval.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // QR expired, show expired state instead of immediate refresh
            setError('QR code expired. Please click "Refresh QR" to generate a new one.');
            // Clear intervals when expired
            if (qrRefreshInterval.current) {
              clearInterval(qrRefreshInterval.current);
              qrRefreshInterval.current = null;
            }
            if (countdownInterval.current) {
              clearInterval(countdownInterval.current);
              countdownInterval.current = null;
            }
          }
          return newTime;
        });
      }, 1000);

      // Don't auto-refresh QR codes - let user manually refresh to prevent disappearing
      // This gives user full control over when to refresh
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load QR code';
      setError(errorMessage);
      // Clear countdown on error
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      setTimeLeft(0);
    } finally {
      setQrRefreshing(false);
    }
  };

  const startStatusPolling = () => {
    // Poll status every 10 seconds (reduced frequency to prevent QR interference)
    if (statusRefreshInterval.current) {
      clearInterval(statusRefreshInterval.current);
    }
    statusRefreshInterval.current = setInterval(loadWhatsAppStatus, 10000);
  };

  const refreshQR = async () => {
    // Clear existing intervals before refresh
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
      qrRefreshInterval.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }

    // Reset states
    setError(null);
    setQrData(null);
    setTimeLeft(0);

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

  const forceReconnect = async () => {
    if (!confirm('Are you sure you want to force reconnect WhatsApp? This will clear the current connection and generate a new QR code.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call API to force disconnect
      const reconnectResult = await adminAPI.forceReconnectWhatsApp();

      if (!reconnectResult.success) {
        throw new Error(reconnectResult.message || 'Force reconnect failed');
      }

      // Clear all intervals
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
        qrRefreshInterval.current = null;
      }
      if (statusRefreshInterval.current) {
        clearInterval(statusRefreshInterval.current);
        statusRefreshInterval.current = null;
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }

      // Reset all states
      setQrData(null);
      setStatus(null);
      setTimeLeft(0);
      setTestResult(null);

      // Show success message
      setTestResult(reconnectResult.message || 'WhatsApp disconnected successfully. Generating new QR code...');

      // Load QR code immediately without delay to prevent disappearing
      await loadQRCode();

      // Start status polling after QR is loaded
      startStatusPolling();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Force reconnect failed';
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
            <div className="flex space-x-2">
              <Button onClick={loadWhatsAppStatus} variant="outline" className="flex-1">
                🔄 Retry Connection
              </Button>
              <Button onClick={forceReconnect} variant="destructive" className="flex-1" disabled={loading}>
                {loading ? '🔄 Reconnecting...' : '🔄 Force Reconnect'}
              </Button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-700">
                <strong>💡 Tip:</strong> If the connection keeps failing, try "Force Reconnect" to clear everything and start fresh.
              </p>
            </div>
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
                  🔄 Refresh Status
                </Button>
                <Button onClick={forceReconnect} variant="destructive" disabled={loading}>
                  🔄 Force Reconnect
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
                      <div className={`text-xs font-medium ${
                          timeLeft <= 30 ? 'text-red-600 animate-pulse' : 'text-orange-600'
                        }`}>
                        {timeLeft <= 30 && '⚠️ '}QR code expires in {timeLeft} {timeLeft === 1 ? 'second' : 'seconds'}
                        {timeLeft <= 30 && ' - Click Refresh QR to extend!'}
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="py-8">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-red-600 mb-4">Failed to load QR code</p>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                    <div className="flex space-x-2 justify-center">
                      <Button onClick={refreshQR} variant="outline" disabled={qrRefreshing}>
                        {qrRefreshing ? '🔄 Refreshing...' : '🔄 Refresh QR'}
                      </Button>
                      <Button onClick={forceReconnect} variant="destructive" disabled={loading}>
                        {loading ? '🔄 Reconnecting...' : '🔄 Force Reconnect'}
                      </Button>
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
                  <li>• QR code expires in {timeLeft} seconds - click "Refresh QR" when expired</li>
                  <li>• QR code will NOT auto-refresh to prevent disappearing</li>
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