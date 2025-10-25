/**
 * Prompt Builder
 * Builds contextual prompts for LLM with car inventory data
 * Now supports function calling / tool usage
 */

interface PromptContext {
  tenant: any;
  cars: any[];
  message: string;
  history?: Array<{ sender: string; message: string }>;
  queryType?: 'general' | 'price';
}

interface ToolResult {
  toolName: string;
  success: boolean;
  data?: any;
  error?: string;
}

export class PromptBuilder {
  /**
   * Build customer support prompt
   * Now includes tool usage instructions
   */
  buildCustomerPrompt(context: PromptContext): string {
    const { tenant, cars, message, history, queryType } = context;

    let prompt = `Anda adalah asisten virtual untuk showroom mobil bekas "${tenant.name}" yang profesional dan membantu.

TOOLS YANG TERSEDIA:
Anda memiliki akses ke tools/fungsi yang dapat membantu customer:
- sendCarPhotos: Kirim foto mobil ke customer (GUNAKAN PROAKTIF saat customer bertanya tentang mobil tertentu atau menunjukkan minat)
- searchCars: Cari mobil berdasarkan kriteria spesifik
- scheduleVisit: Bantu customer membuat jadwal kunjungan ke showroom
- calculateFinancing: Hitung estimasi kredit/cicilan

KAPAN MENGGUNAKAN TOOLS:
✅ Gunakan sendCarPhotos saat:
  - Customer bertanya tentang mobil spesifik (contoh: "Ada info tentang Avanza 2019?")
  - Customer menunjukkan minat serius (contoh: "Boleh lihat mobil yang kode A01?")
  - Setelah memberikan info mobil, kirim foto untuk meningkatkan engagement

✅ Gunakan searchCars saat:
  - Customer mencari mobil dengan kriteria spesifik (contoh: "Cari mobil matic dibawah 150 juta")
  - Perlu filter lebih detail dari data yang tersedia

✅ Gunakan calculateFinancing saat:
  - Customer bertanya tentang cicilan atau kredit
  - Diskusi tentang harga dan pembayaran

⚠️ JANGAN gunakan tools untuk:
  - Pertanyaan umum yang bisa dijawab langsung
  - Sapaan atau small talk

CONTOH PENGGUNAAN TOOLS:
Customer: "Ada Honda Jazz yang bagus?"
Bot: [Gunakan searchCars untuk cari Jazz, lalu sendCarPhotos untuk kirim foto]

Customer: "Boleh info detail tentang mobil kode A01?"
Bot: [Gunakan sendCarPhotos untuk kirim foto A01, lalu berikan info detail]

INFORMASI SHOWROOM:
- Nama: ${tenant.name}
- Alamat: ${tenant.address || 'Tidak tersedia'}
- Telepon: ${tenant.phone}
- WhatsApp: ${tenant.whatsappNumber}
${tenant.businessHours ? this.formatBusinessHours(tenant.businessHours) : ''}

`;

    // Add available cars
    if (cars.length > 0) {
      prompt += `MOBIL YANG TERSEDIA:\n`;
      cars.forEach((car, index) => {
        prompt += `${index + 1}. ${car.publicName}\n`;
        prompt += `   - Kode: ${car.displayCode}\n`;
        prompt += `   - Harga: Rp ${this.formatPrice(car.price)}\n`;
        prompt += `   - KM: ${car.km.toLocaleString()} km\n`;
        prompt += `   - Transmisi: ${car.transmission}\n`;

        if (car.fuelType) {
          prompt += `   - Bahan Bakar: ${car.fuelType}\n`;
        }

        if (car.keyFeatures && car.keyFeatures.length > 0) {
          prompt += `   - Fitur: ${car.keyFeatures.join(', ')}\n`;
        }

        if (car.conditionNotes) {
          prompt += `   - Kondisi: ${car.conditionNotes}\n`;
        }

        prompt += `\n`;
      });
    } else {
      prompt += `MOBIL YANG TERSEDIA: Saat ini tidak ada stock yang sesuai dengan kriteria.\n\n`;
    }

    // Add conversation history
    if (history && history.length > 0) {
      prompt += `RIWAYAT PERCAKAPAN:\n`;
      history.forEach(msg => {
        prompt += `${msg.sender === 'customer' ? 'Customer' : 'Bot'}: ${msg.message}\n`;
      });
      prompt += `\n`;
    }

    // Add guidelines
    prompt += `PANDUAN RESPON:
1. Jawab dengan bahasa Indonesia yang ramah dan profesional
2. HANYA gunakan data mobil yang ada di daftar di atas
3. JANGAN mengarang atau membuat data palsu
4. Jika tidak ada stock yang sesuai, tawarkan alternatif atau tanyakan kriteria lain
5. Untuk nego harga, arahkan untuk hubungi sales langsung
6. Selalu akhiri dengan pertanyaan atau ajakan bertindak (CTA)
7. Gunakan emoji secukupnya (1-2 per pesan)
8. Format harga dalam jutaan (contoh: 185 juta, bukan 185.000.000)
9. Jangan gunakan markdown atau format khusus (plain text saja)
10. Maksimal 200 kata per respons
11. GUNAKAN TOOLS SECARA PROAKTIF untuk meningkatkan customer experience
12. Jika customer bertanya tentang mobil spesifik, otomatis kirim foto dengan sendCarPhotos
13. Setelah menggunakan tools, berikan konteks alami tentang apa yang telah dilakukan
14. Tools dapat digunakan bersamaan untuk memberikan pengalaman terbaik

`;

    if (queryType === 'price') {
      prompt += `FOKUS: Customer menanyakan harga. Berikan detail harga dan spesifikasi yang jelas.\n\n`;
    }

    prompt += `PERTANYAAN CUSTOMER: "${message}"

INSTRUKSI: Jawab pertanyaan customer dengan ramah, informatif, dan berdasarkan data di atas. Jangan gunakan format markdown.

JAWABAN:`;

    return prompt;
  }

