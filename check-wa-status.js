// Check WhatsApp connection status
const API_URL = 'https://auto.lumiku.com';

async function main() {
  // Login
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
    console.error('Login failed:', loginData.error);
    return;
  }

  const token = loginData.data.token;

  // Check WhatsApp status
  const statusRes = await fetch(`${API_URL}/api/admin/whatsapp/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const statusData = await statusRes.json();
  console.log('WhatsApp Status:', JSON.stringify(statusData, null, 2));
}

main().catch(console.error);
