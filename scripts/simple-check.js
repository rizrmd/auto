import { prisma } from '../backend/src/db';

async function checkTenants() {
  const all = await prisma.tenants.findMany({
    select: { id: true, name: true, settings: true }
  });

  console.log('Total tenants:', all.length);
  all.forEach(t => {
    const deleted = t.settings?.deletedAt;
    console.log(`ID: ${t.id}, Name: ${t.name}, Deleted: ${deleted ? 'YES' : 'NO'}`);
  });

  // Check deleted tenants
  const deleted = await prisma.$queryRaw`SELECT id FROM tenants WHERE settings->>'deletedAt' IS NOT NULL`;
  console.log('Deleted IDs:', deleted.map(d => d.id));

  // Check active tenants
  const deletedIds = deleted.map(d => d.id);
  const active = await prisma.tenants.findMany({
    where: deletedIds.length > 0 ? { id: { notIn: deletedIds } } : {}
  });

  console.log('Active tenants count:', active.length);
  active.forEach(t => console.log(`Active: ${t.name}`));

  await prisma.$disconnect();
}

checkTenants();