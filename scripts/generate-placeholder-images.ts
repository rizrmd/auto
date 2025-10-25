#!/usr/bin/env bun

/**
 * Generate Placeholder Images Script
 * 
 * Creates placeholder WebP images for all cars that don't have images yet.
 * This ensures the car detail pages always load properly.
 */

import { PrismaClient } from '../generated/prisma/client.js';
import { promises as fs } from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Base64 encoded 1x1 WebP placeholder (transparent)
const PLACEHOLDER_WEBP_BASE64 = 'UklGRigAAABXRUJQVlA4IBwAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=';

async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function createPlaceholderImage(filePath: string): Promise<void> {
  const buffer = Buffer.from(PLACEHOLDER_WEBP_BASE64, 'base64');
  await fs.writeFile(filePath, buffer);
}

async function generateCarImages(carId: number, photos: string[]): Promise<void> {
  console.log(`Generating images for car ${carId}...`);
  
  for (const photoPath of photos) {
    // Convert URL path to file system path
    const filePath = path.join('/app/data', photoPath.replace('/uploads/', ''));
    const dirPath = path.dirname(filePath);
    
    // Ensure directory exists
    await ensureDirectoryExists(dirPath);
    
    // Check if file already exists
    try {
      await fs.access(filePath);
      console.log(`  ✓ ${photoPath} already exists`);
    } catch {
      // Create placeholder image
      await createPlaceholderImage(filePath);
      console.log(`  + Created ${photoPath}`);
    }
  }
}

async function main(): Promise<void> {
  console.log('🖼️  Generating placeholder images for cars...\n');
  
  try {
    // Get all cars with photos
    const cars = await prisma.car.findMany({
      where: {
        photos: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        displayCode: true,
        publicName: true,
        photos: true
      }
    });
    
    console.log(`Found ${cars.length} cars with photos\n`);
    
    let totalImagesCreated = 0;
    let totalImagesExisted = 0;
    
    for (const car of cars) {
      console.log(`📸 ${car.publicName} (${car.displayCode})`);
      
      let imagesCreated = 0;
      let imagesExisted = 0;
      
      for (const photoPath of car.photos) {
        const filePath = path.join('/app/data', photoPath.replace('/uploads/', ''));
        const dirPath = path.dirname(filePath);
        
        await ensureDirectoryExists(dirPath);
        
        try {
          await fs.access(filePath);
          imagesExisted++;
        } catch {
          await createPlaceholderImage(filePath);
          imagesCreated++;
        }
      }
      
      totalImagesCreated += imagesCreated;
      totalImagesExisted += imagesExisted;
      
      if (imagesCreated > 0) {
        console.log(`  ✅ Created ${imagesCreated} new images, ${imagesExisted} already existed\n`);
      } else {
        console.log(`  ✅ All ${imagesExisted} images already exist\n`);
      }
    }
    
    console.log('🎉 Summary:');
    console.log(`  Total cars processed: ${cars.length}`);
    console.log(`  New images created: ${totalImagesCreated}`);
    console.log(`  Images already existed: ${totalImagesExisted}`);
    console.log(`  Total images: ${totalImagesCreated + totalImagesExisted}`);
    
  } catch (error) {
    console.error('❌ Error generating placeholder images:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.main) {
  main();
}