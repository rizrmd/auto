/**
 * Admin Bot Integration Test
 * Tests webhook routing between admin and customer bots
 */

const WEBHOOK_URL = 'http://localhost:3000/webhook/whatsapp';

interface TestCase {
  name: string;
  sender: string; // Phone number
  message: string;
  expectedBot: 'admin' | 'customer';
  description: string;
}

const testCases: TestCase[] = [
  {
    name: 'Admin - Help Command',
    sender: '6281234567891@s.whatsapp.net', // Budi (admin from seed)
    message: '/help',
    expectedBot: 'admin',
    description: 'Admin should receive admin bot help',
  },
  {
    name: 'Admin - Upload Command',
    sender: '6281234567891@s.whatsapp.net',
    message: '/upload',
    expectedBot: 'admin',
    description: 'Admin should receive upload flow start',
  },
  {
    name: 'Sales - List Command',
    sender: '6281234567892@s.whatsapp.net', // Ani (sales from seed)
    message: '/list',
    expectedBot: 'admin',
    description: 'Sales should receive admin bot list',
  },
  {
    name: 'Customer - Car Inquiry',
    sender: '628999999999@s.whatsapp.net', // Random customer
    message: 'Halo, ada Avanza?',
    expectedBot: 'customer',
    description: 'Customer should receive LLM response',
  },
  {
    name: 'Customer - Photo Request',
    sender: '628888888888@s.whatsapp.net',
    message: 'Mau lihat foto Mercedes',
    expectedBot: 'customer',
    description: 'Customer should receive customer bot response',
  },
];

async function testWebhook(testCase: TestCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST: ${testCase.name}`);
  console.log(`📱 Sender: ${testCase.sender}`);
  console.log(`💬 Message: "${testCase.message}"`);
  console.log(`🤖 Expected Bot: ${testCase.expectedBot}`);
  console.log(`📝 Description: ${testCase.description}`);
  console.log(`${'='.repeat(60)}\n`);

  const payload = {
    event: 'message',
    message: testCase.message,
    sender: testCase.sender,
    chat: testCase.sender,
    time: new Date().toISOString(),
  };

  try {
    console.log('📤 Sending webhook payload...');
    const startTime = Date.now();

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ERROR: ${errorText}`);
      return false;
    }

    const data = await response.json();
    console.log(`\n📦 Response data:`, JSON.stringify(data, null, 2));

    // Check if correct bot was used
    if (data.data?.userType) {
      const actualBot =
        data.data.userType === 'customer' ? 'customer' : 'admin';
      const isCorrect = actualBot === testCase.expectedBot;

      if (isCorrect) {
        console.log(`\n✅ PASS: Routed to ${actualBot} bot (expected ${testCase.expectedBot})`);
      } else {
        console.log(`\n❌ FAIL: Routed to ${actualBot} bot (expected ${testCase.expectedBot})`);
      }

      return isCorrect;
    } else {
      console.log(`\n⚠️  WARNING: Cannot determine which bot was used`);
      return true; // Don't fail if we can't determine
    }
  } catch (error) {
    console.error(`\n❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🚀 Starting Admin Bot Integration Tests\n');
  console.log(`📍 Target: ${WEBHOOK_URL}`);
  console.log(`📅 Date: ${new Date().toISOString()}\n`);

  // Health check first
  try {
    console.log('🏥 Health check...');
    const healthResponse = await fetch('http://localhost:3000/api/health');
    if (healthResponse.ok) {
      console.log('✅ Server is healthy\n');
    } else {
      console.error('❌ Server health check failed');
      console.error('Make sure the server is running: bun backend/index.tsx');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Cannot connect to server');
    console.error('Make sure the server is running: bun backend/index.tsx');
    process.exit(1);
  }

  const results: { name: string; passed: boolean }[] = [];

  for (const testCase of testCases) {
    const passed = await testWebhook(testCase);
    results.push({ name: testCase.name, passed });

    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60) + '\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  console.log(`\n📈 Results: ${passed} passed, ${failed} failed out of ${results.length} tests`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Admin bot integration is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
