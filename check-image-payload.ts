import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkImagePayload() {
  // Get last 10 messages from Yoppi with Image received
  const messages = await prisma.message.findMany({
    where: {
      lead: {
        customerPhone: { contains: '81235108908' }
      },
      message: 'Image received'
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: {
      id: true,
      message: true,
      sender: true,
      metadata: true,
      createdAt: true
    }
  });

  console.log('📸 Image Messages (payload metadata):');
  console.log('='.repeat(80));

  for (const msg of messages) {
    console.log(`\n[${msg.createdAt.toISOString()}] ${msg.sender}: ${msg.message}`);
    console.log('Metadata:', JSON.stringify(msg.metadata, null, 2));
    console.log('-'.repeat(80));
  }
}

checkImagePayload()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
