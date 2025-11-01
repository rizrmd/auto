/**
 * Create Admin User Script
 * Creates a new admin user for tenant management
 */

import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Check if tenant exists (assuming AutoLeads Motors tenant)
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'autolumiku' }
    });

    // If tenant doesn't exist, create one
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
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
      console.log('✅ Created tenant:', tenant.name);
    } else {
      console.log('✅ Found existing tenant:', tenant.name);
    }

    // Create admin user
    const email = 'admin@autolumiku.com';
    const password = 'admin123456'; // Change this in production!

    // Simple password hash (in production, use bcrypt)
    const passwordHash = `hashed_${password}`;

    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId: tenant.id
      }
    });

    if (existingUser) {
      console.log('⚠️  User already exists:', existingUser.email);
      console.log('📝 Current credentials:');
      console.log('   Email:', existingUser.email);
      console.log('   Password:', password);
      console.log('   Role:', existingUser.role);
    } else {
      const newUser = await prisma.user.create({
        data: {
          name: 'Admin AutoLeads',
          email,
          passwordHash,
          phone: '+628123456789',
          whatsappNumber: '+628123456789',
          role: 'admin',
          status: 'active',
          tenantId: tenant.id,
        }
      });

      console.log('✅ Created admin user:');
      console.log('   Email:', newUser.email);
      console.log('   Password:', password);
      console.log('   Role:', newUser.role);
      console.log('   Tenant:', tenant.name);
    }

    // Create additional sales users
    const salesUsers = [
      {
        name: 'Sales Person 1',
        email: 'sales1@autolumiku.com',
        phone: '+628123456780',
        whatsappNumber: '+628123456780',
        password: 'sales123456'
      },
      {
        name: 'Sales Person 2',
        email: 'sales2@autolumiku.com',
        phone: '+628123456781',
        whatsappNumber: '+628123456781',
        password: 'sales123456'
      }
    ];

    for (const salesUser of salesUsers) {
      const existingSales = await prisma.user.findFirst({
        where: {
          email: salesUser.email,
          tenantId: tenant.id
        }
      });

      if (!existingSales) {
        await prisma.user.create({
          data: {
            ...salesUser,
            passwordHash: `hashed_${salesUser.password}`,
            role: 'sales',
            status: 'active',
            tenantId: tenant.id,
          }
        });
        console.log(`✅ Created sales user: ${salesUser.email}`);
      }
    }

    console.log('\n🎉 Admin setup completed!');
    console.log('\n📱 Login Credentials:');
    console.log('   URL: https://auto.lumiku.com/admin/login');
    console.log('   Email: admin@autolumiku.com');
    console.log('   Password: admin123456');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();