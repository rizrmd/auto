#!/usr/bin/env bun

/**
 * Debug script to check password hash
 */

import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkPassword() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'admin@autolumiku.com' }
    });

    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('User found:', user.id, user.email);
    console.log('Password hash:', user.passwordHash);

    // Test password verification
    const isValid = await Bun.password.verify('admin123456', user.passwordHash);
    console.log('Password verification result:', isValid);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPassword();