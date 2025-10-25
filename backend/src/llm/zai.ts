/**
 * ZAI API Client (OpenAI Compatible)
 * Integration with ZAI API for natural language generation with function calling support
 *
 * @example Basic Usage
 * ```typescript
 * const client = new ZaiClient();
 * const response = await client.generateResponse("Hello, how are you?");
 * console.log(response);
 * ```
 *
 * @example Function Calling - Manual
 * ```typescript
 * const tools = [{
 *   type: 'function',
 *   function: {
 *     name: 'get_lead_info',
 *     description: 'Get lead information by phone number',
 *     parameters: {
 *       type: 'object',
 *       properties: {
 *         phone: { type: 'string', description: 'Phone number' }
 *       },
 *       required: ['phone']
 *     }
 *   }
 * }];
 *
 * const result = await client.generateWithTools(
 *   "Get info for +1234567890",
 *   tools
 * );
 *
 * if (result.tool_calls) {
 *   // Execute tools and continue conversation
 *   const toolResults = await executeTools(result.tool_calls);
 *   const finalResponse = await client.generateWithTools(
 *     "",
 *     tools,
 *     [...conversationHistory, toolResults]
 *   );
 * }
 * ```
 *
 * @example Function Calling - Automatic Loop
 * ```typescript
 * const tools = [...]; // Define your tools
 *
 * const toolExecutor = async (name: string, args: any) => {
 *   switch (name) {
 *     case 'get_lead_info':
 *       return await getLeadInfo(args.phone);
 *     case 'create_appointment':
 *       return await createAppointment(args);
 *     default:
 *       throw new Error(`Unknown tool: ${name}`);
 *   }
 * };
 *
 * const response = await client.handleToolCallingLoop(
 *   "Book an appointment for the lead with phone +1234567890",
 *   tools,
 *   toolExecutor,
 *   5 // max iterations
 * );
 * ```
 *
 * @example Using Helper Methods
 * ```typescript
 * // Create a tool definition
 * const tool = client.createTool(
 *   'send_message',
 *   'Send a WhatsApp message',
 *   {
 *     properties: {
 *       to: { type: 'string', description: 'Recipient phone' },
 *       message: { type: 'string', description: 'Message content' }
 *     },
 *     required: ['to', 'message']
 *   }
 * );
 *
 * // Validate tools
 * const validation = client.validateTools([tool]);
 * if (!validation.valid) {
 *   console.error('Invalid tools:', validation.errors);
 * }
 *
 * // Parse tool arguments safely
 * const args = client.parseToolArguments(toolCall);
 * ```
 */

/**
 * OpenAI-compatible message format
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

/**
 * Tool call structure from LLM response
 */
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

/**
 * Tool definition (OpenAI format)
 */
export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

/**
 * Tool execution result
 */
export interface ToolResult {
  tool_call_id: string;
  name: string;
  content: string; // JSON string of result
}

/**
 * Response from generateWithTools
 */
export interface GenerateWithToolsResponse {
  message: string | null;
  tool_calls: ToolCall[] | null;
  finish_reason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * ZAI API request payload
 */
interface ZaiApiRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  tools?: Tool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export class ZaiClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private defaultMaxTokens: number = 1024;
  private defaultTemperature: number = 0.7;

  constructor() {
    this.apiKey = process.env.ZAI_API_KEY || '';
    this.baseUrl = process.env.ZAI_API_URL || 'https://api.z.ai/api/coding/paas/v4';
    this.model = process.env.ZAI_MODEL || 'glm-4.5v';

    if (!this.apiKey) {
      console.warn('⚠️ ZAI_API_KEY not set. LLM features will not work.');
    }
  }

