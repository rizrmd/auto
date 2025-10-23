/**
 * Intent Recognizer
 * Classifies customer message intent using pattern matching and keywords
 */

export type IntentType =
  | 'inquiry'       // General car inquiry
  | 'price'         // Price question
  | 'location'      // Location/address question
  | 'negotiation'   // Price negotiation
  | 'greeting'      // Hello, hi, etc
  | 'test_drive'    // Test drive request
  | 'unknown';      // Unknown intent

export interface Intent {
  type: IntentType;
  confidence: number;
  entities: {
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    transmission?: 'Manual' | 'Matic';
    priceRange?: { min?: number; max?: number };
    displayCode?: string; // #A01, #V02, etc
  };
}

export class IntentRecognizer {
  private readonly BRAND_PATTERNS = [
    'toyota', 'honda', 'daihatsu', 'mitsubishi', 'suzuki', 'nissan',
    'mazda', 'isuzu', 'ford', 'chevrolet', 'hyundai', 'kia', 'bmw',
    'mercy', 'mercedes', 'audi', 'vw', 'volkswagen'
  ];

  private readonly MODEL_PATTERNS = [
    'avanza', 'xenia', 'veloz', 'rush', 'terios', 'innova', 'fortuner',
    'hrv', 'brv', 'crv', 'jazz', 'brio', 'mobilio', 'city', 'civic',
    'xpander', 'pajero', 'outlander', 'ertiga', 'baleno', 'ignis',
    'swift', 'carry', 'apv', 'grand livina', 'x-trail', 'serena'
  ];

  /**
   * Recognize intent from message
   */
  recognizeIntent(message: string): Intent {
    const normalized = message.toLowerCase().trim();

    // Check for greeting
    if (this.isGreeting(normalized)) {
      return {
        type: 'greeting',
        confidence: 0.95,
        entities: {}
      };
    }

    // Check for location query
    if (this.isLocationQuery(normalized)) {
      return {
        type: 'location',
        confidence: 0.9,
        entities: {}
      };
    }

    // Check for negotiation
    if (this.isNegotiation(normalized)) {
      return {
        type: 'negotiation',
        confidence: 0.85,
        entities: this.extractEntities(normalized)
      };
    }

    // Check for price query
    if (this.isPriceQuery(normalized)) {
      return {
        type: 'price',
        confidence: 0.85,
        entities: this.extractEntities(normalized)
      };
    }

    // Check for test drive
    if (this.isTestDrive(normalized)) {
      return {
        type: 'test_drive',
        confidence: 0.85,
        entities: this.extractEntities(normalized)
      };
    }

    // Check for general inquiry
    if (this.isInquiry(normalized)) {
      return {
        type: 'inquiry',
        confidence: 0.8,
        entities: this.extractEntities(normalized)
      };
    }

    // Default: unknown
    return {
      type: 'unknown',
      confidence: 0.5,
      entities: this.extractEntities(normalized)
    };
  }

  /**
   * Check if message is a greeting
   */
  private isGreeting(message: string): boolean {
    const greetingPatterns = [
      /^(halo|hai|hi|hello|selamat pagi|selamat siang|selamat sore|selamat malam|assalamualaikum)/,
      /^(p|om|gan|boss|bro|kak|mas|mbak)/
    ];

    return greetingPatterns.some(pattern => pattern.test(message));
  }

