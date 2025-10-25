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
import { ZaiClient, type ChatMessage, type ToolCall } from '../../llm/zai';
import { tools } from '../../llm/tools';
import { ToolExecutor, type ToolResult } from '../../llm/tool-executor';
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

    // Generate intelligent response using LLM with function calling
    try {
      const whatsapp = new WhatsAppClient();

      if (whatsapp.isConfigured()) {
        console.log(`[WEBHOOK] Processing message with function calling: "${message}"`);

        // Recognize intent and extract entities (keep for analytics)
        const intent = intentRecognizer.recognizeIntent(message);
        console.log(`[WEBHOOK] Intent: ${intent.type}, Confidence: ${intent.confidence}`);
        console.log(`[WEBHOOK] Entities:`, intent.entities);

        // Initialize ZAI client and tool executor
        const zaiClient = new ZaiClient();
        const toolExecutor = new ToolExecutor({
          tenantId: tenant.id,
          leadId: lead.id,
          customerPhone: customerPhone,
          prisma: prisma,
          whatsapp: whatsapp,
        });

        // Get conversation history for context
        const history = await prisma.message.findMany({
          where: {
            tenantId: tenant.id,
            leadId: lead.id,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            sender: true,
            message: true,
          },
        });

        // Build conversation context
        const conversationHistory: ChatMessage[] = [];

        // Add system message with business context
        conversationHistory.push({
          role: 'system',
          content: `You are an AI assistant for ${tenant.name}, a car dealership specializing in quality used cars.

Your role is to help customers find their ideal car, answer questions about inventory, pricing, financing, and schedule test drives.

Business Information:
- Company: ${tenant.name}
- WhatsApp: ${tenant.whatsappNumber}
- Location: ${tenant.address || 'Contact us for showroom location'}

Communication Guidelines:
- Be friendly, professional, and helpful
- Use Indonesian language naturally (mix Indonesian-English is okay for car terms)
- Provide specific information when available from tools
- If you need to send photos, use the send_car_photos tool
- Always confirm important details like test drive appointments
- For complex inquiries, offer to have a sales representative call them

Available Tools:
- search_cars: Find cars matching customer criteria
- get_car_details: Get detailed info about a specific car
- send_car_photos: Send photos of a car to customer
- get_financing_info: Calculate financing/installments
- schedule_test_drive: Book test drive appointments
- check_trade_in: Check trade-in options

Current customer message: "${message}"`,
        });

        // Add recent conversation history (reverse to get chronological order)
        for (const msg of history.reverse()) {
          if (conversationHistory.length >= 8) break; // Limit context size

          conversationHistory.push({
            role: msg.sender === 'customer' ? 'user' : 'assistant',
            content: msg.message,
          });
        }

        // Add current message
        conversationHistory.push({
          role: 'user',
          content: message,
        });

        console.log(`[WEBHOOK] Starting function calling loop with ${tools.length} available tools`);
        console.log(`[WEBHOOK] Tools: ${tools.map(t => t.function.name).join(', ')}`);

        // Function calling loop (max 3 iterations)
        let finalResponse = '';
        let iterations = 0;
        const maxIterations = 3;
        const messages = [...conversationHistory];

        while (iterations < maxIterations) {
          iterations++;
          console.log(`[WEBHOOK] Function calling iteration ${iterations}/${maxIterations}`);

          try {
            // Call LLM with tools
            const response = await zaiClient.generateWithTools(
              '', // No additional prompt needed, all context is in messages
              tools,
              messages
            );

            console.log(`[WEBHOOK] LLM finish_reason: ${response.finish_reason}`);

            // Check if LLM wants to call tools
            if (response.finish_reason === 'tool_calls' && response.tool_calls) {
              console.log(`[WEBHOOK] LLM requested ${response.tool_calls.length} tool call(s)`);

              // Add assistant message with tool calls to history
              messages.push({
                role: 'assistant',
                content: response.message,
                tool_calls: response.tool_calls,
              });

              // Execute all tool calls in parallel
              const toolResults: ToolResult[] = await toolExecutor.executeToolCalls(
                response.tool_calls
              );

              console.log(`[WEBHOOK] Executed ${toolResults.length} tool(s) successfully`);

              // Add tool results to conversation
              for (const result of toolResults) {
                messages.push({
                  role: 'tool',
                  content: result.content,
                  tool_call_id: result.tool_call_id,
                  name: result.name,
                });
              }

              // Continue loop to get LLM's final response
              continue;
            } else {
              // No tool calls, this is the final response
              finalResponse = response.message || 'Maaf, saya tidak bisa memproses permintaan Anda saat ini.';
              console.log(`[WEBHOOK] Final response generated: "${finalResponse.substring(0, 100)}..."`);
              break;
            }
          } catch (loopError) {
            console.error(`[WEBHOOK] Error in function calling iteration ${iterations}:`, loopError);

            // If first iteration fails, fall back to RAG engine
            if (iterations === 1) {
              console.log('[WEBHOOK] Falling back to RAG engine');
              const queryType = intent.type === 'price' ? 'price' : 'general';
              finalResponse = await ragEngine.generateResponse(
                tenant,
                message,
                intent.entities,
                queryType
              );
            } else {
              // Use last known response or error message
              finalResponse = 'Maaf, ada kendala teknis. Bisa hubungi kami langsung ya 😊';
            }
            break;
          }
        }

        // Check if max iterations reached without final response
        if (iterations >= maxIterations && !finalResponse) {
          console.warn('[WEBHOOK] Max iterations reached, using fallback response');
          finalResponse = 'Maaf, permintaan Anda cukup kompleks. Bisa hubungi tim kami langsung di ' +
                         tenant.whatsappNumber + ' untuk bantuan lebih lanjut 😊';
        }

        console.log(`[WEBHOOK] Sending final response to customer`);

        // Send final response to customer
        const sendResult = await whatsapp.sendMessage({
          target: customerPhone,
          message: finalResponse
        });

        if (sendResult.success) {
          console.log(`[WEBHOOK] Response sent successfully to ${customerPhone}`);

          // Save bot response to database
          await prisma.message.create({
            data: {
              tenantId: tenant.id,
              leadId: lead.id,
              sender: 'bot',
              message: finalResponse,
              metadata: {
                type: 'text',
                autoReply: true,
                intent: intent.type,
                confidence: intent.confidence,
                entities: intent.entities,
                functionCalling: true,
                iterations: iterations,
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
          console.error('[WEBHOOK] Failed to send response:', sendResult.error);
        }
      } else {
        console.warn('[WEBHOOK] WhatsApp API not configured, skipping reply');
      }
    } catch (error) {
      console.error('[WEBHOOK] Error in function calling workflow:', error);
      
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