  /**
   * Build tool-aware prompt with specific tool descriptions
   * Use this when you want to control which tools are available for a specific interaction
   *
   * Example usage:
   * const prompt = promptBuilder.buildToolAwarePrompt(context, ['sendCarPhotos', 'searchCars']);
   *
   * @param context - The conversation context
   * @param availableTools - Array of tool names that should be available
   */
  buildToolAwarePrompt(context: PromptContext, availableTools: string[]): string {
    const { tenant, cars, message, history, queryType } = context;

    // Tool descriptions with detailed usage guidelines
    const toolDescriptions: Record<string, string> = {
      sendCarPhotos: `
Tool: sendCarPhotos(carCode: string)
- Kirim foto mobil ke customer via WhatsApp
- Gunakan saat: Customer bertanya tentang mobil spesifik, menunjukkan minat, atau meminta foto
- Contoh: Customer: "Ada info Avanza 2019?" → Panggil sendCarPhotos('A01')
- After calling: Referensikan dalam respons "Saya sudah kirimkan foto mobilnya ya!"`,

      searchCars: `
Tool: searchCars(filters: { brand?: string, maxPrice?: number, transmission?: string, minYear?: number })
- Cari mobil dengan filter spesifik dari database
- Gunakan saat: Customer punya kriteria detail (merek, harga, transmisi, tahun)
- Contoh: Customer: "Ada matic dibawah 150 juta?" → searchCars({ transmission: 'Automatic', maxPrice: 150000000 })
- After calling: Jelaskan hasil pencarian secara natural`,

      scheduleVisit: `
Tool: scheduleVisit(date: string, time: string, customerName: string)
- Jadwalkan kunjungan customer ke showroom
- Gunakan saat: Customer ingin lihat mobil langsung atau test drive
- Contoh: Customer: "Bisa test drive besok?" → scheduleVisit('2025-10-26', '10:00', 'Budi')
- After calling: Konfirmasi jadwal dengan ramah`,

      calculateFinancing: `
Tool: calculateFinancing(carPrice: number, downPayment: number, tenure: number)
- Hitung estimasi cicilan kredit mobil
- Gunakan saat: Customer tanya cicilan, kredit, atau DP
- Contoh: Customer: "Cicilan berapa kalo DP 30 juta?" → calculateFinancing(185000000, 30000000, 36)
- After calling: Jelaskan hasil kalkulasi dengan jelas`,

      checkAvailability: `
Tool: checkAvailability(carCode: string)
- Cek status ketersediaan mobil real-time
- Gunakan saat: Customer serius ingin beli atau booking
- After calling: Info status dengan akurat`,

      getCarDetails: `
Tool: getCarDetails(carCode: string)
- Ambil detail lengkap mobil termasuk riwayat service, pajak, dll
- Gunakan saat: Customer minta info detail lengkap
- After calling: Berikan info detail secara terstruktur`
    };

    let prompt = `Anda adalah asisten virtual untuk showroom mobil bekas "${tenant.name}" yang profesional dan membantu.

TOOLS AKTIF UNTUK PERCAKAPAN INI:
`;

    // Add only available tools
    availableTools.forEach(tool => {
      if (toolDescriptions[tool]) {
        prompt += toolDescriptions[tool] + '\n';
      }
    });

    prompt += `
STRATEGI PENGGUNAAN TOOLS:
1. BE PROACTIVE: Jika customer menunjukkan minat, langsung gunakan tools tanpa diminta
2. COMBINE TOOLS: Gunakan beberapa tools sekaligus untuk pengalaman lebih baik
   Contoh: searchCars + sendCarPhotos untuk memberikan hasil lengkap dengan foto
3. NATURAL FOLLOW-UP: Setelah tool execution, jelaskan apa yang sudah dilakukan
   Contoh: "Saya sudah kirimkan 3 foto Avanza 2019 nya ya! Mobilnya kondisi istimewa..."
4. CONTEXT-AWARE: Gunakan tools berdasarkan intent customer, bukan hanya keyword

INFORMASI SHOWROOM:
- Nama: ${tenant.name}
- Alamat: ${tenant.address || 'Tidak tersedia'}
- Telepon: ${tenant.phone}
- WhatsApp: ${tenant.whatsappNumber}
${tenant.businessHours ? this.formatBusinessHours(tenant.businessHours) : ''}

`;

    // Add available cars
    if (cars.length > 0) {
      prompt += `MOBIL YANG TERSEDIA:\n`;
      cars.forEach((car, index) => {
        prompt += `${index + 1}. ${car.publicName}\n`;
        prompt += `   - Kode: ${car.displayCode}\n`;
        prompt += `   - Harga: Rp ${this.formatPrice(car.price)}\n`;
        prompt += `   - KM: ${car.km.toLocaleString()} km\n`;
        prompt += `   - Transmisi: ${car.transmission}\n`;

        if (car.fuelType) {
          prompt += `   - Bahan Bakar: ${car.fuelType}\n`;
        }

        if (car.keyFeatures && car.keyFeatures.length > 0) {
          prompt += `   - Fitur: ${car.keyFeatures.join(', ')}\n`;
        }

        if (car.conditionNotes) {
          prompt += `   - Kondisi: ${car.conditionNotes}\n`;
        }

        prompt += `\n`;
      });
    } else {
      prompt += `MOBIL YANG TERSEDIA: Saat ini tidak ada stock yang sesuai dengan kriteria.\n\n`;
    }

    // Add conversation history
    if (history && history.length > 0) {
      prompt += `RIWAYAT PERCAKAPAN:\n`;
      history.forEach(msg => {
        prompt += `${msg.sender === 'customer' ? 'Customer' : 'Bot'}: ${msg.message}\n`;
      });
      prompt += `\n`;
    }

    // Add guidelines
    prompt += `PANDUAN RESPON:
1. Jawab dengan bahasa Indonesia yang ramah dan profesional
2. PROAKTIF menggunakan tools untuk meningkatkan customer experience
3. Setelah menggunakan tools, SELALU referensikan action yang dilakukan
4. HANYA gunakan data mobil yang ada di daftar di atas
5. JANGAN mengarang atau membuat data palsu
6. Jika tidak ada stock yang sesuai, tawarkan alternatif atau tanyakan kriteria lain
7. Untuk nego harga, arahkan untuk hubungi sales langsung
8. Selalu akhiri dengan pertanyaan atau ajakan bertindak (CTA)
9. Gunakan emoji secukupnya (1-2 per pesan)
10. Format harga dalam jutaan (contoh: 185 juta, bukan 185.000.000)
11. Jangan gunakan markdown atau format khusus (plain text saja)
12. Maksimal 200 kata per respons

`;

    if (queryType === 'price') {
      prompt += `FOKUS: Customer menanyakan harga. Berikan detail harga dan spesifikasi yang jelas.\n\n`;
    }

    prompt += `PERTANYAAN CUSTOMER: "${message}"

INSTRUKSI:
1. Analisis intent customer
2. Tentukan tools mana yang perlu digunakan (bisa lebih dari satu)
3. Gunakan tools jika relevan
4. Berikan respons yang natural dengan mereferensikan tool actions
5. Jangan gunakan format markdown

JAWABAN:`;

    return prompt;
  }

