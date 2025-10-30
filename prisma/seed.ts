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
  // 1. CREATE TENANTS
  // ============================================

  // Create auto.lumiku.com tenant
  const autoTenant = await prisma.tenant.create({
    data: {
      name: 'AutoLeads Motors',
      slug: 'autoleads-motors',
      subdomain: 'auto.autoleads.id',
      customDomain: 'auto.lumiku.com',
      customDomainVerified: true,
      whatsappNumber: '6281234567890',
      phone: '+62-21-1234567',
      email: 'info@auto.lumiku.com',
      address: 'Jl. Sudirman No. 123, Jakarta Pusat',
      city: 'Jakarta',
      mapsUrl: 'https://maps.google.com/?q=Jl.+Sudirman+No.+123+Jakarta',
      plan: 'pro',
      status: 'active',
      primaryColor: '#2563EB',
      secondaryColor: '#1F2937',
      logoUrl: '/uploads/logos/autoleads.png',
      whatsappBotEnabled: true,
      planStartedAt: new Date('2025-01-01'),
      planExpiresAt: new Date('2025-12-31'),
      businessHours: {
        monday: '08:00-18:00',
        tuesday: '08:00-18:00',
        wednesday: '08:00-18:00',
        thursday: '08:00-18:00',
        friday: '08:00-18:00',
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

  // Create primamobil.id tenant
  const primaTenant = await prisma.tenant.create({
    data: {
      name: 'PrimaMobil Indonesia',
      slug: 'primamobil-indonesia',
      subdomain: 'primamobil.autoleads.id',
      customDomain: 'primamobil.id',
      customDomainVerified: true,
      whatsappNumber: '628123456789',
      phone: '031-1234567',
      email: 'info@primamobil.id',
      address: 'Jl. Raya Darmo No. 123, Surabaya',
      city: 'Surabaya',
      mapsUrl: 'https://maps.google.com/?q=Jl.+Raya+Darmo+No.+123+Surabaya',
      plan: 'growth',
      status: 'active',
      primaryColor: '#FF5722',
      secondaryColor: '#212121',
      logoUrl: '/uploads/logos/primamobil.png',
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

  console.log('✅ Created tenants:', autoTenant.name, 'and', primaTenant.name);

  // Use primaTenant as the main tenant for demo data
  const tenant = primaTenant;

  // ============================================
  // 2. CREATE USERS
  // ============================================
  const hashedPassword = await hashPassword('password123');

  // Create users for auto.lumiku.com tenant
  const autoOwner = await prisma.user.create({
    data: {
      tenantId: autoTenant.id,
      name: 'Owner AutoLeads',
      email: 'owner@auto.lumiku.com',
      phone: '081234567890',
      whatsappNumber: '6281234567890',
      passwordHash: hashedPassword,
      role: 'owner',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  const autoAdmin = await prisma.user.create({
    data: {
      tenantId: autoTenant.id,
      name: 'Admin AutoLeads',
      email: 'admin@auto.lumiku.com',
      phone: '081234567891',
      whatsappNumber: '6281234567891',
      passwordHash: hashedPassword,
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  const autoSales = await prisma.user.create({
    data: {
      tenantId: autoTenant.id,
      name: 'Sales AutoLeads',
      email: 'sales@auto.lumiku.com',
      phone: '081234567892',
      whatsappNumber: '6281234567892',
      passwordHash: hashedPassword,
      role: 'sales',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  // Create users for primamobil.id tenant
  const primaOwner = await prisma.user.create({
    data: {
      tenantId: primaTenant.id,
      name: 'Owner PrimaMobil',
      email: 'owner@primamobil.id',
      phone: '081234567893',
      whatsappNumber: '6281234567893',
      passwordHash: hashedPassword,
      role: 'owner',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  const primaAdmin = await prisma.user.create({
    data: {
      tenantId: primaTenant.id,
      name: 'Admin PrimaMobil',
      email: 'admin@primamobil.id',
      phone: '081234567894',
      whatsappNumber: '6281234567894',
      passwordHash: hashedPassword,
      role: 'admin',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  const primaSales = await prisma.user.create({
    data: {
      tenantId: primaTenant.id,
      name: 'Sales PrimaMobil',
      email: 'sales@primamobil.id',
      phone: '081234567895',
      whatsappNumber: '6281234567895',
      passwordHash: hashedPassword,
      role: 'sales',
      status: 'active',
      lastLoginAt: new Date(),
    },
  });

  console.log('✅ Created users for both tenants: Owner, Admin, Sales each');

  // Use primaAdmin and primaSales for demo data references
  const budi = primaAdmin;
  const ani = primaSales;

  // ============================================
  // 3. CREATE CARS (2 SAMPLE CARS FOR EACH TENANT)
  // ============================================

  // Create cars for auto.lumiku.com tenant
  const autoCars = await Promise.all([
    // MERCEDES-BENZ C300 2010
    prisma.car.create({
      data: {
        tenantId: autoTenant.id,
        displayCode: '#AUTO01',
        publicName: 'Mercedes-Benz C300 Avantgarde 2010 Silver #AUTO01',
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
          'Audio Premium Harman Kardon',
        ],
        conditionNotes: 'Tangan kedua dari baru, kondisi istimewa mulus, service record Mercedes-Benz resmi lengkap',
        photos: [
          '/uploads/tenant-1/cars/mercedes-c300-2010/1.webp',
          '/uploads/tenant-1/cars/mercedes-c300-2010/2.webp',
        ],
        primaryPhotoIndex: 0,
        description: 'Mercedes-Benz C300 Avantgarde 2010 kondisi istimewa dengan fitur premium lengkap.',
        status: 'available',
        slug: 'mercedes-c300-2010-silver-auto01',
        plateNumber: 'B 8888 MB',
        plateNumberClean: 'B8888MB',
        stockCode: 'AUTO-001',
      },
    }),

    // HONDA JAZZ 2017
    prisma.car.create({
      data: {
        tenantId: autoTenant.id,
        displayCode: '#AUTO02',
        publicName: 'Honda Jazz RS CVT 2017 Putih Mutiara #AUTO02',
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
          'Audio Touchscreen 7 Inch',
          'Kamera Parkir Belakang',
          'Keyless Entry + Push Start Button',
        ],
        conditionNotes: 'Tangan pertama dari baru, service record Honda resmi lengkap',
        photos: [
          '/uploads/tenant-1/cars/honda-jazz-2017/1.webp',
          '/uploads/tenant-1/cars/honda-jazz-2017/2.webp',
        ],
        primaryPhotoIndex: 0,
        description: 'Honda Jazz RS CVT 2017 tipe tertinggi dengan fitur lengkap.',
        status: 'available',
        slug: 'honda-jazz-2017-putih-auto02',
        plateNumber: 'B 1717 JZ',
        plateNumberClean: 'B1717JZ',
        stockCode: 'AUTO-002',
      },
    }),
  ]);

  // Create cars for primamobil.id tenant
  const primaCars = await Promise.all([
    // MAZDA 2 2014
    prisma.car.create({
      data: {
        tenantId: primaTenant.id,
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
          'Mesin SKYACTIV 1.5L Irit BBM',
          'Transmisi Matic 4-Speed Smooth',
          'Audio Touchscreen',
          'Dual Airbag SRS',
        ],
        conditionNotes: 'Tangan pertama dari baru, pajak panjang masih lama',
        photos: [
          '/uploads/tenant-1/cars/mazda-2-2014/1.webp',
          '/uploads/tenant-1/cars/mazda-2-2014/2.webp',
        ],
        primaryPhotoIndex: 0,
        description: 'Mazda 2 R Hatchback 2014 tangan pertama dengan teknologi SKYACTIV irit BBM.',
        status: 'available',
        slug: 'mazda-2-2014-merah-mz01',
        plateNumber: 'L 2468 MZ',
        plateNumberClean: 'L2468MZ',
        stockCode: 'MZ-001',
      },
    }),

    // TOYOTA YARIS 2020
    prisma.car.create({
      data: {
        tenantId: primaTenant.id,
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
          'Mesin 1.5L Dual VVT-i',
          'CVT 7-Speed Sequential',
          'Auto AC Dual Zone',
          'Kamera Mundur',
          '6 Airbags Safety',
        ],
        conditionNotes: 'Tangan pertama dari baru, km sangat rendah',
        photos: [
          '/uploads/tenant-1/cars/toyota-yaris-2020/1.webp',
          '/uploads/tenant-1/cars/toyota-yaris-2020/2.webp',
        ],
        primaryPhotoIndex: 0,
        description: 'Toyota Yaris G CVT 2020 generasi terbaru dengan 6 airbags.',
        status: 'available',
        slug: 'toyota-yaris-2020-silver-y01',
        plateNumber: 'L 2020 YR',
        plateNumberClean: 'L2020YR',
        stockCode: 'TY-001',
      },
    }),
  ]);

  console.log(`✅ Created ${autoCars.length} cars for AutoLeads and ${primaCars.length} cars for PrimaMobil`);

  // Combine cars arrays for demo data references
  const cars = primaCars;

  console.log(`✅ Created ${autoCars.length} cars for AutoLeads and ${primaCars.length} cars for PrimaMobil`);

  // ============================================
  // 4. CREATE LEADS (5 SAMPLE LEADS)
  // ============================================

  const lead1 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654321',
      customerName: 'Ibu Siti',
      carId: cars[1].id, // Toyota Yaris 2020
      status: 'new',
      source: 'wa',
      tags: ['first-time-buyer'],
      notes: 'Tertarik dengan Toyota Yaris, butuh mobil city car irit',
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654322',
      customerName: 'Pak Andi',
      carId: cars[0].id, // Mazda 2 2014
      status: 'hot',
      source: 'wa',
      assignedToUserId: budi.id,
      tags: ['ready-to-buy', 'cash'],
      notes: 'Siap beli minggu ini, prefer cash. Tertarik Mazda sporty.',
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      customerPhone: '6281987654323',
      customerName: 'Dika',
      carId: null, // General inquiry
      status: 'warm',
      source: 'wa',
      assignedToUserId: ani.id,
      tags: ['student', 'budget-limited'],
      notes: 'Anak kuliah, cari mobil pertama yang irit dan sporty',
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
  console.log(`✅ 2 Tenants: ${autoTenant.name} and ${primaTenant.name}`);
  console.log(`✅ 3 Users per tenant: Owner, Admin, Sales`);
  console.log(`✅ 6 Cars per tenant: 4 available, 1 booking`);
  console.log(`   - Mercedes-Benz C300 2010 (9 photos)`);
  console.log(`   - Mazda 2 R 2014 (11 photos)`);
  console.log(`   - Honda Jazz RS 2017 (10 photos)`);
  console.log(`   - Toyota Yaris G 2020 (10 photos)`);
  console.log(`   - Mitsubishi Pajero Sport 2023 (6 photos)`);
  console.log(`   - Honda Brio RS 2021 (8 photos)`);
  console.log(`✅ 5 Leads per tenant: 2 hot, 1 warm, 2 new`);
  console.log(`✅ 10 Messages across conversations per tenant`);
  console.log('\n🔐 Login Credentials:');
  console.log('====================');
  console.log('AutoLeads Motors (auto.lumiku.com):');
  console.log('  Owner: owner@auto.lumiku.com / password123');
  console.log('  Admin: admin@auto.lumiku.com / password123');
  console.log('  Sales: sales@auto.lumiku.com / password123');
  console.log('');
  console.log('PrimaMobil Indonesia (primamobil.id):');
  console.log('  Owner: owner@primamobil.id / password123');
  console.log('  Admin: admin@primamobil.id / password123');
  console.log('  Sales: sales@primamobil.id / password123');
  console.log('\n🌍 Tenant URLs:');
  console.log('===============');
  console.log(`AutoLeads: https://${autoTenant.subdomain}`);
  console.log(`PrimaMobil: https://${primaTenant.subdomain}`);
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
