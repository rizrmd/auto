/**
 * Response Builder
 * Formats bot responses for common queries (cached responses)
 */

export class ResponseBuilder {
  /**
   * Build greeting response
   */
  buildGreetingResponse(tenant: any): string {
    const hour = new Date().getHours();
    let greeting = 'Selamat pagi';

    if (hour >= 12 && hour < 15) {
      greeting = 'Selamat siang';
    } else if (hour >= 15 && hour < 18) {
      greeting = 'Selamat sore';
    } else if (hour >= 18) {
      greeting = 'Selamat malam';
    }

    return `${greeting}! 👋 Terima kasih sudah menghubungi *${tenant.name}*

Saya adalah asisten virtual yang siap membantu Anda 24/7 untuk:
🚗 Informasi stock mobil bekas
💰 Harga dan spesifikasi
📍 Lokasi showroom
🤝 Proses pembelian

Ada yang bisa saya bantu? Silakan tanya langsung atau ketik mobil yang Anda cari ya! 😊`;
  }

  /**
   * Build location response (cached)
   */
  buildLocationResponse(tenant: any): string {
    let response = `📍 *Lokasi Showroom ${tenant.name}*\n\n`;

    if (tenant.address) {
      response += `Alamat: ${tenant.address}\n`;
    }

    if (tenant.city) {
      response += `Kota: ${tenant.city}\n`;
    }

    if (tenant.mapsUrl) {
      response += `\nGoogle Maps: ${tenant.mapsUrl}\n`;
    }

    // Business hours
    if (tenant.businessHours) {
      response += `\n⏰ *Jam Operasional:*\n`;
      const hours = tenant.businessHours as any;

      const days = {
        mon: 'Senin',
        tue: 'Selasa',
        wed: 'Rabu',
        thu: 'Kamis',
        fri: 'Jumat',
        sat: 'Sabtu',
        sun: 'Minggu'
      };

      for (const [key, label] of Object.entries(days)) {
        if (hours[key]) {
          const time = hours[key] === 'closed' ? 'Tutup' : hours[key];
          response += `${label}: ${time}\n`;
        }
      }
    }

    response += `\n📞 Hubungi kami: ${tenant.phone}`;

    if (tenant.whatsappNumber) {
      response += `\n💬 WhatsApp: ${tenant.whatsappNumber}`;
    }

    response += `\n\nDitunggu kedatangannya ya! 🙏`;

    return response;
  }

  /**
   * Build negotiation response
   */
  buildNegotiationResponse(tenant: any): string {
    return `💰 Untuk nego harga, saya akan hubungkan Anda dengan sales kami ya!

Harga yang tertera sudah harga terbaik kami, tapi tetap bisa dibicarakan langsung dengan sales untuk:
✅ Cash keras (pembayaran tunai)
✅ Trade-in (tukar tambah)
✅ Kredit dengan DP rendah

Mau saya hubungkan dengan sales sekarang? Atau mau datang langsung ke showroom kami di ${tenant.address}? 😊`;
  }

  /**
   * Build test drive response
   */
  buildTestDriveResponse(tenant: any): string {
    return `🚗 *Test Drive & Survey Unit*

Silakan datang langsung ke showroom kami untuk:
✅ Lihat unit secara langsung
✅ Test drive
✅ Cek kondisi interior & eksterior
✅ Konsultasi dengan sales

📍 Alamat: ${tenant.address || 'Lihat di Google Maps'}
⏰ Buka setiap hari (kecuali Minggu)
📞 Konfirmasi: ${tenant.phone}

Sebaiknya konfirmasi dulu sebelum datang supaya unit yang Anda incar sudah kami siapkan ya! 😊

Mau saya hubungkan dengan sales untuk jadwalkan kunjungan?`;
  }

