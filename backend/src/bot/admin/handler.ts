/**
 * Admin Bot Handler
 * Handles admin and sales commands via WhatsApp
 */

import { PrismaClient, UserType } from '../../../../generated/prisma';
import { StateManager } from '../state-manager';
import { UploadFlowV2 } from './upload-flow-v2';
import { StatusCommand } from './commands/status';
import { ListCommand } from './commands/list';
import { UploadCommand } from './commands/upload';
import { DeleteCommand } from './commands/delete';

export class AdminBotHandler {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private uploadFlowV2: UploadFlowV2;
  private statusCommand: StatusCommand;
  private listCommand: ListCommand;
  private uploadCommand: UploadCommand;
  private deleteCommand: DeleteCommand;

  constructor(prisma: PrismaClient, stateManager: StateManager) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.uploadFlowV2 = new UploadFlowV2(prisma, stateManager);
    this.statusCommand = new StatusCommand(prisma);
    this.listCommand = new ListCommand(prisma);
    this.uploadCommand = new UploadCommand(prisma, stateManager, this.uploadFlowV2);
    this.deleteCommand = new DeleteCommand(prisma, stateManager);
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
      // Parse command first to check for control commands
      const command = this.parseCommand(message);

      // Handle /cancel command (priority - works even in flow)
      if (command.name === 'cancel') {
        await this.stateManager.resetState(tenant.id, userPhone);
        return '❌ Proses dibatalkan. Ketik /help untuk lihat perintah lain.';
      }

      // Check if user is in flow
      const isInFlow = await this.stateManager.isInFlow(tenant.id, userPhone);

      if (isInFlow) {
        const currentFlow = await this.stateManager.getCurrentFlow(tenant.id, userPhone);

        if (currentFlow === 'upload_car_v2') {
          // Allow /upload to restart flow
          if (command.name === 'upload') {
            await this.stateManager.resetState(tenant.id, userPhone);
            return await this.uploadCommand.execute(tenant, userPhone, message);
          }

          // Continue with current flow
          return await this.uploadFlowV2.processStep(tenant, userPhone, message, media);
        }

        if (currentFlow === 'delete_confirmation') {
          // Handle delete confirmation
          const state = await this.stateManager.getState(tenant.id, userPhone);
          return await this.deleteCommand.processConfirmation(
            tenant,
            userPhone,
            message,
            state?.context || {}
          );
        }
      }

      // Handle commands
      switch (command.name) {
        case 'upload':
          return await this.uploadCommand.execute(tenant, userPhone, message);

        case 'status':
          return await this.statusCommand.execute(tenant, command.args);

        case 'list':
          return await this.listCommand.execute(tenant, command.args);

        case 'delete':
        case 'hapus':
          return await this.deleteCommand.execute(tenant, userPhone, command.args);

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

    response += `📋 *Upload Mobil (Single Message):*\n`;
    response += `/upload [brand] [model] [tahun] harga [harga] km [km] [fitur]\n\n`;

    response += `*Contoh:*\n`;
    response += `• /upload Toyota Avanza 2020 harga 185jt km 45000 velg racing\n`;
    response += `• /upload Honda Jazz 2019 hitam matic harga 187jt km 88000 tangan pertama\n`;
    response += `• /upload Mercedes C300 2015 silver harga 350jt sunroof\n\n`;

    response += `🤖 *AI akan otomatis:*\n`;
    response += `✨ Generate copywriting menarik\n`;
    response += `✨ Buat deskripsi produk profesional\n`;
    response += `✨ Enhancement kondisi notes\n\n`;

    response += `📸 *Setelah data diparsing:*\n`;
    response += `Bot akan minta foto (1-10 foto)\n`;
    response += `Ketik "selesai" untuk lanjut konfirmasi\n\n`;

    response += `📋 *Command Lain:*\n`;
    response += `/status [plat] [status] - Update status mobil\n`;
    response += `/list [status] - Lihat daftar mobil\n`;
    response += `/delete #H01, #H02 - Hapus katalog (multiple)\n`;
    response += `/cancel - Batalkan proses\n\n`;

    if (userType === 'admin') {
      response += `👑 *Admin Only:*\n`;
      response += `• Semua perintah di atas\n`;
      response += `• AI-powered copywriting\n`;
      response += `• Instant catalog upload\n\n`;
    }

    response += `❓ Ketik /help untuk lihat menu ini`;

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
