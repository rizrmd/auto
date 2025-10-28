/**
 * WhatsApp Web API Webhook Route
 * Handles incoming WhatsApp messages from WhatsApp Web API v1.1.0
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
import type { ApiResponse } from '../../types/context';
import { AdminBotHandler } from '../../bot/admin/handler';
import { StateManager } from '../../bot/state-manager';
import { UserType } from '../../../generated/prisma';

const whatsappWebhook = new Hono();

// Initialize StateManager and AdminBotHandler
const stateManager = new StateManager(prisma);
const adminBotHandler = new AdminBotHandler(prisma, stateManager);

interface WhatsAppWebhookPayload {
  event: string;
  message?: string;
  sender?: string;
  chat?: string;
  time?: string;
  [key: string]: any;
}

/**
 * Identify if sender is customer, admin, or sales
 */
async function identifyUserType(tenantId: number, senderPhone: string): Promise<UserType> {
  // Check if sender is a registered user (admin/sales)
  const user = await prisma.user.findFirst({
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
 * POST /webhook/whatsapp
 * Handle incoming WhatsApp messages from WhatsApp Web API
 */
whatsappWebhook.post(
  '/',
  asyncHandler(async (c) => {
    const startTime = Date.now();
    const requestId = c.get('requestId');

    // Log request details
    console.log('='.repeat(50));
    console.log(`[WEBHOOK] WhatsApp Web API webhook received - Request ID: ${requestId}`);
    console.log(`[WEBHOOK] Timestamp: ${new Date().toISOString()}`);
    console.log(`[WEBHOOK] Method: ${c.req.method}`);
    console.log(`[WEBHOOK] URL: ${c.req.url}`);
    console.log(`[WEBHOOK] User-Agent: ${c.req.header('user-agent') || 'Unknown'}`);
    console.log(`[WEBHOOK] Content-Type: ${c.req.header('content-type') || 'Unknown'}`);
    console.log(`[WEBHOOK] Content-Length: ${c.req.header('content-length') || 'Unknown'}`);

    const payload: WhatsAppWebhookPayload = await c.req.json();

    console.log(`[WEBHOOK] WhatsApp Web API Payload:`, payload);

    // Extract message details from WhatsApp Web API format
    let customerPhone: string;
    let customerName: string | undefined;
    let message: string;
    let messageType: string = 'text';
    let messageId: string | undefined;
    let media: { url: string; type: string } | undefined;

    if (payload.event === 'message' && payload.sender) {
      // WhatsApp Web API format
      customerPhone = payload.sender.split('@')[0]; // Extract phone from JID
      message = payload.message || payload.caption || '';
      messageId = payload.id || undefined;

      console.log(`[WEBHOOK] Message from ${customerPhone}: "${message}"`);
      console.log(`[WEBHOOK] Chat: ${payload.chat || 'private'}`);
      console.log(`[WEBHOOK] Time: ${payload.time || 'unknown'}`);

      // 📸 MEDIA PARSING: Support multiple WhatsApp webhook formats
      // Format 1: { attachment: { url: "...", type: "image" } }
      if (payload.attachment?.url && payload.attachment?.type) {
        media = {
          url: payload.attachment.url,
          type: payload.attachment.type
        };
        messageType = payload.attachment.type;
        console.log(`[WEBHOOK] 📸 Media detected (format 1 - attachment):`, media);
      }
      // Format 2: { media_url: "...", media_type: "image" }
      else if (payload.media_url && payload.media_type) {
        media = {
          url: payload.media_url,
          type: payload.media_type
        };
        messageType = payload.media_type;
        console.log(`[WEBHOOK] 📸 Media detected (format 2 - media_url):`, media);
      }
      // Format 3: { image_url: "..." } or { video_url: "..." }
      else if (payload.image_url) {
        media = {
          url: payload.image_url,
          type: 'image'
        };
        messageType = 'image';
        console.log(`[WEBHOOK] 📸 Media detected (format 3 - image_url):`, media);
      }
      else if (payload.video_url) {
        media = {
          url: payload.video_url,
          type: 'video'
        };
        messageType = 'video';
        console.log(`[WEBHOOK] 📸 Media detected (format 3 - video_url):`, media);
      }
      // Format 4: { type: "image", url: "..." }
      else if (payload.type && payload.url) {
        media = {
          url: payload.url,
          type: payload.type
        };
        messageType = payload.type;
        console.log(`[WEBHOOK] 📸 Media detected (format 4 - type/url):`, media);
      }
      // Format 5: { attachment: { type: "image", ... } } - WITHOUT URL
      // WhatsApp Web API may send attachment metadata without URL
      // We detect it but can't download without URL - inform user
      else if (payload.attachment?.type && !payload.attachment.url) {
        messageType = payload.attachment.type;
        console.log(`[WEBHOOK] 📸 Media detected BUT NO URL (format 5 - attachment without URL):`, {
          type: payload.attachment.type,
          mimetype: payload.attachment.mimetype,
          file_length: payload.attachment.file_length
        });
        // Set media with special marker to indicate no URL available
        media = {
          url: '__NO_URL__',
          type: payload.attachment.type,
          metadata: {
            mimetype: payload.attachment.mimetype,
            file_length: payload.attachment.file_length,
            caption: payload.attachment.caption || ''
          }
        };
      }

      // Log full payload if no media detected (for debugging)
      if (!media && !message) {
        console.warn('[WEBHOOK] ⚠️  No message or media detected. Full payload:', JSON.stringify(payload, null, 2));
      }
    } else {
      console.error('[WEBHOOK] Invalid WhatsApp Web API payload format:', payload);
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid WhatsApp Web API payload format',
        },
      };
      return c.json(response, 400);
    }

    // Determine tenant based on device/number
    // For now, we'll use the first active tenant with WhatsApp bot enabled
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

    // Save message to database (with media metadata)
    await prisma.message.create({
      data: {
        tenantId: tenant.id,
        leadId: lead.id,
        sender: 'customer',
        message: message,
        metadata: {
          type: messageType,
          chat: payload.chat,
          time: payload.time,
          messageId: messageId,
          webhookFormat: 'whatsapp-web-api',
          media: media ? {
            url: media.url,
            type: media.type
          } : undefined,
        },
      },
    });

    // 🔀 ROUTING: Identify user type and route to appropriate bot
    const userType = await identifyUserType(tenant.id, customerPhone);

    console.log(`[WEBHOOK] User type identified: ${userType}`);

    // 🤖 ADMIN/SALES BOT: Handle admin commands
    if (userType === 'admin' || userType === 'sales') {
      console.log(`[WEBHOOK] Routing to Admin Bot for ${userType}`);

      try {
        const whatsapp = new WhatsAppClient();

        if (whatsapp.isConfigured()) {
          // Handle message with admin bot (with media support!)
          console.log(`[WEBHOOK] Calling admin bot with media:`, media ? `${media.type} - ${media.url.substring(0, 50)}...` : 'none');

          const adminResponse = await adminBotHandler.handleMessage(
            tenant,
            customerPhone,
            userType,
            message,
            media // ✅ Pass media to admin bot
          );

          console.log(`[WEBHOOK] Admin bot response: "${adminResponse.substring(0, 100)}..."`);

          // Skip sending if response is empty (silent processing for bulk photos)
          if (adminResponse && adminResponse.trim().length > 0) {
            // Send admin bot response
            const sendResult = await whatsapp.sendMessage({
              target: customerPhone,
              message: adminResponse
            });

            if (sendResult.success) {
              console.log(`[WEBHOOK] Admin bot response sent successfully to ${customerPhone}`);

              // Save bot response to database
              await prisma.message.create({
                data: {
                  tenantId: tenant.id,
                  leadId: lead.id,
                  sender: 'bot',
                  message: adminResponse,
                  metadata: {
                    type: 'text',
                    autoReply: true,
                    botType: 'admin',
                    userType: userType,
                    webhookFormat: 'whatsapp-web-api',
                    hasMediaInput: media ? true : false,
                    mediaType: media?.type,
                  },
                },
              });

              // Mark as read
              try {
                const messageIds = messageId ? [messageId] : undefined;
                const readResult = await whatsapp.markAsRead(customerPhone, messageIds);
                if (readResult.success) {
                  console.log(`[WEBHOOK] Message marked as read for ${customerPhone} (admin bot)`);
                }
              } catch (readError) {
                console.warn('[WEBHOOK] Error marking message as read (admin):', readError);
              }
            } else {
              console.error('[WEBHOOK] Failed to send admin bot response:', sendResult.error);
            }
          } else {
            console.log(`[WEBHOOK] Skipping send (empty response = silent processing)`);

            // Still mark as read even for silent processing
            try {
              const messageIds = messageId ? [messageId] : undefined;
              const readResult = await whatsapp.markAsRead(customerPhone, messageIds);
              if (readResult.success) {
                console.log(`[WEBHOOK] Message marked as read for ${customerPhone} (silent processing)`);
              }
            } catch (readError) {
              console.warn('[WEBHOOK] Error marking message as read (silent):', readError);
            }
          }
        } else {
          console.warn('[WEBHOOK] WhatsApp API not configured, skipping admin bot reply');
        }
      } catch (adminError) {
        console.error('[WEBHOOK] Error in admin bot workflow:', adminError);

        // Send fallback message
        try {
          const whatsapp = new WhatsAppClient();
          if (whatsapp.isConfigured()) {
            const fallbackMessage = `Maaf, ada kendala teknis. Ketik /help untuk melihat perintah yang tersedia.`;
            await whatsapp.sendMessage({
              target: customerPhone,
              message: fallbackMessage
            });
          }
        } catch (fallbackError) {
          console.error('[WEBHOOK] Error sending admin fallback reply:', fallbackError);
        }
      }

      // Return success response
      const response: ApiResponse = {
        success: true,
        data: {
          leadId: lead.id,
          status: 'processed',
          message: 'Admin bot processed message',
          userType: userType,
        },
      };

      return c.json(response);
    }

    // 👤 CUSTOMER BOT: Generate intelligent response using LLM with function calling
    console.log(`[WEBHOOK] Routing to Customer Bot with LLM`);

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

🚨 CRITICAL RULES - NEVER VIOLATE THESE:

1. PHOTO REQUEST HANDLING (MANDATORY):
   ❌ NEVER say "Saya akan mengirimkan foto..." without ACTUALLY calling send_car_photos tool
   ❌ NEVER say "Saya akan kirim..." without ACTUALLY calling send_car_photos tool
   ❌ NEVER promise to send photos if you haven't called the tool
   ✅ ALWAYS call send_car_photos tool FIRST, then say "Saya sudah kirimkan foto..."
   ✅ If customer asks for photos but you don't know the code, call search_cars FIRST to find the code, THEN call send_car_photos

   Example (CORRECT):
   Customer: "Mau lihat foto Brio"
   You: [Call search_cars(brand: "Honda", model: "Brio")] → get code #B01
        [Call send_car_photos(displayCode: "B01")]
        Then respond: "Saya sudah kirimkan 3 foto Honda Brio ke WhatsApp Anda ✅"

   Example (WRONG - NEVER DO THIS):
   Customer: "Mau lihat foto Brio"
   You: "Saya akan segera mengirimkan foto Honda Brio..." ❌ NO TOOL CALLED!

2. CODE ACCURACY:
   ✅ ONLY use display codes from search_cars tool results
   ❌ NEVER invent or guess display codes (like #B02, #J02, etc)
   ❌ NEVER mention codes that weren't returned by search_cars

3. TOOL USAGE ORDER (for photo requests):
   Step 1: Call search_cars if you don't have the exact displayCode
   Step 2: Call send_car_photos with displayCode from Step 1
   Step 3: Only then respond to customer with "Saya sudah kirimkan..."

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

              // 🚨 VALIDATION: Detect false photo promises (all tenses!)
              const responseText = finalResponse.toLowerCase();
              const hasFotoMention = responseText.includes('foto') || responseText.includes('gambar');
              const hasFalsePhotoPromise = hasFotoMention && (
                responseText.includes('akan mengirim') ||      // future: "akan mengirimkan"
                responseText.includes('akan kirim') ||         // future: "akan kirimkan"
                responseText.includes('segera mengirim') ||    // immediate: "segera mengirimkan"
                responseText.includes('telah mengirim') ||     // past: "telah mengirimkan" ⚠️ BYPASS ATTEMPT
                responseText.includes('sudah mengirim') ||     // past: "sudah mengirimkan" ⚠️ BYPASS ATTEMPT
                responseText.includes('sudah kirim') ||        // past: "sudah kirimkan" ⚠️ BYPASS ATTEMPT
                responseText.includes('saya kirim') ||         // present: "saya kirimkan"
                (responseText.includes('foto') && responseText.includes('dikirim'))  // passive: "foto dikirimkan"
              );

              const isFalsePhotoPromise = hasFalsePhotoPromise;

              const isPhotoRequest = (
                message.toLowerCase().includes('foto') ||
                message.toLowerCase().includes('gambar') ||
                message.toLowerCase().includes('photo') ||
                message.toLowerCase().includes('pic')
              );

              if (isFalsePhotoPromise && isPhotoRequest) {
                console.warn(`⚠️ [WEBHOOK] DETECTED FALSE PHOTO PROMISE at iteration ${iterations}! Forcing retry with stricter instruction...`);
                console.warn(`[WEBHOOK] Problematic response: "${finalResponse.substring(0, 150)}..."`);
                
                // Add a forcing message to make LLM call the tool
                messages.push({
                  role: 'user',
                  content: 'ERROR: You MUST call send_car_photos tool to actually send photos. DO NOT just promise to send. Call search_cars first if needed to find the car code, then call send_car_photos. Do it now.',
                });
                
                // Force retry but limit to one retry attempt
                if (iterations < 2) { // Only allow one retry for false photo promise
                  continue;
                } else {
                  console.warn('[WEBHOOK] Max retries for false photo promise reached, using fallback');
                  finalResponse = 'Maaf, saya mengalami kesulitan teknis. Silakan hubungi tim kami langsung di ' + tenant.whatsappNumber + ' untuk bantuan 😊';
                  break;
                }
              }

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
                webhookFormat: 'whatsapp-web-api',
              },
            },
          });

          // Mark original message as read after successfully responding (v1.1.0 feature)
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
                  webhookFormat: 'whatsapp-web-api',
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
        message: 'WhatsApp Web API webhook processed with LLM response',
      },
    };

    return c.json(response);
  })
);

export default whatsappWebhook;