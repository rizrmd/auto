/**
 * Conversation State Manager
 * Manages bot conversation states for multi-step flows
 */

import { PrismaClient, UserType } from '../../../generated/prisma';

export interface ConversationContext {
  // Upload car flow
  uploadStep?: number;
  carData?: {
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    transmission?: 'Manual' | 'Matic';
    km?: number;
    price?: bigint;
    plateNumber?: string;
    stockCode?: string;
    keyFeatures?: string[];
    photos?: string[];
    fuelType?: string;
    conditionNotes?: string;
  };

  // Credit calculator flow
  calcStep?: number;
  calcData?: {
    carPrice?: number;
    downPayment?: number;
    tenure?: number;
  };

  // Other flows
  [key: string]: any;
}

export class StateManager {
  private prisma: PrismaClient;
  private readonly DEFAULT_EXPIRY_MINUTES = 30;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get or create conversation state
   */
  async getState(
    tenantId: number,
    userPhone: string,
    userType: UserType
  ): Promise<{
    currentFlow: string;
    currentStep: number;
    context: ConversationContext;
  }> {
    // Clean up expired states
    await this.cleanupExpiredStates();

    // Get existing state
    let state = await this.prisma.conversationState.findUnique({
      where: {
        tenantId_userPhone: {
          tenantId,
          userPhone
        }
      }
    });

    // Create new state if doesn't exist or expired
    if (!state || new Date() > state.expiresAt) {
      state = await this.prisma.conversationState.upsert({
        where: {
          tenantId_userPhone: {
            tenantId,
            userPhone
          }
        },
        create: {
          tenantId,
          userPhone,
          userType,
          currentFlow: 'idle',
          currentStep: 0,
          context: {},
          expiresAt: this.getExpiryDate()
        },
        update: {
          currentFlow: 'idle',
          currentStep: 0,
          context: {},
          expiresAt: this.getExpiryDate()
        }
      });
    }

    return {
      currentFlow: state.currentFlow,
      currentStep: state.currentStep,
      context: state.context as ConversationContext
    };
  }

  /**
   * Update conversation state
   */
  async updateState(
    tenantId: number,
    userPhone: string,
    updates: {
      currentFlow?: string;
      currentStep?: number;
      context?: ConversationContext;
    }
  ): Promise<void> {
    await this.prisma.conversationState.update({
      where: {
        tenantId_userPhone: {
          tenantId,
          userPhone
        }
      },
      data: {
        ...updates,
        expiresAt: this.getExpiryDate(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Reset state to idle
   */
  async resetState(tenantId: number, userPhone: string): Promise<void> {
    await this.prisma.conversationState.update({
      where: {
        tenantId_userPhone: {
          tenantId,
          userPhone
        }
      },
      data: {
        currentFlow: 'idle',
        currentStep: 0,
        context: {},
        expiresAt: this.getExpiryDate(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Start a new flow
   */
  async startFlow(
    tenantId: number,
    userPhone: string,
    flowName: string,
    initialContext: ConversationContext = {}
  ): Promise<void> {
    await this.updateState(tenantId, userPhone, {
      currentFlow: flowName,
      currentStep: 0,
      context: initialContext
    });
  }

  /**
   * Move to next step in flow
   */
  async nextStep(
    tenantId: number,
    userPhone: string,
    contextUpdate: ConversationContext = {}
  ): Promise<void> {
    const state = await this.getState(tenantId, userPhone, 'customer');

    await this.updateState(tenantId, userPhone, {
      currentStep: state.currentStep + 1,
      context: {
        ...state.context,
        ...contextUpdate
      }
    });
  }

  /**
   * Check if user is in a flow
   */
  async isInFlow(tenantId: number, userPhone: string): Promise<boolean> {
    const state = await this.prisma.conversationState.findUnique({
      where: {
        tenantId_userPhone: {
          tenantId,
          userPhone
        }
      }
    });

    return state ? state.currentFlow !== 'idle' && new Date() < state.expiresAt : false;
  }

  /**
   * Get current flow name
   */
  async getCurrentFlow(tenantId: number, userPhone: string): Promise<string> {
    const state = await this.getState(tenantId, userPhone, 'customer');
    return state.currentFlow;
  }

  /**
   * Clean up expired states
   */
  private async cleanupExpiredStates(): Promise<void> {
    try {
      await this.prisma.conversationState.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired states:', error);
    }
  }

  /**
   * Get expiry date (30 minutes from now)
   */
  private getExpiryDate(): Date {
    return new Date(Date.now() + this.DEFAULT_EXPIRY_MINUTES * 60 * 1000);
  }

  /**
   * Get state without creating
   */
  async getStateIfExists(
    tenantId: number,
    userPhone: string
  ): Promise<{
    currentFlow: string;
    currentStep: number;
    context: ConversationContext;
  } | null> {
    const state = await this.prisma.conversationState.findUnique({
      where: {
        tenantId_userPhone: {
          tenantId,
          userPhone
        }
      }
    });

    if (!state || new Date() > state.expiresAt) {
      return null;
    }

    return {
      currentFlow: state.currentFlow,
      currentStep: state.currentStep,
      context: state.context as ConversationContext
    };
  }
}
