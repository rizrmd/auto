/**
 * List Command
 * Handles /list command to show car inventory
 */

import { PrismaClient, CarStatus } from '../../../../../generated/prisma';

export class ListCommand {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Execute list command
   * Usage: /list
   * Usage: /list available
   * Usage: /list sold
   */
  async execute(tenant: any, args: string[]): Promise<string> {
    try {
      const statusFilter = args[0]?.toLowerCase() as CarStatus | undefined;

      // Validate status if provided
      if (statusFilter) {
        const validStatuses: CarStatus[] = ['available', 'sold', 'booking', 'draft'];
        if (!validStatuses.includes(statusFilter)) {
          return `❌ Status tidak valid. Pilih: available, sold, booking, draft`;
        }
      }

      // Build query - exclude deleted cars
      const where: any = {
        tenantId: tenant.id,
        status: { not: 'deleted' as any }
      };
      if (statusFilter) {
        where.status = statusFilter;
      }

      // Get cars
      const cars = await this.prisma.car.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20, // Limit to 20 cars
        select: {
          displayCode: true,
          publicName: true,
          brand: true,
          model: true,
          year: true,
          color: true,
          transmission: true,
          price: true,
          status: true,
          plateNumber: true,
          createdAt: true
        }
      });

      if (cars.length === 0) {
        return `📋 Tidak ada mobil${statusFilter ? ` dengan status "${statusFilter}"` : ''}.`;
      }

      // Format response
      let response = `📋 *Daftar Mobil${statusFilter ? ` (${statusFilter.toUpperCase()})` : ''}*\n`;
      response += `Total: ${cars.length} mobil\n\n`;

      cars.forEach((car, index) => {
        const price = Number(car.price) / 1000000;
        response += `${index + 1}. ${car.displayCode} - ${car.brand} ${car.model}\n`;
        response += `   📅 ${car.year} | 💰 ${price.toFixed(0)}jt | ⚙️ ${car.transmission}\n`;
        response += `   🔖 ${car.status.toUpperCase()}`;

        if (car.plateNumber) {
          response += ` | 🚗 ${car.plateNumber}`;
        }

        response += `\n\n`;
      });

      // Show stats
      const stats = await this.getStats(tenant.id);
      response += `📊 *Statistik:*\n`;
      response += `• Available: ${stats.available}\n`;
      response += `• Sold: ${stats.sold}\n`;
      response += `• Booking: ${stats.booking}\n`;
      response += `• Draft: ${stats.draft}\n`;

      return response;

    } catch (error) {
      console.error('Error listing cars:', error);
      return '❌ Gagal mengambil data. Silakan coba lagi.';
    }
  }

  /**
   * Get inventory statistics
   */
  private async getStats(tenantId: number): Promise<{
    available: number;
    sold: number;
    booking: number;
    draft: number;
  }> {
    // Exclude deleted cars from stats
    const [available, sold, booking, draft] = await Promise.all([
      this.prisma.car.count({ where: { tenantId, status: 'available' } }),
      this.prisma.car.count({ where: { tenantId, status: 'sold' } }),
      this.prisma.car.count({ where: { tenantId, status: 'booking' } }),
      this.prisma.car.count({ where: { tenantId, status: 'draft' } })
    ]);

    return { available, sold, booking, draft };
  }
}
