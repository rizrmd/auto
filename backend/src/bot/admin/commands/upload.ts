/**
 * Upload Command
 * Handles /upload command to start upload flow
 */

import { PrismaClient } from '../../../../../generated/prisma';
import { StateManager } from '../../state-manager';
import { UploadFlowV2 } from '../upload-flow-v2';

export class UploadCommand {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private uploadFlowV2: UploadFlowV2;

  constructor(prisma: PrismaClient, stateManager: StateManager, uploadFlowV2: UploadFlowV2) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.uploadFlowV2 = uploadFlowV2;
  }

  /**
   * Execute upload command
   * V2: Single message with all car data
   * Example: /upload mobil jazz 2020 type R harga 187jt km 88000 velg racing tangan pertama
   */
  async execute(tenant: any, userPhone: string, message: string): Promise<string> {
    // Check if already in a flow
    const isInFlow = await this.stateManager.isInFlow(tenant.id, userPhone);

    if (isInFlow) {
      return '⚠️ Anda sedang dalam proses lain. Ketik /cancel untuk membatalkan proses sebelumnya.';
    }

    // Extract data after /upload command
    const dataText = message.replace(/^\/upload\s*/i, '').trim();

    if (!dataText) {
      return `ℹ️ *Format Upload Baru - Single Message!*

Kirim semua data mobil dalam 1 pesan:

/upload [brand] [model] [tahun] harga [harga] km [km] [fitur tambahan]

*Contoh:*
/upload Toyota Avanza 2020 harga 185jt km 45000 velg racing tangan pertama

/upload Honda Jazz 2019 type R hitam harga 187jt km 88000 service record

/upload Mercedes C300 2015 silver matic harga 350jt km 65000 sunroof

*Minimal:* brand, tahun, harga
*Opsional:* model, warna, transmisi, km, plat, fitur

Setelah data diparsing, bot akan minta foto. ✨`;
    }

    // Start upload flow V2 with data
    return await this.uploadFlowV2.start(tenant, userPhone, dataText);
  }
}
