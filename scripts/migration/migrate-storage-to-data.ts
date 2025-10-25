/**
 * Storage Migration Script: /app/uploads → /app/data
 *
 * This script does NOT modify database records because we're keeping /uploads in URLs
 * for backward compatibility. The backend now serves /uploads/* URLs from /data/ directory.
 *
 * This script only moves physical files from uploads/ to data/ directory.
 *
 * Usage:
 *   bun run scripts/migrate-storage-to-data.ts
 *
 * What it does:
 * 1. Copies all files from ./uploads/ to ./data/
 * 2. Preserves directory structure
 * 3. Logs progress
 * 4. Optionally deletes old ./uploads/ directory after successful migration
 *
 * NOTE: Database records keep /uploads/ in photo paths - backend maps this to /data/
 */

import { copyFile, mkdir, readdir, stat, rm } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

const SOURCE_DIR = './uploads';
const DEST_DIR = './data';
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set DRY_RUN=true to test without moving files

interface MigrationStats {
  filesChecked: number;
  filesCopied: number;
  directoriesCreated: number;
  errors: string[];
  totalBytes: number;
}

/**
 * Recursively copy directory
 */
async function copyDirectory(source: string, destination: string, stats: MigrationStats): Promise<void> {
  // Check if source exists
  if (!existsSync(source)) {
    console.log(`⚠️  Source directory does not exist: ${source}`);
    return;
  }

  // Create destination directory
  if (!existsSync(destination)) {
    if (!DRY_RUN) {
      await mkdir(destination, { recursive: true });
    }
    stats.directoriesCreated++;
    console.log(`📁 Created directory: ${destination}`);
  }

  // Read source directory
  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(source, entry.name);
    const destPath = join(destination, entry.name);

    stats.filesChecked++;

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      await copyDirectory(sourcePath, destPath, stats);
    } else {
      // Copy file
      try {
        const fileStats = await stat(sourcePath);

        if (!DRY_RUN) {
          // Create parent directory if it doesn't exist
          const destDir = dirname(destPath);
          if (!existsSync(destDir)) {
            await mkdir(destDir, { recursive: true });
            stats.directoriesCreated++;
          }

          // Copy file
          await copyFile(sourcePath, destPath);
        }

        stats.filesCopied++;
        stats.totalBytes += fileStats.size;

        console.log(`✅ Copied: ${sourcePath} → ${destPath} (${formatBytes(fileStats.size)})`);
      } catch (error) {
        const errorMsg = `Error copying ${sourcePath}: ${error}`;
        stats.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }
  }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Main migration function
 */
async function migrate(): Promise<void> {
  console.log('='.repeat(70));
  console.log('Storage Migration: /app/uploads → /app/data');
  console.log('='.repeat(70));

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No files will be modified');
    console.log('');
  }

  const stats: MigrationStats = {
    filesChecked: 0,
    filesCopied: 0,
    directoriesCreated: 0,
    errors: [],
    totalBytes: 0
  };

  console.log(`📂 Source:      ${SOURCE_DIR}`);
  console.log(`📂 Destination: ${DEST_DIR}`);
  console.log('');
  console.log('Starting migration...');
  console.log('');

  const startTime = Date.now();

  try {
    await copyDirectory(SOURCE_DIR, DEST_DIR, stats);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('');
  console.log('='.repeat(70));
  console.log('Migration Summary');
  console.log('='.repeat(70));
  console.log(`✅ Files checked:        ${stats.filesChecked}`);
  console.log(`✅ Files copied:         ${stats.filesCopied}`);
  console.log(`✅ Directories created:  ${stats.directoriesCreated}`);
  console.log(`✅ Total data migrated:  ${formatBytes(stats.totalBytes)}`);
  console.log(`⏱️  Duration:             ${duration}s`);

  if (stats.errors.length > 0) {
    console.log('');
    console.log(`⚠️  Errors: ${stats.errors.length}`);
    stats.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('');

  if (!DRY_RUN && stats.errors.length === 0) {
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify files in ./data/ directory');
    console.log('2. Test the application to ensure images load correctly');
    console.log('3. Once verified, you can safely delete ./uploads/ directory:');
    console.log('   rm -rf ./uploads/');
    console.log('');
    console.log('Note: Database records still use /uploads/ URLs - backend now serves');
    console.log('      /uploads/* from /data/ directory for backward compatibility.');
  } else if (DRY_RUN) {
    console.log('🔍 Dry run completed. Run without DRY_RUN=true to actually migrate files.');
  }

  console.log('='.repeat(70));
}

/**
 * Run migration
 */
migrate()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
