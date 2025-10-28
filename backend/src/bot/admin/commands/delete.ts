/**
 * Delete Command
 * Handles /delete command to soft-delete cars from catalog
 */

import { PrismaClient } from '../../../../../generated/prisma';
import { StateManager } from '../../state-manager';

export class DeleteCommand {
  private prisma: PrismaClient;
  private stateManager: StateManager;

  constructor(prisma: PrismaClient, stateManager: StateManager) {
    this.prisma = prisma;
    this.stateManager = stateManager;
  }

  /**
   * Execute delete command
   * Usage: /delete #H01
   * Usage: /delete #H01, #H02, #H03
   */
  async execute(tenant: any, userPhone: string, args: string[]): Promise<string> {
    if (args.length === 0) {
      return `❌ *Format tidak valid*

Contoh:
• /delete #H01
• /delete #H01, #H02, #H03

Gunakan kode mobil (contoh: #H01) yang terlihat di katalog.`;
    }

    try {
      // Parse car codes (support comma-separated)
      const rawCodes = args.join(' ');
      const codes = this.parseCarCodes(rawCodes);

      if (codes.length === 0) {
        return `❌ Tidak ada kode mobil yang valid.

Format: /delete #H01 atau /delete #H01, #H02`;
      }

      // Find cars by codes
      const cars = await this.findCarsByCodes(tenant.id, codes);

      if (cars.length === 0) {
        return `❌ Tidak ada mobil yang ditemukan dengan kode: ${codes.join(', ')}`;
      }

      // Check if some codes not found
      const foundCodes = cars.map(car => car.displayCode);
      const notFoundCodes = codes.filter(code => !foundCodes.includes(code));

      // Build confirmation message
      let response = `🗑️ *Konfirmasi Hapus Katalog:*\n\n`;

      cars.forEach(car => {
        response += `${car.displayCode} - ${car.brand} ${car.model}\n`;
      });

      if (notFoundCodes.length > 0) {
        response += `\n⚠️ Tidak ditemukan: ${notFoundCodes.join(', ')}\n`;
      }

      response += `\n❗ Hapus *${cars.length} mobil* dari katalog?\n\n`;
      response += `Ketik *"ya"* untuk konfirmasi hapus\n`;
      response += `Ketik *"batal"* untuk cancel`;

      // Store pending delete in state
      await this.stateManager.startFlow(
        tenant.id,
        userPhone,
        'delete_confirmation',
        {
          carIds: cars.map(car => car.id),
          carCodes: cars.map(car => car.displayCode)
        },
        'admin'
      );

      return response;

    } catch (error) {
      console.error('Error in delete command:', error);
      return '❌ Gagal memproses delete. Silakan coba lagi.';
    }
  }

  /**
   * Process confirmation (called from handler)
   */
  async processConfirmation(
    tenant: any,
    userPhone: string,
    message: string,
    context: any
  ): Promise<string> {
    const normalized = message.trim().toLowerCase();

    if (normalized === 'batal' || normalized === 'cancel') {
      await this.stateManager.resetState(tenant.id, userPhone);
      return '❌ Penghapusan dibatalkan.';
    }

    if (normalized !== 'ya' && normalized !== 'yes') {
      return `⚠️ Ketik *"ya"* untuk konfirmasi hapus atau *"batal"* untuk cancel.`;
    }

    try {
      const carIds = context.carIds || [];
      const carCodes = context.carCodes || [];

      if (carIds.length === 0) {
        await this.stateManager.resetState(tenant.id, userPhone);
        return '❌ Data tidak valid. Silakan coba lagi.';
      }

      // Soft delete: Update status to 'deleted'
      const result = await this.prisma.car.updateMany({
        where: {
          id: { in: carIds },
          tenantId: tenant.id
        },
        data: {
          status: 'deleted' as any, // Soft delete
          deletedAt: new Date()
        }
      });

      // Reset state
      await this.stateManager.resetState(tenant.id, userPhone);

      return `✅ *${result.count} mobil berhasil dihapus!*

${carCodes.join(', ')}

Mobil dihapus dari katalog publik.`;

    } catch (error) {
      console.error('Error deleting cars:', error);
      await this.stateManager.resetState(tenant.id, userPhone);
      return '❌ Gagal menghapus mobil. Silakan coba lagi.';
    }
  }

  /**
   * Parse car codes from raw input
   * Support: #H01, #H02, #H03 or #H01 #H02 or mixed
   */
  private parseCarCodes(raw: string): string[] {
    // Remove extra spaces, split by comma or space
    const parts = raw
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .split(/[,\s]+/);

    // Filter valid codes (starts with # followed by alphanumeric)
    const codes = parts
      .filter(part => /^#[A-Z0-9]+$/.test(part))
      .map(code => code.trim());

    // Remove duplicates
    return Array.from(new Set(codes));
  }

  /**
   * Find cars by display codes
   */
  private async findCarsByCodes(tenantId: number, codes: string[]): Promise<any[]> {
    return await this.prisma.car.findMany({
      where: {
        tenantId,
        displayCode: { in: codes },
        status: { not: 'deleted' as any } // Don't delete already deleted cars
      },
      select: {
        id: true,
        displayCode: true,
        brand: true,
        model: true,
        year: true,
        publicName: true
      },
      orderBy: {
        displayCode: 'asc'
      }
    });
  }
}
