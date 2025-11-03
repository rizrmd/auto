const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTenantFiltering() {
  try {
    console.log('🔍 Verifying tenant filtering implementation...\n');

    // Step 1: Check all tenants
    const allTenants = await prisma.tenants.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        settings: true
      }
    });

    console.log(`📊 Total tenants in database: ${allTenants.length}`);
    allTenants.forEach(t => {
      const deletedAt = t.settings?.deletedAt;
      console.log(`  - ID: ${t.id}, Name: ${t.name}, Status: ${t.status}, DeletedAt: ${deletedAt || 'null'}`);
    });

    // Step 2: Test the raw SQL query from our fix
    console.log('\n🔧 Testing raw SQL query for deleted tenants...');
    const deletedTenantsIds = await prisma.$queryRaw`
      SELECT id FROM tenants
      WHERE settings->>'deletedAt' IS NOT NULL
      AND settings ? 'deletedAt'
    `;

    const deletedIds = deletedTenantsIds.map(t => t.id);
    console.log(`🗑️  Deleted tenant IDs found: [${deletedIds.join(', ')}]`);

    // Step 3: Test the final filtered query
    console.log('\n✅ Testing final filtered query...');
    const where = deletedIds.length > 0 ? { id: { notIn: deletedIds } } : {};
    const activeTenants = await prisma.tenants.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true
      }
    });

    console.log(`🎯 Active tenants that should appear in frontend: ${activeTenants.length}`);
    activeTenants.forEach(t => {
      console.log(`  ✅ ID: ${t.id}, Name: ${t.name}, Status: ${t.status}`);
    });

    // Step 4: Verification result
    console.log('\n📋 VERIFICATION RESULT:');
    console.log(`   - Total tenants: ${allTenants.length}`);
    console.log(`   - Deleted tenants: ${deletedIds.length}`);
    console.log(`   - Active tenants: ${activeTenants.length}`);

    if (allTenants.length === 3 && deletedIds.length === 1 && activeTenants.length === 2) {
      console.log('   ✅ SUCCESS: Tenant filtering is working correctly!');
      console.log('   ✅ Frontend should show 2 tenants (not 3)');
    } else {
      console.log('   ❌ ISSUE: Expected 3 total, 1 deleted, 2 active');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTenantFiltering();