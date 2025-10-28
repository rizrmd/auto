import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    where: { tenantId: 6 },
    select: {
      id: true,
      name: true,
      whatsappNumber: true,
      role: true,
      status: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log('\n📋 Registered Users:\n');
  users.forEach((u) => {
    const icon = u.role === 'owner' ? '👑' : u.role === 'admin' ? '🔧' : '💼';
    console.log(
      `${icon} ${u.id}. ${u.name.padEnd(20)} | WA: ${u.whatsappNumber} | Role: ${u.role} | Status: ${u.status}`
    );
  });

  console.log(`\n✅ Total users: ${users.length}\n`);

  await prisma.$disconnect();
}

checkUsers();
