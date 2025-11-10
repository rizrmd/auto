/**
 * WhatsApp QR Scanner Component
 * Handles QR code display and WhatsApp connection status
 */

import React, { useState, useEffect, useRef } from 'react';
import { adminAPI, WhatsAppQR as WhatsAppQRType, WhatsAppStatus } from '../../services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { WhatsAppErrorDisplay } from './WhatsAppErrorDisplay';

interface WhatsAppQRProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

export function WhatsAppQR({ onConnectionChange }: WhatsAppQRProps) {
  const [qrData, setQrData] = useState<WhatsAppQRType | null>(null);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interpretedError, setInterpretedError] = useState<any>(null);
  const [qrRefreshing, setQrRefreshing] = useState(false);
  const [connectionTestLoading, setConnectionTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showQR, setShowQR] = useState(false);

  // Simple refs for intervals
  const qrRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const statusRefreshInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize only once
  useEffect(() => {
    loadWhatsAppStatus();

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
  }, []); // Empty dependency array - run only once

  useEffect(() => {
    const isConnected = status?.data?.health?.connected || false;
    onConnectionChange?.(isConnected);
  }, [status, onConnectionChange]);

  const loadWhatsAppStatus = async () => {
    try {
      setError(null);
      setInterpretedError(null);

      // Use enhanced error-aware status check
      const statusResult = await adminAPI.getWhatsAppStatusWithInterpretation();

      if (!statusResult.success) {
        console.error('[WHATSAPP QR] Status check failed:', statusResult.interpretedError);
        setInterpretedError(statusResult.interpretedError);
        return;
      }

      const statusData = statusResult.data!;
      const wasConnected = status?.data?.health?.connected || false;
      const isConnected = statusData.data?.health?.connected || false;

      setStatus(statusData);

      // Handle connection state change
      if (isConnected && !wasConnected) {
        console.log('[WHATSAPP QR] Status changed to connected! Clearing QR...');
        // Connection established - clear QR immediately
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        if (statusRefreshInterval.current) {
          clearInterval(statusRefreshInterval.current);
          statusRefreshInterval.current = null;
        }
        setQrData(null);
        setTimeLeft(0);
        setError(null);
        setInterpretedError(null);
        setShowQR(false);
        setTestResult('🎉 WhatsApp connected successfully!');

        // Start normal polling
        startNormalStatusPolling();
      } else if (shouldShowQR && !qrData) {
        // Disconnected and no QR - load QR
        await loadQRCode();
      }
    } catch (err) {
      console.error('[WHATSAPP QR] Unexpected error loading status:', err);
      setError('Unexpected error occurred while checking WhatsApp status');
    }
  };

  const loadQRCode = async () => {
    try {
      setQrRefreshing(true);
      setError(null);
      setInterpretedError(null);

      // Use enhanced error-aware QR generation
      const qrResult = await adminAPI.getWhatsAppQRWithInterpretation();

      if (!qrResult.success) {
        console.error('[WHATSAPP QR] QR generation failed:', qrResult.interpretedError);
        setInterpretedError(qrResult.interpretedError);

        // Clear countdown on error
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
          countdownInterval.current = null;
        }
        setTimeLeft(0);
        return;
      }

      const qrData = qrResult.data!;
      setQrData(qrData);

      // Set fixed 30 seconds countdown for better UX
      const initialTimeLeft = 30;
      setTimeLeft(initialTimeLeft);

      // Clear existing countdown interval
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }

      // Start countdown timer with exactly 120 seconds
      countdownInterval.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // QR expired, show expired state with specific error
            setInterpretedError({
              message: '⏰ QR code has expired after 30 seconds',
              action: 'Click "Refresh QR" to generate a new QR code',
              severity: 'warning'
            });
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

      // Start rapid status polling after QR is generated to detect scan immediately
      startRapidStatusPolling();
    } catch (err) {
      console.error('[WHATSAPP QR] Unexpected error loading QR code:', err);
      setError('Unexpected error occurred while generating QR code');

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

  const startRapidStatusPolling = () => {
    // Clear existing status polling
    if (statusRefreshInterval.current) {
      clearInterval(statusRefreshInterval.current);
    }

    // Rapid polling every 2 seconds when QR is displayed to detect scan immediately
    statusRefreshInterval.current = setInterval(async () => {
      try {
        const statusData = await adminAPI.getWhatsAppStatus();
        setStatus(statusData);

        // Check if connection established
        if (statusData.data?.health?.connected) {
          console.log('[WHATSAPP QR] Connection detected! Hiding QR code...');

          // Clear all intervals
          if (statusRefreshInterval.current) {
            clearInterval(statusRefreshInterval.current);
            statusRefreshInterval.current = null;
          }
          if (countdownInterval.current) {
            clearInterval(countdownInterval.current);
            countdownInterval.current = null;
          }
          if (qrRefreshInterval.current) {
            clearInterval(qrRefreshInterval.current);
            qrRefreshInterval.current = null;
          }

          // Clear QR data and reset states
          setQrData(null);
          setTimeLeft(0);
          setError(null);

          // Restart normal polling
          startNormalStatusPolling();

          // Show success feedback
          setTestResult('🎉 WhatsApp connected successfully!');

        }
      } catch (err) {
        console.error('[WHATSAPP QR] Error checking status:', err);
      }
    }, 2000); // Poll every 2 seconds for immediate detection
  };

  const startNormalStatusPolling = () => {
    // Normal polling every 10 seconds when connected
    if (statusRefreshInterval.current) {
      clearInterval(statusRefreshInterval.current);
    }
    statusRefreshInterval.current = setInterval(loadWhatsAppStatus, 10000);
  };

  const startStatusPolling = () => {
    // Check current state and start appropriate polling
    if (qrData) {
      startRapidStatusPolling();
    } else {
      startNormalStatusPolling();
    }
  };

  const refreshQR = async () => {
    // Clear all intervals before refresh
    if (qrRefreshInterval.current) {
      clearInterval(qrRefreshInterval.current);
      qrRefreshInterval.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (statusRefreshInterval.current) {
      clearInterval(statusRefreshInterval.current);
      statusRefreshInterval.current = null;
    }

    // Reset states
    setError(null);
    setQrData(null);
    setTimeLeft(0);
    setTestResult(null);

    console.log('[WHATSAPP QR] Refreshing QR code with cache-busting...');

    // Force cache invalidation by clearing any cached images
    if (typeof window !== 'undefined') {
      // Clear any cached QR images
      if (window.caches) {
        window.caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            window.caches.delete(cacheName);
          });
        });
      }
    }

    await loadQRCode();
  };

  const testConnection = async () => {
    try {
      setConnectionTestLoading(true);
      setTestResult(null);
      const result = await adminAPI.testWhatsApp();

      if (result.success) {
        setTestResult('🎉 Test completed successfully - WhatsApp connection is working!');
      } else if (result.interpretedError) {
        // Show interpreted error from WhatsApp API
        setInterpretedError(result.interpretedError);
        setTestResult(result.message);
      } else {
        setTestResult(result.message || 'Test completed successfully');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Test failed';
      setTestResult(`❌ Test failed: ${errorMessage}`);
    } finally {
      setConnectionTestLoading(false);
    }
  };

  const disconnectDevice = async () => {
    const confirmMessage = isConnected && isPaired
      ? 'Are you sure you want to disconnect this WhatsApp device? After disconnection, you can scan a new QR code to reconnect.'
      : 'Are you sure you want to disconnect this partially connected device?';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setInterpretedError(null);

      // Call API to disconnect device
      const disconnectResult = await adminAPI.forceReconnectWhatsApp();

      if (!disconnectResult.success) {
        if (disconnectResult.interpretedError) {
          setInterpretedError(disconnectResult.interpretedError);
        } else {
          setError(disconnectResult.message || 'Disconnect failed');
        }
        return;
      }

      // Clear intervals
      if (qrRefreshInterval.current) {
        clearInterval(qrRefreshInterval.current);
        qrRefreshInterval.current = null;
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }

      // Reset states
      setQrData(null);
      setStatus(null);
      setTimeLeft(0);
      setTestResult(null);

      // Show success message - device is now disconnected
      setTestResult('🔌 WhatsApp device disconnected successfully. Click "Refresh QR" to generate a new QR code for pairing.');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Disconnect failed';
      setError(`❌ Disconnect failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = status?.data?.health?.connected || false;
  const isPaired = status?.data?.health?.paired || false;
  const whatsappStatus = status?.data?.tenant?.whatsappStatus || 'unknown';
  const isDisconnected = whatsappStatus === 'disconnected' || whatsappStatus === 'connecting';
  const shouldShowQR = isDisconnected && showQR;

  // Handle Connect button click
  const handleConnectClick = () => {
    setShowQR(true);
    loadQRCode();
  };

  // Enhanced error display takes priority
  if (interpretedError) {
    return (
      <div className="space-y-6">
        <WhatsAppErrorDisplay
          interpretedError={interpretedError}
          onRetry={loadWhatsAppStatus}
          onForceReconnect={forceReconnect}
          onRefreshQR={refreshQR}
        />

        {/* Show basic connection status if available */}
        {status && (
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className="text-lg font-semibold text-red-600">Disconnected</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Device Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {status?.data?.tenant?.whatsappNumber || 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Fallback for generic errors
  if (error && !status) {
    return (
      <WhatsAppErrorDisplay
        interpretedError={{
          message: error,
          action: 'Try refreshing the page or contact support',
          severity: 'error'
        }}
        onRetry={loadWhatsAppStatus}
        onForceReconnect={forceReconnect}
        onRefreshQR={refreshQR}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Error Display */}
      {interpretedError && (
        <WhatsAppErrorDisplay
          interpretedError={interpretedError}
          onRetry={loadWhatsAppStatus}
          onForceReconnect={forceReconnect}
          onRefreshQR={refreshQR}
        />
      )}

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
                {isPaired && (
                  <Button onClick={testConnection} disabled={connectionTestLoading} className="flex-1">
                    {connectionTestLoading ? 'Testing...' : '🧪 Test Connection'}
                  </Button>
                )}
                <Button onClick={loadWhatsAppStatus} variant="outline" disabled={loading}>
                  🔄 Refresh Status
                </Button>
                <Button onClick={disconnectDevice} variant="destructive" disabled={loading}>
                  🔌 Disconnect
                </Button>
              </div>
            )}

            {isDisconnected && (
              <div className="flex space-x-2">
                {!showQR ? (
                  <Button onClick={handleConnectClick} disabled={loading} className="flex-1">
                    {loading ? '🔄 Connecting...' : '📱 Connect WhatsApp'}
                  </Button>
                ) : (
                  <Button onClick={loadWhatsAppStatus} variant="outline" disabled={loading}>
                    🔄 Refresh Status
                  </Button>
                )}
              </div>
            )}

            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.includes('success') || testResult.includes('successfully')
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : testResult.includes('failed') || testResult.includes('error')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
              }`}>
                <strong>Test Result:</strong> {testResult}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Scanner */}
      {shouldShowQR && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Connect WhatsApp Bot
              </span>
              <div className="flex space-x-2">
                <Button onClick={refreshQR} variant="outline" size="sm" disabled={qrRefreshing}>
                  {qrRefreshing ? '🔄' : '🔄'} Refresh QR
                </Button>
                <Button onClick={() => setShowQR(false)} variant="outline" size="sm">
                  ❌ Cancel
                </Button>
              </div>
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
                      <div className={`text-sm font-medium ${
                          timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-orange-600'
                        }`}>
                        {timeLeft <= 10 && '⚠️ '}QR code expires in {timeLeft} second{timeLeft !== 1 ? 's' : ''}
                        {timeLeft <= 10 && '\nClick Refresh QR to extend!'}
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
                  <li>• QR code expires in 30 seconds - click "Refresh QR" when expired</li>
                  <li>• Status updates automatically every 2 seconds after QR appears</li>
                  <li>• QR code will auto-hide immediately after successful pairing</li>
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