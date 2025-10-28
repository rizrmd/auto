/**
 * Upload Flow V2 - Simplified 2-Step Flow
 * Step 1: Parse all data from single message
 * Step 2: Collect photos
 * AI Enhancement: Auto-generate copywriting
 */

import { PrismaClient } from '../../../../generated/prisma';
import { StateManager, ConversationContext } from '../state-manager';
import { DisplayCodeGenerator } from './display-code-generator';
import { MediaDownloader } from '../../whatsapp/media-downloader';
import { ZaiClient } from '../../llm/zai';
import { NaturalLanguageExtractor } from './natural-language-extractor';

export class UploadFlowV2 {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private nlExtractor: NaturalLanguageExtractor;
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
    this.nlExtractor = new NaturalLanguageExtractor();
    this.codeGenerator = new DisplayCodeGenerator(prisma);
    this.mediaDownloader = new MediaDownloader();
    this.zaiClient = new ZaiClient();
  }

  /**
   * Start upload flow with natural language parsing
   * Example: "upload freed matic 2012 harga 145jt kondisi bagus"
   * Example: "tambah mobil honda freed tahun 2012 km 145rb dijual 145 juta"
   */
  async start(tenant: any, userPhone: string, message: string): Promise<string> {
    console.log('[UPLOAD V2] Processing natural language input:', message);

    // Extract car data using natural language processing
    const extraction = await this.nlExtractor.extract(message);

    console.log('[UPLOAD V2] Extraction result:', {
      success: extraction.success,
      method: extraction.method,
      confidence: extraction.confidence
    });

    // Validate extraction success
    if (!extraction.success) {
      const errors = extraction.errors || ['Unknown error'];
      return `❌ Tidak bisa memahami data mobil. Silakan coba lagi dengan format yang lebih jelas.

${errors.join('\n')}

Contoh yang benar:
• upload freed matic 2012 harga 145jt km 145rb
• tambah mobil honda jazz 2019 hitam harga 187jt
• avanza 2020 dijual 185 juta km 45 ribu

Minimal: brand/model, tahun, harga`;
    }

    const carData = extraction.data;

    // Start flow with parsed data
    await this.stateManager.startFlow(tenant.id, userPhone, 'upload_car_v2', {
      carData: carData
    });

    // Show parsed data and ask for photos
    const methodIcon = extraction.method === 'llm' ? '🤖' : '📝';
    const confidenceIcon = extraction.confidence === 'high' ? '✨' : extraction.confidence === 'medium' ? '⭐' : '🔸';

    let response = `✅ *Data Mobil Berhasil Diproses!*\n`;
    response += `${methodIcon} ${extraction.method === 'llm' ? 'AI Natural Language' : 'Pattern Matching'} ${confidenceIcon}\n\n`;

    response += `📋 *Informasi Mobil:*\n`;
    response += `• Brand: ${carData.brand}\n`;
    response += `• Model: ${carData.model || '-'}\n`;
    response += `• Tahun: ${carData.year}\n`;
    response += `• Warna: ${carData.color || 'Silver'}\n`;
    response += `• Transmisi: ${carData.transmission || 'Manual'}\n`;

    if (carData.km && carData.km > 0) {
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

    // ✅ IMPORTANT: Check media FIRST before checking message text
    // Webhook may send both: message="Image received" AND media object
    // We need to handle media first, not the text message

    // Handle photo
    if (media && media.type === 'image') {
      // Check if URL is available
      if (media.url === '__NO_URL__') {
        // WhatsApp API sent attachment metadata but no URL to download
        console.log('[UPLOAD V2] Photo received but no URL available from webhook');

        // Count as photo received (for user feedback) but can't download
        const photoCount = existingPhotos.length + 1;

        // Update counter in state (but don't add actual URL since we can't download)
        await this.stateManager.updateState(tenant.id, userPhone, {
          context: {
            ...context,
            carData: {
              ...context.carData,
              photos: existingPhotos,
              photoCount: photoCount  // Track count separately
            }
          }
        });

        // Acknowledge photo but explain limitation
        if (photoCount === 1) {
          return `📸 Foto terdeteksi!

⚠️ *Catatan:* Webhook WhatsApp tidak mengirim URL foto. Foto perlu diupload via Web Dashboard setelah mobil tersimpan.

💡 *Solusi:*
1. Ketik *"selesai"* untuk lanjut tanpa foto
2. Upload foto via https://auto.lumiku.com/admin setelah mobil tersimpan

Atau ketik *"/cancel"* untuk batal dan upload via web langsung.`;
        }

        // Silent for subsequent photos
        return '';
      }

      // URL available - try to download
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

        // Only send response for first photo or every 5th photo to avoid spam
        // When user sends bulk photos, most will be processed silently
        if (updatedPhotos.length === 1) {
          return `✅ Foto pertama diterima!

📸 Kirim foto lainnya (maksimal 10 foto).

Setelah semua foto terkirim, ketik *"selesai"* untuk lanjut.`;
        } else if (updatedPhotos.length % 5 === 0) {
          return `📸 Total foto: ${updatedPhotos.length}/10

Kirim foto lagi atau ketik *"selesai"* untuk lanjut.`;
        }

        // Silent processing for photos 2-4, 6-9 to avoid message spam
        return '';
      } catch (error) {
        console.error('[UPLOAD V2] Error downloading photo:', error);
        return `⚠️ Gagal mengunduh foto. Silakan coba kirim lagi atau ketik *"skip"* untuk lanjut tanpa foto.`;
      }
    }

    // ⚠️ FALLBACK: Handle "Image received" text message without media object
    // This happens when webhook sends text but no media object at all
    if (message.trim() === 'Image received') {
      console.log('[UPLOAD V2] Received "Image received" text without media object (old webhook behavior)');
      // Silent acknowledgment - return empty string to avoid spam
      return '';
    }

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
      // Allow "selesai" without photos - treat as skip
      // User can upload photos later via web dashboard
      await this.stateManager.nextStep(tenant.id, userPhone, {
        carData: {
          ...context.carData,
          photos: existingPhotos
        }
      });

      if (existingPhotos.length === 0) {
        console.log('[UPLOAD V2] User typed "selesai" without photos, proceeding without photos');
      }

      return await this.buildConfirmation(tenant, { ...context.carData, photos: existingPhotos });
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
   * Generate AI-enhanced copywriting with vision analysis and dynamic variation
   */
  private async generateEnhancedCopy(carData: any): Promise<{
    publicName: string;
    description: string;
    conditionNotes?: string;
  }> {
    try {
      console.log('[UPLOAD V2] Starting enhanced copywriting with vision analysis...');

      // Step 1: Vision analysis (if photos available)
      let visionData: any = null;
      if (carData.photos && carData.photos.length > 0) {
        console.log('[UPLOAD V2] Analyzing first photo with GLM-4V...');
        visionData = await this.analyzeCarPhoto(carData.photos[0], carData);
      }

      // Step 2: Get variation style based on car data (deterministic hash)
      const variation = this.selectVariation(carData);
      console.log('[UPLOAD V2] Selected variation:', variation);

      // Step 3: Generate copywriting with vision data + variation
      const enhancedData = await this.generateDynamicCopywriting(carData, visionData, variation);

      console.log('[UPLOAD V2] AI-enhanced data generated successfully');
      return enhancedData;

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
   * Analyze car photo using GLM-4V vision model
   */
  private async analyzeCarPhoto(photoUrl: string, carData: any): Promise<any> {
    try {
      // Build vision analysis prompt
      const visionPrompt = `Analisis detail mobil dalam foto ini:

User menyebutkan:
- Brand: ${carData.brand}
- Model: ${carData.model || 'tidak disebutkan'}
- Tahun: ${carData.year}
- Warna: ${carData.color || 'tidak disebutkan'}

Tugas kamu:
1. Validasi warna asli dari foto (apakah sesuai dengan yang disebutkan user?)
2. Identifikasi varian/tipe mobil dari badge, grill, atau ciri khas
3. Identifikasi kondisi cat (mulus, ada baret, repaint, dll)
4. Identifikasi modifikasi visual (velg, bodykit, spoiler, stiker, dll)
5. Identifikasi fitur visual unggulan (fog lamp, sunroof, roof rack, dll)
6. Kondisi eksterior secara keseluruhan (excellent, good, fair)

Format response JSON:
{
  "actualColor": "warna sebenarnya dari foto",
  "colorMatch": true/false,
  "variant": "varian/tipe mobil (misal: E, S, RS, Sport)",
  "paintCondition": "kondisi cat",
  "modifications": ["modifikasi 1", "modifikasi 2"],
  "visualFeatures": ["fitur 1", "fitur 2"],
  "overallCondition": "excellent/good/fair",
  "appealingPoints": ["poin menarik 1", "poin menarik 2"]
}

Berikan response dalam Bahasa Indonesia.`;

      // Call GLM-4V with multimodal content
      const response = await this.callZaiVisionApi(photoUrl, visionPrompt);

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const visionData = JSON.parse(jsonMatch[0]);
        console.log('[UPLOAD V2] Vision analysis result:', visionData);
        return visionData;
      }

      console.warn('[UPLOAD V2] No JSON found in vision response, using null');
      return null;

    } catch (error) {
      console.error('[UPLOAD V2] Error in vision analysis:', error);
      return null;
    }
  }

  /**
   * Call Z.AI Vision API with multimodal content (GLM-4V)
   */
  private async callZaiVisionApi(imageUrl: string, textPrompt: string): Promise<string> {
    const apiKey = process.env.ZAI_API_KEY || '';
    const baseUrl = process.env.ZAI_API_URL || 'https://api.z.ai/api/coding/paas/v4';
    const model = 'glm-4v-plus'; // Vision model

    if (!apiKey) {
      throw new Error('ZAI API key not configured');
    }

    // Build multimodal message (OpenAI-compatible format)
    const payload = {
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: textPrompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1024
    };

    console.log('[UPLOAD V2] Calling GLM-4V vision API...');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[UPLOAD V2] Vision API error:', errorData);
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content || '';
    }

    throw new Error('No response from vision API');
  }

  /**
   * Select copywriting variation based on car data (deterministic hash)
   * 4 styles × 5 angles = 20 unique variations
   */
  private selectVariation(carData: any): { style: string; angle: string } {
    // Create hash from car data for deterministic selection
    const hashString = `${carData.brand}-${carData.model}-${carData.year}-${carData.price}`;
    const hash = this.simpleHash(hashString);

    // 4 copywriting styles
    const styles = ['storytelling', 'benefit-first', 'aspirational', 'value-focused'];
    const styleIndex = hash % styles.length;
    const style = styles[styleIndex];

    // 5 benefit angles
    const angles = ['investment', 'lifestyle', 'family', 'performance', 'practicality'];
    const angleIndex = Math.floor(hash / styles.length) % angles.length;
    const angle = angles[angleIndex];

    return { style, angle };
  }

  /**
   * Simple hash function for deterministic variation selection
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate dynamic copywriting with vision data and variation style
   */
  private async generateDynamicCopywriting(
    carData: any,
    visionData: any,
    variation: { style: string; angle: string }
  ): Promise<{
    publicName: string;
    description: string;
    conditionNotes?: string;
  }> {
    // Build style-specific instruction
    const styleInstructions = {
      'storytelling': 'Gunakan pendekatan storytelling yang mengajak pembaca membayangkan pengalaman berkendara. Mulai dengan hook emosional.',
      'benefit-first': 'Langsung highlight 2-3 benefit utama di kalimat pertama. Fokus pada hasil yang didapat pembeli.',
      'aspirational': 'Gambarkan lifestyle upgrade dan status sosial. Buat pembeli merasa ini adalah mobil impian yang terjangkau.',
      'value-focused': 'Tekankan value for money, efisiensi, dan investasi cerdas. Gunakan data konkret (harga, tahun, kondisi).'
    };

    const angleInstructions = {
      'investment': 'Frame sebagai investasi cerdas. Highlight: harga resale value bagus, demand tinggi, biaya maintenance rendah.',
      'lifestyle': 'Frame sebagai lifestyle upgrade. Highlight: gaya hidup modern, mobilitas premium, kenyamanan sehari-hari.',
      'family': 'Frame sebagai mobil keluarga ideal. Highlight: keamanan, kenyamanan keluarga, ruang luas, fitur family-friendly.',
      'performance': 'Frame sebagai performa optimal. Highlight: mesin responsif, handling bagus, akselerasi, efisiensi bahan bakar.',
      'practicality': 'Frame sebagai pilihan praktis. Highlight: irit, perawatan mudah, suku cadang murah, cocok daily driver.'
    };

    // Build comprehensive prompt with vision data
    let prompt = `Kamu adalah copywriter profesional automotive showroom dengan spesialisasi mobil bekas premium.

📊 DATA MOBIL:
- Brand: ${carData.brand}
- Model: ${carData.model || 'standar'}
- Tahun: ${carData.year}
- Warna: ${carData.color || 'Silver'}
- Transmisi: ${carData.transmission || 'Manual'}
- KM: ${carData.km ? carData.km.toLocaleString() + ' km' : 'belum disebutkan'}
- Harga: Rp ${carData.price ? (Number(carData.price) / 1000000).toFixed(0) : 0} juta
- Fitur: ${carData.keyFeatures ? carData.keyFeatures.join(', ') : 'standar'}
- Catatan user: ${carData.notes || 'tidak ada'}
`;

    // Add vision analysis data if available
    if (visionData) {
      prompt += `
🔍 ANALISIS FOTO (GLM-4V):
- Warna asli dari foto: ${visionData.actualColor || carData.color}
- Varian/tipe: ${visionData.variant || 'standar'}
- Kondisi cat: ${visionData.paintCondition || 'baik'}
- Modifikasi: ${visionData.modifications?.join(', ') || 'standar'}
- Fitur visual unggulan: ${visionData.visualFeatures?.join(', ') || 'standar'}
- Kondisi keseluruhan: ${visionData.overallCondition || 'good'}
- Poin menarik: ${visionData.appealingPoints?.join(', ') || '-'}
`;
    }

    prompt += `
🎯 COPYWRITING STYLE: "${variation.style}"
${styleInstructions[variation.style as keyof typeof styleInstructions]}

🎯 BENEFIT ANGLE: "${variation.angle}"
${angleInstructions[variation.angle as keyof typeof angleInstructions]}

📝 TUGAS KAMU:
1. **Public Name**: Format: "[Brand] [Model] [Variant] [Tahun] [Warna]"
   - Gunakan warna ASLI dari foto (bukan input user jika beda)
   - Tambahkan variant jika teridentifikasi
   - Contoh: "Honda Jazz RS 2019 Abu-Abu Metalik"

2. **Description** (2-3 kalimat, 150-200 kata):
   - Kalimat 1: Hook dengan style "${variation.style}"
   - Kalimat 2-3: Detail benefit dengan angle "${variation.angle}"
   - Sebutkan kondisi NYATA dari foto (cat, modifikasi, fitur visual)
   - SEO-friendly: sebutkan brand, model, tahun, tipe transmisi
   - Natural, tidak berlebihan, fokus pada fakta menarik
   - Akhiri dengan soft CTA yang relevan dengan angle

3. **Condition Notes** (1-2 kalimat, 50-80 kata):
   - Highlight kondisi fisik berdasarkan foto
   - Sebutkan modifikasi atau upgrade jika ada
   - Sebutkan kelengkapan (jika disebutkan user)
   - Fokus pada aspek yang membuat mobil ini stand out

⚠️ PENTING:
- Gunakan Bahasa Indonesia natural, bukan formal berlebihan
- JANGAN gunakan kata: "unit", "siap tempur", "jarang ada", "langka"
- JANGAN claim yang tidak bisa diverifikasi: "terawat bengkel resmi", "record service lengkap" (kecuali user sebutkan)
- Jika ada perbedaan warna foto vs input user, GUNAKAN warna dari foto + sebutkan di condition notes
- Setiap mobil HARUS punya copywriting UNIK (karena kombinasi style + angle berbeda)

Format response JSON:
{
  "publicName": "...",
  "description": "...",
  "conditionNotes": "..."
}`;

    console.log('[UPLOAD V2] Generating copywriting with variation:', variation);

    // Call GLM-4-Plus for text generation
    const response = await this.zaiClient.generateResponse(prompt);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const enhancedData = JSON.parse(jsonMatch[0]);
      console.log('[UPLOAD V2] Dynamic copywriting generated');
      return enhancedData;
    }

    throw new Error('No JSON found in AI response');
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

      // Use custom domain if verified, otherwise use subdomain
      const catalogDomain = tenant.customDomainVerified && tenant.customDomain
        ? tenant.customDomain
        : tenant.subdomain;

      // Build success response with link
      let response = `✅ *Mobil Berhasil Diupload!*\n\n`;
      response += `📋 *Detail:*\n`;
      response += `• Kode: ${displayCode}\n`;
      response += `• Nama: ${publicName}\n`;
      response += `• Harga: Rp ${(Number(car.price) / 1000000).toFixed(0)} juta\n`;
      response += `• Foto: ${carData.photos?.length || 0} foto\n\n`;
      response += `🔗 *Link Katalog:*\n`;
      response += `https://${catalogDomain}/cars/${slug}\n\n`;
      response += `🚀 Mobil sudah LIVE di website dan siap dilihat customer!\n\n`;
      response += `Ketik /list untuk lihat semua mobil atau /upload untuk upload lagi.`;

      return response;

    } catch (error) {
      console.error('[UPLOAD V2] Error saving car:', error);
      return '❌ Gagal menyimpan mobil. Silakan coba lagi atau hubungi admin.\n\nError: ' + (error instanceof Error ? error.message : 'Unknown error');
    }
  }
}
