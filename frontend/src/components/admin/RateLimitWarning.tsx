/**
 * Rate Limit Warning Component
 * Displays warnings when WhatsApp pairing attempts are failing repeatedly
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface RateLimitWarningProps {
  failureCount: number;
  rateLimitedUntil: string | null;
  whatsappNumber?: string;
  recommendations?: string[];
  onDismiss?: () => void;
}

export function RateLimitWarning({
  failureCount,
  rateLimitedUntil,
  whatsappNumber,
  recommendations = [],
  onDismiss
}: RateLimitWarningProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!rateLimitedUntil) return;

    const interval = setInterval(() => {
      const diff = new Date(rateLimitedUntil).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Rate limit expired - you can try again!');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  // Don't show warning if failure count is less than 2
  if (failureCount < 2) return null;

  const severity = failureCount >= 3 ? 'error' : 'warning';

  const getSeverityStyles = () => {
    return severity === 'error'
      ? 'border-red-200 bg-red-50'
      : 'border-yellow-200 bg-yellow-50';
  };

  const getTextColor = () => {
    return severity === 'error' ? 'text-red-800' : 'text-yellow-800';
  };

  const getContentColor = () => {
    return severity === 'error' ? 'text-red-700' : 'text-yellow-700';
  };

  return (
    <Card className={`${getSeverityStyles()} border-2`}>
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-2xl">
            {severity === 'error' ? '🚫' : '⚠️'}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className={`text-sm font-medium ${getTextColor()}`}>
                {severity === 'error'
                  ? 'WhatsApp Rate Limit Detected'
                  : 'Multiple Pairing Failures Detected'
                }
              </h3>
              <div className={`mt-2 text-sm ${getContentColor()}`}>
                <p className="mb-2">
                  {severity === 'error'
                    ? `You've had ${failureCount} failed pairing attempts. WhatsApp likely rate-limited this number${whatsappNumber ? ` (${whatsappNumber})` : ''}.`
                    : `You've had ${failureCount} failed pairing attempts. One more failure may trigger rate limiting.`
                  }
                </p>

                {rateLimitedUntil && (
                  <div className="mb-3 p-2 bg-white bg-opacity-50 rounded border border-current">
                    <p className="font-semibold">
                      ⏰ Estimated recovery: {timeLeft}
                    </p>
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="font-semibold flex items-center">
                      <span className="mr-1">💡</span> Recommended Solutions:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 ml-2">
                      {recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm leading-relaxed">
                          {idx === 0 && <strong className="font-semibold">Best Option: </strong>}
                          {rec}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {severity === 'error' && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                    <p className="text-xs font-medium">
                      <strong>⚠️ Important:</strong> Continuing to attempt pairing with this number
                      may extend the lockout period. Consider using a different number or waiting
                      the full 24-48 hours.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {onDismiss && (
              <div className="pt-2">
                <Button
                  onClick={onDismiss}
                  variant="ghost"
                  size="sm"
                  className={`text-xs ${getTextColor()} hover:${getTextColor()}`}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
