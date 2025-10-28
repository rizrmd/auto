// Debug monitor JSON parsing issue
const API_URL = 'https://auto.lumiku.com';

async function test() {
  console.log('=== Testing API responses ===\n');

  // Step 1: Login
  console.log('1. Testing login...');
  const loginRes = await fetch(`${API_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'owner@showroom-surabaya.com',
      password: 'password123'
    })
  });

  console.log('  Status:', loginRes.status);
  console.log('  Headers:', Object.fromEntries(loginRes.headers.entries()));

  const loginText = await loginRes.text();
  console.log('  Response length:', loginText.length);
  console.log('  First 200 chars:', loginText.substring(0, 200));

  let loginData;
  try {
    loginData = JSON.parse(loginText);
    console.log('  ✅ Login JSON parsed OK');
  } catch (e) {
    console.log('  ❌ Login JSON parse error:', e.message);
    return;
  }

  if (!loginData.success) {
    console.log('  ❌ Login failed:', loginData.error);
    return;
  }

  const token = loginData.data.token;
  console.log('  Token:', token.substring(0, 20) + '...');

  // Step 2: Get lead detail
  console.log('\n2. Testing lead detail API...');
  const leadRes = await fetch(`${API_URL}/api/admin/leads/34`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('  Status:', leadRes.status);
  console.log('  Headers:', Object.fromEntries(leadRes.headers.entries()));

  const leadText = await leadRes.text();
  console.log('  Response length:', leadText.length);
  console.log('  First 500 chars:', leadText.substring(0, 500));
  console.log('  Last 200 chars:', leadText.substring(leadText.length - 200));

  try {
    const leadData = JSON.parse(leadText);
    console.log('  ✅ Lead JSON parsed OK');
    console.log('  Success:', leadData.success);
    console.log('  Messages count:', leadData.data?.messages?.length);
  } catch (e) {
    console.log('  ❌ Lead JSON parse error:', e.message);
    console.log('  Character at error position might be:', leadText.charAt(e.message.match(/position (\d+)/)?.[1] || 0));
  }
}

test().catch(console.error);
