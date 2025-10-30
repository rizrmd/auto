/**
 * Message Sender
 * High-level interface for sending WhatsApp messages
 */

import { WhatsAppClient } from './whatsapp-client';

export class MessageSender {
  private readonly MAX_MESSAGE_LENGTH = 4096; // WhatsApp limit
  private whatsappClient: WhatsAppClient;

  constructor() {
    this.whatsappClient = new WhatsAppClient();
  }

  /**
   * Send text message
   */
  async sendMessage(
    from: string,
    to: string,
    message: string
  ): Promise<boolean> {
    try {
      const result = await this.whatsappClient.sendMessage({
        target: to,
        message: message
      });
      return result.success;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Send message with image
   */
  async sendMessageWithImage(
    from: string,
    to: string,
    message: string,
    imageUrl: string
  ): Promise<boolean> {
    try {
      const result = await this.whatsappClient.sendImage(to, imageUrl, message);
      return result.success;
    } catch (error) {
      console.error('Error sending message with image:', error);
      return false;
    }
  }

  /**
   * Send message with document
   */
  async sendMessageWithDocument(
    from: string,
    to: string,
    message: string,
    documentUrl: string,
    filename?: string
  ): Promise<boolean> {
    try {
      // For documents, we'll send as a regular message with URL for now
      // TODO: Implement proper document sending when WhatsAppClient supports it
      const fullMessage = `${message}\n\nDocument: ${documentUrl}`;
      const result = await this.whatsappClient.sendMessage({
        target: to,
        message: fullMessage
      });
      return result.success;
    } catch (error) {
      console.error('Error sending message with document:', error);
      return false;
    }
  }

  /**
   * Send formatted car details
   */
  async sendCarDetails(
    from: string,
    to: string,
    car: any
  ): Promise<boolean> {
    let message = `🚗 *${car.publicName}*\n\n`;

    message += `💰 Harga: Rp ${this.formatPrice(car.price)}\n`;
    message += `📅 Tahun: ${car.year}\n`;
    message += `🎨 Warna: ${car.color}\n`;
    message += `⚙️ Transmisi: ${car.transmission}\n`;
    message += `🛣️ Kilometer: ${car.km.toLocaleString()} km\n`;

    if (car.fuelType) {
      message += `⛽ Bahan Bakar: ${car.fuelType}\n`;
    }

    if (car.keyFeatures && car.keyFeatures.length > 0) {
      message += `\n✨ *Kelebihan:*\n`;
      car.keyFeatures.forEach((feature: string) => {
        message += `• ${feature}\n`;
      });
    }

    if (car.conditionNotes) {
      message += `\n📝 ${car.conditionNotes}\n`;
    }

    message += `\n📋 Kode: ${car.displayCode}`;

    // Send with image if available
    if (car.photos && car.photos.length > 0) {
      const primaryPhoto = car.photos[car.primaryPhotoIndex || 0];
      return await this.sendMessageWithImage(from, to, message, primaryPhoto);
    }

    return await this.sendMessage(from, to, message);
  }

  /**
   * Send multiple cars list
   */
  async sendCarsList(
    from: string,
    to: string,
    cars: any[],
    title?: string
  ): Promise<boolean> {
    if (cars.length === 0) {
      return await this.sendMessage(from, to, 'Tidak ada mobil yang tersedia.');
    }

    let message = title ? `${title}\n\n` : '🚗 *Daftar Mobil*\n\n';

    cars.forEach((car, index) => {
      message += `${index + 1}. ${car.publicName}\n`;
      message += `   💰 ${this.formatPrice(car.price)} | `;
      message += `📅 ${car.year} | `;
      message += `⚙️ ${car.transmission}\n`;
      message += `   Kode: ${car.displayCode}\n\n`;
    });

    return await this.sendMessage(from, to, message);
  }

  /**
   * Send broadcast to multiple recipients
   */
  async sendBroadcast(
    from: string,
    recipients: string[],
    message: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        await this.sendMessage(from, recipient, message);
        success++;

        // Rate limiting: 1 message per second
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to send to ${recipient}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Split long message into chunks
   */
  private splitMessage(message: string): string[] {
    if (message.length <= this.MAX_MESSAGE_LENGTH) {
      return [message];
    }

    const chunks: string[] = [];
    let currentChunk = '';

    const lines = message.split('\n');

    for (const line of lines) {
      if ((currentChunk + line + '\n').length > this.MAX_MESSAGE_LENGTH) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }

        // If single line is too long, split by words
        if (line.length > this.MAX_MESSAGE_LENGTH) {
          const words = line.split(' ');
          let wordChunk = '';

          for (const word of words) {
            if ((wordChunk + word + ' ').length > this.MAX_MESSAGE_LENGTH) {
              chunks.push(wordChunk.trim());
              wordChunk = word + ' ';
            } else {
              wordChunk += word + ' ';
            }
          }

          if (wordChunk) {
            currentChunk = wordChunk;
          }
        } else {
          currentChunk = line + '\n';
        }
      } else {
        currentChunk += line + '\n';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Format price
   */
  private formatPrice(price: bigint | number): string {
    const numPrice = typeof price === 'bigint' ? Number(price) : price;
    return `${(numPrice / 1000000).toFixed(0)} juta`;
  }

  /**
   * Check if sender is configured
   */
  isConfigured(): boolean {
    return this.whatsappClient.isConfigured();
  }
}
