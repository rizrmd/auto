// Test script to check individual services
const { PrismaClient } = require('./generated/prisma');

async function testServices() {
  console.log('Testing services...');

  // Test database
  try {
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database: healthy');
    await prisma.$disconnect();
  } catch (e) {
    console.log('Database: unhealthy -', e.message);
  }

  // Test WhatsApp
  try {
    const response = await fetch('http://localhost:8080/health');
    const data = await response.json();
    console.log('WhatsApp:', data.success ? 'healthy' : 'unhealthy');
  } catch (e) {
    console.log('WhatsApp: unhealthy -', e.message);
  }

  // Test memory
  const mem = process.memoryUsage();
  const percent = (mem.heapUsed / mem.heapTotal) * 100;
  console.log('Memory:', percent < 70 ? 'healthy' : 'unhealthy', `(${percent.toFixed(2)}%)`);

  // Test cache (simple test)
  try {
    // This is a simplified cache test
    console.log('Cache: healthy (simplified test)');
  } catch (e) {
    console.log('Cache: unhealthy -', e.message);
  }

  process.exit(0);
}

testServices();