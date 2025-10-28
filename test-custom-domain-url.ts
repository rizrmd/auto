/**
 * Test Custom Domain URL Generation
 * Verify that catalog URLs use custom domain when verified
 */

// Mock tenant data
const tenantWithCustomDomain = {
  id: 1,
  name: 'Showroom Mobil Surabaya',
  subdomain: 'showroom-surabaya.autoleads.id',
  customDomain: 'auto.lumiku.com',
  customDomainVerified: true
};

const tenantWithoutCustomDomain = {
  id: 2,
  name: 'Test Showroom',
  subdomain: 'test-showroom.autoleads.id',
  customDomain: null,
  customDomainVerified: false
};

const tenantWithUnverifiedCustomDomain = {
  id: 3,
  name: 'Pending Showroom',
  subdomain: 'pending-showroom.autoleads.id',
  customDomain: 'pending.example.com',
  customDomainVerified: false
};

// Function to get catalog domain (same logic as upload-flow-v2.ts)
function getCatalogDomain(tenant: any): string {
  return tenant.customDomainVerified && tenant.customDomain
    ? tenant.customDomain
    : tenant.subdomain;
}

// Function to build catalog URL
function buildCatalogUrl(tenant: any, slug: string): string {
  const catalogDomain = getCatalogDomain(tenant);
  return `https://${catalogDomain}/cars/${slug}`;
}

console.log('🧪 Testing Custom Domain URL Generation\n');
console.log('='.repeat(80));

// Test 1: Tenant with verified custom domain
console.log('\n📝 Test 1: Tenant with verified custom domain');
console.log(`Tenant: ${tenantWithCustomDomain.name}`);
console.log(`Subdomain: ${tenantWithCustomDomain.subdomain}`);
console.log(`Custom Domain: ${tenantWithCustomDomain.customDomain}`);
console.log(`Verified: ${tenantWithCustomDomain.customDomainVerified}`);

const slug1 = 'honda-freed-2012-silver-f12';
const url1 = buildCatalogUrl(tenantWithCustomDomain, slug1);
console.log(`\n🔗 Generated URL: ${url1}`);
console.log(`✅ Expected: https://auto.lumiku.com/cars/${slug1}`);
console.log(`${url1 === `https://auto.lumiku.com/cars/${slug1}` ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n' + '-'.repeat(80));

// Test 2: Tenant without custom domain
console.log('\n📝 Test 2: Tenant without custom domain');
console.log(`Tenant: ${tenantWithoutCustomDomain.name}`);
console.log(`Subdomain: ${tenantWithoutCustomDomain.subdomain}`);
console.log(`Custom Domain: ${tenantWithoutCustomDomain.customDomain}`);
console.log(`Verified: ${tenantWithoutCustomDomain.customDomainVerified}`);

const slug2 = 'toyota-avanza-2020-silver-a20';
const url2 = buildCatalogUrl(tenantWithoutCustomDomain, slug2);
console.log(`\n🔗 Generated URL: ${url2}`);
console.log(`✅ Expected: https://test-showroom.autoleads.id/cars/${slug2}`);
console.log(`${url2 === `https://test-showroom.autoleads.id/cars/${slug2}` ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n' + '-'.repeat(80));

// Test 3: Tenant with unverified custom domain (should fallback to subdomain)
console.log('\n📝 Test 3: Tenant with unverified custom domain (fallback)');
console.log(`Tenant: ${tenantWithUnverifiedCustomDomain.name}`);
console.log(`Subdomain: ${tenantWithUnverifiedCustomDomain.subdomain}`);
console.log(`Custom Domain: ${tenantWithUnverifiedCustomDomain.customDomain}`);
console.log(`Verified: ${tenantWithUnverifiedCustomDomain.customDomainVerified}`);

const slug3 = 'honda-jazz-2019-hitam-j15';
const url3 = buildCatalogUrl(tenantWithUnverifiedCustomDomain, slug3);
console.log(`\n🔗 Generated URL: ${url3}`);
console.log(`✅ Expected: https://pending-showroom.autoleads.id/cars/${slug3} (fallback to subdomain)`);
console.log(`${url3 === `https://pending-showroom.autoleads.id/cars/${slug3}` ? '✅ PASS' : '❌ FAIL'}`);

console.log('\n' + '='.repeat(80));

// Test Summary
const tests = [
  url1 === `https://auto.lumiku.com/cars/${slug1}`,
  url2 === `https://test-showroom.autoleads.id/cars/${slug2}`,
  url3 === `https://pending-showroom.autoleads.id/cars/${slug3}`
];

const passCount = tests.filter(t => t).length;
const failCount = tests.filter(t => !t).length;

console.log(`\n📊 Test Summary:`);
console.log(`   Total: ${tests.length}`);
console.log(`   ✅ Pass: ${passCount}`);
console.log(`   ❌ Fail: ${failCount}`);

if (failCount === 0) {
  console.log('\n🎉 All tests passed! Custom domain logic works correctly.');
} else {
  console.log('\n⚠️ Some tests failed. Check the logic.');
}

console.log('='.repeat(80));
