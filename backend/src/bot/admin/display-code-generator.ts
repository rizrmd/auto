/**
 * Display Code Generator
 * Generates unique display codes like #A01, #A02, #V01, etc.
 */

import { PrismaClient } from '../../../../generated/prisma';

export class DisplayCodeGenerator {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate display code for car
   * Format: #[PREFIX][NUMBER]
   *
   * Prefix logic:
   * - A: Avanza
   * - X: Xenia
   * - V: Veloz
   * - H: Honda (all models)
   * - D: Daihatsu (non-Xenia)
   * - M: Mitsubishi
   * - S: Suzuki
   * - O: Other brands
   *
   * Number: Auto-increment starting from 01
   */
  async generateCode(tenantId: number, brand: string, model: string): Promise<string> {
    // Determine prefix
    const prefix = this.determinePrefix(brand, model);

    // Get highest number for this prefix
    const existingCodes = await this.prisma.car.findMany({
      where: {
        tenantId,
        displayCode: {
          startsWith: `#${prefix}`
        }
      },
      select: {
        displayCode: true
      },
      orderBy: {
        displayCode: 'desc'
      },
      take: 1
    });

    let nextNumber = 1;

    if (existingCodes.length > 0) {
      const lastCode = existingCodes[0].displayCode;
      const lastNumber = parseInt(lastCode.slice(-2));
      nextNumber = lastNumber + 1;
    }

    // Format: #A01, #A02, etc
    const code = `#${prefix}${nextNumber.toString().padStart(2, '0')}`;

    // Check if code already exists (collision check)
    const collision = await this.prisma.car.findFirst({
      where: {
        tenantId,
        displayCode: code
      }
    });

    if (collision) {
      // If collision, increment and try again
      return this.generateCode(tenantId, brand, model);
    }

    return code;
  }

  /**
   * Determine prefix based on brand and model
   */
  private determinePrefix(brand: string, model: string): string {
    const brandLower = brand.toLowerCase();
    const modelLower = model.toLowerCase();

    // Toyota
    if (brandLower === 'toyota') {
      if (modelLower.includes('avanza') && !modelLower.includes('veloz')) {
        return 'A';
      } else if (modelLower.includes('veloz')) {
        return 'V';
      } else if (modelLower.includes('rush')) {
        return 'R';
      } else if (modelLower.includes('innova')) {
        return 'I';
      } else if (modelLower.includes('fortuner')) {
        return 'F';
      } else {
        return 'T'; // Toyota other
      }
    }

    // Daihatsu
    if (brandLower === 'daihatsu') {
      if (modelLower.includes('xenia')) {
        return 'X';
      } else if (modelLower.includes('terios')) {
        return 'T';
      } else {
        return 'D'; // Daihatsu other
      }
    }

    // Honda
    if (brandLower === 'honda') {
      if (modelLower.includes('hr-v') || modelLower.includes('hrv')) {
        return 'H';
      } else if (modelLower.includes('br-v') || modelLower.includes('brv')) {
        return 'B';
      } else if (modelLower.includes('cr-v') || modelLower.includes('crv')) {
        return 'C';
      } else {
        return 'H'; // Honda other
      }
    }

    // Mitsubishi
    if (brandLower === 'mitsubishi') {
      if (modelLower.includes('xpander')) {
        return 'X';
      } else if (modelLower.includes('pajero')) {
        return 'P';
      } else {
        return 'M'; // Mitsubishi other
      }
    }

    // Suzuki
    if (brandLower === 'suzuki') {
      if (modelLower.includes('ertiga')) {
        return 'E';
      } else {
        return 'S'; // Suzuki other
      }
    }

    // Nissan
    if (brandLower === 'nissan') {
      return 'N';
    }

    // BMW
    if (brandLower === 'bmw') {
      return 'B';
    }

    // Mercedes
    if (brandLower === 'mercedes' || brandLower === 'mercy') {
      return 'M';
    }

    // Default: Other
    return 'O';
  }

  /**
   * Validate display code format
   */
  isValidCode(code: string): boolean {
    return /^#[A-Z]\d{2}$/.test(code);
  }

  /**
   * Get all codes for tenant
   */
  async getAllCodes(tenantId: number): Promise<string[]> {
    const cars = await this.prisma.car.findMany({
      where: { tenantId },
      select: { displayCode: true },
      orderBy: { displayCode: 'asc' }
    });

    return cars.map(c => c.displayCode);
  }

  /**
   * Check if code is available
   */
  async isCodeAvailable(tenantId: number, code: string): Promise<boolean> {
    const existing = await this.prisma.car.findFirst({
      where: {
        tenantId,
        displayCode: code
      }
    });

    return !existing;
  }
}
