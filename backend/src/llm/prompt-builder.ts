/**
 * Prompt Builder
 * Builds contextual prompts for LLM with car inventory data
 */

interface PromptContext {
  tenant: any;
  cars: any[];
  message: string;
  history?: Array<{ sender: string; message: string }>;
  queryType?: 'general' | 'price';
}

export class PromptBuilder {
  /**
   * Build customer support prompt
   */
  buildCustomerPrompt(context: PromptContext): string {
    const { tenant, cars, message, history, queryType } = context;

    let prompt = `Anda adalah asisten virtual untuk showroom mobil bekas "${tenant.name}" yang profesional dan membantu.

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
