// Test QR generation
const API_URL = 'https://auto.lumiku.com';

async function main() {
  console.log('Testing QR generation...\n');

  // Login
  console.log('1. Logging in...');
  const loginRes = await fetch(`${API_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@showroom-surabaya.com',
      password: 'password123'
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.success) {
    console.error('❌ Login failed:', loginData.error);
    return;
  }

  console.log('✅ Login success');
  const token = loginData.data.token;

  // Test QR endpoint
  console.log('\n2. Requesting QR code...');
  const qrRes = await fetch(`${API_URL}/api/admin/whatsapp/qr?format=json`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Response status:', qrRes.status);

  const qrData = await qrRes.json();
  console.log('\nQR Response:', JSON.stringify(qrData, null, 2));
}

main().catch(console.error);
