// Monitor actual QR response from browser
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/DBB43984BEE5FCBD474DAADB97245031');

ws.on('open', function open() {
  console.log('🔗 Monitoring QR response content...');

  // Enable Network domain
  ws.send(JSON.stringify({id: 1, method: "Network.enable", params: {}}));
  ws.send(JSON.stringify({id: 2, method: "Runtime.enable", params: {}}));

  // Intercept response bodies
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 3,
      method: "Network.getResponseBody",
      params: {
        requestId: "intercept-qr"
      }
    }));
  }, 2000);

  // Check current QR image
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 4,
      method: "Runtime.evaluate",
      params: {
        expression: `
          (function() {
            // Find QR image
            const qrImg = document.querySelector('img[src*="qr"], img[alt*="QR"], img[alt*="qr"]');

            if (qrImg) {
              console.log('QR Image found:', {
                src: qrImg.src.substring(0, 100) + '...',
                complete: qrImg.complete,
                naturalWidth: qrImg.naturalWidth,
                naturalHeight: qrImg.naturalHeight
              });

              return {
                qrFound: true,
                qrSrc: qrImg.src.substring(0, 200),
                timestamp: new Date().toISOString(),
                error: null
              };
            } else {
              // Check if there's error message
              const errorElements = document.querySelectorAll('[class*="error"], [class*="warning"]');
              const errors = Array.from(errorElements).map(el => el.textContent);

              return {
                qrFound: false,
                errorMessages: errors,
                pageContent: document.body.textContent.substring(0, 500)
              };
            }
          })()
        `
      }
    }));
  }, 3000);
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);

  // Track network responses with bodies
  if (msg.method === 'Network.responseReceived') {
    const response = msg.params.response;

    if (response.url.includes('whatsapp/qr')) {
      console.log('📥 QR Response received:', {
        url: response.url,
        status: response.status,
        headers: response.headers
      });

      // Try to get response body
      if (msg.requestId) {
        ws.send(JSON.stringify({
          id: Date.now(),
          method: "Network.getResponseBody",
          params: {
            requestId: msg.requestId
          }
        }));
      }
    }
  }

  // Handle response body
  if (msg.method === 'Network.getResponseBody') {
    console.log('📦 Response Body:', {
      body: msg.result.body.substring(0, 200),
      base64Encoded: msg.result.base64Encoded
    });
  }

  // Handle evaluation results
  if (msg.id === 4 && msg.result) {
    console.log('🎯 Current QR Status:');
    console.log(JSON.stringify(msg.result.value, null, 2));
  }

  // Console messages
  if (msg.method === 'Console.messageAdded') {
    const consoleMsg = msg.params.message;
    if (consoleMsg.text.includes('QR') || consoleMsg.text.includes('error')) {
      console.log('📝 Console:', consoleMsg.text);
    }
  }
});

setTimeout(() => ws.close(), 10000);