/**
 * Tool Executor
 * Executes tool calls made by the LLM
 */

import { PrismaClient } from '../../../generated/prisma';
import { FonnteClient } from '../whatsapp/fonnte-client';
import { validateToolArguments, getToolByName } from './tools';

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  tool_call_id: string;
  role: 'tool';
  name: string;
  content: string;
}

export interface ToolExecutionContext {
  tenantId: number;
  leadId: number;
  customerPhone: string;
  prisma: PrismaClient;
  whatsapp: FonnteClient;
}

export class ToolExecutor {
  private context: ToolExecutionContext;

  constructor(context: ToolExecutionContext) {
    this.context = context;
  }

  /**
   * Execute a single tool call
   */
  async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    const { id, function: func } = toolCall;
    const { name, arguments: argsString } = func;

    console.log(`[TOOL_EXECUTOR] Executing tool: ${name}`);
    console.log(`[TOOL_EXECUTOR] Arguments: ${argsString}`);

    try {
      // Parse arguments
      const args = JSON.parse(argsString);

      // Validate arguments
      const tool = getToolByName(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      const validation = validateToolArguments(tool, args);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Execute the tool
      let result: string;
      switch (name) {
        case 'search_cars':
          result = await this.searchCars(args);
          break;
        case 'get_car_details':
          result = await this.getCarDetails(args);
          break;
        case 'send_car_photos':
          result = await this.sendCarPhotos(args);
          break;
        case 'send_location_info':
          result = await this.sendLocationInfo(args);
          break;
        case 'get_price_quote':
          result = await this.getPriceQuote(args);
          break;
        case 'get_financing_info':
          result = await this.getFinancingInfo(args);
          break;
        case 'schedule_test_drive':
          result = await this.scheduleTestDrive(args);
          break;
        case 'check_trade_in':
          result = await this.checkTradeIn(args);
          break;
        default:
          throw new Error(`Tool not implemented: ${name}`);
      }

      console.log(`[TOOL_EXECUTOR] Tool ${name} executed successfully`);
      console.log(`[TOOL_EXECUTOR] Result: ${result.substring(0, 200)}...`);

      return {
        tool_call_id: id,
        role: 'tool',
        name,
        content: result,
      };
    } catch (error) {
      console.error(`[TOOL_EXECUTOR] Error executing tool ${name}:`, error);
      return {
        tool_call_id: id,
        role: 'tool',
        name,
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Execute multiple tool calls in parallel
   */
  async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    console.log(`[TOOL_EXECUTOR] Executing ${toolCalls.length} tool(s)`);

    const results = await Promise.allSettled(
      toolCalls.map(toolCall => this.executeToolCall(toolCall))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Tool call ${index} failed:`, result.reason);
        return {
          tool_call_id: toolCalls[index].id,
          role: 'tool' as const,
          name: toolCalls[index].function.name,
          content: `Error: ${result.reason?.message || 'Execution failed'}`,
        };
      }
    });
  }

  /**
   * Search for cars
   */
  private async searchCars(args: any): Promise<string> {
    const where: any = {
      tenantId: this.context.tenantId,
      status: 'available',
    };

    // Build filters
    if (args.brand) {
      where.brand = { contains: args.brand, mode: 'insensitive' };
    }
    if (args.model) {
      where.model = { contains: args.model, mode: 'insensitive' };
    }
    if (args.year) {
      where.year = args.year;
    }
    if (args.minPrice || args.maxPrice) {
      where.price = {};
      if (args.minPrice) where.price.gte = BigInt(args.minPrice);
      if (args.maxPrice) where.price.lte = BigInt(args.maxPrice);
    }
    if (args.transmission) {
      where.transmission = args.transmission;
    }
    if (args.color) {
      where.color = { contains: args.color, mode: 'insensitive' };
    }
    if (args.fuelType) {
      where.fuelType = args.fuelType;
    }
    if (args.maxKm) {
      where.km = { lte: args.maxKm };
    }

    const cars = await this.context.prisma.car.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayCode: true,
        publicName: true,
        brand: true,
        model: true,
        year: true,
        color: true,
        transmission: true,
        km: true,
        price: true,
        fuelType: true,
        keyFeatures: true,
        photos: true,
      },
    });

    if (cars.length === 0) {
      return 'No cars found matching the criteria.';
    }

    const carList = cars.map(car => {
      const features = Array.isArray(car.keyFeatures)
        ? car.keyFeatures.slice(0, 3).join(', ')
        : '';

      return `
Code: ${car.displayCode}
Car: ${car.publicName || `${car.brand} ${car.model} ${car.year}`}
Price: Rp ${car.price.toLocaleString('id-ID')}
Color: ${car.color || 'N/A'}
Transmission: ${car.transmission || 'N/A'}
Mileage: ${car.km?.toLocaleString('id-ID') || 'N/A'} km
Fuel: ${car.fuelType || 'N/A'}
Key Features: ${features || 'N/A'}
Photos: ${Array.isArray(car.photos) ? car.photos.length : 0} available
      `.trim();
    });

    return `Found ${cars.length} car(s):\n\n${carList.join('\n\n---\n\n')}`;
  }

  /**
   * Get car details
   */
  private async getCarDetails(args: any): Promise<string> {
    // Normalize display code (handle both with/without hash)
    let displayCode = args.displayCode.toUpperCase().trim();
    if (!displayCode.startsWith('#')) {
      displayCode = '#' + displayCode;
    }

    const car = await this.context.prisma.car.findFirst({
      where: {
        tenantId: this.context.tenantId,
        displayCode: displayCode,
        status: 'available',
      },
      select: {
        id: true,
        displayCode: true,
        publicName: true,
        brand: true,
        model: true,
        year: true,
        color: true,
        transmission: true,
        km: true,
        price: true,
        fuelType: true,
        keyFeatures: true,
        conditionNotes: true,
        photos: true,
        slug: true,
      },
    });

    if (!car) {
      return `Car with code ${args.displayCode} not found or not available.`;
    }

    const features = Array.isArray(car.keyFeatures)
      ? car.keyFeatures.join('\n  - ')
      : 'N/A';

    return `
Car Details for ${car.displayCode}:

Name: ${car.publicName || `${car.brand} ${car.model} ${car.year}`}
Price: Rp ${car.price.toLocaleString('id-ID')}
Brand: ${car.brand}
Model: ${car.model}
Year: ${car.year}
Color: ${car.color || 'N/A'}
Transmission: ${car.transmission || 'N/A'}
Mileage: ${car.km?.toLocaleString('id-ID') || 'N/A'} km
Fuel Type: ${car.fuelType || 'N/A'}

Key Features:
  - ${features}

Condition Notes: ${car.conditionNotes || 'No additional notes'}
Available Photos: ${Array.isArray(car.photos) ? car.photos.length : 0}
    `.trim();
  }

  /**
   * Send car photos via WhatsApp
   */
  private async sendCarPhotos(args: any): Promise<string> {
    // Normalize display code (handle both with/without hash)
    let displayCode = args.displayCode.toUpperCase().trim();
    if (!displayCode.startsWith('#')) {
      displayCode = '#' + displayCode;
    }

    const car = await this.context.prisma.car.findFirst({
      where: {
        tenantId: this.context.tenantId,
        displayCode: displayCode,
        status: 'available',
      },
      select: {
        displayCode: true,
        publicName: true,
        brand: true,
        model: true,
        year: true,
        photos: true,
      },
    });

    if (!car) {
      return `Car with code ${args.displayCode} not found.`;
    }

    if (!Array.isArray(car.photos) || car.photos.length === 0) {
      return `No photos available for car ${args.displayCode}.`;
    }

    const maxPhotos = Math.min(args.maxPhotos || 3, 5);
    const photosToSend = car.photos.slice(0, maxPhotos);

    console.log(`[TOOL_EXECUTOR] Sending ${photosToSend.length} photo(s) for ${car.displayCode}`);

    // Send photos
    const carName = car.publicName || `${car.brand} ${car.model} ${car.year}`;
    let successCount = 0;

    for (let i = 0; i < photosToSend.length; i++) {
      const photo = photosToSend[i];
      const caption = i === 0
        ? `Foto ${carName} (${car.displayCode}) - ${i + 1}/${photosToSend.length}`
        : `Foto ${i + 1}/${photosToSend.length}`;

      const result = await this.context.whatsapp.sendImage(
        this.context.customerPhone,
        photo,
        caption
      );

      if (result.status) {
        successCount++;
        // Small delay between photos to avoid rate limiting
        if (i < photosToSend.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        console.error(`Failed to send photo ${i + 1}:`, result.detail || result.message);
      }
    }

    if (successCount > 0) {
      return `Successfully sent ${successCount} photo(s) of ${car.displayCode} (${carName}) to customer.`;
    } else {
      return `Failed to send photos for ${car.displayCode}. Please try again.`;
    }
  }

  /**
   * Send location information
   */
  private async sendLocationInfo(args: any): Promise<string> {
    // Get tenant information
    const tenant = await this.context.prisma.tenant.findUnique({
      where: { id: this.context.tenantId },
      select: {
        name: true,
        address: true,
        city: true,
        mapsUrl: true,
        phone: true,
        whatsappNumber: true,
        businessHours: true,
      },
    });

    if (!tenant) {
      return 'Maaf, informasi lokasi tidak tersedia saat ini.';
    }

    // Format business hours
    let hoursText = 'Senin - Sabtu: 09:00 - 18:00\nMinggu: 10:00 - 16:00';
    if (tenant.businessHours && typeof tenant.businessHours === 'object') {
      const hours = tenant.businessHours as Record<string, string>;
      const dayNames: Record<string, string> = {
        mon: 'Senin',
        tue: 'Selasa',
        wed: 'Rabu',
        thu: 'Kamis',
        fri: 'Jumat',
        sat: 'Sabtu',
        sun: 'Minggu',
      };
      hoursText = Object.entries(hours)
        .map(([day, time]) => `${dayNames[day] || day}: ${time}`)
        .join('\n');
    }

    let locationInfo = `📍 Lokasi ${tenant.name}\n\n`;
    locationInfo += `📌 Alamat:\n${tenant.address || 'N/A'}\n`;
    if (tenant.city) {
      locationInfo += `${tenant.city}\n`;
    }
    locationInfo += `\n⏰ Jam Operasional:\n${hoursText}\n`;
    locationInfo += `\n📞 Kontak:\n`;
    locationInfo += `Telepon: ${tenant.phone}\n`;
    locationInfo += `WhatsApp: ${tenant.whatsappNumber}\n`;

    if (tenant.mapsUrl) {
      locationInfo += `\n🗺️ Google Maps:\n${tenant.mapsUrl}\n`;
    }

    locationInfo += `\nKami tunggu kunjungan Anda! 😊`;

    return locationInfo;
  }

  /**
   * Get price quote with financing options
   */
  private async getPriceQuote(args: any): Promise<string> {
    const car = await this.context.prisma.car.findFirst({
      where: {
        tenantId: this.context.tenantId,
        displayCode: args.displayCode.toUpperCase(),
        status: 'available',
      },
      select: {
        displayCode: true,
        publicName: true,
        brand: true,
        model: true,
        year: true,
        price: true,
      },
    });

    if (!car) {
      return `Mobil dengan kode ${args.displayCode} tidak ditemukan atau tidak tersedia.`;
    }

    const price = Number(car.price);
    const carName = car.publicName || `${car.brand} ${car.model} ${car.year}`;

    // Calculate financing options
    const dpOptions = [20, 30, 40]; // Down payment percentages
    const tenors = [1, 2, 3, 4, 5]; // Years

    let quoteInfo = `💰 Informasi Harga ${car.displayCode}\n`;
    quoteInfo += `${carName}\n\n`;
    quoteInfo += `Harga: ${this.formatPrice(price)}\n\n`;

    quoteInfo += `💳 Opsi Pembayaran:\n\n`;
    quoteInfo += `1️⃣ Cash/Tunai\n`;
    quoteInfo += `   Harga: ${this.formatPrice(price)}\n`;
    quoteInfo += `   (Harga bisa nego! 😊)\n\n`;

    quoteInfo += `2️⃣ Kredit/Cicilan\n`;
    quoteInfo += `   Beberapa pilihan DP:\n\n`;

    for (const dpPercent of dpOptions) {
      const dp = price * (dpPercent / 100);
      const loanAmount = price - dp;

      quoteInfo += `   • DP ${dpPercent}% = ${this.formatPrice(dp)}\n`;

      // Calculate for 3-year tenor as example
      const tenor3y = 3;
      const monthlyRate = 0.10 / 12; // 10% annual rate
      const months = tenor3y * 12;
      const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
                            (Math.pow(1 + monthlyRate, months) - 1);

      quoteInfo += `     Cicilan 3 tahun: ${this.formatPrice(Math.round(monthlyPayment))}/bulan\n\n`;
    }

    quoteInfo += `📋 Catatan:\n`;
    quoteInfo += `- Tersedia tenor 1-5 tahun\n`;
    quoteInfo += `- Bunga kompetitif 8-12% per tahun\n`;
    quoteInfo += `- Proses approval cepat\n`;
    quoteInfo += `- Harga masih bisa nego! 💪\n\n`;
    quoteInfo += `Mau kalkulasi dengan DP dan tenor tertentu? Silakan beritahu saya! 😊`;

    return quoteInfo;
  }

  /**
   * Get financing information
   */
  private async getFinancingInfo(args: any): Promise<string> {
    const { carPrice, downPayment, downPaymentPercent, tenure } = args;

    // Calculate down payment
    let dp = downPayment || 0;
    if (!dp && downPaymentPercent) {
      dp = (carPrice * downPaymentPercent) / 100;
    }

    // Default to 20% if not provided
    if (!dp) {
      dp = carPrice * 0.2;
    }

    const loanAmount = carPrice - dp;

    // Interest rates (approximate - adjust based on actual financing terms)
    const interestRateMap: { [key: number]: number } = {
      1: 0.08,  // 8% per year
      2: 0.09,  // 9% per year
      3: 0.10,  // 10% per year
      4: 0.11,  // 11% per year
      5: 0.12,  // 12% per year
    };

    const annualRate = interestRateMap[tenure] || 0.10;
    const monthlyRate = annualRate / 12;
    const months = tenure * 12;

    // Calculate monthly payment using amortization formula
    const monthlyPayment = loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1);

    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - loanAmount;

    return `
Financing Calculation:

Car Price: Rp ${carPrice.toLocaleString('id-ID')}
Down Payment: Rp ${dp.toLocaleString('id-ID')} (${((dp/carPrice)*100).toFixed(1)}%)
Loan Amount: Rp ${loanAmount.toLocaleString('id-ID')}

Tenure: ${tenure} year(s) (${months} months)
Interest Rate: ${(annualRate * 100).toFixed(1)}% per year
Monthly Payment: Rp ${Math.round(monthlyPayment).toLocaleString('id-ID')}

Total Payment: Rp ${Math.round(totalPayment).toLocaleString('id-ID')}
Total Interest: Rp ${Math.round(totalInterest).toLocaleString('id-ID')}

Note: These are approximate calculations. Actual rates may vary based on credit approval and financing institution.
    `.trim();
  }

  /**
   * Schedule test drive
   */
  private async scheduleTestDrive(args: any): Promise<string> {
    const { displayCode, preferredDate, preferredTime, customerName, notes } = args;

    // Verify car exists
    const car = await this.context.prisma.car.findFirst({
      where: {
        tenantId: this.context.tenantId,
        displayCode: displayCode.toUpperCase(),
        status: 'available',
      },
      select: {
        id: true,
        displayCode: true,
        publicName: true,
        brand: true,
        model: true,
        year: true,
      },
    });

    if (!car) {
      return `Mobil dengan kode ${displayCode} tidak ditemukan atau tidak tersedia.`;
    }

    const carName = car.publicName || `${car.brand} ${car.model} ${car.year}`;

    // Update lead with test drive request info
    const testDriveNote = `
[Test Drive Request - ${new Date().toISOString()}]
Mobil: ${car.displayCode} (${carName})
Nama: ${customerName || 'Belum disebutkan'}
Tanggal: ${preferredDate}
Waktu: ${preferredTime || 'Belum ditentukan'}
Catatan: ${notes || 'Tidak ada'}
---
    `.trim();

    // Get current lead
    const currentLead = await this.context.prisma.lead.findUnique({
      where: { id: this.context.leadId },
      select: { notes: true, status: true, tags: true, carId: true },
    });

    // Update lead with test drive info
    await this.context.prisma.lead.update({
      where: { id: this.context.leadId },
      data: {
        notes: currentLead?.notes
          ? `${currentLead.notes}\n\n${testDriveNote}`
          : testDriveNote,
        status: 'hot', // Mark as hot lead
        carId: car.id, // Associate with the car
        tags: {
          set: Array.from(new Set([
            ...(currentLead?.tags || []),
            'test_drive_requested'
          ])),
        },
      },
    });

    console.log(`[TOOL_EXECUTOR] Test drive request added to lead #${this.context.leadId}`);

    return `✅ Test Drive Dijadwalkan!

🚗 Mobil: ${car.displayCode} (${carName})
📅 Tanggal: ${preferredDate}
⏰ Waktu: ${preferredTime || 'Akan dikonfirmasi'}
${customerName ? `👤 Nama: ${customerName}\n` : ''}
Tim sales kami akan segera menghubungi Anda untuk konfirmasi jadwal test drive.

Terima kasih sudah tertarik dengan mobil kami! 😊`;
  }

  /**
   * Helper: Format price in Indonesian Rupiah
   */
  private formatPrice(price: number | bigint): string {
    const priceNum = typeof price === 'bigint' ? Number(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(priceNum);
  }

  /**
   * Check trade-in availability
   */
  private async checkTradeIn(args: any): Promise<string> {
    const { currentCarBrand, currentCarModel, currentCarYear } = args;

    let tradeInInfo = `🔄 Ya, kami menerima tukar tambah mobil lama Anda!\n\n`;

    if (currentCarBrand || currentCarModel || currentCarYear) {
      const carDescription = [currentCarBrand, currentCarModel, currentCarYear]
        .filter(Boolean)
        .join(' ');

      tradeInInfo += `Untuk ${carDescription} Anda:\n`;
      tradeInInfo += `✓ Kami akan melakukan inspeksi menyeluruh\n`;
      tradeInInfo += `✓ Penilaian biasanya 30-60 menit\n`;
      tradeInInfo += `✓ Kami pertimbangkan kondisi, KM, riwayat servis\n\n`;
    }

    tradeInInfo += `📋 Proses Tukar Tambah:\n`;
    tradeInInfo += `1. Jadwalkan inspeksi (bisa langsung datang)\n`;
    tradeInInfo += `2. Bawa mobil & dokumen (STNK, BPKB jika ada)\n`;
    tradeInInfo += `3. Tim kami akan survey & beri estimasi harga\n`;
    tradeInInfo += `4. Nilai tukar tambah bisa jadi DP mobil baru\n\n`;

    tradeInInfo += `💡 Keuntungan Tukar Tambah:\n`;
    tradeInInfo += `• Proses cepat & mudah\n`;
    tradeInInfo += `• Harga terbaik untuk mobil lama Anda\n`;
    tradeInInfo += `• Langsung bisa upgrade ke mobil baru\n`;
    tradeInInfo += `• Dokumen kami bantu urus\n\n`;

    tradeInInfo += `Mau jadwalkan inspeksi? Atau ada pertanyaan lain? 😊`;

    // Update lead with trade-in interest
    await this.context.prisma.lead.update({
      where: { id: this.context.leadId },
      data: {
        tags: {
          push: 'trade_in_interest',
        },
      },
    }).catch(err => {
      console.error('[TOOL_EXECUTOR] Failed to update lead tags:', err);
    });

    return tradeInInfo;
  }
}
