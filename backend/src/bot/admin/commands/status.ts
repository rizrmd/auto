/**
 * Status Command
 * Handles /status command to update car status
 */

import { PrismaClient, CarStatus } from '../../../../../generated/prisma';

export class StatusCommand {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Execute status command
   * Usage: /status B1234XYZ sold
   * Usage: /status #A01 available
   */
  async execute(tenant: any, args: string[]): Promise<string> {
    if (args.length < 2) {
      return `❌ *Format tidak valid*

Contoh:
• /status B1234XYZ sold
• /status #A01 available

Status: available, sold, booking, draft`;
    }

    const identifier = args[0]; // Plate or display code
    const newStatus = args[1].toLowerCase() as CarStatus;

    // Validate status
    const validStatuses: CarStatus[] = ['available', 'sold', 'booking', 'draft'];
    if (!validStatuses.includes(newStatus)) {
      return `❌ Status tidak valid. Pilih: available, sold, booking, draft`;
    }

    try {
      // Find car by plate or display code
      const car = await this.findCar(tenant.id, identifier);

      if (!car) {
        return `❌ Mobil dengan identifier "${identifier}" tidak ditemukan.`;
      }

      // Update status
      const updated = await this.prisma.car.update({
        where: { id: car.id },
        data: {
          status: newStatus,
          soldAt: newStatus === 'sold' ? new Date() : null
        }
      });

      return `✅ *Status Updated*

Mobil: ${updated.publicName}
Status: ${updated.status.toUpperCase()}
${updated.soldAt ? `Terjual: ${updated.soldAt.toLocaleDateString('id-ID')}` : ''}`;

    } catch (error) {
      console.error('Error updating status:', error);
      return '❌ Gagal update status. Silakan coba lagi.';
    }
  }

  /**
   * Find car by plate number or display code
   */
  private async findCar(tenantId: number, identifier: string): Promise<any> {
    const normalized = identifier.toUpperCase().replace(/\s+/g, '');

    // Try by display code first
    if (normalized.startsWith('#')) {
      return await this.prisma.car.findFirst({
        where: {
          tenantId,
          displayCode: normalized
        }
      });
    }

    // Try by plate number
    return await this.prisma.car.findFirst({
      where: {
        tenantId,
        OR: [
          { plateNumberClean: normalized },
          { plateNumber: { contains: identifier } }
        ]
      }
    });
  }
}
