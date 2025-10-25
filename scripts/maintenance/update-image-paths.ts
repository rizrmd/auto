#!/usr/bin/env bun

import { PrismaClient } from './generated/prisma/client.js';

const prisma = new PrismaClient();

const pathMappings = {
  'honda-brio-rs': 'honda-brio-rs-2021-merah-b01',
  'honda-jazz-2017': 'honda-jazz-2017-putih-j01', 
  'mazda-2-2014': 'mazda-2-2014-merah-mz01',
  'mercedes-c300-2010': 'mercedes-c300-2010-silver-m01',
  'mitsubishi-pajero-sport-2023': 'pajero-sport-2023-putih-p01',
  'toyota-yaris-2020': 'toyota-yaris-2020-silver-y01'
};

const cars = await prisma.car.findMany({
  where: { photos: { isEmpty: false } }
});

for (const car of cars) {
  let updatedPhotos = [...car.photos];
  
  for (const [oldPath, newPath] of Object.entries(pathMappings)) {
    updatedPhotos = updatedPhotos.map(photo => 
      photo.replace(`/uploads/tenant-1/cars/${oldPath}/`, `/uploads/tenant-1/cars/${newPath}/`)
    );
  }
  
  if (JSON.stringify(updatedPhotos) !== JSON.stringify(car.photos)) {
    await prisma.car.update({
      where: { id: car.id },
      data: { photos: updatedPhotos }
    });
    console.log(`Updated ${car.displayCode}: ${car.photos[0]} -> ${updatedPhotos[0]}`);
  }
}

console.log('✅ Database updated with new image paths');
await prisma.$disconnect();