  /**
   * Build error response
   */
  buildErrorResponse(tenant: any): string {
    return `Maaf ada kendala teknis sementara 🙏

Silakan hubungi kami langsung:
📞 ${tenant.phone}
💬 WhatsApp: ${tenant.whatsappNumber || tenant.phone}

Atau coba tanya lagi dalam beberapa saat ya!`;
  }

  /**
   * Build "no cars found" response
   */
  buildNoResultsResponse(tenant: any, query?: string): string {
    let response = `Maaf, untuk saat ini stock ${query || 'yang Anda cari'} belum ada 😔\n\n`;

    response += `Tapi jangan khawatir! Kami punya beberapa alternatif lain yang menarik 😊\n\n`;
    response += `Atau bisa ceritakan lebih detail mobil yang Anda cari:\n`;
    response += `• Brand & model\n`;
    response += `• Tahun\n`;
    response += `• Budget\n`;
    response += `• Transmisi (Manual/Matic)\n\n`;

    response += `Saya akan carikan yang paling sesuai! 🔍`;

    return response;
  }

  /**
   * Format price in IDR
   */
  formatPrice(price: bigint | number): string {
    const numPrice = typeof price === 'bigint' ? Number(price) : price;
    return `Rp ${(numPrice / 1000000).toFixed(0)} juta`;
  }

  /**
   * Format car details
   */
  formatCarDetails(car: any): string {
    let details = `🚗 *${car.publicName}*\n\n`;

    details += `💰 Harga: ${this.formatPrice(car.price)}\n`;
    details += `📅 Tahun: ${car.year}\n`;
    details += `🎨 Warna: ${car.color}\n`;
    details += `⚙️ Transmisi: ${car.transmission}\n`;
    details += `🛣️ Kilometer: ${car.km.toLocaleString()} km\n`;

    if (car.fuelType) {
      details += `⛽ Bahan Bakar: ${car.fuelType}\n`;
    }

    if (car.keyFeatures && car.keyFeatures.length > 0) {
      details += `\n✨ *Kelebihan:*\n`;
      car.keyFeatures.forEach((feature: string) => {
        details += `• ${feature}\n`;
      });
    }

    if (car.conditionNotes) {
      details += `\n📝 ${car.conditionNotes}\n`;
    }

    details += `\n📋 Kode: ${car.displayCode}`;

    return details;
  }

  /**
   * Format multiple cars list
   */
  formatCarsList(cars: any[], tenant: any): string {
    if (cars.length === 0) {
      return this.buildNoResultsResponse(tenant);
    }

    let response = `Saya menemukan ${cars.length} mobil yang mungkin Anda cari:\n\n`;

    cars.forEach((car, index) => {
      response += `${index + 1}. ${car.publicName}\n`;
      response += `   💰 ${this.formatPrice(car.price)} | `;
      response += `📅 ${car.year} | `;
      response += `⚙️ ${car.transmission} | `;
      response += `🛣️ ${car.km.toLocaleString()} km\n`;
      response += `   Kode: ${car.displayCode}\n\n`;
    });

    response += `Mau info lebih detail yang mana? Sebutkan kode mobilnya ya (misal: ${cars[0].displayCode}) 😊\n\n`;
    response += `Atau langsung hubungi sales kami untuk diskusi lebih lanjut!`;

    return response;
  }

  /**
   * Build rate limit response
   */
  buildRateLimitResponse(): string {
    return `Maaf, terlalu banyak pesan dalam waktu singkat 🙏

Mohon tunggu sebentar ya, atau hubungi kami langsung untuk respon lebih cepat! 😊`;
  }

  /**
   * Build business hours closed response
   */
  buildClosedResponse(tenant: any): string {
    return `Terima kasih sudah menghubungi *${tenant.name}* 😊

Maaf, kami sedang tutup. Silakan hubungi kami kembali pada jam operasional atau tinggalkan pesan, kami akan segera balas!

Atau hubungi langsung:
📞 ${tenant.phone}

Terima kasih! 🙏`;
  }
}
