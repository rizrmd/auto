/**
 * WhatsApp Error Display Component
 * Shows specific, actionable error messages from WhatsApp Web API
 */

import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface WhatsAppErrorDisplayProps {
  interpretedError?: {
    message: string;
    action?: string;
    severity: 'error' | 'warning' | 'info';
  };
  rawError?: string;
  onRetry?: () => void;
  onForceReconnect?: () => void;
  onRefreshQR?: () => void;
  showActions?: boolean;
}

export function WhatsAppErrorDisplay({
  interpretedError,
  rawError,
  onRetry,
  onForceReconnect,
  onRefreshQR,
  showActions = true
}: WhatsAppErrorDisplayProps) {
  if (!interpretedError && !rawError) {
    return null;
  }

  const error = interpretedError || {
    message: rawError || 'Unknown error occurred',
    severity: 'error' as const
  };

  const getSeverityStyles = () => {
    switch (error.severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getIconColor = () => {
    switch (error.severity) {
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTextColor = () => {
    switch (error.severity) {
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      case 'info':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  const getActionButtons = () => {
    const buttons = [];

    if (onRetry) {
      buttons.push(
        <Button key="retry" onClick={onRetry} variant="outline" className="flex-1">
          🔄 Retry
        </Button>
      );
    }

    if (onRefreshQR && (error.message.toLowerCase().includes('qr') || error.message.toLowerCase().includes('expired'))) {
      buttons.push(
        <Button key="refresh-qr" onClick={onRefreshQR} variant="outline" className="flex-1">
          🔄 Refresh QR
        </Button>
      );
    }

    if (onForceReconnect && (error.message.toLowerCase().includes('session') || error.message.toLowerCase().includes('corrupted'))) {
      buttons.push(
        <Button key="force-reconnect" onClick={onForceReconnect} variant="destructive" className="flex-1">
          🔧 Force Reconnect
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Card className={`${getSeverityStyles()} border-2`}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Error Header */}
          <div className="flex items-start space-x-3">
            <div className={`text-2xl ${getIconColor()}`}>
              {error.severity === 'error' ? '❌' : error.severity === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${getTextColor()}`}>
                {error.severity === 'error' ? 'Connection Error' :
                 error.severity === 'warning' ? 'Warning' : 'Information'}
              </h3>
              <p className={`mt-1 ${getTextColor()}`}>
                {error.message}
              </p>
            </div>
          </div>

          {/* Actionable Instructions */}
          {error.action && (
            <div className={`pl-11 ${getTextColor()}`}>
              <div className="flex items-start space-x-2">
                <span className="text-sm font-medium">💡 Solution:</span>
                <span className="text-sm">{error.action}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showActions && getActionButtons().length > 0 && (
            <div className="pl-11 pt-2">
              <div className="flex flex-wrap gap-2">
                {getActionButtons()}
              </div>
            </div>
          )}

          {/* Debug Information (Dev Only) */}
          {process.env.NODE_ENV === 'development' && rawError && (
            <details className="pl-11 pt-2">
              <summary className={`text-sm cursor-pointer ${getTextColor()} font-mono`}>
                Debug Information
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify({ interpretedError, rawError }, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  );
}