// Chrome DevTools WhatsApp Page Analysis
import WebSocket from 'ws';
import fs from 'fs';

const ws = new WebSocket('ws://localhost:9222/devtools/page/DBB43984BEE5FCBD474DAADB97245031');

ws.on('open', function open() {
  console.log('🔗 Connected to Chrome DevTools');

  // Enable Network domain
  ws.send(JSON.stringify({
    id: 1,
    method: "Network.enable",
    params: {}
  }));

  // Enable Page domain
  ws.send(JSON.stringify({
    id: 2,
    method: "Page.enable",
    params: {}
  }));

  // Enable Console domain
  ws.send(JSON.stringify({
    id: 3,
    method: "Console.enable",
    params: {}
  }));

  // Get page content
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 4,
      method: "Runtime.evaluate",
      params: {
        expression: `
          (function() {
            return {
              url: window.location.href,
              title: document.title,
              connectionStatus: document.querySelector('[data-testid="connection-status"]')?.innerText,
              qrCodeVisible: !!document.querySelector('img[src*="qr"]'),
              refreshButton: !!document.querySelector('button[class*="refresh"]'),
              errorMessages: Array.from(document.querySelectorAll('[class*="error"], [class*="warning"]'))
                .map(el => el.innerText),
              networkRequests: performance.getEntriesByType('resource')
                .filter(r => r.name.includes('whatsapp'))
                .map(r => ({name: r.name, status: r.responseStatus, duration: r.duration}))
            };
          })()
        `
      }
    }));
  }, 2000);

  // Take screenshot
  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 5,
      method: "Page.captureScreenshot",
      params: {
        format: "png",
        quality: 80
      }
    }));
  }, 3000);
});

ws.on('message', function message(data) {
  const response = JSON.parse(data);

  if (response.id === 4 && response.result) {
    console.log('📊 Page Analysis Result:');
    console.log(JSON.stringify(response.result.value, null, 2));
  }

  if (response.id === 5 && response.result) {
    console.log('📸 Screenshot captured (base64 length):', response.result.data.length);

    // Save screenshot
    const buffer = Buffer.from(response.result.data, 'base64');
    fs.writeFileSync('whatsapp-page-screenshot.png', buffer);
    console.log('💾 Screenshot saved as: whatsapp-page-screenshot.png');

    ws.close();
  }

  if (response.method === 'Network.responseReceived') {
    const url = response.params.response.url;
    if (url.includes('whatsapp') || url.includes('wa/')) {
      console.log('🌐 Network Request:', url, 'Status:', response.params.response.status);
    }
  }

  if (response.method === 'Console.messageAdded') {
    const message = response.params.message;
    if (message.level === 'error' || message.level === 'warning') {
      console.log(`⚠️ Console ${message.level}:`, message.text);
    }
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket Error:', err.message);
});