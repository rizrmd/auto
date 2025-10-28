import { CarParser } from './backend/src/bot/admin/parser';

const parser = new CarParser();

const testCases = [
  'Honda Freed PSD Matic tahun 2012 KM 145515 harga 145jt',
  'Honda Freed PSD Matic 2012 KM 145515 harga 145jt',
  'Honda Freed 2012 harga 145jt km 145515'
];

console.log('🧪 Testing Parser with Honda Freed inputs:\n');

for (const input of testCases) {
  console.log('='.repeat(80));
  console.log(`Input: "${input}"\n`);

  try {
    const result = parser.parseAllInOne(input);
    console.log('✅ Parsed result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('❌ Parser error:', error);
  }

  console.log('\n');
}
