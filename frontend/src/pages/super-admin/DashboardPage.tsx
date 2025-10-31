/**
 * Super Admin Dashboard - Working Version with Inline Styles
 * No dependencies on CSS frameworks or contexts
 */

import React from 'react';

function DashboardPage() {
  console.log('🔥🔥🔥 WORKING DASHBOARD MOUNTING! 🔥🔥🔥');

  const [clickCount, setClickCount] = React.useState(0);
  const [showDetails, setShowDetails] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleTimeString());
  const [apiStatus, setApiStatus] = React.useState('Not tested yet');

  // Update time every second
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleButtonClick = () => {
    console.log('🖱️ BUTTON CLICKED! Count:', clickCount + 1);
    setClickCount(prev => prev + 1);
    setShowDetails(true);
  };

  const handleTestAPI = () => {
    console.log('🌐 Testing API call...');
    setApiStatus('Testing...');

    // Simple fetch test
    fetch('/api/super-admin/analytics/global')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('✅ API Response:', data);
        setApiStatus(`SUCCESS! Got ${Object.keys(data).length} fields`);
        alert('API Test Success! Check console for details.\nResponse: ' + JSON.stringify(data, null, 2));
      })
      .catch(error => {
        console.error('❌ API Error:', error);
        setApiStatus('FAILED! ' + error.message);
        alert('API Test Failed!\nError: ' + error.message);
      });
  };

  const buttonStyle = {
    backgroundColor: 'white',
    color: '#1e40af',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    marginTop: '10px'
  };

  const apiButtonStyle = {
    backgroundColor: 'white',
    color: '#7c3aed',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    marginTop: '10px'
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      padding: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px'
        }}>
          🎉 Super Admin Dashboard
        </h1>
        <p style={{ color: '#94a3b8' }}>
          Working dashboard - Inline styles version!
        </p>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
          Current Time: {currentTime}
        </p>
      </div>

      {/* Success Message */}
      <div style={{
        backgroundColor: '#16a34a',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          ✅ SUCCESS!
        </h2>
        <p>React components are working perfectly!</p>
        <p style={{ fontSize: '14px', marginTop: '4px' }}>
          Click count: {clickCount} | useEffect working: ✅
        </p>
      </div>

      {/* Test Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '24px',
          borderRadius: '12px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            🖱️ React State Test
          </h3>
          <button
            onClick={handleButtonClick}
            style={buttonStyle}
          >
            CLICK ME! (Count: {clickCount})
          </button>
          {showDetails && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#1d4ed8',
              borderRadius: '8px',
              fontSize: '14px'
            }}>
              <p>✅ useState working</p>
              <p>✅ onClick handler working</p>
              <p>✅ Component re-rendering</p>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: '#7c3aed',
          color: 'white',
          padding: '24px',
          borderRadius: '12px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            🌐 API Test
          </h3>
          <button
            onClick={handleTestAPI}
            style={apiButtonStyle}
          >
            TEST API CALL
          </button>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Test /api/super-admin/analytics/global
          </p>
          <p style={{ fontSize: '12px', marginTop: '4px', color: '#e0e7ff' }}>
            Status: {apiStatus}
          </p>
        </div>
      </div>

      {/* Debug Info */}
      <div style={{
        backgroundColor: '#ca8a04',
        color: 'white',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
          🔍 Debug Information
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <p><strong>React:</strong> ✅ Working</p>
            <p><strong>useState:</strong> ✅ Working</p>
            <p><strong>useEffect:</strong> ✅ Working</p>
            <p><strong>Events:</strong> ✅ Working</p>
          </div>
          <div>
            <p><strong>Context:</strong> ❌ Not Used</p>
            <p><strong>Auth:</strong> ❌ Not Required</p>
            <p><strong>API:</strong> ✅ Ready</p>
            <p><strong>Time:</strong> {currentTime}</p>
          </div>
        </div>
      </div>

      {/* Mock Dashboard Content */}
      <div style={{
        borderTop: '1px solid #475569',
        paddingTop: '24px'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '16px'
        }}>
          📊 Mock Dashboard Data
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#60a5fa', marginBottom: '8px' }}>
              Total Tenants
            </h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>2</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Active: 2</p>
          </div>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#34d399', marginBottom: '8px' }}>
              Total Cars
            </h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>4</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Available: 4</p>
          </div>
          <div style={{
            backgroundColor: '#1e293b',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fbbf24', marginBottom: '8px' }}>
              Total Leads
            </h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>6</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Active: 6</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#1e293b',
        borderRadius: '12px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          📝 Next Steps:
        </h3>
        <ol style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>
          <li>1. Test the "TEST API CALL" button above</li>
          <li>2. Check browser console for API results</li>
          <li>3. If API works, we can add authentication back</li>
          <li>4. Then restore full dashboard functionality</li>
        </ol>
      </div>
    </div>
  );
}

export default DashboardPage;