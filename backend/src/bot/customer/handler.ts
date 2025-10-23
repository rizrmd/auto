/**
 * Customer Bot Handler
 * Main message handler for customer inquiries
 */

import { PrismaClient } from '../../../../generated/prisma';
import { StateManager } from '../state-manager';
import { IntentRecognizer, Intent } from './intent-recognizer';
import { RAGEngine } from './rag-engine';
import { ResponseBuilder } from './response-builder';
import { LeadCapture } from './lead-capture';

export class CustomerBotHandler {
  private prisma: PrismaClient;
  private stateManager: StateManager;
  private intentRecognizer: IntentRecognizer;
  private ragEngine: RAGEngine;
  private responseBuilder: ResponseBuilder;
  private leadCapture: LeadCapture;

  constructor(prisma: PrismaClient, stateManager: StateManager) {
    this.prisma = prisma;
    this.stateManager = stateManager;
    this.intentRecognizer = new IntentRecognizer();
    this.ragEngine = new RAGEngine(prisma);
    this.responseBuilder = new ResponseBuilder();
    this.leadCapture = new LeadCapture(prisma);
  }

  /**
   * Handle customer message
   */
  async handleMessage(
    tenant: any,
    customerPhone: string,
    message: string,
    media?: { url: string; type: string }
  ): Promise<string> {
    try {
      // 1. Check if in a flow
      const isInFlow = await this.stateManager.isInFlow(tenant.id, customerPhone);
      if (isInFlow) {
        // Handle flow-specific logic if needed
        const state = await this.stateManager.getState(tenant.id, customerPhone, 'customer');

        // For now, flows are primarily for admin
        // Customers stay in simple Q&A mode
      }

      // 2. Recognize intent
      const intent = this.intentRecognizer.recognizeIntent(message);

      // 3. Get or create lead
      const lead = await this.leadCapture.getOrCreateLead(
        tenant.id,
        customerPhone,
        message
      );

      // 4. Save incoming message
      await this.saveMessage(tenant.id, lead.id, 'customer', message);

      // 5. Generate response based on intent
      let response: string;

      switch (intent.type) {
        case 'inquiry':
          response = await this.handleInquiry(tenant, customerPhone, message, intent);
          break;

        case 'price':
          response = await this.handlePriceQuery(tenant, message, intent);
          break;

        case 'location':
          response = await this.handleLocationQuery(tenant);
          break;

        case 'negotiation':
          response = await this.handleNegotiation(tenant);
          break;

        case 'greeting':
          response = await this.handleGreeting(tenant);
          break;

        case 'test_drive':
          response = await this.handleTestDrive(tenant);
          break;

        case 'unknown':
        default:
          response = await this.handleUnknown(tenant, message);
          break;
      }

      // 6. Save bot response
      await this.saveMessage(tenant.id, lead.id, 'bot', response);

      // 7. Update lead status based on intent
      await this.leadCapture.updateLeadStatus(lead.id, intent);

      return response;

    } catch (error) {
      console.error('Error in customer bot handler:', error);
      return this.responseBuilder.buildErrorResponse(tenant);
    }
  }

  /**
   * Handle general car inquiry
   */
  private async handleInquiry(
    tenant: any,
    customerPhone: string,
    message: string,
    intent: Intent
  ): Promise<string> {
    // Use RAG to query database and generate response
    const response = await this.ragEngine.generateResponse(
      tenant,
      message,
      intent.entities
    );

    return response;
  }

  /**
   * Handle price query
   */
  private async handlePriceQuery(
    tenant: any,
    message: string,
    intent: Intent
  ): Promise<string> {
    // Extract car identifier from message
    const response = await this.ragEngine.generateResponse(
      tenant,
      message,
      intent.entities,
      'price'
    );

    return response;
  }

  /**
   * Handle location query (cached response)
   */
  private async handleLocationQuery(tenant: any): Promise<string> {
    return this.responseBuilder.buildLocationResponse(tenant);
  }

  /**
   * Handle negotiation request
   */
  private async handleNegotiation(tenant: any): Promise<string> {
    return this.responseBuilder.buildNegotiationResponse(tenant);
  }

  /**
   * Handle greeting
   */
  private async handleGreeting(tenant: any): Promise<string> {
    return this.responseBuilder.buildGreetingResponse(tenant);
  }

  /**
   * Handle test drive request
   */
  private async handleTestDrive(tenant: any): Promise<string> {
    return this.responseBuilder.buildTestDriveResponse(tenant);
  }

  /**
   * Handle unknown intent
   */
  private async handleUnknown(tenant: any, message: string): Promise<string> {
    // Fall back to RAG for general response
    const response = await this.ragEngine.generateResponse(tenant, message, {});
    return response;
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    tenantId: number,
    leadId: number,
    sender: 'customer' | 'bot',
    message: string
  ): Promise<void> {
    try {
      await this.prisma.message.create({
        data: {
          tenantId,
          leadId,
          sender,
          message,
          createdAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }
}
