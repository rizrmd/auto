import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Hash password helper using Bun's built-in password hashing
async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 12,
  });
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clean up existing data (optional - comment out if you want to preserve data)
  await prisma.message.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.car.deleteMany();
  await prisma.user.deleteMany();
  await prisma.conversationState.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('✅ Cleaned up existing data');

  // ============================================
  // 1. CREATE TENANT
  // ============================================
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Showroom Mobil Surabaya',
      slug: 'showroom-surabaya',
      subdomain: 'showroom-surabaya.autoleads.id',
      whatsappNumber: '628123456789',
      phone: '031-1234567',
      email: 'info@showroom-surabaya.com',
      address: 'Jl. Raya Darmo No. 123, Surabaya',
      city: 'Surabaya',
      mapsUrl: 'https://maps.google.com/?q=Jl.+Raya+Darmo+No.+123+Surabaya',
      plan: 'growth',
      status: 'active',
      primaryColor: '#FF5722',
      secondaryColor: '#212121',
      logoUrl: '/uploads/logos/showroom-surabaya.png',
      whatsappBotEnabled: true,
      planStartedAt: new Date('2025-01-01'),
      planExpiresAt: new Date('2025-12-31'),
      businessHours: {
        monday: '09:00-18:00',
        tuesday: '09:00-18:00',
        wednesday: '09:00-18:00',
        thursday: '09:00-18:00',
        friday: '09:00-18:00',
        saturday: '09:00-17:00',
        sunday: '10:00-15:00',
      },
      settings: {
        autoReplyEnabled: true,
        leadNotifications: true,
        currency: 'IDR',
        language: 'id',
      },
    },
  });

  console.log('✅ Created tenant:', tenant.name);

  // ============================================
  // 2. CREATE USERS
  // ============================================
  const hashedPassword = await hashPassword('password123');

  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Owner Showroom',
      email: 'owner@showroom-surabaya.com',
      phone: '081234567890',
      whatsappNumber: '6281234567890',
      passwordHash: hashedPassword,
      role: 'owner',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  const budi = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Budi Santoso',
      email: 'budi@showroom-surabaya.com',
      phone: '081234567891',
      whatsappNumber: '6281234567891',
      passwordHash: hashedPassword,
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  const ani = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Ani Wijaya',
      email: 'ani@showroom-surabaya.com',
      phone: '081234567892',
      whatsappNumber: '6281234567892',
      passwordHash: hashedPassword,
      role: 'sales',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  console.log('✅ Created users: Owner, Budi (admin), Ani (sales)');

  // ============================================
  // 3. CREATE CARS (6 REAL CARS WITH ACTUAL PHOTOS)
  // ============================================

  const cars = await Promise.all([
    // MERCEDES-BENZ C300 2010
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#M01',
        publicName: 'Mercedes-Benz C300 2010 Silver #M01',
        brand: 'Mercedes-Benz',
        model: 'C300 Avantgarde',
        year: 2010,
        color: 'Silver',
        transmission: 'Matic',
        km: 95000,
        price: BigInt(245000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin V6 3.0L 231 HP',
          'Transmisi 7G-Tronic',
          'Leather Seat Electric',
          'Sunroof Panoramic',
          'Parking Sensors',
          'Audio Premium Harman Kardon',
          'Cruise Control',
          'Dual Zone AC',
        ],
        conditionNotes: 'Tangan kedua, service record Mercedes-Benz resmi, pajak hidup, ban baru 90%',
        photos: [
          '/uploads/tenant-1/cars/mercedes-c300-2010/1.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/2.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/3.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/4.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/5.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/6.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/7.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/8.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/9.webp',
        ],
        primaryPhotoIndex: 0,
        description:
          'Mercedes-Benz C300 Avantgarde 2010 dengan mesin V6 3.0L bertenaga 231 HP. Sedan mewah dengan fitur lengkap termasuk sunroof panoramic, jok kulit elektrik, dan audio premium Harman Kardon. Kondisi terawat dengan service record resmi Mercedes-Benz. Interior dan eksterior sangat mulus, siap pakai untuk eksekutif yang menghargai kenyamanan dan prestise.',
        status: 'available',
        slug: 'mercedes-c300-2010-silver-m01',
        plateNumber: 'L 8888 MB',
        plateNumberClean: 'L8888MB',
        stockCode: 'MB-001',
      },
    }),

    // MAZDA 2 2014
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#MZ01',
        publicName: 'Mazda 2 R 2014 Merah #MZ01',
        brand: 'Mazda',
        model: 'Mazda 2 R Hatchback',
        year: 2014,
        color: 'Merah Metalik',
        transmission: 'Matic',
        km: 82000,
        price: BigInt(135000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin SKYACTIV 1.5L Irit BBM',
          'Transmisi Matic 4-Speed',
          'Audio Touchscreen',
          'Foglamp',
          'Velg Alloy 15 Inch',
          'Electric Mirror',
          'Dual Airbag',
          'ABS + EBD',
        ],
        conditionNotes: 'Tangan pertama dari baru, pajak panjang, interior original bersih, AC dingin',
        photos: [
          '/uploads/tenant-1/cars/mazda-2-2014/1.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/2.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/3.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/4.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/5.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/6.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/7.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/8.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/9.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/10.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/11.webp',
        ],
        primaryPhotoIndex: 0,
        description:
          'Mazda 2 R Hatchback 2014 dengan teknologi SKYACTIV yang sangat irit BBM. City car sporty dengan desain KODO yang elegan dan dinamis. Tangan pertama dengan kondisi istimewa, interior original terawat. Cocok untuk mobilitas harian di kota dengan konsumsi BBM ekonomis 1:16 km/L. Fitur keamanan lengkap dengan dual airbag dan ABS.',
        status: 'available',
        slug: 'mazda-2-2014-merah-mz01',
        plateNumber: 'L 2468 MZ',
        plateNumberClean: 'L2468MZ',
        stockCode: 'MZ-001',
      },
    }),

    // HONDA JAZZ 2017
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#J01',
        publicName: 'Honda Jazz RS 2017 Putih #J01',
        brand: 'Honda',
        model: 'Jazz RS CVT',
        year: 2017,
        color: 'Putih Mutiara',
        transmission: 'Matic',
        km: 68000,
        price: BigInt(225000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin 1.5L i-VTEC 120 HP',
          'CVT Earth Dreams Technology',
          'Paddle Shift',
          'Cruise Control',
          'Audio Touchscreen 7 Inch',
          'Camera Parkir',
          'Keyless Entry + Push Start',
          'Leather Seat',
          'Auto AC',
          'LED DRL',
        ],
        conditionNotes: 'Tangan pertama, service record Honda resmi, pajak hidup, interior seperti baru',
        photos: [
          '/uploads/tenant-1/cars/honda-jazz-2017/1.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/2.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/3.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/4.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/5.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/6.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/7.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/8.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/9.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/10.webp',
        ],
        primaryPhotoIndex: 0,
        description:
          'Honda Jazz RS CVT 2017 varian tertinggi dengan fitur paling lengkap. Hatchback premium dengan mesin i-VTEC 1.5L yang bertenaga namun irit. Dilengkapi CVT dengan paddle shift untuk pengalaman berkendara yang lebih sporty. Interior luas dengan kabin lega dan fleksibel (Ultra Seat). Tangan pertama dengan kondisi sangat terawat, service record lengkap di Honda resmi. Fitur kenyamanan lengkap: keyless entry, push start, cruise control, camera parkir, dan jok kulit.',
        status: 'available',
        slug: 'honda-jazz-2017-putih-j01',
        plateNumber: 'L 1717 JZ',
        plateNumberClean: 'L1717JZ',
        stockCode: 'HJ-001',
      },
    }),

    // TOYOTA YARIS 2020
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#Y01',
        publicName: 'Toyota Yaris G 2020 Silver #Y01',
        brand: 'Toyota',
        model: 'Yaris G CVT',
        year: 2020,
        color: 'Silver Metalik',
        transmission: 'Matic',
        km: 42000,
        price: BigInt(255000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin 1.5L Dual VVT-i 107 HP',
          'CVT 7-Speed Sequential',
          'Auto AC Dual Zone',
          'Audio Display 7 Inch',
          'Reverse Camera',
          'Parking Sensor',
          'Keyless Entry',
          'Push Start Button',
          'Electric Mirror',
          'Velg Alloy 16 Inch',
          '6 Airbags',
          'VSC + TRC',
        ],
        conditionNotes: 'Tangan pertama dari baru, km rendah, pajak panjang, ban 90%, cat original',
        photos: [
          '/uploads/tenant-1/cars/toyota-yaris-2020/1.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/2.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/3.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/4.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/5.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/6.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/7.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/8.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/9.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/10.webp',
        ],
        primaryPhotoIndex: 0,
        description:
          'Toyota Yaris G CVT 2020 generasi terbaru dengan desain sporty dan modern. Hatchback premium dari Toyota dengan fitur safety terlengkap di kelasnya (6 airbags, VSC, TRC). Mesin 1.5L Dual VVT-i sangat irit BBM dengan transmisi CVT 7-speed yang halus dan responsif. Kondisi istimewa seperti baru, km rendah, tangan pertama dengan service record Toyota resmi. Interior lapang dengan fitur kenyamanan lengkap. Cocok untuk keluarga muda yang mengutamakan keamanan dan kenyamanan.',
        status: 'available',
        slug: 'toyota-yaris-2020-silver-y01',
        plateNumber: 'L 2020 YR',
        plateNumberClean: 'L2020YR',
        stockCode: 'TY-001',
      },
    }),

    // MITSUBISHI PAJERO SPORT 2023
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#P01',
        publicName: 'Mitsubishi Pajero Sport Dakar 2023 Putih #P01',
        brand: 'Mitsubishi',
        model: 'Pajero Sport Dakar 4x2 AT',
        year: 2023,
        color: 'Putih',
        transmission: 'Matic',
        km: 15000,
        price: BigInt(565000000),
        fuelType: 'Diesel',
        keyFeatures: [
          'Mesin 2.4L MIVEC Turbo Diesel 181 HP',
          'Transmisi 8-Speed Sport Mode',
          'Paddle Shift',
          'Electric Parking Brake',
          'Leather Seat Premium',
          'Audio Touchscreen 9 Inch',
          'Camera 360 Derajat',
          'Blind Spot Warning',
          'Lane Departure Warning',
          'Auto Cruise Control',
          'Sunroof Electric',
          '7 Airbags',
          'Hill Start Assist',
        ],
        conditionNotes: 'Seperti baru, garansi resmi Mitsubishi masih aktif hingga 2026, km sangat rendah',
        photos: [
          '/uploads/tenant-1/cars/mitsubishi-pajero-2023/1.webp',
          '/uploads/tenant-1/cars/mitsubishi-pajero-2023/2.webp',
          '/uploads/tenant-1/cars/mitsubishi-pajero-2023/3.webp',
          '/uploads/tenant-1/cars/mitsubishi-pajero-2023/4.webp',
          '/uploads/tenant-1/cars/mitsubishi-pajero-2023/5.webp',
          '/uploads/tenant-1/cars/mitsubishi-pajero-2023/6.webp',
        ],
        primaryPhotoIndex: 0,
        description:
          'Mitsubishi Pajero Sport Dakar 4x2 AT 2023 varian tertinggi dengan fitur paling lengkap. SUV tangguh dengan mesin diesel turbo 2.4L MIVEC yang bertenaga namun irit. Transmisi 8-speed dengan paddle shift memberikan performa maksimal. Fitur safety terlengkap: 7 airbags, blind spot warning, lane departure warning, dan camera 360. Interior mewah dengan jok kulit premium dan sunroof elektrik. Kondisi seperti baru dengan km sangat rendah, garansi resmi masih panjang. Cocok untuk keluarga yang suka traveling dan petualangan dengan tetap mengutamakan kenyamanan dan keamanan.',
        status: 'booking',
        slug: 'pajero-sport-2023-putih-p01',
        plateNumber: 'L 2023 PS',
        plateNumberClean: 'L2023PS',
        stockCode: 'PS-001',
      },
    }),

    // HONDA BRIO RS
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#B01',
        publicName: 'Honda Brio RS CVT Merah #B01',
        brand: 'Honda',
        model: 'Brio RS CVT',
        year: 2021,
        color: 'Merah Phoenix Orange',
        transmission: 'Matic',
        km: 35000,
        price: BigInt(185000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin 1.2L i-VTEC 90 HP',
          'CVT Earth Dreams',
          'Paddle Shift',
          'Audio Touchscreen 7 Inch',
          'Rear Camera',
          'Keyless Entry + Push Start',
          'Auto AC',
          'Eco Indicator',
          'Electric Mirror',
          'Velg Alloy Sporty 15 Inch',
          'LED Headlamp',
        ],
        conditionNotes: 'Tangan pertama, pajak panjang, service record Honda resmi, interior bersih',
        photos: [
          '/uploads/tenant-1/cars/honda-brio-rs/1.webp',
          '/uploads/tenant-1/cars/honda-brio-rs/2.webp',
          '/uploads/tenant-1/cars/honda-brio-rs/3.webp',
          '/uploads/tenant-1/cars/honda-brio-rs/4.webp',
          '/uploads/tenant-1/cars/honda-brio-rs/5.webp',
          '/uploads/tenant-1/cars/honda-brio-rs/6.webp',
          '/uploads/tenant-1/cars/honda-brio-rs/7.webp',
          '/uploads/tenant-1/cars/honda-brio-rs/8.webp',
        ],
        primaryPhotoIndex: 0,
        description:
          'Honda Brio RS CVT 2021 varian sporty dengan tampilan agresif dan fitur lengkap. City car irit BBM dengan mesin i-VTEC 1.2L dan transmisi CVT yang halus. Dilengkapi paddle shift untuk sensasi berkendara lebih sporty. Desain eksterior eye-catching dengan LED headlamp dan velg alloy 15 inch. Interior modern dengan audio touchscreen, keyless entry, dan push start. Sangat cocok untuk anak muda atau first car dengan budget terjangkau namun fitur tidak murahan. Tangan pertama dengan kondisi terawat, konsumsi BBM sangat irit 1:18 km/L dalam kota.',
        status: 'available',
        slug: 'honda-brio-rs-2021-merah-b01',
        plateNumber: 'L 2121 BR',
        plateNumberClean: 'L2121BR',
        stockCode: 'HB-001',
      },
    }),
  ]);

  console.log(`✅ Created ${cars.length} cars`);

  // ============================================
  // 4. CREATE LEADS (5 SAMPLE LEADS)
  // ============================================

  const lead1 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654321',
      customerName: 'Ibu Siti',
      carId: cars[1].id, // Mazda 2 2014
      status: 'new',
      source: 'wa',
      tags: ['first-time-buyer'],
      notes: 'Tertarik dengan Mazda 2, butuh mobil city car irit',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654322',
      customerName: 'Pak Andi',
      carId: cars[0].id, // Mercedes C300 2010
      status: 'hot',
      source: 'wa',
      assignedToUserId: budi.id,
      tags: ['ready-to-buy', 'cash'],
      notes: 'Siap beli minggu ini, prefer cash. Tertarik Mercedes eksekutif.',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654323',
      customerName: 'Dika',
      carId: cars[5].id, // Honda Brio RS 2021
      status: 'warm',
      source: 'wa',
      assignedToUserId: ani.id,
      tags: ['student', 'budget-limited'],
      notes: 'Anak kuliah, cari mobil pertama yang irit dan sporty',
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654324',
      customerName: 'Bu Nina',
      carId: cars[2].id, // Honda Jazz RS 2017
      status: 'hot',
      source: 'web',
      assignedToUserId: budi.id,
      tags: ['credit', 'trade-in'],
      notes: 'Mau tukar tambah dari Jazz lama, tertarik upgrade ke RS',
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654325',
      customerName: 'Pak Rudi',
      carId: null, // General inquiry
      status: 'new',
      source: 'wa',
      tags: ['general-inquiry'],
      notes: 'Tanya-tanya dulu, belum specific mobil apa',
    },
  });

  console.log(`✅ Created 5 leads`);

  // ============================================
  // 5. CREATE MESSAGES (10 SAMPLE MESSAGES)
  // ============================================

  // Conversation 1: Lead 1 (Ibu Siti) - New lead, bot interaction
  await prisma.message.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: lead1.id,
        sender: 'customer',
        message: 'Halo, saya tertarik dengan Mazda 2 merah #MZ01',
        createdAt: new Date('2025-10-23T09:00:00'),
      },
      {
        tenantId: tenant.id,
        leadId: lead1.id,
        sender: 'bot',
        message: 'Halo Ibu Siti! 👋 Terima kasih sudah menghubungi Showroom Mobil Surabaya.\n\nAnda tertarik dengan *Mazda 2 R 2014 Merah #MZ01*\n💰 Harga: Rp 135.000.000\n🚗 Transmisi: Matic\n📊 KM: 82.000\n⛽ Irit BBM 1:16 km/L\n\nApakah Ibu ingin:\n1️⃣ Lihat detail & foto lengkap\n2️⃣ Jadwalkan test drive\n3️⃣ Tanya spesifikasi\n4️⃣ Bicara dengan sales',
        createdAt: new Date('2025-10-23T09:00:05'),
      },
      {
        tenantId: tenant.id,
        leadId: lead1.id,
        sender: 'customer',
        message: '1',
        createdAt: new Date('2025-10-23T09:01:00'),
      },
    ],
  });

  // Conversation 2: Lead 2 (Pak Andi) - Hot lead, sales takeover
  await prisma.message.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: lead2.id,
        sender: 'customer',
        message: 'Mercedes C300 yang silver masih ada?',
        createdAt: new Date('2025-10-22T14:30:00'),
      },
      {
        tenantId: tenant.id,
        leadId: lead2.id,
        sender: 'bot',
        message: 'Masih ada Pak! *Mercedes-Benz C300 2010 Silver #M01*\n💰 Rp 245.000.000\n⚙️ V6 3.0L Matic\n📊 95.000 km\n✨ Sunroof Panoramic, Audio Harman Kardon\n\nBapak berminat cash atau kredit?',
        createdAt: new Date('2025-10-22T14:30:05'),
      },
      {
        tenantId: tenant.id,
        leadId: lead2.id,
        sender: 'customer',
        message: 'Cash pak, saya serius mau beli. Bisa nego gak?',
        createdAt: new Date('2025-10-22T14:31:00'),
      },
      {
        tenantId: tenant.id,
        leadId: lead2.id,
        sender: 'system',
        message: '🔔 Lead prioritas! Sales Budi akan segera menghubungi Anda.',
        createdAt: new Date('2025-10-22T14:31:05'),
      },
      {
        tenantId: tenant.id,
        leadId: lead2.id,
        sender: 'sales',
        message: 'Selamat siang Pak Andi, saya Budi dari Showroom Mobil Surabaya. Untuk harga cash bisa kita diskusikan lebih lanjut Pak. Bapak posisi dimana? Bisa langsung survey ke showroom kami di Jl. Raya Darmo?',
        createdAt: new Date('2025-10-22T14:35:00'),
      },
    ],
  });

  // Conversation 3: Lead 3 (Dika) - Student inquiry
  await prisma.message.createMany({
    data: [
      {
        tenantId: tenant.id,
        leadId: lead3.id,
        sender: 'customer',
        message: 'Pak, ada mobil second yang bagus untuk pemula budget 200jt?',
        createdAt: new Date('2025-10-21T16:00:00'),
      },
      {
        tenantId: tenant.id,
        leadId: lead3.id,
        sender: 'bot',
        message: 'Halo Dika! Ada beberapa pilihan bagus untuk budget 200jt:\n\n1️⃣ *Mazda 2 R 2014 #MZ01* - Rp 135jt (Matic, Irit)\n2️⃣ *Honda Brio RS 2021 #B01* - Rp 185jt (Matic, Sporty)\n\nKeduanya irit BBM dan cocok untuk pemula. Lebih prefer yang mana?',
        createdAt: new Date('2025-10-21T16:00:05'),
      },
      {
        tenantId: tenant.id,
        leadId: lead3.id,
        sender: 'customer',
        message: 'Brio RS aja pak, lebih sporty. Konsumsi BBM berapa?',
        createdAt: new Date('2025-10-21T16:02:00'),
      },
    ],
  });

  console.log(`✅ Created 10 messages across ${[lead1, lead2, lead3].length} conversations`);

  // ============================================
  // SUMMARY
  // ============================================

  console.log('\n📊 Seed Summary:');
  console.log('================');
  console.log(`✅ 1 Tenant: ${tenant.name}`);
  console.log(`✅ 3 Users: Owner, Budi (admin), Ani (sales)`);
  console.log(`✅ 6 Cars: 4 available, 1 booking`);
  console.log(`   - Mercedes-Benz C300 2010 (9 photos)`);
  console.log(`   - Mazda 2 R 2014 (11 photos)`);
  console.log(`   - Honda Jazz RS 2017 (10 photos)`);
  console.log(`   - Toyota Yaris G 2020 (10 photos)`);
  console.log(`   - Mitsubishi Pajero Sport 2023 (6 photos)`);
  console.log(`   - Honda Brio RS 2021 (8 photos)`);
  console.log(`✅ 5 Leads: 2 hot, 1 warm, 2 new`);
  console.log(`✅ 10 Messages across conversations`);
  console.log('\n🔐 Login Credentials:');
  console.log('====================');
  console.log('Owner: owner@showroom-surabaya.com / password123');
  console.log('Admin: budi@showroom-surabaya.com / password123');
  console.log('Sales: ani@showroom-surabaya.com / password123');
  console.log('\n🌍 Tenant URL:');
  console.log('==============');
  console.log(`https://${tenant.subdomain}`);
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
