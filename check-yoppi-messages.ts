import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkYoppiMessages() {
  console.log('\n🔍 Checking Yoppi messages...\n');

  // Find Yoppi's lead
  const lead = await prisma.lead.findFirst({
    where: {
      customerPhone: {
        contains: '81235108908' // Last 11 digits of Yoppi's number
      }
    },
    include: {
      tenant: true,
    }
  });

  if (!lead) {
    console.log('❌ No lead found for Yoppi (+6281235108908)');
    return;
  }

  console.log(`✅ Lead found: ID ${lead.id}`);
  console.log(`📱 Phone: ${lead.customerPhone}`);
  console.log(`🏢 Tenant: ${lead.tenant.name}\n`);

  // Get last 10 messages
  const messages = await prisma.message.findMany({
    where: {
      leadId: lead.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  });

  console.log(`📬 Last ${messages.length} messages:\n`);
  console.log('='.repeat(80));

  for (const msg of messages.reverse()) {
    const timestamp = msg.createdAt.toISOString().replace('T', ' ').substring(0, 19);
    const sender = msg.sender === 'customer' ? '👤 Yoppi' : '🤖 Bot';
    const preview = msg.message.substring(0, 100);

    console.log(`\n[${timestamp}] ${sender}:`);
    console.log(msg.message);

    if (msg.metadata && typeof msg.metadata === 'object') {
      console.log(`\nMetadata:`, JSON.stringify(msg.metadata, null, 2));
    }

    console.log('-'.repeat(80));
  }

  // Check conversation state
  const state = await prisma.conversationState.findFirst({
    where: {
      tenantId: lead.tenantId,
      userPhone: {
        contains: '81235108908'
      }
    }
  });

  if (state) {
    console.log(`\n📊 Conversation State:`);
    console.log(`   Flow: ${state.currentFlow}`);
    console.log(`   Step: ${state.currentStep}`);
    console.log(`   User Type: ${state.userType}`);
    console.log(`   Context:`, JSON.stringify(state.context, null, 2));
    console.log(`   Expires: ${state.expiresAt}`);
  } else {
    console.log(`\n📊 No active conversation state`);
  }

  await prisma.$disconnect();
}

checkYoppiMessages();
