/**
 * Admin Bot Handler
 * Handles admin and sales commands via WhatsApp
 */

import { PrismaClient, UserType } from '../../../../generated/prisma';
import { StateManager } from '../state-manager';
import { UploadFlow } from './upload-flow';
import { StatusCommand } from './commands/status';
import { ListCommand } from './commands/list';
import { UploadCommand } from './commands/upload';

export class AdminBotHandler {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private uploadFlow: UploadFlow;
  private statusCommand: StatusCommand;
  private listCommand: ListCommand;
  private uploadCommand: UploadCommand;

  constructor(prisma: PrismaClient, stateManager: StateManager) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.uploadFlow = new UploadFlow(prisma, stateManager);
    this.statusCommand = new StatusCommand(prisma);
    this.listCommand = new ListCommand(prisma);
    this.uploadCommand = new UploadCommand(prisma, stateManager, this.uploadFlow);
  }

  /**
   * Handle admin/sales message
   */
  async handleMessage(
    tenant: any,
    userPhone: string,
    userType: UserType,
    message: string,
    media?: { url: string; type: string }
  ): Promise<string> {
    try {
      // Check if user is in upload flow
      const isInFlow = await this.stateManager.isInFlow(tenant.id, userPhone);

      if (isInFlow) {
        const currentFlow = await this.stateManager.getCurrentFlow(tenant.id, userPhone);

        if (currentFlow === 'upload_car') {
          return await this.uploadFlow.processStep(tenant, userPhone, message, media);
        }
      }

      // Parse command
      const command = this.parseCommand(message);

      // Handle commands
      switch (command.name) {
        case 'upload':
          return await this.uploadCommand.execute(tenant, userPhone, command.args);

        case 'status':
          return await this.statusCommand.execute(tenant, command.args);

        case 'list':
          return await this.listCommand.execute(tenant, command.args);

        case 'help':
          return this.buildHelpResponse(userType);

        case 'cancel':
          await this.stateManager.resetState(tenant.id, userPhone);
          return '❌ Proses dibatalkan. Ketik /help untuk lihat perintah lain.';

        default:
          // If not a command, show help
          return this.buildHelpResponse(userType);
      }

    } catch (error) {
      console.error('Error in admin bot handler:', error);
      return '❌ Terjadi kesalahan. Silakan coba lagi atau ketik /help untuk bantuan.';
    }
  }

  /**
   * Parse command from message
   */
  private parseCommand(message: string): { name: string; args: string[] } {
    const normalized = message.trim().toLowerCase();

    // Check if starts with /
    if (!normalized.startsWith('/')) {
      return { name: '', args: [] };
    }

    // Remove / and split
    const parts = normalized.slice(1).split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);

    return { name, args };
  }

  /**
   * Build help response
   */
  private buildHelpResponse(userType: UserType): string {
    let response = `🤖 *Admin Bot Commands*\n\n`;

    response += `📋 *Manajemen Mobil:*\n`;
    response += `/upload - Upload mobil baru via WA\n`;
    response += `/status [plat] [status] - Update status mobil\n`;
    response += `/list [status] - Lihat daftar mobil\n`;
    response += `/cancel - Batalkan proses\n\n`;

    response += `💡 *Contoh:*\n`;
    response += `• /upload\n`;
    response += `• /status B1234XYZ sold\n`;
    response += `• /list available\n\n`;

    if (userType === 'admin') {
      response += `👑 *Admin Only:*\n`;
      response += `• Semua perintah di atas\n`;
      response += `• Edit dan hapus mobil\n`;
      response += `• Lihat analytics\n\n`;
    }

    response += `❓ Butuh bantuan? Ketik /help`;

    return response;
  }

  /**
   * Verify user has permission
   */
  private async verifyPermission(
    tenantId: number,
    userPhone: string,
    requiredRole: 'admin' | 'sales'
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          tenantId,
          OR: [
            { phone: { contains: userPhone.slice(-10) } },
            { whatsappNumber: { contains: userPhone.slice(-10) } }
          ],
          status: 'active'
        }
      });

      if (!user) return false;

      if (requiredRole === 'admin') {
        return user.role === 'owner' || user.role === 'admin';
      }

      return true; // Sales can do everything sales-related

    } catch (error) {
      console.error('Error verifying permission:', error);
      return false;
    }
  }
}
