/**
 * Blog Command Handler
 * Handles /blog command for AI-powered blog post generation via WhatsApp
 */

import { PrismaClient } from '../../../../generated/prisma';
import { StateManager } from '../../state-manager';
import { BlogWhatsAppService } from '../../../services/blog-whatsapp.service';
import type { BlogCategory, AITone } from '../../../types/blog';

export class BlogCommand {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private blogService: BlogWhatsAppService;

  constructor(prisma: PrismaClient, stateManager: StateManager) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.blogService = new BlogWhatsAppService();
  }

  /**
   * Execute /blog command
   */
  async execute(tenant: any, userPhone: string, message: string): Promise<string> {
    // Extract prompt from message
    const prompt = message.replace(/^\/blog\s*/i, '').trim();

    if (!prompt) {
      return this.buildUsageHelp();
    }

    // Check user permission (admin/owner only)
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        OR: [
          { phone: { contains: userPhone.slice(-10) } },
          { whatsappNumber: { contains: userPhone.slice(-10) } },
        ],
        status: 'active',
      },
    });

    if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
      return '❌ Maaf, hanya admin/owner yang bisa menggunakan fitur blog AI.';
    }

    // Start blog generation flow
    await this.stateManager.startFlow(
      tenant.id,
      userPhone,
      'blog_generation',
      {
        blogPrompt: prompt,
        authorId: user.id,
      },
      'admin'
    );

    // Ask for tone
    return this.askForTone();
  }

  /**
   * Process conversation step
   */
  async processStep(
    tenant: any,
    userPhone: string,
    message: string
  ): Promise<string> {
    const state = await this.stateManager.getStateIfExists(tenant.id, userPhone);

    if (!state || state.currentFlow !== 'blog_generation') {
      return '❌ Session tidak ditemukan. Silakan mulai lagi dengan /blog <prompt>';
    }

    const context = state.context;
    const step = state.currentStep;

    switch (step) {
      case 0:
        // Process tone selection
        return await this.processToneSelection(tenant, userPhone, message, context);

      case 1:
        // Process category selection
        return await this.processCategorySelection(tenant, userPhone, message, context);

      case 2:
        // Process car selection
        return await this.processCarSelection(tenant, userPhone, message, context);

      case 3:
        // Process keywords
        return await this.processKeywords(tenant, userPhone, message, context);

      default:
        await this.stateManager.resetState(tenant.id, userPhone);
        return '❌ Proses tidak valid. Silakan mulai lagi dengan /blog <prompt>';
    }
  }

  /**
   * Ask for tone preference
   */
  private askForTone(): string {
    let response = '📝 *Blog AI Generator*\n\n';
    response += 'Pilih tone artikel:\n\n';
    response += '1️⃣ *Professional* - Formal dan authoritative\n';
    response += '2️⃣ *Casual* - Friendly dan conversational\n';
    response += '3️⃣ *Balanced* - Profesional tapi approachable (Recommended)\n\n';
    response += 'Ketik nomor pilihan (1/2/3) atau ketik /cancel untuk batalkan.';

    return response;
  }

  /**
   * Process tone selection
   */
  private async processToneSelection(
    tenant: any,
    userPhone: string,
    message: string,
    context: any
  ): Promise<string> {
    const normalized = message.trim();
    let selectedTone: AITone = 'balanced';

    if (normalized === '1' || normalized.toLowerCase().includes('professional')) {
      selectedTone = 'professional';
    } else if (normalized === '2' || normalized.toLowerCase().includes('casual')) {
      selectedTone = 'casual';
    } else if (normalized === '3' || normalized.toLowerCase().includes('balanced')) {
      selectedTone = 'balanced';
    } else {
      return '❌ Pilihan tidak valid. Ketik 1, 2, atau 3.\n\n' + this.askForTone();
    }

    // Update context with tone
    await this.stateManager.nextStep(tenant.id, userPhone, {
      ...context,
      blogTone: selectedTone,
    });

    // Ask for category
    return this.askForCategory();
  }

  /**
   * Ask for category
   */
  private askForCategory(): string {
    let response = '📂 *Pilih Kategori Artikel:*\n\n';
    response += '1️⃣ *Tips & Trik Mobil*\n';
    response += '2️⃣ *Berita Otomotif*\n';
    response += '3️⃣ *Panduan Membeli*\n';
    response += '4️⃣ *Perawatan Kendaraan*\n';
    response += '5️⃣ *Review Mobil*\n';
    response += '6️⃣ *Promo & Penawaran*\n\n';
    response += 'Ketik nomor pilihan (1-6):';

    return response;
  }

  /**
   * Process category selection
   */
  private async processCategorySelection(
    tenant: any,
    userPhone: string,
    message: string,
    context: any
  ): Promise<string> {
    const normalized = message.trim();
    let selectedCategory: BlogCategory = 'tips_mobil';

    switch (normalized) {
      case '1':
        selectedCategory = 'tips_mobil';
        break;
      case '2':
        selectedCategory = 'berita_otomotif';
        break;
      case '3':
        selectedCategory = 'panduan_beli';
        break;
      case '4':
        selectedCategory = 'perawatan';
        break;
      case '5':
        selectedCategory = 'review_mobil';
        break;
      case '6':
        selectedCategory = 'promo';
        break;
      default:
        return '❌ Pilihan tidak valid. Ketik angka 1-6.\n\n' + this.askForCategory();
    }

    // Update context with category
    await this.stateManager.nextStep(tenant.id, userPhone, {
      ...context,
      blogCategory: selectedCategory,
    });

    // Ask for car selection
    return await this.askForCars(tenant);
  }

  /**
   * Ask for car selection
   */
  private async askForCars(tenant: any): Promise<string> {
    // Get available cars
    const cars = await this.prisma.car.findMany({
      where: {
        tenantId: tenant.id,
        status: 'available',
        deletedAt: null,
      },
      select: {
        id: true,
        brand: true,
        model: true,
        year: true,
        displayCode: true,
        price: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (cars.length === 0) {
      // Skip car selection if no cars available
      return 'ℹ️ Tidak ada mobil tersedia.\n\n' + this.askForKeywords();
    }

    let response = '🚗 *Pilih Mobil untuk Disebutkan:*\n\n';
    response += 'Mobil yang tersedia:\n';

    cars.forEach((car, index) => {
      response += `${index + 1}. ${car.displayCode} - ${car.brand} ${car.model} ${car.year}\n`;
      response += `   Rp ${car.price?.toString() || 'N/A'}\n`;
    });

    response += '\n*Cara pilih:*\n';
    response += '- Ketik nomor mobil (contoh: 1,3,5)\n';
    response += '- Atau ketik "skip" untuk lewati\n';
    response += '- Maksimal 5 mobil';

    return response;
  }

  /**
   * Process car selection
   */
  private async processCarSelection(
    tenant: any,
    userPhone: string,
    message: string,
    context: any
  ): Promise<string> {
    const normalized = message.trim().toLowerCase();

    // Allow skipping
    if (normalized === 'skip' || normalized === 'lewati') {
      await this.stateManager.nextStep(tenant.id, userPhone, {
        ...context,
        blogCarIds: [],
      });
      return this.askForKeywords();
    }

    // Parse car numbers
    const carNumbers = normalized.split(/[,\s]+/).map((n) => parseInt(n.trim()));
    const validNumbers = carNumbers.filter((n) => !isNaN(n) && n > 0);

    if (validNumbers.length === 0) {
      return '❌ Format tidak valid. Ketik nomor mobil yang dipisahkan koma (contoh: 1,3,5) atau "skip"';
    }

    if (validNumbers.length > 5) {
      return '❌ Maksimal 5 mobil. Silakan pilih ulang.';
    }

    // Get cars
    const cars = await this.prisma.car.findMany({
      where: {
        tenantId: tenant.id,
        status: 'available',
        deletedAt: null,
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Map numbers to car IDs
    const selectedCarIds = validNumbers
      .filter((num) => num <= cars.length)
      .map((num) => cars[num - 1].id);

    if (selectedCarIds.length === 0) {
      return '❌ Nomor mobil tidak valid. Silakan pilih ulang.';
    }

    // Update context
    await this.stateManager.nextStep(tenant.id, userPhone, {
      ...context,
      blogCarIds: selectedCarIds,
    });

    return this.askForKeywords();
  }

  /**
   * Ask for keywords
   */
  private askForKeywords(): string {
    let response = '🔍 *Target Keywords (SEO):*\n\n';
    response += 'Masukkan keywords yang ingin ditargetkan.\n\n';
    response += '*Contoh:*\n';
    response += 'mobil bekas, avanza second, tips beli mobil\n\n';
    response += 'Atau ketik "skip" untuk lewati.';

    return response;
  }

  /**
   * Process keywords and generate blog
   */
  private async processKeywords(
    tenant: any,
    userPhone: string,
    message: string,
    context: any
  ): Promise<string> {
    const normalized = message.trim().toLowerCase();

    let keywords: string[] = [];
    if (normalized !== 'skip' && normalized !== 'lewati') {
      keywords = message
        .split(/[,\n]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    // Update context
    await this.stateManager.updateState(tenant.id, userPhone, {
      currentFlow: 'blog_generation',
      currentStep: 4,
      context: {
        ...context,
        blogKeywords: keywords,
      },
    });

    // Generate confirmation message
    let confirmation = '✅ *Konfirmasi Blog AI:*\n\n';
    confirmation += `📝 Prompt: ${context.blogPrompt}\n`;
    confirmation += `🎨 Tone: ${context.blogTone}\n`;
    confirmation += `📂 Kategori: ${this.getCategoryName(context.blogCategory)}\n`;
    confirmation += `🚗 Mobil: ${context.blogCarIds?.length || 0} mobil\n`;
    confirmation += `🔍 Keywords: ${keywords.length > 0 ? keywords.join(', ') : 'Tidak ada'}\n\n`;
    confirmation += '⏳ Generating blog post...\n';
    confirmation += 'Proses ini memakan waktu 30-60 detik.';

    // Send confirmation first
    const confirmationSent = confirmation;

    // Start generation in background
    this.generateBlogInBackground(tenant, userPhone, context, keywords);

    return confirmationSent;
  }

  /**
   * Generate blog in background
   */
  private async generateBlogInBackground(
    tenant: any,
    userPhone: string,
    context: any,
    keywords: string[]
  ): Promise<void> {
    try {
      console.log('[BlogCommand] Starting blog generation...');

      const blogPost = await this.blogService.generateBlogPost({
        prompt: context.blogPrompt,
        tenantId: tenant.id,
        authorId: context.authorId,
        tone: context.blogTone,
        carIds: context.blogCarIds || [],
        keywords,
        category: context.blogCategory,
      });

      console.log('[BlogCommand] Blog generated:', blogPost.id);

      // Build success message
      let successMessage = '✅ *Blog Post Berhasil Dibuat!*\n\n';
      successMessage += `📝 *${blogPost.title}*\n\n`;
      successMessage += `${blogPost.excerpt}\n\n`;
      successMessage += `📂 Kategori: ${this.getCategoryName(blogPost.category)}\n`;
      successMessage += `📊 Status: DRAFT\n\n`;
      successMessage += `🔗 *Edit & Publish:*\n`;
      successMessage += `${blogPost.editUrl}\n\n`;
      successMessage += 'ℹ️ Blog post sudah dibuat sebagai DRAFT. Silakan review dan publish dari admin panel.';

      // Send success message via WhatsApp
      await this.sendWhatsAppMessage(tenant, userPhone, successMessage);

      // Reset state
      await this.stateManager.resetState(tenant.id, userPhone);

    } catch (error) {
      console.error('[BlogCommand] Error generating blog:', error);

      let errorMessage = '❌ *Gagal Generate Blog*\n\n';
      errorMessage += 'Terjadi kesalahan saat generate artikel.\n';
      errorMessage += 'Silakan coba lagi atau hubungi admin.\n\n';
      errorMessage += `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      // Send error message
      await this.sendWhatsAppMessage(tenant, userPhone, errorMessage);

      // Reset state
      await this.stateManager.resetState(tenant.id, userPhone);
    }
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsAppMessage(
    tenant: any,
    userPhone: string,
    message: string
  ): Promise<void> {
    try {
      const baseUrl = process.env.APP_URL || 'https://auto.lumiku.com';
      const proxyHost = tenant.customDomain || tenant.subdomain;
      const cleanPhone = userPhone.replace(/[^0-9]/g, '');

      const response = await fetch(`${baseUrl}/api/wa/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Host: proxyHost,
        },
        body: JSON.stringify({
          number: cleanPhone,
          message,
        }),
      });

      if (!response.ok) {
        console.error('[BlogCommand] Failed to send WhatsApp:', await response.text());
      }
    } catch (error) {
      console.error('[BlogCommand] Error sending WhatsApp:', error);
    }
  }

  /**
   * Get category display name
   */
  private getCategoryName(category: BlogCategory): string {
    const categoryMap: Record<BlogCategory, string> = {
      tips_mobil: 'Tips & Trik Mobil',
      berita_otomotif: 'Berita Otomotif',
      panduan_beli: 'Panduan Membeli',
      perawatan: 'Perawatan Kendaraan',
      review_mobil: 'Review Mobil',
      promo: 'Promo & Penawaran',
    };

    return categoryMap[category] || category;
  }

  /**
   * Build usage help
   */
  private buildUsageHelp(): string {
    let response = '📝 *Blog AI Generator*\n\n';
    response += '*Cara pakai:*\n';
    response += '/blog <prompt artikel>\n\n';
    response += '*Contoh:*\n';
    response += '• /blog Tulis artikel tentang tips membeli Avanza bekas\n';
    response += '• /blog Panduan perawatan mobil matic untuk pemula\n';
    response += '• /blog Review Toyota Fortuner 2020 bekas\n\n';
    response += 'ℹ️ Setelah kirim prompt, bot akan tanya:\n';
    response += '1. Tone artikel (Professional/Casual/Balanced)\n';
    response += '2. Kategori artikel\n';
    response += '3. Mobil yang mau disebutkan (opsional)\n';
    response += '4. Keywords SEO (opsional)\n\n';
    response += 'Bot akan generate artikel lengkap dengan:\n';
    response += '✅ Judul & konten SEO-friendly\n';
    response += '✅ Meta description & keywords\n';
    response += '✅ Format Markdown\n';
    response += '✅ Integrasi mobil katalog\n\n';
    response += 'Artikel akan disimpan sebagai DRAFT di admin panel.';

    return response;
  }
}
