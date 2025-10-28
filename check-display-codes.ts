import { PrismaClient } from './generated/prisma';

const prisma = new PrismaClient();

async function checkDisplayCodes() {
  console.log('=== Checking Car Display Codes ===\n');

  const cars = await prisma.car.findMany({
    where: { status: 'available' },
    select: {
      id: true,
      displayCode: true,
      publicName: true,
      brand: true,
      model: true,
      year: true,
      photos: true,
    },
    orderBy: { displayCode: 'asc' }
  });

  console.log(`Total available cars: ${cars.length}\n`);

  cars.forEach(car => {
    const photoCount = Array.isArray(car.photos) ? car.photos.length : 0;
    console.log(`Code: ${car.displayCode || 'NULL'}`);
    console.log(`  Name: ${car.publicName || `${car.brand} ${car.model} ${car.year}`}`);
    console.log(`  Photos: ${photoCount}`);
    console.log('');
  });

  await prisma.$disconnect();
}

checkDisplayCodes().catch(console.error);
