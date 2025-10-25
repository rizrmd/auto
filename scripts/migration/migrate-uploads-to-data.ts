#!/usr/bin/env bun

/**
 * Migrate uploads from /app/uploads to /app/data
 * This ensures all images are in persistent storage
 */

import { readdir, stat, copyFile, mkdir } from 'fs/promises';
import { join } from 'path';

const SOURCE_DIR = '/app/uploads';
const TARGET_DIR = '/app/data';

async function migrateUploads() {
  console.log('🔄 Starting migration from /app/uploads to /app/data...');

  try {
    // Check if source directory exists
    const sourceExists = await stat(SOURCE_DIR).catch(() => null);
    if (!sourceExists) {
      console.log('✅ Source directory does not exist, migration not needed');
      return;
    }

    // Ensure target directory exists
    await mkdir(TARGET_DIR, { recursive: true });

    // Read source directory
    const items = await readdir(SOURCE_DIR);
    console.log(`📁 Found ${items.length} items to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        const sourcePath = join(SOURCE_DIR, item);
        const targetPath = join(TARGET_DIR, item);

        const sourceStat = await stat(sourcePath);
        
        if (sourceStat.isDirectory()) {
          // Recursively copy directory
          await copyDirectory(sourcePath, targetPath);
        } else {
          // Copy file
          await copyFile(sourcePath, targetPath);
        }

        migratedCount++;
        console.log(`✅ Migrated: ${item}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate ${item}:`, error);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} items`);
    console.log(`   ❌ Failed: ${errorCount} items`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 You can now remove /app/uploads directory');
    } else {
      console.log('\n⚠️  Migration completed with errors');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

async function copyDirectory(source: string, target: string): Promise<void> {
  await mkdir(target, { recursive: true });
  
  const items = await readdir(source);
  
  for (const item of items) {
    const sourcePath = join(source, item);
    const targetPath = join(target, item);
    
    const sourceStat = await stat(sourcePath);
    
    if (sourceStat.isDirectory()) {
      await copyDirectory(sourcePath, targetPath);
    } else {
      await copyFile(sourcePath, targetPath);
    }
  }
}

// Run migration
migrateUploads();