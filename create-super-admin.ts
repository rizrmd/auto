import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 12,
  });
}

async function createSuperAdmin() {
  console.log('🔧 Creating Super Admin user...');

  // Check if Super Admin already exists
  const existingSuperAdmin = await prisma.superAdmin.findFirst({
    where: { email: 'admin@autoleads.com' }
  });

  if (existingSuperAdmin) {
    console.log('✅ Super Admin already exists:', existingSuperAdmin.email);
    return existingSuperAdmin;
  }

  // Create Super Admin user
  const passwordHash = await hashPassword('Admin@123456');

  const superAdmin = await prisma.superAdmin.create({
    data: {
      name: 'AutoLeads Super Admin',
      email: 'admin@autoleads.com',
      passwordHash: passwordHash,
      role: 'super_admin',
      status: 'active',
    },
  });

  console.log('✅ Super Admin created successfully:');
  console.log('   Email: admin@autoleads.com');
  console.log('   Password: Admin@123456');
  console.log('   Role: super_admin');
  console.log('   ID:', superAdmin.id);

  return superAdmin;
}

async function main() {
  try {
    await createSuperAdmin();
    console.log('🎉 Super Admin setup completed!');
  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();