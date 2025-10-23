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
  // 3. CREATE CARS (15 SAMPLE CARS)
  // ============================================

  const cars = await Promise.all([
    // TOYOTA AVANZA
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#A01',
        publicName: 'Avanza 2020 Hitam #A01',
        brand: 'Toyota',
        model: 'Avanza',
        year: 2020,
        color: 'Hitam',
        transmission: 'Manual',
        km: 45000,
        price: BigInt(165000000),
        fuelType: 'Bensin',
        keyFeatures: ['Velg Racing', 'Audio System Upgrade', 'Jok Kulit', 'Kondisi Mulus'],
        conditionNotes: 'Pajak panjang, service rutin di bengkel resmi',
        photos: [
          '/uploads/cars/avanza-2020-hitam-1.jpg',
          '/uploads/cars/avanza-2020-hitam-2.jpg',
          '/uploads/cars/avanza-2020-hitam-3.jpg',
          '/uploads/cars/avanza-2020-hitam-4.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Toyota Avanza 2020 warna hitam, kondisi istimewa. Pajak panjang, km rendah, service record lengkap. Cocok untuk keluarga.',
        status: 'available',
        slug: 'avanza-2020-hitam-a01',
        plateNumber: 'L 1234 AB',
        plateNumberClean: 'L1234AB',
        stockCode: 'STK-001',
      },
    }),

    // TOYOTA AVANZA 2
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#A02',
        publicName: 'Avanza 2021 Silver #A02',
        brand: 'Toyota',
        model: 'Avanza',
        year: 2021,
        color: 'Silver',
        transmission: 'Matic',
        km: 32000,
        price: BigInt(185000000),
        fuelType: 'Bensin',
        keyFeatures: ['Automatic Transmission', 'Camera Parkir', 'Sensor Parkir', 'Low KM'],
        conditionNotes: 'Pemakaian pribadi, terawat',
        photos: [
          '/uploads/cars/avanza-2021-silver-1.jpg',
          '/uploads/cars/avanza-2021-silver-2.jpg',
          '/uploads/cars/avanza-2021-silver-3.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Avanza matic tahun 2021, km rendah, pemakaian pribadi. Sangat terawat dan siap pakai.',
        status: 'available',
        slug: 'avanza-2021-silver-a02',
        plateNumber: 'L 5678 CD',
        plateNumberClean: 'L5678CD',
        stockCode: 'STK-002',
      },
    }),

    // TOYOTA INNOVA
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#A03',
        publicName: 'Innova 2019 Putih #A03',
        brand: 'Toyota',
        model: 'Innova Reborn',
        year: 2019,
        color: 'Putih',
        transmission: 'Matic',
        km: 58000,
        price: BigInt(285000000),
        fuelType: 'Diesel',
        keyFeatures: ['Diesel Engine', 'Irit BBM', 'Captain Seat', 'Full Original'],
        conditionNotes: 'Tangan pertama, istimewa',
        photos: [
          '/uploads/cars/innova-2019-putih-1.jpg',
          '/uploads/cars/innova-2019-putih-2.jpg',
          '/uploads/cars/innova-2019-putih-3.jpg',
          '/uploads/cars/innova-2019-putih-4.jpg',
          '/uploads/cars/innova-2019-putih-5.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Innova Reborn 2019 diesel matic, sangat irit dan nyaman. Tangan pertama dari baru.',
        status: 'available',
        slug: 'innova-2019-putih-a03',
        plateNumber: 'L 9012 EF',
        plateNumberClean: 'L9012EF',
        stockCode: 'STK-003',
      },
    }),

    // TOYOTA INNOVA 2
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#A04',
        publicName: 'Innova 2022 Abu-abu #A04',
        brand: 'Toyota',
        model: 'Innova Zenix',
        year: 2022,
        color: 'Abu-abu',
        transmission: 'Matic',
        km: 18000,
        price: BigInt(385000000),
        fuelType: 'Hybrid',
        keyFeatures: ['Hybrid Engine', 'Panoramic Roof', 'Kursi Elektrik', 'Layar 10 Inch'],
        conditionNotes: 'Seperti baru, garansi resmi masih berlaku',
        photos: [
          '/uploads/cars/innova-zenix-2022-1.jpg',
          '/uploads/cars/innova-zenix-2022-2.jpg',
          '/uploads/cars/innova-zenix-2022-3.jpg',
          '/uploads/cars/innova-zenix-2022-4.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Innova Zenix 2022 hybrid, teknologi terbaru dari Toyota. Km rendah, masih garansi resmi.',
        status: 'booking',
        slug: 'innova-zenix-2022-abu-a04',
        plateNumber: 'L 3456 GH',
        plateNumberClean: 'L3456GH',
        stockCode: 'STK-004',
      },
    }),

    // TOYOTA FORTUNER
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#A05',
        publicName: 'Fortuner 2020 Hitam #A05',
        brand: 'Toyota',
        model: 'Fortuner VRZ',
        year: 2020,
        color: 'Hitam',
        transmission: 'Matic',
        km: 42000,
        price: BigInt(475000000),
        fuelType: 'Diesel',
        keyFeatures: ['4x4', 'Sunroof', 'Leather Seat', 'Full Spec'],
        conditionNotes: 'Full modif, audio upgrade',
        photos: [
          '/uploads/cars/fortuner-2020-hitam-1.jpg',
          '/uploads/cars/fortuner-2020-hitam-2.jpg',
          '/uploads/cars/fortuner-2020-hitam-3.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Fortuner VRZ 2020 diesel 4x4, full spec dengan modifikasi tasteful. Sangat gagah dan tangguh.',
        status: 'available',
        slug: 'fortuner-2020-hitam-a05',
        plateNumber: 'L 7890 IJ',
        plateNumberClean: 'L7890IJ',
        stockCode: 'STK-005',
      },
    }),

    // HONDA BRIO
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#B01',
        publicName: 'Brio 2019 Merah #B01',
        brand: 'Honda',
        model: 'Brio Satya',
        year: 2019,
        color: 'Merah',
        transmission: 'Manual',
        km: 52000,
        price: BigInt(135000000),
        fuelType: 'Bensin',
        keyFeatures: ['Irit BBM', 'Cocok Pemula', 'AC Dingin', 'Ban Tebal'],
        conditionNotes: 'Ideal untuk mobil pertama',
        photos: [
          '/uploads/cars/brio-2019-merah-1.jpg',
          '/uploads/cars/brio-2019-merah-2.jpg',
          '/uploads/cars/brio-2019-merah-3.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Honda Brio 2019 manual, sangat irit dan cocok untuk pemula atau anak kuliahan.',
        status: 'available',
        slug: 'brio-2019-merah-b01',
        plateNumber: 'L 2345 KL',
        plateNumberClean: 'L2345KL',
        stockCode: 'STK-006',
      },
    }),

    // HONDA BRIO 2
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#B02',
        publicName: 'Brio 2021 Putih #B02',
        brand: 'Honda',
        model: 'Brio RS',
        year: 2021,
        color: 'Putih',
        transmission: 'Matic',
        km: 28000,
        price: BigInt(165000000),
        fuelType: 'Bensin',
        keyFeatures: ['CVT Transmission', 'Sporty Design', 'Touchscreen', 'Low KM'],
        conditionNotes: 'Pemakaian wanita, sangat bersih',
        photos: [
          '/uploads/cars/brio-rs-2021-putih-1.jpg',
          '/uploads/cars/brio-rs-2021-putih-2.jpg',
          '/uploads/cars/brio-rs-2021-putih-3.jpg',
          '/uploads/cars/brio-rs-2021-putih-4.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Brio RS 2021 matic CVT, sporty dan irit. Pemakaian sangat hati-hati, interior bersih.',
        status: 'available',
        slug: 'brio-rs-2021-putih-b02',
        plateNumber: 'L 6789 MN',
        plateNumberClean: 'L6789MN',
        stockCode: 'STK-007',
      },
    }),

    // HONDA HR-V
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#B03',
        publicName: 'HR-V 2018 Hitam #B03',
        brand: 'Honda',
        model: 'HR-V Prestige',
        year: 2018,
        color: 'Hitam',
        transmission: 'Matic',
        km: 65000,
        price: BigInt(285000000),
        fuelType: 'Bensin',
        keyFeatures: ['Sunroof', 'Leather Seat', 'Kamera 360', 'Full Variasi'],
        conditionNotes: 'Modifikasi audio dan velg',
        photos: [
          '/uploads/cars/hrv-2018-hitam-1.jpg',
          '/uploads/cars/hrv-2018-hitam-2.jpg',
          '/uploads/cars/hrv-2018-hitam-3.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'HR-V Prestige 2018 dengan sunroof, full modifikasi tasteful. SUV compact yang nyaman.',
        status: 'sold',
        slug: 'hrv-2018-hitam-b03',
        soldAt: new Date('2025-10-15'),
        plateNumber: 'L 1357 OP',
        plateNumberClean: 'L1357OP',
        stockCode: 'STK-008',
      },
    }),

    // HONDA HR-V 2
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#B04',
        publicName: 'HR-V 2022 Putih #B04',
        brand: 'Honda',
        model: 'HR-V SE',
        year: 2022,
        color: 'Putih',
        transmission: 'Matic',
        km: 22000,
        price: BigInt(385000000),
        fuelType: 'Bensin',
        keyFeatures: ['Honda Sensing', 'Turbo Engine', 'Panoramic Roof', 'Warranty'],
        conditionNotes: 'Seperti baru, garansi aktif',
        photos: [
          '/uploads/cars/hrv-2022-putih-1.jpg',
          '/uploads/cars/hrv-2022-putih-2.jpg',
          '/uploads/cars/hrv-2022-putih-3.jpg',
          '/uploads/cars/hrv-2022-putih-4.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'HR-V SE 2022 turbo dengan Honda Sensing, fitur safety terlengkap. Masih garansi resmi.',
        status: 'available',
        slug: 'hrv-2022-putih-b04',
        plateNumber: 'L 2468 QR',
        plateNumberClean: 'L2468QR',
        stockCode: 'STK-009',
      },
    }),

    // HONDA HR-V 3
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#B05',
        publicName: 'HR-V 2023 Abu-abu #B05',
        brand: 'Honda',
        model: 'HR-V RS',
        year: 2023,
        color: 'Abu-abu',
        transmission: 'Matic',
        km: 8000,
        price: BigInt(425000000),
        fuelType: 'Bensin',
        keyFeatures: ['Turbo', 'Panoramic Sunroof', 'Wireless Charger', 'ADAS'],
        conditionNotes: 'Baru pakai 8 bulan, seperti baru',
        photos: [
          '/uploads/cars/hrv-rs-2023-abu-1.jpg',
          '/uploads/cars/hrv-rs-2023-abu-2.jpg',
          '/uploads/cars/hrv-rs-2023-abu-3.jpg',
          '/uploads/cars/hrv-rs-2023-abu-4.jpg',
          '/uploads/cars/hrv-rs-2023-abu-5.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'HR-V RS 2023 model terbaru, km sangat rendah. Fitur lengkap dengan teknologi terkini.',
        status: 'booking',
        slug: 'hrv-rs-2023-abu-b05',
        plateNumber: 'L 3579 ST',
        plateNumberClean: 'L3579ST',
        stockCode: 'STK-010',
      },
    }),

    // DAIHATSU XENIA
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#C01',
        publicName: 'Xenia 2019 Silver #C01',
        brand: 'Daihatsu',
        model: 'Xenia R',
        year: 2019,
        color: 'Silver',
        transmission: 'Manual',
        km: 55000,
        price: BigInt(145000000),
        fuelType: 'Bensin',
        keyFeatures: ['7 Seater', 'Irit BBM', 'AC Double Blower', 'Audio Touchscreen'],
        conditionNotes: 'Mobil keluarga, terawat rutin',
        photos: [
          '/uploads/cars/xenia-2019-silver-1.jpg',
          '/uploads/cars/xenia-2019-silver-2.jpg',
          '/uploads/cars/xenia-2019-silver-3.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Xenia R 2019 manual, cocok untuk keluarga dengan budget terbatas. Irit dan lega.',
        status: 'available',
        slug: 'xenia-2019-silver-c01',
        plateNumber: 'L 4680 UV',
        plateNumberClean: 'L4680UV',
        stockCode: 'STK-011',
      },
    }),

    // DAIHATSU XENIA 2
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#C02',
        publicName: 'Xenia 2021 Hitam #C02',
        brand: 'Daihatsu',
        model: 'Xenia 1.5 R',
        year: 2021,
        color: 'Hitam',
        transmission: 'Matic',
        km: 35000,
        price: BigInt(175000000),
        fuelType: 'Bensin',
        keyFeatures: ['Automatic', '7 Seater', 'Velg Alloy', 'Fog Lamp'],
        conditionNotes: 'Pajak baru diperpanjang',
        photos: [
          '/uploads/cars/xenia-2021-hitam-1.jpg',
          '/uploads/cars/xenia-2021-hitam-2.jpg',
          '/uploads/cars/xenia-2021-hitam-3.jpg',
          '/uploads/cars/xenia-2021-hitam-4.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Xenia 2021 matic, nyaman untuk perjalanan jauh. Pajak baru perpanjang.',
        status: 'available',
        slug: 'xenia-2021-hitam-c02',
        plateNumber: 'L 5791 WX',
        plateNumberClean: 'L5791WX',
        stockCode: 'STK-012',
      },
    }),

    // DAIHATSU TERIOS
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#C03',
        publicName: 'Terios 2018 Putih #C03',
        brand: 'Daihatsu',
        model: 'Terios R',
        year: 2018,
        color: 'Putih',
        transmission: 'Manual',
        km: 72000,
        price: BigInt(165000000),
        fuelType: 'Bensin',
        keyFeatures: ['Ground Clearance Tinggi', 'Tangguh', 'AC Dingin', 'Audio Bagus'],
        conditionNotes: 'Cocok untuk medan berat',
        photos: [
          '/uploads/cars/terios-2018-putih-1.jpg',
          '/uploads/cars/terios-2018-putih-2.jpg',
          '/uploads/cars/terios-2018-putih-3.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Terios 2018 manual, tangguh untuk berbagai medan. Ground clearance tinggi.',
        status: 'available',
        slug: 'terios-2018-putih-c03',
        plateNumber: 'L 6802 YZ',
        plateNumberClean: 'L6802YZ',
        stockCode: 'STK-013',
      },
    }),

    // DAIHATSU TERIOS 2
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#C04',
        publicName: 'Terios 2020 Merah #C04',
        brand: 'Daihatsu',
        model: 'Terios X',
        year: 2020,
        color: 'Merah',
        transmission: 'Matic',
        km: 48000,
        price: BigInt(195000000),
        fuelType: 'Bensin',
        keyFeatures: ['Matic Responsif', 'Kamera Parkir', 'Velg Racing', 'Full Modif'],
        conditionNotes: 'Modifikasi tasteful',
        photos: [
          '/uploads/cars/terios-2020-merah-1.jpg',
          '/uploads/cars/terios-2020-merah-2.jpg',
          '/uploads/cars/terios-2020-merah-3.jpg',
          '/uploads/cars/terios-2020-merah-4.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Terios X 2020 matic merah, modifikasi full tapi tetap fungsional. Nyaman dan stylish.',
        status: 'available',
        slug: 'terios-2020-merah-c04',
        plateNumber: 'L 7913 AA',
        plateNumberClean: 'L7913AA',
        stockCode: 'STK-014',
      },
    }),

    // DAIHATSU TERIOS 3
    prisma.car.create({
      data: {
        tenantId: tenant.id,
        displayCode: '#C05',
        publicName: 'Terios 2022 Hitam #C05',
        brand: 'Daihatsu',
        model: 'Terios 1.5 X MT',
        year: 2022,
        color: 'Hitam',
        transmission: 'Manual',
        km: 25000,
        price: BigInt(215000000),
        fuelType: 'Bensin',
        keyFeatures: ['Low KM', 'Full Original', 'Service Record', 'Pajak Panjang'],
        conditionNotes: 'Seperti baru, sangat terawat',
        photos: [
          '/uploads/cars/terios-2022-hitam-1.jpg',
          '/uploads/cars/terios-2022-hitam-2.jpg',
          '/uploads/cars/terios-2022-hitam-3.jpg',
        ],
        primaryPhotoIndex: 0,
        description: 'Terios 2022 manual, km rendah dan sangat terawat. Service record lengkap dari awal.',
        status: 'available',
        slug: 'terios-2022-hitam-c05',
        plateNumber: 'L 8024 BB',
        plateNumberClean: 'L8024BB',
        stockCode: 'STK-015',
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
      carId: cars[0].id, // Avanza 2020 Hitam
      status: 'new',
      source: 'wa',
      tags: ['first-time-buyer'],
      notes: 'Tertarik dengan Avanza, butuh mobil keluarga',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654322',
      customerName: 'Pak Andi',
      carId: cars[2].id, // Innova 2019
      status: 'hot',
      source: 'wa',
      assignedToUserId: budi.id,
      tags: ['ready-to-buy', 'cash'],
      notes: 'Siap beli minggu ini, prefer cash. Follow up terus!',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654323',
      customerName: 'Dika',
      carId: cars[5].id, // Brio 2019
      status: 'warm',
      source: 'wa',
      assignedToUserId: ani.id,
      tags: ['student', 'budget-limited'],
      notes: 'Anak kuliah, cari mobil pertama yang irit',
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654324',
      customerName: 'Bu Nina',
      carId: cars[8].id, // HR-V 2022
      status: 'hot',
      source: 'web',
      assignedToUserId: budi.id,
      tags: ['credit', 'trade-in'],
      notes: 'Mau tukar tambah dari Jazz 2018, tertarik kredit',
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
        message: 'Halo, saya tertarik dengan Avanza hitam #A01',
        createdAt: new Date('2025-10-23T09:00:00'),
      },
      {
        tenantId: tenant.id,
        leadId: lead1.id,
        sender: 'bot',
        message: 'Halo Ibu Siti! 👋 Terima kasih sudah menghubungi Showroom Mobil Surabaya.\n\nAnda tertarik dengan *Avanza 2020 Hitam #A01*\n💰 Harga: Rp 165.000.000\n🚗 Transmisi: Manual\n📊 KM: 45.000\n\nApakah Ibu ingin:\n1️⃣ Lihat detail & foto lengkap\n2️⃣ Jadwalkan test drive\n3️⃣ Tanya spesifikasi\n4️⃣ Bicara dengan sales',
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
        message: 'Innova diesel yang putih masih ada?',
        createdAt: new Date('2025-10-22T14:30:00'),
      },
      {
        tenantId: tenant.id,
        leadId: lead2.id,
        sender: 'bot',
        message: 'Masih ada Pak! *Innova Reborn 2019 Putih #A03*\n💰 Rp 285.000.000\n⚙️ Diesel Matic\n📊 58.000 km\n✨ Tangan pertama\n\nBapak berminat cash atau kredit?',
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
        message: 'Pak, ada mobil second yang bagus untuk pemula budget 150jt?',
        createdAt: new Date('2025-10-21T16:00:00'),
      },
      {
        tenantId: tenant.id,
        leadId: lead3.id,
        sender: 'bot',
        message: 'Halo Dika! Ada beberapa pilihan bagus untuk budget 150jt:\n\n1️⃣ *Brio 2019 Merah #B01* - Rp 135jt (Manual)\n2️⃣ *Xenia 2019 Silver #C01* - Rp 145jt (Manual)\n\nKeduanya irit BBM dan cocok untuk pemula. Lebih prefer yang mana?',
        createdAt: new Date('2025-10-21T16:00:05'),
      },
      {
        tenantId: tenant.id,
        leadId: lead3.id,
        sender: 'customer',
        message: 'Brio aja pak, lebih kecil. Konsumsi BBM berapa?',
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
  console.log(`✅ 15 Cars: 12 available, 2 booking, 1 sold`);
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
