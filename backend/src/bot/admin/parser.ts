/**
 * Car Parser
 * Parses car information from text messages
 */

export class CarParser {
  /**
   * Parse brand and model
   * Example: "Toyota Avanza 1.3 G" -> { brand: "Toyota", model: "Avanza 1.3 G" }
   */
  parseBrandModel(text: string): { brand?: string; model?: string } {
    const brands = [
      'Toyota', 'Honda', 'Daihatsu', 'Mitsubishi', 'Suzuki', 'Nissan',
      'Mazda', 'Isuzu', 'Ford', 'Chevrolet', 'Hyundai', 'Kia', 'BMW',
      'Mercedes-Benz', 'Mercy', 'Audi', 'Volkswagen', 'VW'
    ];

    const normalized = text.trim();

    for (const brand of brands) {
      const regex = new RegExp(`^(${brand})\\s+(.+)`, 'i');
      const match = normalized.match(regex);

      if (match) {
        return {
          brand: this.normalizeBrand(match[1]),
          model: match[2].trim()
        };
      }
    }

    return {};
  }

  /**
   * Parse year and color
   * Example: "2020 Hitam Metalik" -> { year: 2020, color: "Hitam Metalik" }
   */
  parseYearColor(text: string): { year?: number; color?: string } {
    const normalized = text.trim();

    // Extract year (2010-2025)
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    if (!yearMatch) return {};

    const year = parseInt(yearMatch[1]);
    if (year < 2000 || year > 2025) return {};

    // Extract color (everything after year)
    const colorPart = normalized.replace(yearMatch[0], '').trim();
    if (!colorPart) return { year };

    return {
      year,
      color: this.capitalizeWords(colorPart)
    };
  }

  /**
   * Parse transmission and KM
   * Example: "Manual 45000" -> { transmission: "Manual", km: 45000 }
   */
  parseTransmissionKm(text: string): { transmission?: 'Manual' | 'Matic'; km?: number } {
    const normalized = text.toLowerCase().trim();

    // Extract transmission
    let transmission: 'Manual' | 'Matic' | undefined;

    if (normalized.includes('matic') || normalized.includes('automatic') || normalized.includes('at')) {
      transmission = 'Matic';
    } else if (normalized.includes('manual') || normalized.includes('mt')) {
      transmission = 'Manual';
    }

    // Extract KM (number only)
    const kmMatch = normalized.match(/\d+/);
    const km = kmMatch ? parseInt(kmMatch[0]) : undefined;

    if (!transmission || !km) return {};

    return { transmission, km };
  }

  /**
   * Parse price
   * Example: "185000000" -> { price: 185000000 }
   * Example: "185jt" -> { price: 185000000 }
   */
  parsePrice(text: string): { price?: number } {
    const normalized = text.toLowerCase().replace(/\s+/g, '');

    // Remove "rp" prefix if exists
    const cleaned = normalized.replace(/^rp\.?/i, '');

    // Check for "jt" or "juta" suffix
    if (cleaned.includes('jt') || cleaned.includes('juta')) {
      const match = cleaned.match(/(\d+)/);
      if (match) {
        const juta = parseInt(match[1]);
        return { price: juta * 1000000 };
      }
    }

    // Direct number
    const match = cleaned.match(/(\d+)/);
    if (match) {
      const price = parseInt(match[1]);
      // Assume if < 1000, it's in millions (e.g., 185 means 185jt)
      if (price < 1000) {
        return { price: price * 1000000 };
      }
      return { price };
    }

    return {};
  }

  /**
   * Parse plate number
   * Example: "B 1234 XYZ" -> { plateNumber: "B 1234 XYZ", plateNumberClean: "B1234XYZ" }
   */
  parsePlateNumber(text: string): { plateNumber?: string; plateNumberClean?: string } {
    const normalized = text.trim().toUpperCase();

    // Indonesian plate format: [Letter] [Numbers] [Letters]
    const match = normalized.match(/([A-Z]{1,2})\s*(\d{1,4})\s*([A-Z]{1,3})/);

    if (match) {
      const plateNumber = `${match[1]} ${match[2]} ${match[3]}`;
      const plateNumberClean = `${match[1]}${match[2]}${match[3]}`;

      return {
        plateNumber,
        plateNumberClean
      };
    }

    return {};
  }

  /**
   * Parse features (comma-separated)
   * Example: "Velg racing, Spoiler, Interior rapi" -> ["Velg racing", "Spoiler", "Interior rapi"]
   */
  parseFeatures(text: string): string[] {
    return text
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0)
      .map(f => this.capitalizeWords(f));
  }

  /**
   * Normalize brand name
   */
  private normalizeBrand(brand: string): string {
    const brandMap: { [key: string]: string } = {
      'mercy': 'Mercedes-Benz',
      'vw': 'Volkswagen'
    };

    const lower = brand.toLowerCase();
    return brandMap[lower] || this.capitalizeWords(brand);
  }

  /**
   * Capitalize words
   */
  private capitalizeWords(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Parse stock code
   * Example: "STK-001" -> "STK-001"
   */
  parseStockCode(text: string): string | undefined {
    const match = text.match(/STK-\d{3,}/i);
    return match ? match[0].toUpperCase() : undefined;
  }

  /**
   * Parse fuel type
   * Example: "Bensin" -> "Bensin"
   */
  parseFuelType(text: string): string | undefined {
    const normalized = text.toLowerCase();

    if (normalized.includes('bensin') || normalized.includes('gasoline')) {
      return 'Bensin';
    } else if (normalized.includes('diesel') || normalized.includes('solar')) {
      return 'Diesel';
    } else if (normalized.includes('hybrid')) {
      return 'Hybrid';
    } else if (normalized.includes('listrik') || normalized.includes('electric')) {
      return 'Listrik';
    }

    return undefined;
  }
}
