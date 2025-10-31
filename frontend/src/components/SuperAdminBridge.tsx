/**
 * Super Admin Bridge Component
 *
 * This component provides a bridge between the simple routing used in the main app
 * and the React Router-based Super Admin application. It handles the initial
 * loading and sets up React Router for Super Admin functionality.
 */

import React, { useEffect, useState } from 'react';
import { SuperAdminApp } from '../SuperAdminApp-bypass';

interface SuperAdminBridgeProps {
  // Props can be added here if needed in the future
}

export function SuperAdminBridge(props: SuperAdminBridgeProps) {
  const [isRouterReady, setIsRouterReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate initialization or perform any needed setup
    const initializeRouter = async () => {
      try {
        // Add any initialization logic here
        // For example: checking authentication, loading config, etc.

        // Simulate async initialization
        await new Promise(resolve => setTimeout(resolve, 100));

        setIsRouterReady(true);
      } catch (err) {
        console.error('Failed to initialize Super Admin:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    initializeRouter();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Super Admin Error
            </h1>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isRouterReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Super Admin...</p>
        </div>
      </div>
    );
  }

  return <SuperAdminApp {...props} />;
}