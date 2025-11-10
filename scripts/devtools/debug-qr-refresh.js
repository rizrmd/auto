// Debug QR Code Refresh Issue
import WebSocket from 'ws';
import fs from 'fs';

const ws = new WebSocket('ws://localhost:9222/devtools/page/DBB43984BEE5FCBD474DAADB97245031');

let networkRequests = [];
let consoleMessages = [];

ws.on('open', function open() {
  console.log('🔗 Connected to Chrome DevTools for QR Refresh Analysis');

  // Enable required domains
  ws.send(JSON.stringify({id: 1, method: "Network.enable", params: {}}));
  ws.send(JSON.stringify({id: 2, method: "Console.enable", params: {}}));
  ws.send(JSON.stringify({id: 3, method: "Runtime.enable", params: {}}));

  // Monitor for refresh button clicks
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 4,
      method: "Runtime.evaluate",
      params: {
        expression: `
          (function() {
            console.log('🔍 Starting QR Refresh Debug Analysis...');

            // Find refresh button
            const refreshBtn = document.querySelector('button[class*="refresh"], button:contains("Refresh"), button[title*="refresh"]');
            console.log('Refresh button found:', !!refreshBtn, refreshBtn?.textContent, refreshBtn?.className);

            // Add click listener to refresh button
            if (refreshBtn) {
              refreshBtn.addEventListener('click', function(e) {
                console.log('🔄 Refresh button clicked!', {
                  timestamp: new Date().toISOString(),
                  button: this.textContent,
                  disabled: this.disabled
                });
              });

              // Trigger refresh every 5 seconds for testing
              setInterval(() => {
                console.log('🤖 Auto-triggering refresh...');
                refreshBtn.click();
              }, 5000);
            }

            // Monitor QR code element
            const qrImg = document.querySelector('img[src*="qr"], img[alt*="QR"], img[alt*="qr"]');
            console.log('QR image found:', !!qrImg);
            if (qrImg) {
              const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                  if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                    console.log('🖼️ QR Image src changed:',
                      mutation.oldValue ? 'CHANGED' : 'INITIAL',
                      'New length:', qrImg.src.length
                    );
                  }
                });
              });
              observer.observe(qrImg, { attributes: true, attributeOldValue: true });
            }

            return {
              refreshButtonFound: !!refreshBtn,
              refreshButtonText: refreshBtn?.textContent,
              refreshButtonDisabled: refreshBtn?.disabled,
              qrImageFound: !!qrImg,
              currentQrSrc: qrImg?.src?.substring(0, 100) + '...',
              pageUrl: window.location.href,
              userAgent: navigator.userAgent
            };
          })()
        `
      }
    }));
  }, 1000);
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);

  // Track network requests
  if (msg.method === 'Network.requestWillBeSent') {
    const request = msg.params.request;
    if (request.url.includes('whatsapp') || request.url.includes('qr') || request.url.includes('wa/')) {
      console.log('📤 WhatsApp Request:', request.method, request.url);
      networkRequests.push({
        type: 'request',
        url: request.url,
        method: request.method,
        timestamp: new Date().toISOString()
      });
    }
  }

  if (msg.method === 'Network.responseReceived') {
    const response = msg.params.response;
    if (response.url.includes('whatsapp') || response.url.includes('qr') || response.url.includes('wa/')) {
      console.log('📥 WhatsApp Response:', response.status, response.url);
      networkRequests.push({
        type: 'response',
        url: response.url,
        status: response.status,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Track console messages
  if (msg.method === 'Console.messageAdded') {
    const consoleMsg = msg.params.message;
    consoleMessages.push({
      level: consoleMsg.level,
      text: consoleMsg.text,
      timestamp: new Date().toISOString()
    });

    if (consoleMsg.text.includes('Refresh') || consoleMsg.text.includes('QR') || consoleMsg.text.includes('refresh')) {
      console.log(`📝 Console [${consoleMsg.level.toUpperCase()}]: ${consoleMsg.text}`);
    }
  }

  // Handle evaluation results
  if (msg.id === 4 && msg.result) {
    console.log('🎯 Initial Page Analysis:');
    console.log(JSON.stringify(msg.result.value, null, 2));
  }

  // Handle errors
  if (msg.method === 'Runtime.exceptionThrown') {
    const exception = msg.params.exceptionDetails;
    console.log('❌ JavaScript Error:', exception.text);
    console.log('   Stack:', exception.stackTrace);
  }
});

// Close after 30 seconds
setTimeout(() => {
  console.log('\n📊 Analysis Summary:');
  console.log('Total Network Requests:', networkRequests.length);
  console.log('Console Messages:', consoleMessages.length);

  // Save analysis report
  const report = {
    timestamp: new Date().toISOString(),
    networkRequests,
    consoleMessages,
    summary: {
      totalRequests: networkRequests.length,
      errorCount: consoleMessages.filter(m => m.level === 'error').length,
      warningCount: consoleMessages.filter(m => m.level === 'warning').length
    }
  };

  fs.writeFileSync('qr-refresh-analysis.json', JSON.stringify(report, null, 2));
  console.log('💾 Detailed report saved to: qr-refresh-analysis.json');

  ws.close();
}, 30000);

ws.on('error', function error(err) {
  console.error('❌ WebSocket Error:', err.message);
});