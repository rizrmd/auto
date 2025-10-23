/**
 * Upload Command
 * Handles /upload command to start upload flow
 */

import { PrismaClient } from '../../../../../generated/prisma';
import { StateManager } from '../../state-manager';
import { UploadFlow } from '../upload-flow';

export class UploadCommand {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private uploadFlow: UploadFlow;

  constructor(prisma: PrismaClient, stateManager: StateManager, uploadFlow: UploadFlow) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.uploadFlow = uploadFlow;
  }

  /**
   * Execute upload command
   */
  async execute(tenant: any, userPhone: string, args: string[]): Promise<string> {
    // Check if already in a flow
    const isInFlow = await this.stateManager.isInFlow(tenant.id, userPhone);

    if (isInFlow) {
      return '⚠️ Anda sedang dalam proses lain. Ketik /cancel untuk membatalkan proses sebelumnya.';
    }

    // Start upload flow
    return await this.uploadFlow.start(tenant, userPhone);
  }
}
