import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkAttachmentDetail() {
  // Get last message with "Image received" from Yoppi
  const messages = await prisma.message.findMany({
    where: {
      lead: {
        customerPhone: { contains: '81235108908' }
      },
      message: 'Image received',
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: {
      id: true,
      message: true,
      sender: true,
      metadata: true,
      createdAt: true
    }
  });

  if (messages.length === 0) {
    console.log('❌ No recent "Image received" messages found');
    return;
  }

  const msg = messages[0];
  console.log('📸 Latest Image Message:');
  console.log('='.repeat(80));
  console.log(`Time: ${msg.createdAt.toISOString()}`);
  console.log(`Sender: ${msg.sender}`);
  console.log(`Message: ${msg.message}`);
  console.log('\n📦 Full Metadata:');
  console.log(JSON.stringify(msg.metadata, null, 2));
}

checkAttachmentDetail()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
