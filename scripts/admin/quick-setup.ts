/**
 * Quick Admin Setup Script
 * Creates admin user for testing
 */

import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

async function quickSetup() {
  try {
    console.log('🚀 Creating admin user...');

    // Create tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'autolumiku' },
      update: {},
      create: {
        name: 'AutoLeads Motors',
        slug: 'autolumiku',
        subdomain: 'autolumiku',
        phone: '+628123456789',
        whatsappNumber: '+6283134446903',
        whatsappBotEnabled: true,
        primaryColor: '#FF5722',
        secondaryColor: '#000000',
        status: 'active',
        plan: 'pro',
      }
    });

    console.log('✅ Tenant created:', tenant.name);

    // Create admin user with plain password (for demo)
    const user = await prisma.user.upsert({
      where: {
        email_tenantId: {
          email: 'admin@autolumiku.com',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        tenantId: tenant.id,
        name: 'Admin AutoLeads',
        email: 'admin@autolumiku.com',
        passwordHash: 'admin123456', // Plain text for demo (use bcrypt in production)
        phone: '+628123456789',
        whatsappNumber: '+628123456789',
        role: 'admin',
        status: 'active',
      }
    });

    console.log('✅ Admin user created:', user.email);
    console.log('\n🎉 SETUP COMPLETE!');
    console.log('📋 Login Credentials:');
    console.log('   Email: admin@autolumiku.com');
    console.log('   Password: admin123456');
    console.log('   URL: https://auto.lumiku.com/admin/login');
    console.log('\n📱 Admin Features Available:');
    console.log('   - Dashboard Overview');
    console.log('   - WhatsApp Bot Management');
    console.log('   - User & Sales Team Management');

    // Create sales users
    const salesUsers = [
      { name: 'Sales Person 1', email: 'sales1@autolumiku.com', phone: '+628123456780', whatsappNumber: '+628123456780', password: 'sales123456' },
      { name: 'Sales Person 2', email: 'sales2@autolumiku.com', phone: '+628123456781', whatsappNumber: '+628123456781', password: 'sales123456' }
    ];

    for (const salesUser of salesUsers) {
      await prisma.user.upsert({
        where: {
          email_tenantId: {
            email: salesUser.email,
            tenantId: tenant.id
          }
        },
        update: {},
        create: {
          tenantId: tenant.id,
          name: salesUser.name,
          email: salesUser.email,
          passwordHash: salesUser.password,
          phone: salesUser.phone,
          whatsappNumber: salesUser.whatsappNumber,
          role: 'sales',
          status: 'active',
        }
      });
      console.log(`✅ Sales user created: ${salesUser.email}`);
    }

    console.log('\n👥 Sales Team Accounts:');
    console.log('   sales1@autolumiku.com / sales123456');
    console.log('   sales2@autolumiku.com / sales123456');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

quickSetup();