/**
 * Upload Flow V2 - Simplified 2-Step Flow
 * Step 1: Parse all data from single message
 * Step 2: Collect photos
 * AI Enhancement: Auto-generate copywriting
 */

import { PrismaClient } from '../../../../generated/prisma';
import { StateManager, ConversationContext } from '../state-manager';
import { CarParser } from './parser';
import { DisplayCodeGenerator } from './display-code-generator';
import { MediaDownloader } from '../../whatsapp/media-downloader';
import { ZaiClient } from '../../llm/zai';

export class UploadFlowV2 {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private parser: CarParser;
  private codeGenerator: DisplayCodeGenerator;
  private mediaDownloader: MediaDownloader;
  private zaiClient: ZaiClient;

  private readonly STEPS = [
    'photos',      // 0: Collect photos
    'confirm'      // 1: Confirmation
  ];

  constructor(prisma: PrismaClient, stateManager: StateManager) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.parser = new CarParser();
    this.codeGenerator = new DisplayCodeGenerator(prisma);
    this.mediaDownloader = new MediaDownloader();
    this.zaiClient = new ZaiClient();
  }

  /**
   * Start upload flow with data parsing
   * Example: "/upload mobil jazz 2020 type R harga 187jt km 88000 velg racing tangan pertama"
   */
  async start(tenant: any, userPhone: string, message: string): Promise<string> {
    // Parse all car data from message
    const carData = this.parser.parseAllInOne(message);

    console.log('[UPLOAD V2] Parsed car data:', carData);

    // Validate required fields
    if (!carData.brand || !carData.year || !carData.price) {
      return `❌ Data tidak lengkap. Format yang benar:

/upload [brand] [model] [tahun] harga [harga] km [km] [fitur]

Contoh:
/upload Toyota Avanza 2020 harga 185jt km 45000 velg racing tangan pertama
/upload Honda Jazz 2019 type R harga 187jt km 88000 service record

Minimal harus ada: brand, tahun, dan harga.`;
    }

    // Start flow with parsed data
    await this.stateManager.startFlow(tenant.id, userPhone, 'upload_car_v2', {
      carData: carData
    });

    // Show parsed data and ask for photos
    let response = `✅ *Data Mobil Berhasil Diparsing!*\n\n`;
    response += `📋 *Informasi Mobil:*\n`;
    response += `• Brand: ${carData.brand}\n`;
    response += `• Model: ${carData.model || '-'}\n`;
    response += `• Tahun: ${carData.year}\n`;
    response += `• Warna: ${carData.color || 'Silver'}\n`;
    response += `• Transmisi: ${carData.transmission || 'Manual'}\n`;

    if (carData.km) {
      response += `• KM: ${carData.km.toLocaleString()}\n`;
    }
    response += `• Harga: Rp ${(carData.price! / 1000000).toFixed(0)} juta\n`;

    if (carData.keyFeatures && carData.keyFeatures.length > 0) {
      response += `• Fitur: ${carData.keyFeatures.join(', ')}\n`;
    }

    if (carData.notes) {
      response += `• Catatan: ${carData.notes}\n`;
    }

    response += `\n📸 *Langkah Selanjutnya:*\n`;
    response += `Kirim foto mobil (1-10 foto).\n`;
    response += `Setelah semua foto terkirim, ketik *"selesai"* untuk lanjut.\n\n`;
    response += `Atau ketik *"skip"* jika tidak ada foto (dapat ditambah nanti).`;

    return response;
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
      return '❌ Upload dibatalkan. Ketik /upload untuk mulai lagi.';
    }

    switch (currentStep) {
      case 'photos':
        return await this.handlePhotos(tenant, userPhone, message, media, state.context);

      case 'confirm':
        return await this.handleConfirm(tenant, userPhone, message, state.context);

      default:
        return 'Error: Invalid step';
    }
  }

  /**
   * Handle photos collection
   */
  private async handlePhotos(
    tenant: any,
    userPhone: string,
    message: string,
    media: { url: string; type: string } | undefined,
    context: ConversationContext
  ): Promise<string> {
    const existingPhotos = context.carData?.photos || [];

    // Handle skip
    if (message.toLowerCase().trim() === 'skip' || message.toLowerCase().trim() === '-') {
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
        return '❌ Belum ada foto. Kirim minimal 1 foto atau ketik *"skip"* untuk upload tanpa foto.';
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
      try {
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

📸 Total foto: ${updatedPhotos.length}/10

Kirim foto lagi atau ketik *"selesai"* untuk lanjut ke konfirmasi.`;
      } catch (error) {
        console.error('[UPLOAD V2] Error downloading photo:', error);
        return `⚠️ Gagal mengunduh foto. Silakan coba kirim lagi atau ketik *"skip"* untuk lanjut tanpa foto.`;
      }
    }

    return '❌ Kirim foto atau ketik *"selesai"* untuk lanjut, atau *"skip"* untuk lewati.';
  }

  /**
   * Handle confirmation
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

    return '❌ Ketik *"ya"* untuk konfirmasi atau *"tidak"* untuk batal.';
  }

  /**
   * Build confirmation message with AI-enhanced copy
   */
  private async buildConfirmation(tenant: any, carData: any): Promise<string> {
    console.log('[UPLOAD V2] Building confirmation with AI enhancement...');

    // Generate AI-enhanced description
    const enhancedData = await this.generateEnhancedCopy(carData);

    let response = `🤖 *AI Sedang Membuat Copywriting...*\n\n`;
    response += `⏳ Tunggu sebentar...\n\n`;

    // Build preview
    response += `📋 *Preview Data Mobil:*\n\n`;
    response += `*${enhancedData.publicName}*\n\n`;

    response += `💰 Harga: Rp ${(carData.price ? Number(carData.price) / 1000000 : 0).toFixed(0)} juta\n\n`;

    response += `📝 *Deskripsi:*\n${enhancedData.description}\n\n`;

    if (enhancedData.conditionNotes) {
      response += `✨ *Kondisi:*\n${enhancedData.conditionNotes}\n\n`;
    }

    response += `📊 *Spesifikasi:*\n`;
    response += `• Brand: ${carData.brand}\n`;
    response += `• Model: ${carData.model || '-'}\n`;
    response += `• Tahun: ${carData.year}\n`;
    response += `• Warna: ${carData.color || 'Silver'}\n`;
    response += `• Transmisi: ${carData.transmission || 'Manual'}\n`;

    if (carData.km) {
      response += `• KM: ${carData.km.toLocaleString()}\n`;
    }

    if (carData.keyFeatures && carData.keyFeatures.length > 0) {
      response += `\n🎯 *Fitur Unggulan:*\n`;
      carData.keyFeatures.forEach((f: string) => response += `• ${f}\n`);
    }

    response += `\n📸 Foto: ${carData.photos?.length || 0} foto\n\n`;

    response += `Apakah data sudah benar?\nKetik *"ya"* untuk upload atau *"tidak"* untuk batal.`;

    // Store enhanced data in context for saving
    await this.stateManager.updateState(tenant.id, carData.userPhone || '', {
      context: {
        carData: {
          ...carData,
          ...enhancedData
        }
      }
    });

    return response;
  }

  /**
   * Generate AI-enhanced copywriting
   */
  private async generateEnhancedCopy(carData: any): Promise<{
    publicName: string;
    description: string;
    conditionNotes?: string;
  }> {
    try {
      const prompt = `Kamu adalah copywriter profesional untuk showroom mobil bekas berkualitas.

Data mobil:
- Brand: ${carData.brand}
- Model: ${carData.model || ''}
- Tahun: ${carData.year}
- Warna: ${carData.color || 'Silver'}
- Transmisi: ${carData.transmission || 'Manual'}
- KM: ${carData.km ? carData.km.toLocaleString() : 'N/A'}
- Harga: Rp ${carData.price ? (Number(carData.price) / 1000000).toFixed(0) : 0} juta
- Fitur: ${carData.keyFeatures ? carData.keyFeatures.join(', ') : 'Standard'}
- Catatan: ${carData.notes || 'N/A'}

Buatkan:
1. Public name (format: Brand Model Tahun Warna + kode akan ditambah otomatis)
2. Description (2-3 kalimat menarik, highlight value proposition, target buyer yang tepat)
3. Condition notes (1-2 kalimat tentang kondisi, kelengkapan, keunggulan kondisi mobil)

Format response JSON:
{
  "publicName": "...",
  "description": "...",
  "conditionNotes": "..."
}

Gunakan bahasa Indonesia yang natural dan menarik. Fokus pada benefit untuk pembeli.`;

      const response = await this.zaiClient.generate(prompt);

      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhancedData = JSON.parse(jsonMatch[0]);
        console.log('[UPLOAD V2] AI-enhanced data:', enhancedData);
        return enhancedData;
      }

      // Fallback if no JSON found
      throw new Error('No JSON found in AI response');

    } catch (error) {
      console.error('[UPLOAD V2] Error generating AI copy:', error);

      // Fallback to simple template
      const publicName = `${carData.brand} ${carData.model || ''} ${carData.year} ${carData.color || 'Silver'}`;
      const description = `${carData.brand} ${carData.model || ''} tahun ${carData.year} dengan transmisi ${carData.transmission || 'Manual'}, kondisi terawat dan siap pakai. Harga ${(Number(carData.price) / 1000000).toFixed(0)} juta negotiable.`;
      const conditionNotes = carData.notes || 'Kondisi terawat, siap pakai, surat-surat lengkap.';

      return {
        publicName,
        description,
        conditionNotes
      };
    }
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
        carData.model || ''
      );

      // Build public name with display code
      const publicName = `${carData.publicName || carData.brand + ' ' + (carData.model || '') + ' ' + carData.year + ' ' + (carData.color || 'Silver')} ${displayCode}`;

      // Generate slug
      const slug = publicName
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
          model: carData.model || '',
          year: carData.year!,
          color: carData.color || 'Silver',
          transmission: carData.transmission || 'Manual',
          km: carData.km || 0,
          price: BigInt(carData.price!),
          keyFeatures: carData.keyFeatures || [],
          photos: carData.photos || [],
          description: carData.description,
          conditionNotes: carData.conditionNotes,
          status: 'available',
          slug
        }
      });

      // Reset state
      await this.stateManager.resetState(tenant.id, userPhone);

      // Build success response with link
      let response = `✅ *Mobil Berhasil Diupload!*\n\n`;
      response += `📋 *Detail:*\n`;
      response += `• Kode: ${displayCode}\n`;
      response += `• Nama: ${publicName}\n`;
      response += `• Harga: Rp ${(Number(car.price) / 1000000).toFixed(0)} juta\n`;
      response += `• Foto: ${carData.photos?.length || 0} foto\n\n`;
      response += `🔗 *Link Katalog:*\n`;
      response += `https://${tenant.subdomain}/cars/${slug}\n\n`;
      response += `🚀 Mobil sudah LIVE di website dan siap dilihat customer!\n\n`;
      response += `Ketik /list untuk lihat semua mobil atau /upload untuk upload lagi.`;

      return response;

    } catch (error) {
      console.error('[UPLOAD V2] Error saving car:', error);
      return '❌ Gagal menyimpan mobil. Silakan coba lagi atau hubungi admin.\n\nError: ' + (error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
