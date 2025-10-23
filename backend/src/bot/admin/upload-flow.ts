/**
 * Upload Flow State Machine
 * Multi-step flow for uploading cars via WhatsApp
 */

import { PrismaClient } from '../../../../generated/prisma';
import { StateManager, ConversationContext } from '../state-manager';
import { CarParser } from './parser';
import { DisplayCodeGenerator } from './display-code-generator';
import { MediaDownloader } from '../../whatsapp/media-downloader';

export class UploadFlow {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private parser: CarParser;
  private codeGenerator: DisplayCodeGenerator;
  private mediaDownloader: MediaDownloader;

  private readonly STEPS = [
    'brand_model',      // 0: Brand & model
    'year_color',       // 1: Year & color
    'transmission_km',  // 2: Transmission & KM
    'price',            // 3: Price
    'plate',            // 4: Plate number (optional)
    'features',         // 5: Key features (optional)
    'photos',           // 6: Photos
    'confirm'           // 7: Confirmation
  ];

  constructor(prisma: PrismaClient, stateManager: StateManager) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.parser = new CarParser();
    this.codeGenerator = new DisplayCodeGenerator(prisma);
    this.mediaDownloader = new MediaDownloader();
  }

  /**
   * Start upload flow
   */
  async start(tenant: any, userPhone: string): Promise<string> {
    await this.stateManager.startFlow(tenant.id, userPhone, 'upload_car', {
      carData: {}
    });

    return `🚗 *Upload Mobil Baru*

Baik, saya akan bantu upload mobil baru. Proses ini sekitar 2 menit.

*Step 1/8: Brand & Model*
Contoh: Toyota Avanza 1.3 G

Ketik brand dan model mobil:`;
  }

  /**
   * Process current step
   */
  async processStep(
    tenant: any,
    userPhone: string,
    message: string,
    media?: { url: string; type: string }
  ): Promise<string> {
    const state = await this.stateManager.getState(tenant.id, userPhone, 'admin');
    const currentStep = this.STEPS[state.currentStep];

    // Handle cancel
    if (message.toLowerCase().trim() === '/cancel') {
      await this.stateManager.resetState(tenant.id, userPhone);
      return '❌ Upload dibatalkan.';
    }

    // Handle skip
    const isSkip = message.toLowerCase().trim() === 'skip' || message.toLowerCase().trim() === '-';

    switch (currentStep) {
      case 'brand_model':
        return await this.handleBrandModel(tenant, userPhone, message, state.context);

      case 'year_color':
        return await this.handleYearColor(tenant, userPhone, message, state.context);

      case 'transmission_km':
        return await this.handleTransmissionKm(tenant, userPhone, message, state.context);

      case 'price':
        return await this.handlePrice(tenant, userPhone, message, state.context);

      case 'plate':
        return await this.handlePlate(tenant, userPhone, message, state.context, isSkip);

      case 'features':
        return await this.handleFeatures(tenant, userPhone, message, state.context, isSkip);

      case 'photos':
        return await this.handlePhotos(tenant, userPhone, message, media, state.context, isSkip);

      case 'confirm':
        return await this.handleConfirm(tenant, userPhone, message, state.context);

      default:
        return 'Error: Invalid step';
    }
  }

  /**
   * Step 1: Brand & Model
   */
  private async handleBrandModel(
    tenant: any,
    userPhone: string,
    message: string,
    context: ConversationContext
  ): Promise<string> {
    const parsed = this.parser.parseBrandModel(message);

    if (!parsed.brand || !parsed.model) {
      return '❌ Format tidak valid. Contoh yang benar:\n• Toyota Avanza 1.3 G\n• Honda BR-V Prestige\n\nCoba lagi:';
    }

    await this.stateManager.nextStep(tenant.id, userPhone, {
      carData: {
        ...context.carData,
        brand: parsed.brand,
        model: parsed.model
      }
    });

    return `✅ Brand: ${parsed.brand}, Model: ${parsed.model}

*Step 2/8: Tahun & Warna*
Contoh: 2020 Hitam Metalik

Ketik tahun dan warna:`;
  }

  /**
   * Step 2: Year & Color
   */
  private async handleYearColor(
    tenant: any,
    userPhone: string,
    message: string,
    context: ConversationContext
  ): Promise<string> {
    const parsed = this.parser.parseYearColor(message);

    if (!parsed.year || !parsed.color) {
      return '❌ Format tidak valid. Contoh yang benar:\n• 2020 Hitam Metalik\n• 2019 Putih\n\nCoba lagi:';
    }

    await this.stateManager.nextStep(tenant.id, userPhone, {
      carData: {
        ...context.carData,
        year: parsed.year,
        color: parsed.color
      }
    });

    return `✅ Tahun: ${parsed.year}, Warna: ${parsed.color}

*Step 3/8: Transmisi & KM*
Contoh: Manual 45000

Ketik transmisi (Manual/Matic) dan kilometer:`;
  }

  /**
   * Step 3: Transmission & KM
   */
  private async handleTransmissionKm(
    tenant: any,
    userPhone: string,
    message: string,
    context: ConversationContext
  ): Promise<string> {
    const parsed = this.parser.parseTransmissionKm(message);

    if (!parsed.transmission || !parsed.km) {
      return '❌ Format tidak valid. Contoh yang benar:\n• Manual 45000\n• Matic 30000\n\nCoba lagi:';
    }

    await this.stateManager.nextStep(tenant.id, userPhone, {
      carData: {
        ...context.carData,
        transmission: parsed.transmission,
        km: parsed.km
      }
    });

    return `✅ Transmisi: ${parsed.transmission}, KM: ${parsed.km.toLocaleString()}

*Step 4/8: Harga*
Contoh: 185000000 atau 185jt

Ketik harga jual:`;
  }

  /**
   * Step 4: Price
   */
  private async handlePrice(
    tenant: any,
    userPhone: string,
    message: string,
    context: ConversationContext
  ): Promise<string> {
    const parsed = this.parser.parsePrice(message);

    if (!parsed.price) {
      return '❌ Format tidak valid. Contoh yang benar:\n• 185000000\n• 185jt\n• 185000000\n\nCoba lagi:';
    }

    await this.stateManager.nextStep(tenant.id, userPhone, {
      carData: {
        ...context.carData,
        price: BigInt(parsed.price)
      }
    });

    return `✅ Harga: Rp ${(parsed.price / 1000000).toFixed(0)} juta

*Step 5/8: Plat Nomor (Opsional)*
Contoh: B 1234 XYZ

Ketik plat nomor atau "skip" untuk lewati:`;
  }

  /**
   * Step 5: Plate Number
   */
  private async handlePlate(
    tenant: any,
    userPhone: string,
    message: string,
    context: ConversationContext,
    isSkip: boolean
  ): Promise<string> {
    let plateNumber: string | undefined;
    let plateNumberClean: string | undefined;

    if (!isSkip) {
      const parsed = this.parser.parsePlateNumber(message);
      if (parsed.plateNumber) {
        plateNumber = parsed.plateNumber;
        plateNumberClean = parsed.plateNumberClean;
      }
    }

    await this.stateManager.nextStep(tenant.id, userPhone, {
      carData: {
        ...context.carData,
        plateNumber,
        plateNumberClean
      }
    });

    return `${plateNumber ? `✅ Plat: ${plateNumber}` : '⏭️ Plat dilewati'}

*Step 6/8: Fitur Unggulan (Opsional)*
Contoh: Velg racing, Spoiler, Interior rapi

Ketik fitur-fitur unggulan (pisahkan dengan koma) atau "skip":`;
  }

  /**
   * Step 6: Features
   */
  private async handleFeatures(
    tenant: any,
    userPhone: string,
    message: string,
    context: ConversationContext,
    isSkip: boolean
  ): Promise<string> {
    let keyFeatures: string[] = [];

    if (!isSkip) {
      keyFeatures = this.parser.parseFeatures(message);
    }

    await this.stateManager.nextStep(tenant.id, userPhone, {
      carData: {
        ...context.carData,
        keyFeatures
      }
    });

    return `${keyFeatures.length > 0 ? `✅ Fitur: ${keyFeatures.join(', ')}` : '⏭️ Fitur dilewati'}

*Step 7/8: Foto Mobil*

Kirim foto mobil (minimal 1, maksimal 10).
Setelah semua foto terkirim, ketik "selesai".

Atau ketik "skip" untuk upload foto nanti.`;
  }

  /**
   * Step 7: Photos
   */
  private async handlePhotos(
    tenant: any,
    userPhone: string,
    message: string,
    media: { url: string; type: string } | undefined,
    context: ConversationContext,
    isSkip: boolean
  ): Promise<string> {
    const existingPhotos = context.carData?.photos || [];

    // Handle skip
    if (isSkip) {
      await this.stateManager.nextStep(tenant.id, userPhone, {
        carData: {
          ...context.carData,
          photos: []
        }
      });

      return await this.buildConfirmation(tenant, { ...context.carData, photos: [] });
    }

    // Handle "selesai"
    if (message.toLowerCase().trim() === 'selesai') {
      if (existingPhotos.length === 0) {
        return '❌ Belum ada foto. Kirim minimal 1 foto atau ketik "skip" untuk upload nanti.';
      }

      await this.stateManager.nextStep(tenant.id, userPhone, {
        carData: {
          ...context.carData,
          photos: existingPhotos
        }
      });

      return await this.buildConfirmation(tenant, { ...context.carData, photos: existingPhotos });
    }

    // Handle photo
    if (media && media.type === 'image') {
      // Download and save photo
      const photoUrl = await this.mediaDownloader.downloadAndSave(
        media.url,
        tenant.id,
        `car-${Date.now()}.jpg`
      );

      const updatedPhotos = [...existingPhotos, photoUrl];

      await this.stateManager.updateState(tenant.id, userPhone, {
        context: {
          ...context,
          carData: {
            ...context.carData,
            photos: updatedPhotos
          }
        }
      });

      return `✅ Foto ${updatedPhotos.length} diterima!

Total foto: ${updatedPhotos.length}/10

Kirim foto lagi atau ketik "selesai" jika sudah cukup.`;
    }

    return '❌ Kirim foto atau ketik "selesai" atau "skip".';
  }

  /**
   * Step 8: Confirm
   */
  private async handleConfirm(
    tenant: any,
    userPhone: string,
    message: string,
    context: ConversationContext
  ): Promise<string> {
    const normalized = message.toLowerCase().trim();

    if (normalized === 'ya' || normalized === 'yes' || normalized === 'y') {
      return await this.saveCar(tenant, userPhone, context);
    } else if (normalized === 'tidak' || normalized === 'no' || normalized === 'n') {
      await this.stateManager.resetState(tenant.id, userPhone);
      return '❌ Upload dibatalkan. Ketik /upload untuk mulai lagi.';
    }

    return '❌ Ketik "ya" untuk konfirmasi atau "tidak" untuk batal.';
  }

  /**
   * Build confirmation message
   */
  private async buildConfirmation(tenant: any, carData: any): Promise<string> {
    let response = `*Step 8/8: Konfirmasi*\n\n`;
    response += `📋 *Data Mobil:*\n`;
    response += `• Brand: ${carData.brand}\n`;
    response += `• Model: ${carData.model}\n`;
    response += `• Tahun: ${carData.year}\n`;
    response += `• Warna: ${carData.color}\n`;
    response += `• Transmisi: ${carData.transmission}\n`;
    response += `• KM: ${carData.km?.toLocaleString()}\n`;
    response += `• Harga: Rp ${carData.price ? (Number(carData.price) / 1000000).toFixed(0) : '0'} juta\n`;

    if (carData.plateNumber) {
      response += `• Plat: ${carData.plateNumber}\n`;
    }

    if (carData.keyFeatures && carData.keyFeatures.length > 0) {
      response += `• Fitur: ${carData.keyFeatures.join(', ')}\n`;
    }

    response += `• Foto: ${carData.photos?.length || 0} foto\n\n`;

    response += `Apakah data sudah benar?\nKetik "ya" untuk simpan atau "tidak" untuk batal.`;

    return response;
  }

  /**
   * Save car to database
   */
  private async saveCar(
    tenant: any,
    userPhone: string,
    context: ConversationContext
  ): Promise<string> {
    try {
      const carData = context.carData!;

      // Generate display code
      const displayCode = await this.codeGenerator.generateCode(
        tenant.id,
        carData.brand!,
        carData.model!
      );

      // Generate public name
      const publicName = `${carData.brand} ${carData.model} ${carData.year} ${carData.color} ${displayCode}`;

      // Generate slug
      const slug = `${carData.brand}-${carData.model}-${carData.year}-${carData.color}-${displayCode}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Create car
      const car = await this.prisma.car.create({
        data: {
          tenantId: tenant.id,
          plateNumber: carData.plateNumber,
          plateNumberClean: carData.plateNumberClean,
          displayCode,
          publicName,
          brand: carData.brand!,
          model: carData.model!,
          year: carData.year!,
          color: carData.color!,
          transmission: carData.transmission!,
          km: carData.km!,
          price: carData.price!,
          keyFeatures: carData.keyFeatures || [],
          photos: carData.photos || [],
          status: 'available',
          slug
        }
      });

      // Reset state
      await this.stateManager.resetState(tenant.id, userPhone);

      return `✅ *Mobil berhasil diupload!*

📋 Kode: ${displayCode}
🔗 URL: ${tenant.subdomain}/cars/${slug}

Mobil sudah LIVE di website dan siap dilihat customer! 🚀

Ketik /list untuk lihat semua mobil atau /upload untuk upload lagi.`;

    } catch (error) {
      console.error('Error saving car:', error);
      return '❌ Gagal menyimpan mobil. Silakan coba lagi atau hubungi admin.';
    }
  }
}
