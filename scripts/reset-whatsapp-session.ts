/**
 * Reset WhatsApp Web API Session
 *
 * This script clears all WhatsApp session data from the database.
 * Use this when QR code pairing is stuck or failed.
 */

import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function resetWhatsAppSession() {
  console.log('🔄 Resetting WhatsApp Web API session...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Try to find WhatsApp session tables
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename LIKE '%whatsapp%'
        OR tablename LIKE '%session%'
    `;

    console.log('\n📋 Found tables:', tables.map(t => t.tablename));

    // Clear WhatsApp session data from common table names
    const possibleTables = [
      'whatsmeow_sessions',  // WhatsApp Web API v1.2.0 uses whatsmeow library
      'whatsapp_sessions',
      'whatsapp_session',
      'sessions',
      'wa_sessions',
      'waweb_sessions'
    ];

    for (const tableName of possibleTables) {
      try {
        // Check if table exists
        const tableExists = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = ${tableName}
        `;

        if (tableExists[0]?.count > 0n) {
          // Count rows before clearing
          const rowCount = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
            `SELECT COUNT(*) as count FROM "${tableName}"`
          );
          const rows = Number(rowCount[0]?.count || 0);

          console.log(`\n🗑️  Clearing table: ${tableName} (${rows} rows)`);

          // Delete all rows
          await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE`);
          console.log(`✅ Cleared: ${tableName} - ${rows} rows deleted`);
        }
      } catch (error) {
        // Table doesn't exist or error, continue
        console.log(`⚠️  Table ${tableName} not found or error:`, error instanceof Error ? error.message : 'Unknown');
      }
    }

    console.log('\n✅ WhatsApp session reset complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart WhatsApp Web API service');
    console.log('   2. Open https://auto.lumiku.com/api/wa/pair');
    console.log('   3. Scan the QR code with WhatsApp');

  } catch (error) {
    console.error('\n❌ Error resetting WhatsApp session:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetWhatsAppSession()
  .catch((error) => {
    console.error('Failed to reset WhatsApp session:', error);
    process.exit(1);
  });
