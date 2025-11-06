import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 12,
  });
}

async function updateSuperAdminPassword() {
  console.log('🔧 Updating Super Admin password...');

  // Find the Super Admin
  const superAdmin = await prisma.superAdmin.findFirst({
    where: { email: 'admin@autoleads.com' }
  });

  if (!superAdmin) {
    console.log('❌ Super Admin not found');
    return;
  }

  console.log('📋 Found Super Admin:', superAdmin.email, 'ID:', superAdmin.id);

  // Update password
  const newPassword = 'Admin@123456';
  const passwordHash = await hashPassword(newPassword);

  await prisma.superAdmin.update({
    where: { id: superAdmin.id },
    data: { passwordHash: passwordHash }
  });

  console.log('✅ Password updated successfully!');
  console.log('   Email: admin@autoleads.com');
  console.log('   New Password: Admin@123456');

  // Test password verification
  const testVerification = await Bun.password.verify(newPassword, passwordHash);
  console.log('🔍 Password verification test:', testVerification ? 'PASS' : 'FAIL');
}

async function main() {
  try {
    await updateSuperAdminPassword();
    console.log('🎉 Password update completed!');
  } catch (error) {
    console.error('❌ Error updating password:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();