  /**
   * Check if message is location query
   */
  private isLocationQuery(message: string): boolean {
    const locationKeywords = [
      'lokasi', 'alamat', 'dimana', 'di mana', 'maps', 'google maps',
      'tempat', 'showroom', 'cabang', 'daerah mana', 'jam buka', 'buka jam'
    ];

    return locationKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is negotiation
   */
  private isNegotiation(message: string): boolean {
    const negoKeywords = [
      'nego', 'nawar', 'discount', 'diskon', 'kurang', 'bisa kurang',
      'harga nett', 'harga pas', 'cash keras', 'terakhir', 'best price',
      'harga mati', 'turun', 'murah'
    ];

    return negoKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is price query
   */
  private isPriceQuery(message: string): boolean {
    const priceKeywords = [
      'harga', 'berapa', 'price', 'budget', 'biaya', 'bayar',
      'dp', 'cicil', 'kredit', 'cash', 'tunai'
    ];

    return priceKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is test drive request
   */
  private isTestDrive(message: string): boolean {
    const testDriveKeywords = [
      'test drive', 'coba', 'lihat unit', 'lihat mobil', 'survey',
      'mau liat', 'mau lihat', 'kesana', 'ke sana', 'datang'
    ];

    return testDriveKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Check if message is general inquiry
   */
  private isInquiry(message: string): boolean {
    const inquiryKeywords = [
      'ada', 'ready', 'tersedia', 'stock', 'stok', 'punya',
      'cari', 'butuh', 'mau', 'pengen', 'info', 'tanya'
    ];

    // Also check for brand/model mentions
    const hasBrand = this.BRAND_PATTERNS.some(brand => message.includes(brand));
    const hasModel = this.MODEL_PATTERNS.some(model => message.includes(model));
    const hasKeyword = inquiryKeywords.some(keyword => message.includes(keyword));

    return hasKeyword || hasBrand || hasModel;
  }

  /**
   * Extract entities from message
   */
  private extractEntities(message: string): Intent['entities'] {
    const entities: Intent['entities'] = {};

    // Extract brand
    for (const brand of this.BRAND_PATTERNS) {
      if (message.includes(brand)) {
        entities.brand = this.capitalizeBrand(brand);
        break;
      }
    }

    // Extract model
    for (const model of this.MODEL_PATTERNS) {
      if (message.includes(model)) {
        entities.model = this.capitalizeModel(model);
        break;
      }
    }

    // Extract year (2015-2025)
    const yearMatch = message.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year >= 2010 && year <= 2025) {
        entities.year = year;
      }
    }

    // Extract color
    const colors = ['hitam', 'putih', 'silver', 'abu', 'merah', 'biru', 'hijau'];
    for (const color of colors) {
      if (message.includes(color)) {
        entities.color = color;
        break;
      }
    }

    // Extract transmission
    if (message.includes('matic') || message.includes('automatic') || message.includes('at')) {
      entities.transmission = 'Matic';
    } else if (message.includes('manual') || message.includes('mt')) {
      entities.transmission = 'Manual';
    }

    // Extract display code (#A01, #V02, etc)
    const codeMatch = message.match(/#([A-Z]\d{2})/i);
    if (codeMatch) {
      entities.displayCode = `#${codeMatch[1].toUpperCase()}`;
    }

    // Extract price range
    const priceMatch = message.match(/(\d+)\s*(jt|juta|m)/gi);
    if (priceMatch) {
      const prices = priceMatch.map(p => {
        const num = parseInt(p.replace(/[^0-9]/g, ''));
        return num * 1000000; // Convert juta to full number
      });

      if (prices.length === 1) {
        entities.priceRange = { max: prices[0] };
      } else if (prices.length >= 2) {
        entities.priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices)
        };
      }
    }

    return entities;
  }

  /**
   * Capitalize brand name
   */
  private capitalizeBrand(brand: string): string {
    const brandMap: { [key: string]: string } = {
      'toyota': 'Toyota',
      'honda': 'Honda',
      'daihatsu': 'Daihatsu',
      'mitsubishi': 'Mitsubishi',
      'suzuki': 'Suzuki',
      'nissan': 'Nissan',
      'mazda': 'Mazda',
      'isuzu': 'Isuzu',
      'ford': 'Ford',
      'chevrolet': 'Chevrolet',
      'hyundai': 'Hyundai',
      'kia': 'Kia',
      'bmw': 'BMW',
      'mercy': 'Mercedes-Benz',
      'mercedes': 'Mercedes-Benz',
      'audi': 'Audi',
      'vw': 'Volkswagen',
      'volkswagen': 'Volkswagen'
    };

    return brandMap[brand] || brand;
  }

  /**
   * Capitalize model name
   */
  private capitalizeModel(model: string): string {
    return model.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
}