  /**
   * Generate response from prompt (backward compatible)
   * @param prompt - User prompt
   * @param tools - Optional tools for function calling
   * @returns Text response or throws error
   */
  async generateResponse(prompt: string, tools?: Tool[]): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ZAI API key not configured');
    }

    try {
      const messages: ChatMessage[] = [
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.callZaiApi(messages, tools);

      // Extract text from OpenAI-compatible response
      if (response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        if (choice.message && choice.message.content) {
          return choice.message.content;
        }
      }

      throw new Error('No response generated');

    } catch (error) {
      console.error('Error calling ZAI API:', error);
      throw error;
    }
  }

  /**
   * Core API call method
   * @private
   */
  private async callZaiApi(
    messages: ChatMessage[],
    tools?: Tool[],
    toolChoice?: 'auto' | 'none'
  ): Promise<any> {
    const payload: ZaiApiRequest = {
      model: this.model,
      messages: messages,
      temperature: this.defaultTemperature,
      max_tokens: this.defaultMaxTokens,
      top_p: 0.95,
      stream: false
    };

    // Add tools if provided
    if (tools && tools.length > 0) {
      payload.tools = tools;
      payload.tool_choice = toolChoice || 'auto';
    }

    console.log('📤 ZAI API Request:', {
      model: payload.model,
      messageCount: messages.length,
      toolsCount: tools?.length || 0,
      lastMessageRole: messages[messages.length - 1]?.role
    });

    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ ZAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`ZAI API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    console.log('📥 ZAI API Response:', {
      finishReason: data.choices?.[0]?.finish_reason,
      hasToolCalls: !!data.choices?.[0]?.message?.tool_calls,
      toolCallsCount: data.choices?.[0]?.message?.tool_calls?.length || 0,
      usage: data.usage
    });

    return data;
  }

  /**
   * Generate response with function calling support
   * @param prompt - User prompt or system prompt
   * @param tools - Array of tools (OpenAI format)
   * @param conversationHistory - Previous messages for multi-turn conversation
   * @returns Response with text and/or tool_calls
   */
  async generateWithTools(
    prompt: string,
    tools: Tool[],
    conversationHistory?: ChatMessage[]
  ): Promise<GenerateWithToolsResponse> {
    if (!this.apiKey) {
      throw new Error('ZAI API key not configured');
    }

    try {
      // Build messages array
      const messages: ChatMessage[] = conversationHistory ? [...conversationHistory] : [];

      // Add current prompt
      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await this.callZaiApi(messages, tools);

      // Parse response
      if (response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        const assistantMessage = choice.message;

        return {
          message: assistantMessage.content || null,
          tool_calls: assistantMessage.tool_calls || null,
          finish_reason: choice.finish_reason || 'stop',
          usage: response.usage
        };
      }

      throw new Error('No response generated');

    } catch (error) {
      console.error('❌ Error in generateWithTools:', error);
      throw error;
    }
  }

  /**
   * Parse tool calls from API response
   * @param response - Raw API response
   * @returns Array of tool calls or null
   */
  parseToolCalls(response: any): ToolCall[] | null {
    try {
      if (response.choices && response.choices.length > 0) {
        const choice = response.choices[0];
        const message = choice.message;

        if (message && message.tool_calls && Array.isArray(message.tool_calls)) {
          console.log('🔧 Parsed tool calls:', {
            count: message.tool_calls.length,
            tools: message.tool_calls.map((tc: ToolCall) => tc.function.name)
          });
          return message.tool_calls;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error parsing tool calls:', error);
      return null;
    }
  }

  /**
   * Build tool result messages for next LLM call
   * @param toolResults - Results from tool execution
   * @returns Array of tool result messages
   */
  buildToolResultMessages(toolResults: ToolResult[]): ChatMessage[] {
    return toolResults.map(result => ({
      role: 'tool' as const,
      content: result.content,
      tool_call_id: result.tool_call_id,
      name: result.name
    }));
  }

  /**
   * Handle complete tool calling loop with automatic execution
   * @param prompt - Initial user prompt
   * @param tools - Available tools
   * @param toolExecutor - Function to execute tools
   * @param maxIterations - Maximum number of tool calling iterations
   * @param conversationHistory - Previous conversation messages
   * @returns Final response after all tool calls
   */
  async handleToolCallingLoop(
    prompt: string,
    tools: Tool[],
    toolExecutor: (toolName: string, args: any) => Promise<any>,
    maxIterations: number = 5,
    conversationHistory?: ChatMessage[]
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ZAI API key not configured');
    }

    let messages: ChatMessage[] = conversationHistory ? [...conversationHistory] : [];

    // Add initial user prompt
    messages.push({
      role: 'user',
      content: prompt
    });

    let iterations = 0;

    try {
      while (iterations < maxIterations) {
        iterations++;
        console.log(`\n🔄 Tool calling iteration ${iterations}/${maxIterations}`);

        // Call LLM with tools
        const response = await this.callZaiApi(messages, tools);

        if (!response.choices || response.choices.length === 0) {
          throw new Error('No response from LLM');
        }

        const choice = response.choices[0];
        const assistantMessage = choice.message;
        const finishReason = choice.finish_reason;

        // Add assistant message to history
        messages.push({
          role: 'assistant',
          content: assistantMessage.content || null,
          tool_calls: assistantMessage.tool_calls || undefined
        });

        // Check finish reason
        if (finishReason === 'stop') {
          // No tool calls, return final response
          console.log('✅ Tool calling complete (no more tools needed)');
          return assistantMessage.content || 'Response completed without message';
        }

        if (finishReason === 'tool_calls' && assistantMessage.tool_calls) {
          // Execute tool calls
          console.log(`🔧 Executing ${assistantMessage.tool_calls.length} tool calls...`);

          const toolResults: ToolResult[] = [];

          for (const toolCall of assistantMessage.tool_calls) {
            try {
              console.log(`  → Executing: ${toolCall.function.name}`);

              // Parse arguments
              const args = JSON.parse(toolCall.function.arguments);

              // Execute tool
              const result = await toolExecutor(toolCall.function.name, args);

              // Store result
              toolResults.push({
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: JSON.stringify(result)
              });

              console.log(`  ✓ ${toolCall.function.name} completed`);
            } catch (error) {
              console.error(`  ✗ Error executing ${toolCall.function.name}:`, error);

              // Add error result
              toolResults.push({
                tool_call_id: toolCall.id,
                name: toolCall.function.name,
                content: JSON.stringify({
                  error: error instanceof Error ? error.message : 'Unknown error',
                  success: false
                })
              });
            }
          }

          // Add tool results to messages
          const toolMessages = this.buildToolResultMessages(toolResults);
          messages.push(...toolMessages);

          // Continue loop to get next LLM response
          continue;
        }

        // Unexpected finish reason
        console.warn(`⚠️ Unexpected finish reason: ${finishReason}`);
        return assistantMessage.content || 'Response completed with unexpected finish reason';
      }

      // Max iterations reached
      console.warn(`⚠️ Max iterations (${maxIterations}) reached`);
      const lastAssistantMessage = messages
        .filter(m => m.role === 'assistant')
        .pop();

      return lastAssistantMessage?.content || 'Max iterations reached without final response';

    } catch (error) {
      console.error('❌ Error in tool calling loop:', error);
      throw error;
    }
  }

  /**
   * Generate response with retry logic
   */
  async generateWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
    let lastError: Error | undefined;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.generateResponse(prompt);
      } catch (error) {
        console.error(`ZAI attempt ${i + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (i < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Batch generate responses
   */
  async batchGenerate(prompts: string[]): Promise<string[]> {
    const results = await Promise.allSettled(
      prompts.map(prompt => this.generateResponse(prompt))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Prompt ${index} failed:`, result.reason);
        return 'Error generating response';
      }
    });
  }

  /**
   * Count tokens (approximate)
   */
  estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if prompt is within token limit
   */
  isWithinTokenLimit(prompt: string, maxTokens: number = 30000): boolean {
    return this.estimateTokens(prompt) <= maxTokens;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await this.generateResponse('Hello');
      return response.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Validate tool definitions
   * @param tools - Array of tools to validate
   * @returns Validation result with errors if any
   */
  validateTools(tools: Tool[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(tools)) {
      errors.push('Tools must be an array');
      return { valid: false, errors };
    }

    tools.forEach((tool, index) => {
      if (!tool.type || tool.type !== 'function') {
        errors.push(`Tool ${index}: type must be 'function'`);
      }

      if (!tool.function) {
        errors.push(`Tool ${index}: missing function definition`);
        return;
      }

      if (!tool.function.name || typeof tool.function.name !== 'string') {
        errors.push(`Tool ${index}: function.name is required and must be a string`);
      }

      if (!tool.function.description || typeof tool.function.description !== 'string') {
        errors.push(`Tool ${index}: function.description is required and must be a string`);
      }

      if (!tool.function.parameters) {
        errors.push(`Tool ${index}: function.parameters is required`);
      } else {
        if (tool.function.parameters.type !== 'object') {
          errors.push(`Tool ${index}: function.parameters.type must be 'object'`);
        }

        if (!tool.function.parameters.properties || typeof tool.function.parameters.properties !== 'object') {
          errors.push(`Tool ${index}: function.parameters.properties is required and must be an object`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a simple tool definition helper
   * @param name - Tool name
   * @param description - Tool description
   * @param parameters - Tool parameters (JSON Schema)
   * @returns Tool definition in OpenAI format
   */
  createTool(
    name: string,
    description: string,
    parameters: {
      properties: Record<string, any>;
      required?: string[];
    }
  ): Tool {
    return {
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          ...parameters
        }
      }
    };
  }

  /**
   * Get conversation history with proper formatting
   * @param messages - Array of messages
   * @returns Formatted conversation history
   */
  formatConversationHistory(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.name && { name: msg.name }),
      ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
      ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id })
    }));
  }

  /**
   * Extract tool call arguments safely
   * @param toolCall - Tool call object
   * @returns Parsed arguments or null
   */
  parseToolArguments(toolCall: ToolCall): any | null {
    try {
      return JSON.parse(toolCall.function.arguments);
    } catch (error) {
      console.error(`❌ Failed to parse arguments for ${toolCall.function.name}:`, error);
      return null;
    }
  }

  /**
   * Set custom temperature for generation
   */
  setTemperature(temperature: number): void {
    if (temperature < 0 || temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    this.defaultTemperature = temperature;
  }

  /**
   * Set custom max tokens
   */
  setMaxTokens(maxTokens: number): void {
    if (maxTokens < 1) {
      throw new Error('Max tokens must be greater than 0');
    }
    this.defaultMaxTokens = maxTokens;
  }

  /**
   * Get current configuration
   */
  getConfig(): {
    model: string;
    temperature: number;
    maxTokens: number;
    hasApiKey: boolean;
  } {
    return {
      model: this.model,
      temperature: this.defaultTemperature,
      maxTokens: this.defaultMaxTokens,
      hasApiKey: !!this.apiKey
    };
  }
}
