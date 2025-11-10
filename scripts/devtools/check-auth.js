// Check Authentication Status
import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:9222/devtools/page/DBB43984BEE5FCBD474DAADB97245031');

ws.on('open', function open() {
  console.log('🔗 Checking authentication status...');

  ws.send(JSON.stringify({id: 1, method: "Runtime.enable", params: {}}));

  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 2,
      method: "Runtime.evaluate",
      params: {
        expression: `
          (function() {
            return {
              cookies: document.cookie,
              localStorage: Object.keys(window.localStorage),
              sessionStorage: Object.keys(window.sessionStorage),
              authToken: localStorage.getItem('token') || sessionStorage.getItem('token'),
              isAuthenticated: !!localStorage.getItem('token') || !!sessionStorage.getItem('token'),
              currentPage: window.location.href,
              loginStatus: document.body.textContent.includes('Login') ? 'Not Logged In' : 'Possibly Logged In'
            };
          })()
        `
      }
    }));
  }, 1000);

  setTimeout(() => {
    ws.send(JSON.stringify({
      id: 3,
      method: "Runtime.evaluate",
      params: {
        expression: `
          fetch('/api/admin/whatsapp/qr', {
            headers: {
              'Authorization': 'Bearer ' + (localStorage.getItem('token') || sessionStorage.getItem('token') || '')
            }
          })
          .then(r => r.json())
          .then(data => console.log('QR Response:', data))
          .catch(e => console.log('QR Error:', e.message))
        `
      }
    }));
  }, 2000);
});

ws.on('message', function message(data) {
  const msg = JSON.parse(data);

  if (msg.id === 2 && msg.result) {
    console.log('🔐 Authentication Status:');
    console.log(JSON.stringify(msg.result.value, null, 2));
  }

  if (msg.method === 'Console.messageAdded') {
    const consoleMsg = msg.params.message;
    if (consoleMsg.text.includes('QR Response') || consoleMsg.text.includes('QR Error')) {
      console.log('📝', consoleMsg.text);
    }
  }
});

setTimeout(() => ws.close(), 5000);