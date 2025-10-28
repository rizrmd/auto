/**
 * Register Yoppi as Admin
 * WhatsApp: +6281235108908
 */

import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

// Hash password helper using Bun's built-in password hashing
async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 12,
  });
}

async function registerYoppi() {
  console.log('🔐 Registering Yoppi as Admin...\n');

  try {
    // 1. Get tenant (first active tenant)
    const tenant = await prisma.tenant.findFirst({
      where: {
        status: 'active',
      },
    });

    if (!tenant) {
      console.error('❌ No active tenant found!');
      console.error('Please run: bun prisma db seed');
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name} (ID: ${tenant.id})`);

    // 2. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { email: 'yoppi@showroom-surabaya.com' },
          { whatsappNumber: '6281235108908' },
          { phone: '081235108908' },
        ],
      },
    });

    if (existingUser) {
      console.log('\n⚠️  User already exists!');
      console.log('📋 Existing user details:');
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Phone: ${existingUser.phone}`);
      console.log(`   WhatsApp: ${existingUser.whatsappNumber}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Status: ${existingUser.status}`);

      // Update to admin if not already
      if (existingUser.role !== 'admin') {
        console.log('\n🔄 Updating role to admin...');
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'admin',
            whatsappNumber: '6281235108908',
            status: 'active',
          },
        });
        console.log('✅ User updated to admin role');
      } else {
        console.log('\n✅ User is already an admin');
      }

      process.exit(0);
    }

    // 3. Create new user
    const hashedPassword = await hashPassword('yoppi123');

    const newUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: 'Yoppi',
        email: 'yoppi@showroom-surabaya.com',
        phone: '081235108908',
        whatsappNumber: '6281235108908',
        passwordHash: hashedPassword,
        role: 'admin',
        status: 'active',
        lastLoginAt: new Date(),
      },
    });

    console.log('\n✅ Admin registered successfully!\n');
    console.log('📋 User Details:');
    console.log(`   ID: ${newUser.id}`);
    console.log(`   Name: ${newUser.name}`);
    console.log(`   Email: ${newUser.email}`);
    console.log(`   Phone: ${newUser.phone}`);
    console.log(`   WhatsApp: ${newUser.whatsappNumber}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Status: ${newUser.status}`);
    console.log(`   Password: yoppi123`);
    console.log(`   Tenant: ${tenant.name}`);

    console.log('\n🤖 Admin Bot Commands Available:');
    console.log('   /upload - Upload mobil baru');
    console.log('   /list - Lihat daftar mobil');
    console.log('   /status - Update status mobil');
    console.log('   /help - Lihat semua command');

    console.log('\n📱 Next Steps:');
    console.log(`   1. Kirim pesan WhatsApp ke bot showroom`);
    console.log(`   2. From: +6281235108908 (Yoppi)`);
    console.log(`   3. Message: /help`);
    console.log(`   4. Bot akan respon dengan menu admin`);

    console.log('\n🔐 Login Credentials:');
    console.log(`   Email: yoppi@showroom-surabaya.com`);
    console.log(`   Password: yoppi123`);
    console.log(`   (Silakan ganti password setelah login)`);

  } catch (error) {
    console.error('\n❌ Error registering admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
registerYoppi();
