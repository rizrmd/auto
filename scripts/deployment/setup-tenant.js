import { PrismaClient } from '../../generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding tenant data...');
  
  // Get existing tenant or create new
  let tenant = await prisma.tenant.findFirst({
    where: { status: 'active' }
  });
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'AutoLeads Motors',
        whatsappNumber: '+6281234567890',
        phone: '+6281234567890',
        address: 'Jakarta, Indonesia',
        whatsappBotEnabled: true,
        status: 'active',
        slug: 'autoleads-motors',
        subdomain: 'auto'
      }
    });
  }
  
  console.log('Tenant created/updated:', tenant);
  
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { id: 1 },
    update: {
      name: 'Admin',
      email: 'admin@auto.lumiku.com',
      phone: '6281234567890',
      role: 'owner',
      status: 'active'
    },
    create: {
      name: 'Admin',
      email: 'admin@auto.lumiku.com',
      phone: '6281234567890',
      role: 'owner',
      status: 'active',
      tenantId: tenant.id,
      passwordHash: 'admin123' // This should be hashed in production
    }
  });
  
  console.log('Admin user created/updated:', adminUser);
  
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });