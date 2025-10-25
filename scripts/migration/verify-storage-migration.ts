/**
 * Storage Migration Verification Script
 *
 * Verifies that the storage migration from /uploads to /data is complete and working.
 *
 * Usage:
 *   bun run scripts/verify-storage-migration.ts
 *
 * What it checks:
 * 1. Database records use /uploads/ URLs
 * 2. Physical files exist in /data/ directory
 * 3. File paths match database records
 * 4. No orphaned files in /uploads/
 * 5. All car photos are accessible
 */

import { PrismaClient } from '../../generated/prisma';
import { existsSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

interface VerificationResult {
  totalCars: number;
  totalPhotos: number;
  photosFound: number;
  photosMissing: number;
  missingFiles: string[];
  orphanedUploads: string[];
  errors: string[];
}

/**
 * Main verification function
 */
async function verify(): Promise<void> {
  console.log('='.repeat(70));
  console.log('Storage Migration Verification');
  console.log('='.repeat(70));
  console.log('');

  const result: VerificationResult = {
    totalCars: 0,
    totalPhotos: 0,
    photosFound: 0,
    photosMissing: 0,
    missingFiles: [],
    orphanedUploads: [],
    errors: []
  };

  try {
    // Step 1: Check database records
    console.log('📋 Step 1: Checking database records...');
    await checkDatabaseRecords(result);
    console.log('');

    // Step 2: Verify physical files
    console.log('📁 Step 2: Verifying physical files...');
    await verifyPhysicalFiles(result);
    console.log('');

    // Step 3: Check for orphaned uploads
    console.log('🔍 Step 3: Checking for orphaned /uploads directory...');
    await checkOrphanedUploads(result);
    console.log('');

    // Step 4: Print summary
    printSummary(result);

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Check database records
 */
async function checkDatabaseRecords(result: VerificationResult): Promise<void> {
  const cars = await prisma.car.findMany({
    select: {
      id: true,
      displayCode: true,
      photos: true,
      slug: true
    }
  });

  result.totalCars = cars.length;
  console.log(`   Found ${cars.length} cars in database`);

  for (const car of cars) {
    result.totalPhotos += car.photos.length;

    // Verify all photos use /uploads/ URLs
    for (const photo of car.photos) {
      if (!photo.startsWith('/uploads/')) {
        result.errors.push(
          `Car ${car.displayCode} has photo with invalid URL: ${photo} (should start with /uploads/)`
        );
      }
    }
  }

  console.log(`   Found ${result.totalPhotos} photos in database`);

  if (result.errors.length > 0) {
    console.log(`   ⚠️  ${result.errors.length} URL format issues`);
  } else {
    console.log('   ✅ All photos use /uploads/ URLs (correct)');
  }
}

/**
 * Verify physical files exist
 */
async function verifyPhysicalFiles(result: VerificationResult): Promise<void> {
  const cars = await prisma.car.findMany({
    select: {
      displayCode: true,
      photos: true
    }
  });

  for (const car of cars) {
    for (const photo of car.photos) {
      // Convert /uploads/ URL to /data/ filesystem path
      const filePath = photo.replace('/uploads/', './data/');

      if (existsSync(filePath)) {
        result.photosFound++;
      } else {
        result.photosMissing++;
        result.missingFiles.push(`${car.displayCode}: ${filePath}`);
      }
    }
  }

  console.log(`   ✅ Found: ${result.photosFound}/${result.totalPhotos} photos`);

  if (result.photosMissing > 0) {
    console.log(`   ❌ Missing: ${result.photosMissing} photos`);
  }
}

/**
 * Check for orphaned /uploads directory
 */
async function checkOrphanedUploads(result: VerificationResult): Promise<void> {
  if (existsSync('./uploads')) {
    console.log('   ⚠️  ./uploads directory still exists');

    try {
      const uploadFiles = await countFilesRecursive('./uploads');
      console.log(`   Found ${uploadFiles} files in ./uploads directory`);

      if (uploadFiles > 0) {
        console.log('   💡 You can safely delete ./uploads after verifying /data works');
        result.orphanedUploads.push(`./uploads directory contains ${uploadFiles} files`);
      }
    } catch (error) {
      console.log('   ⚠️  Could not count files in ./uploads');
    }
  } else {
    console.log('   ✅ ./uploads directory not found (good - already cleaned up)');
  }
}

/**
 * Count files recursively
 */
async function countFilesRecursive(dir: string): Promise<number> {
  let count = 0;

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        count += await countFilesRecursive(fullPath);
      } else {
        count++;
      }
    }
  } catch (error) {
    // Directory might not exist or not accessible
  }

  return count;
}

/**
 * Print summary
 */
function printSummary(result: VerificationResult): void {
  console.log('='.repeat(70));
  console.log('Verification Summary');
  console.log('='.repeat(70));
  console.log('');
  console.log(`📊 Database:`);
  console.log(`   Total cars:   ${result.totalCars}`);
  console.log(`   Total photos: ${result.totalPhotos}`);
  console.log('');
  console.log(`📁 Physical Files:`);
  console.log(`   Found:        ${result.photosFound}`);
  console.log(`   Missing:      ${result.photosMissing}`);
  console.log('');

  // Missing files details
  if (result.missingFiles.length > 0) {
    console.log(`❌ Missing Files (${result.missingFiles.length}):`);
    result.missingFiles.slice(0, 10).forEach(file => {
      console.log(`   - ${file}`);
    });
    if (result.missingFiles.length > 10) {
      console.log(`   ... and ${result.missingFiles.length - 10} more`);
    }
    console.log('');
  }

  // Errors
  if (result.errors.length > 0) {
    console.log(`⚠️  Errors (${result.errors.length}):`);
    result.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    console.log('');
  }

  // Orphaned uploads
  if (result.orphanedUploads.length > 0) {
    console.log(`📦 Cleanup Needed:`);
    result.orphanedUploads.forEach(msg => {
      console.log(`   - ${msg}`);
    });
    console.log('');
  }

  // Overall status
  console.log('='.repeat(70));
  if (result.photosMissing === 0 && result.errors.length === 0) {
    console.log('✅ VERIFICATION PASSED - Migration is complete and working!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the application to ensure images load correctly');
    console.log('2. Once verified, delete ./uploads directory: rm -rf ./uploads/');
    console.log('3. Deploy to production with Coolify volume configured');
  } else {
    console.log('❌ VERIFICATION FAILED - Issues found');
    console.log('');
    console.log('Next steps:');
    if (result.photosMissing > 0) {
      console.log('1. Run migration script: bun run scripts/migrate-storage-to-data.ts');
      console.log('2. Copy missing files to ./data/ directory');
    }
    if (result.errors.length > 0) {
      console.log('3. Fix database URL format issues');
    }
    console.log('4. Re-run this verification script');
  }
  console.log('='.repeat(70));

  // Exit code
  if (result.photosMissing > 0 || result.errors.length > 0) {
    process.exit(1);
  }
}

/**
 * Run verification
 */
verify()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