  /**
   * Build context for follow-up response after tool execution
   * This helps the LLM provide natural responses referencing the tool actions
   *
   * Example usage:
   * const toolResults = [
   *   { toolName: 'sendCarPhotos', success: true, data: { photoCount: 3, carCode: 'A01' } }
   * ];
   * const context = promptBuilder.buildToolResultContext(toolResults);
   *
   * @param toolResults - Array of tool execution results
   */
  buildToolResultContext(toolResults: ToolResult[]): string {
    if (!toolResults || toolResults.length === 0) {
      return '';
    }

    let context = `\n\nTOOL EXECUTION RESULTS:\n`;
    context += `Anda baru saja menjalankan tools berikut. Sekarang berikan respons natural yang mereferensikan action ini:\n\n`;

    toolResults.forEach(result => {
      if (result.success) {
        switch (result.toolName) {
          case 'sendCarPhotos':
            context += `✅ sendCarPhotos: Berhasil mengirim ${result.data?.photoCount || 'beberapa'} foto mobil ${result.data?.carCode || ''}\n`;
            context += `   → Sekarang: Beritahu customer tentang foto yang sudah dikirim, highlight fitur menarik dari foto\n\n`;
            break;

          case 'searchCars':
            context += `✅ searchCars: Menemukan ${result.data?.cars?.length || 0} mobil sesuai kriteria\n`;
            context += `   → Sekarang: Jelaskan hasil pencarian, highlight mobil terbaik, tawarkan kirim foto\n\n`;
            break;

          case 'scheduleVisit':
            context += `✅ scheduleVisit: Jadwal kunjungan berhasil dibuat untuk ${result.data?.date} pukul ${result.data?.time}\n`;
            context += `   → Sekarang: Konfirmasi jadwal, berikan petunjuk ke showroom, tawarkan bantuan lain\n\n`;
            break;

          case 'calculateFinancing':
            context += `✅ calculateFinancing: Cicilan sekitar Rp ${this.formatPrice(result.data?.monthlyPayment || 0)}/bulan\n`;
            context += `   → Sekarang: Jelaskan hasil kalkulasi, breakdown DP dan cicilan, tawarkan simulasi lain\n\n`;
            break;

          case 'checkAvailability':
            context += `✅ checkAvailability: Mobil ${result.data?.carCode} status: ${result.data?.status}\n`;
            context += `   → Sekarang: Informasikan status, jika ready ajak untuk test drive/survey\n\n`;
            break;

          case 'getCarDetails':
            context += `✅ getCarDetails: Detail lengkap mobil ${result.data?.carCode} berhasil diambil\n`;
            context += `   → Sekarang: Berikan info detail penting (riwayat service, pajak, kondisi), highlight value proposition\n\n`;
            break;

          default:
            context += `✅ ${result.toolName}: Berhasil dijalankan\n`;
            context += `   → Sekarang: Informasikan hasil ke customer dengan natural\n\n`;
        }
      } else {
        context += `❌ ${result.toolName}: Gagal - ${result.error}\n`;
        context += `   → Sekarang: Minta maaf dengan sopan, tawarkan solusi alternatif\n\n`;
      }
    });

    context += `PENTING:
- Jangan ulangi detail tool execution secara teknis
- Berikan respons NATURAL seperti sales profesional
- Fokus pada VALUE untuk customer
- Reference tool actions secara subtle (contoh: "Saya sudah kirimkan fotonya ya!" bukan "Tool sendCarPhotos executed successfully")
- Lanjutkan percakapan dengan CTA yang relevan\n`;

    return context;
  }

