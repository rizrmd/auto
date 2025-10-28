// Real-time chat monitor for specific phone number
const PHONE_ARG = process.argv[2] || '6281235108908';
const PHONE = PHONE_ARG.startsWith('+') ? PHONE_ARG : `+${PHONE_ARG}`;
const API_URL = 'https://auto.lumiku.com';
const POLL_INTERVAL = 2000; // Check every 2 seconds

let authToken = null;
let leadId = null;
let lastMessageId = null;

async function login() {
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
    process.exit(1);
  }

  authToken = loginData.data.token;
  console.log('✅ Login berhasil');
}

async function findLead() {
  const leadsRes = await fetch(`${API_URL}/api/admin/leads`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  const leadsData = await leadsRes.json();
  if (!leadsData.success) {
    console.error('Failed to get leads:', leadsData.error);
    process.exit(1);
  }

  const leads = leadsData.data || [];
  const leadSummary = leads.find(l => l.customerPhone === PHONE);

  if (!leadSummary) {
    console.log(`❌ No lead found for phone: ${PHONE}`);
    process.exit(1);
  }

  leadId = leadSummary.id;
  console.log(`✅ Found lead ID: ${leadId}`);
}

async function getMessages() {
  const leadDetailRes = await fetch(`${API_URL}/api/admin/leads/${leadId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  // Check for 401 Unauthorized status
  if (leadDetailRes.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  // Check for rate limit (429)
  if (leadDetailRes.status === 429) {
    console.log('⚠️  Rate limited. Pausing for 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    return [];
  }

  // Check for other HTTP errors
  if (!leadDetailRes.ok) {
    throw new Error(`HTTP ${leadDetailRes.status}: ${leadDetailRes.statusText}`);
  }

  let leadDetailData;
  try {
    leadDetailData = await leadDetailRes.json();
  } catch (e) {
    throw new Error(`Failed to parse response: ${e.message}`);
  }

  if (!leadDetailData.success) {
    const error = leadDetailData.error;
    if (error && (error.code === 'UNAUTHORIZED' || error.message.includes('Invalid token'))) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(error?.message || 'Failed to get messages');
  }

  const lead = leadDetailData.data;
  return lead.messages || [];
}

async function checkForNewMessages() {
  try {
    const messages = await getMessages();

    if (messages.length === 0) return;

    // Sort by creation time
    const sortedMessages = [...messages].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Find new messages
    const newMessages = lastMessageId
      ? sortedMessages.filter(m => m.id > lastMessageId)
      : sortedMessages.slice(-1); // Show only last message on first run

    if (newMessages.length > 0) {
      newMessages.forEach(msg => {
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
        const icon = isCustomer ? '📩' : '📤';

        console.log(`\n${icon} [${time}] ${sender}`);
        console.log(`   ${msg.message}`);
      });

      // Update last message ID
      lastMessageId = sortedMessages[sortedMessages.length - 1].id;
    }
  } catch (error) {
    // Only relogin if specifically unauthorized (401)
    if (error.message === 'UNAUTHORIZED') {
      console.log('\n⚠️  Session expired, re-authenticating...');
      try {
        await login();
        await findLead(); // Re-find lead ID with new token
      } catch (e) {
        console.error('❌ Relogin failed:', e.message);
      }
    } else {
      console.error('⚠️  Error:', error.message);
    }
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log(`📱 REAL-TIME CHAT MONITOR: ${PHONE}`);
  console.log('='.repeat(70));
  console.log('Connecting...\n');

  // Login and find lead
  await login();
  await findLead();

  // Get initial messages to set last message ID
  const initialMessages = await getMessages();
  if (initialMessages.length > 0) {
    const sorted = [...initialMessages].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    lastMessageId = sorted[sorted.length - 1].id;

    const lastMsg = sorted[sorted.length - 1];
    const time = new Date(lastMsg.createdAt).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    console.log(`\n📊 Monitoring started. Last message at ${time}`);
  }

  console.log('🔄 Waiting for new messages... (Press Ctrl+C to stop)\n');
  console.log('-'.repeat(70));

  // Start polling
  setInterval(checkForNewMessages, POLL_INTERVAL);
}

main().catch(console.error);
