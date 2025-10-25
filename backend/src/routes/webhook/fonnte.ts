/**
 * WhatsApp Webhook Route
 *
 * Handles incoming WhatsApp messages.
 */

import { Hono } from 'hono';
import { LeadService } from '../../services/lead.service';
import { prisma } from '../../db';
import { asyncHandler } from '../../middleware/error-handler';
import { WhatsAppClient } from '../../whatsapp/whatsapp-client';
import { RAGEngine } from '../../bot/customer/rag-engine';
import { IntentRecognizer } from '../../bot/customer/intent-recognizer';
import type { FontteWebhookPayload, ApiResponse } from '../../types/context';

const whatsappWebhook = new Hono();

/**
 * POST /webhook/fonnte
 * Handle incoming WhatsApp messages
 */
whatsappWebhook.post(
  '/',
  asyncHandler(async (c) => {
    const startTime = Date.now();
    const requestId = c.get('requestId');

    // Log request details
    console.log('='.repeat(50));
    console.log(`[WEBHOOK] WhatsApp webhook received - Request ID: ${requestId}`);
    console.log(`[WEBHOOK] Timestamp: ${new Date().toISOString()}`);
    console.log(`[WEBHOOK] Method: ${c.req.method}`);
    console.log(`[WEBHOOK] URL: ${c.req.url}`);
    console.log(`[WEBHOOK] User-Agent: ${c.req.header('user-agent') || 'Unknown'}`);
    console.log(`[WEBHOOK] Content-Type: ${c.req.header('content-type') || 'Unknown'}`);
    console.log(`[WEBHOOK] Content-Length: ${c.req.header('content-length') || 'Unknown'}`);

    const payload = await c.req.json();

    // Handle different payload formats
    let customerPhone: string;
    let customerName: string | undefined;
    let message: string;
    let messageType: string = 'text';
    let messageId: string | undefined;

    // Check if it's the old Fonnte format or new format
    if (payload.sender) {
      // Fonnte format
      console.log(`[WEBHOOK] Payload Details:`);
      console.log(`[WEBHOOK]   - Sender: ${payload.sender}`);
      console.log(`[WEBHOOK]   - Message: ${payload.message}`);
      console.log(`[WEBHOOK]   - Type: ${payload.type}`);
      console.log(`[WEBHOOK]   - Push Name: ${payload.pushname || 'Not provided'}`);
      console.log(`[WEBHOOK]   - Member Name: ${payload.member?.name || 'Not provided'}`);
      console.log(`[WEBHOOK]   - Device ID: ${payload.device || 'Not provided'}`);
      console.log(`[WEBHOOK]   - Timestamp: ${payload.timestamp || 'Not provided'}`);
      console.log(`[WEBHOOK]   - File: ${payload.file || 'No file'}`);
      console.log(`[WEBHOOK]   - URL: ${payload.url || 'No URL'}`);
      console.log(`[WEBHOOK]   - Location: ${payload.location || 'No location'}`);
      console.log(`[WEBHOOK]   - Message ID: ${payload.id || 'Not provided'}`);

      // Extract phone number from WhatsApp JID format
      customerPhone = payload.sender.split('@')[0].split(':')[0];
      customerName = payload.pushname || payload.member?.name;
      message = payload.message;
      messageType = payload.type || 'text';
      messageId = payload.id;
    } else if (payload.phone) {
      // Simple format for testing
      console.log(`[WEBHOOK] Simple payload detected:`);
      console.log(`[WEBHOOK]   - Phone: ${payload.phone}`);
      console.log(`[WEBHOOK]   - Message: ${payload.message}`);

      customerPhone = payload.phone;
      customerName = undefined;
      message = payload.message;
      messageId = payload.id;
    } else {
      console.error('[WEBHOOK] Invalid payload format:', payload);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid payload format',
        },
      };
      return c.json(response, 400);
    }

    // Determine tenant based on device/number
    // For now, we'll need to identify tenant from the device number
    // This requires a mapping table or configuration
    // For simplicity, we'll use the first tenant or a default tenant
    const tenant = await prisma.tenant.findFirst({
      where: {
        status: 'active',
        whatsappBotEnabled: true,
      },
    });

    if (!tenant) {
      console.warn('No active tenant found for webhook');
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NO_TENANT',
          message: 'No active tenant configured',
        },
      };
      return c.json(response, 400);
    }

    const leadService = new LeadService();
    const ragEngine = new RAGEngine(prisma);
    const intentRecognizer = new IntentRecognizer();

    // Find or create lead
    const lead = await leadService.findOrCreateByPhone(tenant.id, customerPhone, {
      customerName,
      source: 'wa',
      status: 'new',
    });

    // Save message to database
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        sender: 'customer',
        message: message,
        metadata: {
          type: messageType,
          file: payload.file,
          url: payload.url,
          timestamp: payload.timestamp,
          messageId: messageId,
        },
      },
    });

    // Generate intelligent response using LLM
    try {
      const whatsapp = new WhatsAppClient();
      
      if (whatsapp.isConfigured()) {
        console.log(`[WEBHOOK] Generating LLM response for message: "${message}"`);
        
        // Recognize intent and extract entities
        const intent = intentRecognizer.recognizeIntent(message);
        console.log(`[WEBHOOK] Intent: ${intent.type}, Confidence: ${intent.confidence}`);
        console.log(`[WEBHOOK] Entities:`, intent.entities);
        
        // Determine query type for RAG engine
        const queryType = intent.type === 'price' ? 'price' : 'general';
        
        // Generate response using RAG engine
        const llmResponse = await ragEngine.generateResponse(
          tenant,
          message,
          intent.entities,
          queryType
        );
        
        console.log(`[WEBHOOK] LLM Response: "${llmResponse}"`);
        
        // Send LLM response
        const sendResult = await whatsapp.sendMessage({
          target: customerPhone,
          message: llmResponse
        });
        
        if (sendResult.success) {
          console.log(`[WEBHOOK] LLM reply sent to ${customerPhone}`);
          
          // Save LLM reply to database
          await prisma.message.create({
            data: {
              tenantId: tenant.id,
              leadId: lead.id,
              sender: 'bot',
              message: llmResponse,
              metadata: {
                type: 'text',
                autoReply: true,
                intent: intent.type,
                confidence: intent.confidence,
                entities: intent.entities,
              },
            },
          });

          // Mark original message as read after successfully responding
          try {
            const messageIds = messageId ? [messageId] : undefined;
            const readResult = await whatsapp.markAsRead(customerPhone, messageIds);
            if (readResult.success) {
              console.log(`[WEBHOOK] Message marked as read for ${customerPhone}${messageId ? ` (ID: ${messageId})` : ''}`);
            } else {
              console.warn(`[WEBHOOK] Failed to mark message as read: ${readResult.error}`);
            }
          } catch (readError) {
            console.warn('[WEBHOOK] Error marking message as read:', readError);
          }
        } else {
          console.error('[WEBHOOK] Failed to send LLM reply:', sendResult.error);
        }
      } else {
        console.warn('[WEBHOOK] WhatsApp API not configured, skipping reply');
      }
    } catch (error) {
      console.error('[WEBHOOK] Error generating/sending LLM reply:', error);
      
      // Fallback to simple error message
      try {
        const whatsapp = new WhatsAppClient();
        if (whatsapp.isConfigured()) {
          const fallbackMessage = `Maaf, ada kendala teknis. Bisa hubungi kami langsung di ${tenant.whatsappNumber} ya 😊`;
          const sendResult = await whatsapp.sendMessage({
            target: customerPhone,
            message: fallbackMessage
          });
          
          if (sendResult.success) {
            // Save fallback reply
            await prisma.message.create({
              data: {
                tenantId: tenant.id,
                leadId: lead.id,
                sender: 'bot',
                message: fallbackMessage,
                metadata: {
                  type: 'text',
                  autoReply: true,
                  fallback: true,
                },
              },
            });

            // Mark message as read even for fallback replies
            try {
              const messageIds = messageId ? [messageId] : undefined;
              const readResult = await whatsapp.markAsRead(customerPhone, messageIds);
              if (readResult.success) {
                console.log(`[WEBHOOK] Message marked as read for ${customerPhone}${messageId ? ` (ID: ${messageId})` : ''} (fallback)`);
              } else {
                console.warn(`[WEBHOOK] Failed to mark message as read (fallback): ${readResult.error}`);
              }
            } catch (readError) {
              console.warn('[WEBHOOK] Error marking message as read (fallback):', readError);
            }
          } else {
            console.error('[WEBHOOK] Failed to send fallback reply:', sendResult.error);
          }
        }
      } catch (fallbackError) {
        console.error('[WEBHOOK] Error sending fallback reply:', fallbackError);
      }
      // Continue anyway - we still want to acknowledge webhook
    }

    const response: ApiResponse = {
      success: true,
      data: {
        leadId: lead.id,
        status: 'processed',
        message: 'Webhook processed with LLM response',
      },
    };

    return c.json(response);
  })
);

export default whatsappWebhook;