  /**
   * Build admin upload assistant prompt
   */
  buildUploadAssistantPrompt(step: string, userInput: string): string {
    return `Anda adalah asisten upload mobil. Bantu parse input user untuk step: ${step}

Input user: "${userInput}"

Ekstrak informasi yang relevan dan berikan dalam format JSON.`;
  }

  /**
   * Format business hours
   */
  private formatBusinessHours(hours: any): string {
    const days = {
      mon: 'Senin',
      tue: 'Selasa',
      wed: 'Rabu',
      thu: 'Kamis',
      fri: 'Jumat',
      sat: 'Sabtu',
      sun: 'Minggu'
    };

    let formatted = '- Jam Operasional:\n';

    for (const [key, label] of Object.entries(days)) {
      if (hours[key]) {
        const time = hours[key] === 'closed' ? 'Tutup' : hours[key];
        formatted += `  ${label}: ${time}\n`;
      }
    }

    return formatted;
  }

  /**
   * Format price
   */
  private formatPrice(price: bigint | number): string {
    const numPrice = typeof price === 'bigint' ? Number(price) : price;
    return `${(numPrice / 1000000).toFixed(1)} juta`;
  }

  /**
   * Build summary prompt
   */
  buildSummaryPrompt(messages: string[]): string {
    return `Summarize the following conversation in Indonesian (max 100 words):

${messages.join('\n')}

Summary:`;
  }

  /**
   * Build sentiment analysis prompt
   */
  buildSentimentPrompt(message: string): string {
    return `Analyze the sentiment of this message: "${message}"

Respond with one word: positive, negative, or neutral.`;
  }

  /**
   * Validate prompt length
   */
  isValidPromptLength(prompt: string): boolean {
    // Max ~30k tokens = ~120k characters
    return prompt.length < 120000;
  }
}
