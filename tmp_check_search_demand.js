const { PrismaClient } = require('/app/generated/prisma');
const prisma = new PrismaClient();

async function checkSearchDemand() {
  try {
    const data = await prisma.searchDemand.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    console.log('Search Demand Records:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\nTotal records:', await prisma.searchDemand.count());

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkSearchDemand();