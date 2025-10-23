/**
 * Main Bot Orchestrator
 * Routes incoming WhatsApp messages to customer or admin bot
 */

import { PrismaClient, UserType } from '../../../generated/prisma';
import { StateManager } from './state-manager';
import { CustomerBotHandler } from './customer/handler';
import { AdminBotHandler } from './admin/handler';
import { MessageSender } from '../whatsapp/message-sender';

interface IncomingMessage {
  device: string; // Showroom WA number (628xxx)
  sender: string; // User phone (628xxx)
  message: string;
  media?: {
    url: string;
    type: 'image' | 'video' | 'document';
  };
  timestamp?: Date;
}

interface BotResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class BotOrchestrator {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private customerBot: CustomerBotHandler;
  private adminBot: AdminBotHandler;
  private messageSender: MessageSender;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.stateManager = new StateManager(prisma);
    this.customerBot = new CustomerBotHandler(prisma, this.stateManager);
    this.adminBot = new AdminBotHandler(prisma, this.stateManager);
    this.messageSender = new MessageSender();
  }

  /**
   * Process incoming WhatsApp message
   */
  async processMessage(message: IncomingMessage): Promise<BotResponse> {
    try {
      // 1. Identify tenant by device (WhatsApp number)
      const tenant = await this.identifyTenant(message.device);
      if (!tenant) {
        console.error(`Tenant not found for device: ${message.device}`);
        return {
          success: false,
          error: 'Tenant not found'
        };
      }

      // Check if bot is enabled
      if (!tenant.whatsappBotEnabled) {
        console.log(`Bot disabled for tenant: ${tenant.name}`);
        return {
          success: false,
          error: 'Bot disabled'
        };
      }

      // 2. Determine user type (customer, admin, sales)
      const userType = await this.identifyUserType(tenant.id, message.sender);

      // 3. Route to appropriate bot
      let response: string;

      if (userType === 'customer') {
        response = await this.customerBot.handleMessage(
          tenant,
          message.sender,
          message.message,
          message.media
        );
      } else {
        // Admin or sales
        response = await this.adminBot.handleMessage(
          tenant,
          message.sender,
          userType,
          message.message,
          message.media
        );
      }

      // 4. Send response via WhatsApp
      await this.messageSender.sendMessage(
        message.device,
        message.sender,
        response
      );

      return {
        success: true,
        message: response
      };

    } catch (error) {
      console.error('Error processing message:', error);

      // Send error message to user
      try {
        await this.messageSender.sendMessage(
          message.device,
          message.sender,
          'Maaf, terjadi kesalahan. Silakan coba lagi dalam beberapa saat.'
        );
      } catch (sendError) {
        console.error('Error sending error message:', sendError);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Identify tenant by WhatsApp device number
   */
  private async identifyTenant(device: string): Promise<any> {
    // Normalize phone number (remove +, spaces)
    const normalized = device.replace(/[^0-9]/g, '');

    return await this.prisma.tenant.findFirst({
      where: {
        whatsappNumber: {
          contains: normalized.slice(-10) // Match last 10 digits
        }
      }
    });
  }

  /**
   * Determine if sender is customer, admin, or sales
   */
  private async identifyUserType(tenantId: number, senderPhone: string): Promise<UserType> {
    // Check if sender is a registered user (admin/sales)
    const user = await this.prisma.user.findFirst({
      where: {
        tenantId,
        OR: [
          { phone: { contains: senderPhone.slice(-10) } },
          { whatsappNumber: { contains: senderPhone.slice(-10) } }
        ],
        status: 'active'
      }
    });

    if (user) {
      return user.role === 'owner' || user.role === 'admin' ? 'admin' : 'sales';
    }

    // Default to customer
    return 'customer';
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
