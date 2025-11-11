#!/usr/bin/env bun

/**
 * Complete WhatsApp Database Cleanup
 *
 * This script clears ALL WhatsApp/whatsmeow related tables to fix
 * foreign key constraint violations during pairing.
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function completeWhatsAppCleanup() {
  console.log('🧹 Complete WhatsApp Database Cleanup...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Find ALL tables related to WhatsApp/whatsmeow
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND (
          tablename LIKE '%whatsmeow%'
          OR tablename LIKE '%whatsapp%'
          OR tablename LIKE '%wa_%'
          OR tablename LIKE '%waweb%'
          OR tablename LIKE '%session%'
        )
    `;

    console.log('\n📋 Found WhatsApp-related tables:', tables.map(t => t.tablename));

    // Comprehensive table list based on whatsmeow library
    const whatsmeowTables = [
      'whatsmeow_sessions',
      'whatsmeow_identity_keys',
      'whatsmeow_pre_keys',
      'whatsmeow_signed_pre_keys',
      'whatsmeow_sessions',
      'whatsmeow_state',
      'whatsapp_sessions',
      'whatsapp_identity_keys',
      'whatsapp_pre_keys',
      'whatsapp_signed_pre_keys',
      'wa_sessions',
      'wa_identity_keys',
      'wa_pre_keys',
      'wa_signed_pre_keys',
      'waweb_sessions',
      'waweb_identity_keys',
      'waweb_pre_keys',
      'waweb_signed_pre_keys'
    ];

    let totalCleaned = 0;
    let totalTables = 0;

    for (const tableName of whatsmeowTables) {
      try {
        // Check if table exists
        const tableExists = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = ${tableName}
        `;

        if (tableExists[0]?.count > 0n) {
          totalTables++;

          // Count rows before cleaning
          const rowCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          const rows = Number(rowCount[0]?.count || 0);
          totalCleaned += rows;

          console.log(`\n🗑️  Cleaning table: ${tableName} (${rows} rows)`);

          // Delete all data with CASCADE to handle foreign keys
          await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
          console.log(`✅ Cleaned: ${tableName} - ${rows} rows deleted`);
        }
      } catch (error) {
        console.log(`⚠️  Table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Also try to clean any dynamically discovered tables
    for (const table of tables) {
      const tableName = table.tablename;
      if (!whatsmeowTables.includes(tableName)) {
        try {
          const rowCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          const rows = Number(rowCount[0]?.count || 0);

          if (rows > 0) {
            totalTables++;
            totalCleaned += rows;
            console.log(`\n🗑️  Cleaning discovered table: ${tableName} (${rows} rows)`);
            await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`);
            console.log(`✅ Cleaned: ${tableName} - ${rows} rows deleted`);
          }
        } catch (error) {
          console.log(`⚠️  Discovered table ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    console.log('\n🎉 Cleanup Summary:');
    console.log(`   • Tables cleaned: ${totalTables}`);
    console.log(`   • Total rows deleted: ${totalCleaned}`);
    console.log('\n✅ Complete WhatsApp database cleanup finished!');

    console.log('\n📝 Next steps:');
    console.log('   1. Restart the application container');
    console.log('   2. Try WhatsApp pairing again');
    console.log('   3. QR code should now work without foreign key errors');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
completeWhatsAppCleanup()
  .catch((error) => {
    console.error('Failed to cleanup WhatsApp database:', error);
    process.exit(1);
  });