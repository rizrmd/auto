/**
 * Test Natural Language Extractor
 * Tests the LLM-based car data extraction with various input formats
 */

import { NaturalLanguageExtractor } from './backend/src/bot/admin/natural-language-extractor';

const extractor = new NaturalLanguageExtractor();

const testCases = [
  // Yoppi's exact input that failed before
  'Honda Freed PSD Matic tahun 2012 KM 145515 harga 145jt',

  // Very natural, minimal format
  'upload freed matic 2012 harga 145jt kondisi bagus',
  'mau upload mobil honda freed tahun 2012',
  'tambah mobil freed 145jt km 145rb',
  'freed 2012 matic dijual 145 juta',

  // Complete information
  'Honda Jazz 2019 type R hitam matic harga 187jt km 88000 velg racing tangan pertama',
  'Toyota Avanza 2020 harga 185jt km 45000 velg racing',

  // Luxury cars
  'Mercedes C300 2015 silver matic harga 350jt km 65000 sunroof leather seats',
  'BMW 320i 2018 hitam dijual 450 juta km 50rb pajak panjang',

  // Minimal information
  'avanza 2020 185jt',
  'jazz hitam 2019 187juta',

  // With plate number
  'Honda Civic 2020 L 1234 AB harga 350jt km 30rb',

  // Edge cases
  'upload mobil bekas honda freed PSD automatic tahun 2012 kilometer 145515 dijual 145 juta rupiah kondisi istimewa',
  'jual cepat toyota avanza veloz tahun 2020 warna silver km baru 45 ribu harga 185 juta nego'
];

async function runTests() {
  console.log('🧪 Testing Natural Language Extractor\n');
  console.log('='.repeat(80));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testCases.length; i++) {
    const input = testCases[i];
    console.log(`\n📝 Test Case ${i + 1}/${testCases.length}`);
    console.log(`Input: "${input}"\n`);

    try {
      const result = await extractor.extract(input);

      if (result.success) {
        successCount++;
        console.log(`✅ SUCCESS`);
        console.log(`Method: ${result.method === 'llm' ? '🤖 LLM' : '📝 Parser'}`);
        console.log(`Confidence: ${result.confidence === 'high' ? '✨ High' : result.confidence === 'medium' ? '⭐ Medium' : '🔸 Low'}`);
        console.log(`\nExtracted Data:`);
        console.log(`  Brand: ${result.data.brand || 'N/A'}`);
        console.log(`  Model: ${result.data.model || 'N/A'}`);
        console.log(`  Year: ${result.data.year || 'N/A'}`);
        console.log(`  Color: ${result.data.color || 'N/A'}`);
        console.log(`  Transmission: ${result.data.transmission || 'N/A'}`);
        console.log(`  KM: ${result.data.km?.toLocaleString() || 'N/A'}`);
        console.log(`  Price: Rp ${result.data.price ? (result.data.price / 1000000).toFixed(0) + ' juta' : 'N/A'}`);

        if (result.data.keyFeatures && result.data.keyFeatures.length > 0) {
          console.log(`  Features: ${result.data.keyFeatures.join(', ')}`);
        }

        if (result.data.notes) {
          console.log(`  Notes: ${result.data.notes}`);
        }
      } else {
        failCount++;
        console.log(`❌ FAILED`);
        console.log(`Errors:`);
        result.errors?.forEach(err => console.log(`  - ${err}`));
      }

    } catch (error) {
      failCount++;
      console.log(`❌ EXCEPTION: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('-'.repeat(80));
  }

  console.log(`\n📊 Test Summary:`);
  console.log(`   Total: ${testCases.length}`);
  console.log(`   ✅ Success: ${successCount} (${(successCount / testCases.length * 100).toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${failCount} (${(failCount / testCases.length * 100).toFixed(1)}%)`);
  console.log('='.repeat(80));
}

runTests()
  .then(() => {
    console.log('\n✅ Test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
