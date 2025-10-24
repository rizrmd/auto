/**
 * ErrorTest Component
 *
 * Test component to verify Error Boundary functionality.
 * This component should ONLY be used in development/testing.
 *
 * Features:
 * - Triggers controlled React errors
 * - Tests Error Boundary catch behavior
 * - Tests reset functionality
 * - Multiple error scenarios
 */

import { useState } from 'react';

export function ErrorTest() {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [errorType, setErrorType] = useState<'render' | 'async' | 'event'>('render');

  // Throw error during render (caught by Error Boundary)
  if (shouldThrow && errorType === 'render') {
    throw new Error('Test error thrown during render by ErrorTest component');
  }

  // Simulate async error (NOT caught by Error Boundary - only for demonstration)
  const handleAsyncError = async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    throw new Error('Async error - this will NOT be caught by Error Boundary');
  };

  // Simulate event handler error (NOT caught by Error Boundary - only for demonstration)
  const handleEventError = () => {
    throw new Error('Event handler error - this will NOT be caught by Error Boundary');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Error Boundary Test
          </h1>
          <p className="text-gray-600 mb-4">
            Use this page to test the Error Boundary functionality and verify that errors are caught gracefully.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This component is for development/testing only. Remove or protect this route in production.
            </p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Test Error Scenarios
          </h2>

          {/* Error Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Error Type:
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="errorType"
                  value="render"
                  checked={errorType === 'render'}
                  onChange={(e) => setErrorType(e.target.value as 'render')}
                  className="mr-2"
                />
                <span className="text-gray-700">
                  Render Error (Caught by Error Boundary)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="errorType"
                  value="async"
                  checked={errorType === 'async'}
                  onChange={(e) => setErrorType(e.target.value as 'async')}
                  className="mr-2"
                />
                <span className="text-gray-700">
                  Async Error (NOT caught - console only)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="errorType"
                  value="event"
                  checked={errorType === 'event'}
                  onChange={(e) => setErrorType(e.target.value as 'event')}
                  className="mr-2"
                />
                <span className="text-gray-700">
                  Event Handler Error (NOT caught - console only)
                </span>
              </label>
            </div>
          </div>

          {/* Trigger Buttons */}
          <div className="space-y-4">
            {errorType === 'render' && (
              <div>
                <button
                  onClick={() => setShouldThrow(true)}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Throw Render Error
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  This will trigger a render error that should be caught by the Error Boundary. You should see the fallback UI.
                </p>
              </div>
            )}

            {errorType === 'async' && (
              <div>
                <button
                  onClick={handleAsyncError}
                  className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
                  Throw Async Error
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  This will trigger an async error that will NOT be caught by the Error Boundary. Check the console.
                </p>
              </div>
            )}

            {errorType === 'event' && (
              <div>
                <button
                  onClick={handleEventError}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Throw Event Handler Error
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  This will trigger an event handler error that will NOT be caught by the Error Boundary. Check the console.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Information */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            What to Test
          </h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">1. Error Boundary Catches Render Errors</h3>
              <p className="text-sm">
                Select "Render Error" and click the button. You should see the fallback UI with a friendly error message.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">2. Error Details in Development</h3>
              <p className="text-sm">
                In development mode, you should see an expandable "Error Details" section with the error message and component stack.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">3. Reset Functionality</h3>
              <p className="text-sm">
                Click "Coba Lagi" button to reset the error boundary and return to normal view.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">4. Navigation</h3>
              <p className="text-sm">
                Click "Kembali ke Beranda" to navigate back to the home page.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">5. Console Logging</h3>
              <p className="text-sm">
                Open browser console to verify errors are being logged with full context.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">6. Responsive Design</h3>
              <p className="text-sm">
                Test on mobile and desktop to ensure the error UI is responsive.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
