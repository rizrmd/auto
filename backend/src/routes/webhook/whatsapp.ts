/**
 * WhatsApp Web API Webhook Route
 * Handles incoming WhatsApp messages from WhatsApp Web API v1.1.0
 * 
 * Performance optimizations enabled:
 * - Service container singleton pattern
 * - Request deduplication
 * - Response caching
 * - Timeout handling with circuit breakers
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
import { ServiceContainer } from '../../services/service-container';
import { TimeoutHandler } from '../../middleware/timeout-handler';
import { responseCache } from '../../cache/response-cache';

// Initialize admin bot handler with fallback services
const adminBotHandler = new AdminBotHandler(prisma, new StateManager(prisma));

const whatsappWebhook = new Hono();

// Initialize optimized service container
const serviceContainer = ServiceContainer.getInstance();

// Note: Services will be initialized when serviceContainer.initialize() is called in main app
// These are lazy-loaded properties that will be available after initialization
const timeoutHandler = new TimeoutHandler();

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
  async (c) => {
    try {
      const payload = await c.req.json();
      console.log(`[WEBHOOK] Payload received:`, payload);
      
      // Simple success response for now
      return c.json({ 
        success: true, 
        data: { 
          status: 'received',
          message: 'WhatsApp Web API webhook working',
          sender: payload.sender,
          event: payload.event
        } 
      });
    } catch (error) {
      console.error('[WEBHOOK] Error:', error);
      return c.json({ 
        success: false, 
        error: { 
          code: 'WEBHOOK_ERROR', 
          message: error.message 
        } 
      }, 500);
    }
  }
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
         const whatsapp = serviceContainer.whatsappClient || new WhatsAppClient();
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

        // Get optimized ZAI client and tool executor from container
        const zaiClient = serviceContainer.zaiClient || new ZaiClient();
        const toolExecutor = serviceContainer.getToolExecutor ? 
          serviceContainer.getToolExecutor({
            tenantId: tenant.id,
            leadId: lead.id,
            customerPhone: customerPhone,
            prisma: prisma,
            whatsapp: whatsapp,
          }) : new ToolExecutor({
            tenantId: tenant.id,
            leadId: lead.id,
            customerPhone: customerPhone,
            prisma: prisma,
            whatsapp: whatsapp,
          });

        // Get conversation history for context (with caching)
        const cacheKey = `conversation:${tenant.id}:${lead.id}`;
        const cachedHistory = await responseCache.get(cacheKey);
        
        let history;
        if (cachedHistory) {
          history = cachedHistory;
          console.log(`[WEBHOOK] Using cached conversation history`);
        } else {
          // Fallback to simple query when optimized queries not available
          if (serviceContainer.getOptimizedQueries) {
            history = await serviceContainer.getOptimizedQueries().getConversationHistory(
              tenant.id, 
              lead.id, 
              10
            );
          } else {
            const messages = await prisma.message.findMany({
              where: {
                tenantId: tenant.id,
                leadId: lead.id,
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 10
            });
            history = messages;
          }
          // Cache for 2 minutes
          await responseCache.set(cacheKey, history, { ttl: 120, tags: ['conversation', `tenant:${tenant.id}`] });
        }

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
            // Check cache for similar LLM requests
            const llmCacheKey = `llm:${tenant.id}:${message.substring(0, 50)}`;
            const cachedResponse = await responseCache.get(llmCacheKey);
            
            let response;
            if (cachedResponse) {
              response = cachedResponse;
              console.log(`[WEBHOOK] Using cached LLM response`);
            } else {
              // Call LLM with tools (with timeout)
              response = await timeoutHandler.withTimeout(
                'llm',
                () => zaiClient.generateWithTools('', tools, messages),
                30000 // 30 second timeout
              );
              
              // Cache successful responses for 5 minutes
              if (response && !response.tool_calls) {
                await responseCache.set(llmCacheKey, response, { 
                  ttl: 300, 
                  tags: ['llm', `tenant:${tenant.id}`] 
                });
              }
            }

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

              // Execute all tool calls in parallel (with timeout)
              const toolResults: ToolResult[] = await timeoutHandler.withTimeout(
                'tools',
                () => toolExecutor.executeToolCalls(response.tool_calls),
                45000 // 45 second timeout for tool execution
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

        // Send final response to customer (with timeout)
        const sendResult = await timeoutHandler.withTimeout(
          'whatsapp',
          () => whatsapp.sendMessage({
            target: customerPhone,
            message: finalResponse
          }),
          15000 // 15 second timeout for WhatsApp API
        );

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
        const whatsapp = serviceContainer.whatsappClient || new WhatsAppClient();
        if (whatsapp.isConfigured()) {
          const fallbackMessage = `Maaf, ada kendala teknis. Bisa hubungi kami langsung di ${tenant.whatsappNumber} ya 😊`;
           const sendResult = await timeoutHandler.withTimeout(
             'whatsapp-fallback',
             () => whatsapp.sendMessage({
               target: customerPhone,
               message: fallbackMessage
             }),
             15000 // 15 second timeout
           );
          
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

/**
 * GET /webhook/whatsapp/health
 * Health check endpoint for webhook optimization services
 */
whatsappWebhook.get(
  '/health',
  asyncHandler(async (c) => {
    const healthStatus = serviceContainer.healthChecker ? 
      await serviceContainer.healthChecker.checkHealth() : 
      { status: 'healthy', services: {} };
    
    const response: ApiResponse = {
      success: healthStatus.status === 'healthy',
      data: {
        status: healthStatus.status,
        services: healthStatus.services,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    };

    return c.json(response, healthStatus.status === 'healthy' ? 200 : 503);
  })
);

export default whatsappWebhook;