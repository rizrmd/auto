// Get chat logs for specific phone number
const PHONE_ARG = process.argv[2] || '6281235108908';
// Ensure phone number has + prefix
const PHONE = PHONE_ARG.startsWith('+') ? PHONE_ARG : `+${PHONE_ARG}`;
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

  // Get leads list to find the lead ID
  const leadsRes = await fetch(`${API_URL}/api/admin/leads`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const leadsData = await leadsRes.json();

  if (!leadsData.success) {
    console.error('Failed to get leads:', leadsData.error);
    return;
  }

  // Find the lead with matching phone number
  const leads = leadsData.data || [];
  const leadSummary = leads.find(l => l.customerPhone === PHONE);

  if (!leadSummary) {
    console.log(`No lead found for phone: ${PHONE}`);
    console.log(`Available phones: ${leads.map(l => l.customerPhone).join(', ')}`);
    return;
  }

  // Fetch detailed lead data with messages
  const leadDetailRes = await fetch(`${API_URL}/api/admin/leads/${leadSummary.id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const leadDetailData = await leadDetailRes.json();

  if (!leadDetailData.success) {
    console.error('Failed to get lead details:', leadDetailData.error);
    return;
  }

  const lead = leadDetailData.data;

  console.log('='.repeat(70));
  console.log(`CHAT LOG: ${PHONE}`);
  console.log('='.repeat(70));
  console.log(`Customer: ${lead.customerName || 'Unknown'}`);
  console.log(`Status: ${lead.status}`);
  console.log(`Source: ${lead.source}`);
  console.log(`Created: ${new Date(lead.createdAt).toLocaleString('id-ID')}`);
  console.log(`Total Messages: ${lead.messages.length}`);
  console.log('='.repeat(70));

  if (!lead.messages || lead.messages.length === 0) {
    console.log('No messages found.');
    return;
  }

  // Sort messages by time (oldest first for conversation flow)
  const messages = [...lead.messages].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  console.log('\n📱 CONVERSATION HISTORY:\n');

  messages.forEach((msg, idx) => {
    const time = new Date(msg.createdAt).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const isCustomer = msg.sender === PHONE;
    const sender = isCustomer ? '👤 Customer' : '🤖 Bot';

    console.log(`[${idx + 1}] ${time} - ${sender}`);
    console.log(`   ${msg.message}`);
    console.log('');
  });

  console.log('='.repeat(70));
  console.log(`Total: ${messages.length} messages`);
  console.log('='.repeat(70));
}

main().catch(console.error);
