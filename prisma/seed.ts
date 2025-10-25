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
      customDomain: 'auto.lumiku.com',
      customDomainVerified: true,
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
      logoUrl: '/uploads/logos/showroom-surabaya.png', // Note: /uploads URLs served from /data directory
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
        publicName: 'Mercedes-Benz C300 Avantgarde 2010 Silver #M01',
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
          'Transmisi 7G-Tronic Plus',
          'Jok Kulit Elektrik Memory Seat',
          'Sunroof Panoramic',
          'Parking Sensors Depan Belakang',
          'Audio Premium Harman Kardon',
          'Cruise Control',
          'Dual Zone Climate Control',
        ],
        conditionNotes: 'Tangan kedua dari baru, kondisi istimewa mulus, service record Mercedes-Benz resmi lengkap, pajak hidup panjang, ban baru 90%, interior seperti baru',
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
          'Mercedes-Benz C300 Avantgarde 2010 kondisi istimewa, tangan kedua dari baru dengan bukti kepemilikan lengkap. Mesin V6 3.0L bertenaga 231 HP dengan transmisi 7G-Tronic yang sangat halus dan responsif. Dilengkapi fitur premium sunroof panoramic, jok kulit elektrik dengan memory seat, audio Harman Kardon, dan dual zone AC untuk kenyamanan maksimal. Service record lengkap di Mercedes-Benz resmi, pajak hidup panjang, interior dan eksterior mulus terawat seperti baru. Cocok untuk eksekutif yang menghargai prestise dan kenyamanan berkendara dengan harga kompetitif.',
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
        publicName: 'Mazda 2 R Hatchback 2014 Merah Metalik #MZ01',
        brand: 'Mazda',
        model: 'Mazda 2 R Hatchback',
        year: 2014,
        color: 'Merah Metalik',
        transmission: 'Matic',
        km: 82000,
        price: BigInt(135000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin SKYACTIV 1.5L Irit BBM 1:16',
          'Transmisi Matic 4-Speed Smooth',
          'Audio Touchscreen',
          'Foglamp Depan',
          'Velg Alloy Sporty 15 Inch',
          'Electric Mirror Retract',
          'Dual Airbag SRS',
          'ABS + EBD',
        ],
        conditionNotes: 'Tangan pertama dari baru, pajak panjang masih lama, interior original bersih terawat, AC dingin, cat mulus, mesin kering halus',
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
          'Mazda 2 R Hatchback 2014 tangan pertama dari baru, kondisi istimewa seperti baru. Teknologi mesin SKYACTIV 1.5L yang terkenal sangat irit BBM mencapai 1:16 km/L, hemat dan ekonomis untuk pemakaian harian. Desain KODO yang sporty dan elegan dengan warna merah metalik yang menawan, interior original bersih terawat dengan AC dingin. Pajak panjang masih lama, STNK BPKB lengkap siap nama pembeli, mesin halus kering tidak ada PR. Cocok untuk profesional muda atau keluarga kecil yang mencari city car irit BBM dengan performa handal dan biaya perawatan terjangkau.',
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
        publicName: 'Honda Jazz RS CVT 2017 Putih Mutiara #J01',
        brand: 'Honda',
        model: 'Jazz RS CVT',
        year: 2017,
        color: 'Putih Mutiara',
        transmission: 'Matic',
        km: 68000,
        price: BigInt(225000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin 1.5L i-VTEC 120 HP Bertenaga',
          'CVT Earth Dreams Technology',
          'Paddle Shift Sporty',
          'Cruise Control',
          'Audio Touchscreen 7 Inch',
          'Kamera Parkir Belakang',
          'Keyless Entry + Push Start Button',
          'Jok Kulit Premium',
          'Auto AC Digital',
          'LED Daytime Running Light',
        ],
        conditionNotes: 'Tangan pertama dari baru, service record Honda resmi lengkap, pajak hidup panjang, interior seperti baru sangat bersih, cat original mulus, km rendah',
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
          'Honda Jazz RS CVT 2017 tipe tertinggi varian paling lengkap, tangan pertama dari baru kondisi istimewa. Mesin i-VTEC 1.5L bertenaga 120 HP dengan transmisi CVT Earth Dreams yang sangat halus dan irit BBM, dilengkapi paddle shift untuk sensasi berkendara sporty. Interior kabin luas dengan sistem Ultra Seat yang sangat fleksibel, jok kulit premium, audio touchscreen 7 inch, kamera parkir, keyless entry dengan push start button, dan cruise control. Service record lengkap di Honda resmi, pajak hidup panjang, km rendah 68rb, interior bersih seperti baru, cat original mulus no repaint. Cocok untuk keluarga muda atau profesional yang mencari hatchback premium dengan fitur lengkap, kabin luas, dan value tinggi dengan harga terjangkau.',
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
        publicName: 'Toyota Yaris G CVT 2020 Silver Metalik #Y01',
        brand: 'Toyota',
        model: 'Yaris G CVT',
        year: 2020,
        color: 'Silver Metalik',
        transmission: 'Matic',
        km: 42000,
        price: BigInt(255000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin 1.5L Dual VVT-i 107 HP Irit',
          'CVT 7-Speed Sequential Halus',
          'Auto AC Dual Zone Climate',
          'Audio Display 7 Inch Touchscreen',
          'Kamera Mundur Reverse Camera',
          'Parking Sensor Depan Belakang',
          'Keyless Entry Smart',
          'Push Start Button Engine',
          'Electric Mirror Auto Retract',
          'Velg Alloy Two Tone 16 Inch',
          '6 Airbags Safety Complete',
          'VSC + TRC Stability Control',
        ],
        conditionNotes: 'Tangan pertama dari baru, km sangat rendah 42rb, pajak panjang hidup, ban tebal 90%, cat original full kaleng belum pernah repaint, interior bersih wangi',
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
          'Toyota Yaris G CVT 2020 generasi terbaru kondisi istimewa seperti baru, tangan pertama dari baru km sangat rendah 42rb. Fitur keselamatan paling lengkap di kelasnya dengan 6 airbags, VSC, dan TRC untuk proteksi maksimal keluarga Anda. Mesin 1.5L Dual VVT-i sangat irit BBM dengan transmisi CVT 7-speed sequential yang halus, responsif, dan nyaman. Dilengkapi fitur premium dual zone AC, audio touchscreen 7 inch, kamera parkir, parking sensor depan belakang, keyless entry, push start, dan velg alloy two tone 16 inch. Pajak hidup panjang, cat original full kaleng belum pernah repaint, interior bersih wangi, service record Toyota resmi lengkap. Cocok untuk keluarga muda yang mengutamakan keamanan, kenyamanan, dan value investasi jangka panjang dengan resale value tinggi.',
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
        publicName: 'Mitsubishi Pajero Sport Dakar 4x2 AT 2023 Putih #P01',
        brand: 'Mitsubishi',
        model: 'Pajero Sport Dakar 4x2 AT',
        year: 2023,
        color: 'Putih',
        transmission: 'Matic',
        km: 15000,
        price: BigInt(565000000),
        fuelType: 'Diesel',
        keyFeatures: [
          'Mesin 2.4L MIVEC Turbo Diesel 181 HP Bertenaga',
          'Transmisi 8-Speed Sport Mode Paddle Shift',
          'Electric Parking Brake Auto Hold',
          'Jok Kulit Premium Full Leather',
          'Audio Touchscreen 9 Inch Navigation',
          'Kamera 360 Derajat Around View',
          'Blind Spot Warning System',
          'Lane Departure Warning Alert',
          'Adaptive Cruise Control',
          'Sunroof Electric Panoramic',
          '7 Airbags Complete Safety',
          'Hill Start Assist Control',
          'LED Headlamp Projector',
        ],
        conditionNotes: 'Kondisi seperti baru istimewa, km sangat rendah 15rb, garansi resmi Mitsubishi masih aktif panjang hingga 2026, tangan pertama, BPKB STNK lengkap',
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
          'Mitsubishi Pajero Sport Dakar 4x2 AT 2023 tipe tertinggi paling mewah, kondisi seperti baru km sangat rendah hanya 15rb. SUV premium tangguh dengan mesin diesel turbo 2.4L MIVEC bertenaga 181 HP yang powerful namun sangat irit BBM untuk kelas SUV, transmisi 8-speed dengan paddle shift dan sport mode memberikan akselerasi responsif. Fitur keselamatan terlengkap di kelasnya: 7 airbags, blind spot warning, lane departure warning, adaptive cruise control, dan kamera 360 derajat untuk parkir mudah dan aman. Interior super mewah dengan jok kulit premium full leather, sunroof panoramic elektrik, audio touchscreen 9 inch dengan navigasi GPS, electric parking brake dengan auto hold. Garansi resmi Mitsubishi masih aktif panjang hingga 2026, BPKB STNK lengkap siap balik nama. Cocok untuk keluarga sukses yang hobi traveling, adventure, mudik lebaran dengan nyaman, atau eksekutif yang butuh SUV tangguh namun tetap elegan dengan fitur safety dan kenyamanan terlengkap.',
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
        publicName: 'Honda Brio RS CVT 2021 Phoenix Orange #B01',
        brand: 'Honda',
        model: 'Brio RS CVT',
        year: 2021,
        color: 'Merah Phoenix Orange',
        transmission: 'Matic',
        km: 35000,
        price: BigInt(185000000),
        fuelType: 'Bensin',
        keyFeatures: [
          'Mesin 1.2L i-VTEC 90 HP Responsif',
          'CVT Earth Dreams Technology',
          'Paddle Shift Sporty',
          'Audio Touchscreen 7 Inch',
          'Kamera Mundur Rear Camera',
          'Keyless Entry + Push Start Button',
          'Auto AC Digital',
          'Eco Indicator Irit BBM',
          'Electric Mirror Auto Retract',
          'Velg Alloy Sporty Racing 15 Inch',
          'LED Headlamp Projector',
          'Bodykit Sporty RS',
        ],
        conditionNotes: 'Tangan pertama dari baru, pajak panjang hidup, service record Honda resmi lengkap, interior bersih terawat, km rendah, cat mulus',
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
          'Honda Brio RS CVT 2021 varian tertinggi paling sporty, tangan pertama dari baru kondisi mulus terawat. City car sporty dengan tampilan agresif warna Phoenix Orange yang eye-catching, dilengkapi bodykit sporty RS, LED headlamp projector, dan velg alloy racing 15 inch. Mesin i-VTEC 1.2L bertenaga 90 HP dengan transmisi CVT Earth Dreams yang sangat halus dan super irit BBM mencapai 1:18 km/L dalam kota, sangat ekonomis untuk anak muda. Dilengkapi paddle shift untuk sensasi berkendara lebih sporty, audio touchscreen 7 inch, kamera mundur, keyless entry dengan push start button, auto AC digital, dan eco indicator. Pajak panjang masih lama, service record Honda resmi lengkap, km rendah 35rb, interior bersih wangi, cat mulus no repaint. Cocok banget untuk anak muda, mahasiswa, atau first car dengan budget terjangkau namun tampilan keren sporty, fitur lengkap tidak murahan, dan biaya perawatan murah dengan resale value tinggi khas Honda.',
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
