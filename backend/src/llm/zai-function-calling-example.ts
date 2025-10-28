/**
 * ZAI Function Calling Examples
 * Demonstrates how to use the ZaiClient with function calling
 */

import { ZaiClient, Tool, ToolCall } from './zai';

/**
 * Example 1: Simple Tool Definition
 */
export function createExampleTools(): Tool[] {
  return [
    {
      type: 'function',
      function: {
        name: 'get_lead_info',
        description: 'Retrieve lead information from database by phone number',
        parameters: {
          type: 'object',
          properties: {
            phone: {
              type: 'string',
              description: 'Phone number of the lead in E.164 format (e.g., +1234567890)'
            }
          },
          required: ['phone']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'create_appointment',
        description: 'Create a new appointment for a lead',
        parameters: {
          type: 'object',
          properties: {
            lead_id: {
              type: 'string',
              description: 'ID of the lead'
            },
            date: {
              type: 'string',
              description: 'Appointment date in ISO format (YYYY-MM-DD)'
            },
            time: {
              type: 'string',
              description: 'Appointment time in HH:MM format'
            },
            type: {
              type: 'string',
              enum: ['test_drive', 'consultation', 'service'],
              description: 'Type of appointment'
            }
          },
          required: ['lead_id', 'date', 'time', 'type']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'send_whatsapp_message',
        description: 'Send a WhatsApp message to a phone number',
        parameters: {
          type: 'object',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient phone number in E.164 format'
            },
            message: {
              type: 'string',
              description: 'Message content to send'
            }
          },
          required: ['to', 'message']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_available_cars',
        description: 'Get list of available cars in inventory',
        parameters: {
          type: 'object',
          properties: {
            make: {
              type: 'string',
              description: 'Car make/brand (optional filter)'
            },
            model: {
              type: 'string',
              description: 'Car model (optional filter)'
            },
            year_min: {
              type: 'number',
              description: 'Minimum year (optional filter)'
            },
            year_max: {
              type: 'number',
              description: 'Maximum year (optional filter)'
            },
            price_max: {
              type: 'number',
              description: 'Maximum price in USD (optional filter)'
            }
          },
          required: []
        }
      }
    }
  ];
}

/**
 * Example 2: Tool Executor Function
 * This function routes tool calls to actual implementations
 */
export async function executeToolCall(toolName: string, args: any): Promise<any> {
  console.log(`Executing tool: ${toolName} with args:`, args);

  switch (toolName) {
    case 'get_lead_info':
      return await getLeadInfo(args.phone);

    case 'create_appointment':
      return await createAppointment(
        args.lead_id,
        args.date,
        args.time,
        args.type
      );

    case 'send_whatsapp_message':
      return await sendWhatsAppMessage(args.to, args.message);

    case 'get_available_cars':
      return await getAvailableCars({
        make: args.make,
        model: args.model,
        year_min: args.year_min,
        year_max: args.year_max,
        price_max: args.price_max
      });

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Mock implementations (replace with real implementations)
 */
async function getLeadInfo(phone: string) {
  // TODO: Replace with actual database query
  return {
    success: true,
    lead: {
      id: 'lead_123',
      name: 'John Doe',
      phone: phone,
      email: 'john@example.com',
      status: 'active',
      interested_in: 'Mercedes C-Class'
    }
  };
}

async function createAppointment(
  leadId: string,
  date: string,
  time: string,
  type: string
) {
  // TODO: Replace with actual database insert
  return {
    success: true,
    appointment: {
      id: 'appt_456',
      lead_id: leadId,
      date,
      time,
      type,
      status: 'scheduled'
    }
  };
}

async function sendWhatsAppMessage(to: string, message: string) {
  // TODO: Replace with actual WhatsApp API call
  return {
    success: true,
    message_id: 'msg_789',
    sent_at: new Date().toISOString()
  };
}

async function getAvailableCars(filters: any) {
  // TODO: Replace with actual database query
  return {
    success: true,
    cars: [
      {
        id: 'car_1',
        make: 'Mercedes',
        model: 'C-Class',
        year: 2023,
        price: 45000,
        status: 'available'
      },
      {
        id: 'car_2',
        make: 'Mercedes',
        model: 'E-Class',
        year: 2023,
        price: 55000,
        status: 'available'
      }
    ]
  };
}

/**
 * Example 3: Manual Function Calling Flow
 */
export async function manualFunctionCallingExample() {
  const client = new ZaiClient();
  const tools = createExampleTools();

  // First call - LLM decides to use tools
  const response1 = await client.generateWithTools(
    "What's the info for lead with phone +1234567890?",
    tools
  );

  console.log('First Response:', response1);

  if (response1.tool_calls) {
    // Execute tools
    const toolResults = [];

    for (const toolCall of response1.tool_calls) {
      const args = client.parseToolArguments(toolCall);
      if (args) {
        const result = await executeToolCall(toolCall.function.name, args);
        toolResults.push({
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result)
        });
      }
    }

    // Build conversation history
    const conversationHistory = [
      { role: 'user' as const, content: "What's the info for lead with phone +1234567890?" },
      { role: 'assistant' as const, content: response1.message, tool_calls: response1.tool_calls },
      ...client.buildToolResultMessages(toolResults)
    ];

    // Second call - Get final response
    const response2 = await client.generateWithTools(
      "",
      tools,
      conversationHistory
    );

    console.log('Final Response:', response2.message);
    return response2.message;
  }

  return response1.message;
}

/**
 * Example 4: Automatic Function Calling Loop
 */
export async function automaticFunctionCallingExample() {
  const client = new ZaiClient();
  const tools = createExampleTools();

  const response = await client.handleToolCallingLoop(
    "Get the lead info for +1234567890 and book a test drive appointment for them on 2025-11-01 at 14:00",
    tools,
    executeToolCall,
    5 // max iterations
  );

  console.log('Final Response:', response);
  return response;
}

/**
 * Example 5: Using Helper Methods
 */
export async function helperMethodsExample() {
  const client = new ZaiClient();

  // Create a tool using helper
  const customTool = client.createTool(
    'calculate_financing',
    'Calculate car financing options',
    {
      properties: {
        price: { type: 'number', description: 'Car price' },
        down_payment: { type: 'number', description: 'Down payment amount' },
        term_months: { type: 'number', description: 'Loan term in months' }
      },
      required: ['price', 'term_months']
    }
  );

  // Validate tools
  const tools = [customTool, ...createExampleTools()];
  const validation = client.validateTools(tools);

  if (!validation.valid) {
    console.error('Invalid tools:', validation.errors);
    throw new Error('Tool validation failed');
  }

  // Check configuration
  const config = client.getConfig();
  console.log('Client Configuration:', config);

  // Set custom parameters
  client.setTemperature(0.3); // Lower for more deterministic output
  client.setMaxTokens(2048);

  // Use tools
  const response = await client.generateWithTools(
    "Calculate financing for a $50,000 car with $10,000 down payment over 60 months",
    tools
  );

  return response;
}

/**
 * Example 6: Multi-turn Conversation with Context
 */
export async function multiTurnConversationExample() {
  const client = new ZaiClient();
  const tools = createExampleTools();

  // Start with empty conversation
  let conversationHistory: any[] = [];

  // Turn 1
  console.log('\n--- Turn 1 ---');
  const response1 = await client.handleToolCallingLoop(
    "What Mercedes cars do you have available?",
    tools,
    executeToolCall,
    5,
    conversationHistory
  );
  console.log('Assistant:', response1);

  // Update history
  conversationHistory.push(
    { role: 'user', content: "What Mercedes cars do you have available?" },
    { role: 'assistant', content: response1 }
  );

  // Turn 2
  console.log('\n--- Turn 2 ---');
  const response2 = await client.handleToolCallingLoop(
    "I'm interested in the C-Class. Can you show me more details?",
    tools,
    executeToolCall,
    5,
    conversationHistory
  );
  console.log('Assistant:', response2);

  // Update history
  conversationHistory.push(
    { role: 'user', content: "I'm interested in the C-Class. Can you show me more details?" },
    { role: 'assistant', content: response2 }
  );

  // Turn 3
  console.log('\n--- Turn 3 ---');
  const response3 = await client.handleToolCallingLoop(
    "Great! Book me a test drive for tomorrow at 2pm. My number is +1234567890",
    tools,
    executeToolCall,
    5,
    conversationHistory
  );
  console.log('Assistant:', response3);

  return {
    conversation: conversationHistory,
    finalResponse: response3
  };
}

/**
 * Example 7: Error Handling
 */
export async function errorHandlingExample() {
  const client = new ZaiClient();
  const tools = createExampleTools();

  try {
    // This will trigger tool calls that might fail
    const response = await client.handleToolCallingLoop(
      "Get info for invalid phone number and book appointment",
      tools,
      async (name, args) => {
        // Simulate some tools failing
        if (name === 'get_lead_info' && !args.phone.startsWith('+')) {
          throw new Error('Invalid phone number format');
        }
        return executeToolCall(name, args);
      },
      5
    );

    console.log('Response despite errors:', response);
    return response;
  } catch (error) {
    console.error('Failed to complete conversation:', error);
    throw error;
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n========== ZAI Function Calling Examples ==========\n');

  try {
    console.log('\n--- Example 1: Manual Function Calling ---');
    await manualFunctionCallingExample();

    console.log('\n--- Example 2: Automatic Function Calling ---');
    await automaticFunctionCallingExample();

    console.log('\n--- Example 3: Helper Methods ---');
    await helperMethodsExample();

    console.log('\n--- Example 4: Multi-turn Conversation ---');
    await multiTurnConversationExample();

    console.log('\n--- Example 5: Error Handling ---');
    await errorHandlingExample();

    console.log('\n========== All Examples Completed ==========\n');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
