# ZAI Function Calling Documentation

Complete guide for implementing function calling with the ZAI API client.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [Tool Definition](#tool-definition)
5. [Usage Patterns](#usage-patterns)
6. [Best Practices](#best-practices)
7. [Error Handling](#error-handling)
8. [Examples](#examples)

## Overview

The ZaiClient now supports OpenAI-compatible function calling, allowing the LLM to:
- Call external functions/tools during conversation
- Execute multi-step workflows automatically
- Interact with databases, APIs, and external services
- Make data-driven decisions based on real-time information

### Key Features

- **Backward Compatible**: Existing `generateResponse()` calls work unchanged
- **Manual Mode**: Fine-grained control over tool execution
- **Automatic Mode**: Built-in loop handles multi-turn tool calling
- **Type Safe**: Full TypeScript support with interfaces
- **Error Resilient**: Graceful handling of tool failures
- **Debuggable**: Comprehensive logging at each step

## Quick Start

### 1. Define Your Tools

```typescript
import { Tool } from './zai';

const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_lead_info',
      description: 'Get lead information by phone number',
      parameters: {
        type: 'object',
        properties: {
          phone: {
            type: 'string',
            description: 'Phone number in E.164 format'
          }
        },
        required: ['phone']
      }
    }
  }
];
```

### 2. Create Tool Executor

```typescript
async function executeTools(toolName: string, args: any) {
  switch (toolName) {
    case 'get_lead_info':
      return await db.leads.findByPhone(args.phone);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

### 3. Use Automatic Mode

```typescript
import { ZaiClient } from './zai';

const client = new ZaiClient();

const response = await client.handleToolCallingLoop(
  "Get info for lead +1234567890",
  tools,
  executeTools,
  5 // max iterations
);

console.log(response);
```

## API Reference

### Core Methods

#### `generateWithTools(prompt, tools, conversationHistory?)`

Generate response with function calling support.

**Parameters:**
- `prompt: string` - User prompt
- `tools: Tool[]` - Array of available tools
- `conversationHistory?: ChatMessage[]` - Previous messages

**Returns:** `Promise<GenerateWithToolsResponse>`
```typescript
{
  message: string | null;           // Text response
  tool_calls: ToolCall[] | null;    // Tool calls to execute
  finish_reason: string;             // 'stop' | 'tool_calls' | 'length'
  usage?: {                          // Token usage stats
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}
```

#### `handleToolCallingLoop(prompt, tools, toolExecutor, maxIterations?, conversationHistory?)`

Automatic function calling with built-in execution loop.

**Parameters:**
- `prompt: string` - Initial user prompt
- `tools: Tool[]` - Available tools
- `toolExecutor: (name, args) => Promise<any>` - Function to execute tools
- `maxIterations?: number` - Max iterations (default: 5)
- `conversationHistory?: ChatMessage[]` - Previous messages

**Returns:** `Promise<string>` - Final text response

**Features:**
- Automatically executes tool calls
- Handles multi-turn conversations
- Returns final response after all tools executed
- Limits iterations to prevent infinite loops

#### `parseToolCalls(response)`

Extract tool calls from API response.

**Parameters:**
- `response: any` - Raw API response

**Returns:** `ToolCall[] | null`

#### `buildToolResultMessages(toolResults)`

Format tool results for next LLM call.

**Parameters:**
- `toolResults: ToolResult[]` - Results from tool execution

**Returns:** `ChatMessage[]`

### Helper Methods

#### `createTool(name, description, parameters)`

Helper to create tool definitions easily.

```typescript
const tool = client.createTool(
  'send_message',
  'Send a WhatsApp message',
  {
    properties: {
      to: { type: 'string', description: 'Recipient phone' },
      message: { type: 'string', description: 'Message content' }
    },
    required: ['to', 'message']
  }
);
```

#### `validateTools(tools)`

Validate tool definitions before use.

```typescript
const validation = client.validateTools(tools);
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}
```

#### `parseToolArguments(toolCall)`

Safely parse tool arguments from JSON string.

```typescript
const args = client.parseToolArguments(toolCall);
if (args) {
  await executeMyTool(args);
}
```

#### `formatConversationHistory(messages)`

Format messages for API compatibility.

#### `setTemperature(temperature)` / `setMaxTokens(maxTokens)`

Configure generation parameters.

#### `getConfig()`

Get current client configuration.

## Tool Definition

### OpenAI-Compatible Format

```typescript
interface Tool {
  type: 'function';
  function: {
    name: string;                    // Unique tool name
    description: string;              // What the tool does
    parameters: {
      type: 'object';
      properties: Record<string, any>; // JSON Schema
      required?: string[];             // Required parameters
    };
  };
}
```

### JSON Schema Types

```typescript
// String
{
  type: 'string',
  description: 'Description here',
  enum?: ['option1', 'option2']  // Optional: restrict values
}

// Number
{
  type: 'number',
  description: 'Numeric value',
  minimum?: 0,
  maximum?: 100
}

// Boolean
{
  type: 'boolean',
  description: 'True or false'
}

// Array
{
  type: 'array',
  description: 'List of items',
  items: {
    type: 'string'  // Type of array elements
  }
}

// Object
{
  type: 'object',
  description: 'Nested object',
  properties: {
    field1: { type: 'string' },
    field2: { type: 'number' }
  }
}
```

### Example: Complete Tool Definition

```typescript
const appointmentTool: Tool = {
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
        },
        notes: {
          type: 'string',
          description: 'Optional notes about the appointment'
        }
      },
      required: ['lead_id', 'date', 'time', 'type']
    }
  }
};
```

## Usage Patterns

### Pattern 1: Simple Tool Call (Manual)

Best for single-step operations.

```typescript
const response = await client.generateWithTools(
  "Get lead info for +1234567890",
  tools
);

if (response.tool_calls) {
  for (const toolCall of response.tool_calls) {
    const args = client.parseToolArguments(toolCall);
    const result = await executeMyTool(toolCall.function.name, args);
    console.log('Result:', result);
  }
}
```

### Pattern 2: Multi-turn with Context (Manual)

For conversations requiring multiple exchanges.

```typescript
let history: ChatMessage[] = [];

// Turn 1
history.push({ role: 'user', content: "Get available cars" });
const resp1 = await client.generateWithTools("Get available cars", tools, history);
history.push({ role: 'assistant', content: resp1.message, tool_calls: resp1.tool_calls });

// Execute tools and add results
if (resp1.tool_calls) {
  const results = await executeTool(resp1.tool_calls);
  history.push(...client.buildToolResultMessages(results));
}

// Turn 2
history.push({ role: 'user', content: "Show me the Mercedes" });
const resp2 = await client.generateWithTools("Show me the Mercedes", tools, history);
```

### Pattern 3: Automatic Loop (Recommended)

Simplest approach for most use cases.

```typescript
const response = await client.handleToolCallingLoop(
  "Get lead info and book appointment for +1234567890",
  tools,
  async (name, args) => {
    // Your tool execution logic
    return await myDatabase.execute(name, args);
  },
  5 // max iterations
);
```

### Pattern 4: WhatsApp Bot Integration

Integrate with conversational flows.

```typescript
import { ZaiClient, Tool } from './llm/zai';

class WhatsAppBotHandler {
  private client: ZaiClient;
  private tools: Tool[];
  private conversations: Map<string, ChatMessage[]> = new Map();

  constructor() {
    this.client = new ZaiClient();
    this.tools = this.defineTools();
  }

  async handleMessage(phoneNumber: string, message: string): Promise<string> {
    // Get or create conversation history
    let history = this.conversations.get(phoneNumber) || [];

    // Use automatic tool calling
    const response = await this.client.handleToolCallingLoop(
      message,
      this.tools,
      this.executeTools.bind(this),
      5,
      history
    );

    // Update conversation history
    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );
    this.conversations.set(phoneNumber, history);

    return response;
  }

  private defineTools(): Tool[] {
    return [
      // Your tools here
    ];
  }

  private async executeTools(name: string, args: any): Promise<any> {
    // Your tool execution logic
  }
}
```

## Best Practices

### 1. Tool Design

**DO:**
- Use clear, descriptive tool names (e.g., `get_lead_info` not `gli`)
- Write detailed descriptions explaining what the tool does
- Specify all parameters with helpful descriptions
- Mark required parameters explicitly
- Use enums for restricted values

**DON'T:**
- Create too many similar tools (combine related functionality)
- Use vague descriptions (LLM won't know when to use it)
- Forget to validate input parameters in your executor
- Return huge payloads (summarize data when possible)

### 2. Error Handling

```typescript
async function executeTools(name: string, args: any) {
  try {
    // Validate inputs
    if (!args.phone || !args.phone.startsWith('+')) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Execute
    const result = await db.query(args);

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error(`Tool ${name} failed:`, error);

    return {
      success: false,
      error: error.message
    };
  }
}
```

### 3. Performance Optimization

```typescript
// Cache client instance
const client = new ZaiClient();

// Reuse conversation history
const conversationCache = new Map<string, ChatMessage[]>();

// Set appropriate limits
client.setMaxTokens(2048); // Don't request more than needed

// Limit iterations
await client.handleToolCallingLoop(
  prompt,
  tools,
  executor,
  3 // Lower for faster responses
);
```

### 4. Security

```typescript
// Validate tool names (whitelist)
const ALLOWED_TOOLS = ['get_lead_info', 'create_appointment'];

async function executeTools(name: string, args: any) {
  if (!ALLOWED_TOOLS.includes(name)) {
    throw new Error('Unauthorized tool');
  }

  // Sanitize inputs
  const sanitizedArgs = sanitize(args);

  // Execute with proper auth
  return await authorizedExecute(name, sanitizedArgs);
}
```

### 5. Logging and Debugging

The client includes built-in logging. Watch console for:

```
📤 ZAI API Request: { model, messageCount, toolsCount }
📥 ZAI API Response: { finishReason, hasToolCalls, usage }
🔄 Tool calling iteration 1/5
🔧 Executing 2 tool calls...
  → Executing: get_lead_info
  ✓ get_lead_info completed
✅ Tool calling complete
```

## Error Handling

### Common Errors

#### 1. Tool Validation Errors

```typescript
const validation = client.validateTools(tools);
if (!validation.valid) {
  console.error('Invalid tools:', validation.errors);
  // Fix tools before proceeding
}
```

#### 2. API Errors

```typescript
try {
  const response = await client.generateWithTools(prompt, tools);
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Invalid API key');
  } else if (error.message.includes('429')) {
    console.error('Rate limited - retry with backoff');
  } else {
    console.error('API error:', error);
  }
}
```

#### 3. Tool Execution Errors

```typescript
await client.handleToolCallingLoop(
  prompt,
  tools,
  async (name, args) => {
    try {
      return await executeRealTool(name, args);
    } catch (error) {
      // Return error to LLM
      return {
        success: false,
        error: error.message,
        // LLM can decide what to do next
      };
    }
  }
);
```

#### 4. Max Iterations Reached

```typescript
const response = await client.handleToolCallingLoop(
  prompt,
  tools,
  executor,
  5 // If this is exceeded, last response is returned
);

// Check if complete
if (response.includes('Max iterations')) {
  console.warn('Tool calling loop did not complete');
}
```

## Examples

See `zai-function-calling-example.ts` for complete working examples:

1. **Manual Function Calling** - Full control over execution
2. **Automatic Function Calling** - Simplest approach
3. **Helper Methods** - Using utility functions
4. **Multi-turn Conversation** - Maintaining context
5. **Error Handling** - Resilient tool execution

### Run Examples

```bash
# Install dependencies
bun install

# Run examples
bun run backend/src/llm/zai-function-calling-example.ts
```

## Integration with AutoLeads

### Recommended Setup

```typescript
// src/services/whatsapp-bot.ts
import { ZaiClient } from '../llm/zai';
import { leadTools } from '../llm/tools'; // Your tools definition
import { prisma } from '../db';

export class WhatsAppBotService {
  private llm: ZaiClient;

  constructor() {
    this.llm = new ZaiClient();
    this.llm.setTemperature(0.7);
    this.llm.setMaxTokens(1024);
  }

  async handleIncomingMessage(
    from: string,
    message: string,
    conversationHistory: any[]
  ): Promise<string> {
    return await this.llm.handleToolCallingLoop(
      message,
      leadTools,
      this.executeTools.bind(this),
      5,
      conversationHistory
    );
  }

  private async executeTools(name: string, args: any) {
    switch (name) {
      case 'get_lead_info':
        return await prisma.lead.findUnique({
          where: { phone: args.phone }
        });

      case 'create_appointment':
        return await prisma.appointment.create({
          data: args
        });

      // Add more tools...

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
}
```

## TypeScript Types

All types are exported from `./zai`:

```typescript
import {
  ZaiClient,
  Tool,
  ToolCall,
  ToolResult,
  ChatMessage,
  GenerateWithToolsResponse
} from './llm/zai';
```

## Troubleshooting

### Tool not being called

- Check tool description clarity
- Verify parameters are well-documented
- Ensure tool name is unique and descriptive
- Test with `client.validateTools()`

### Arguments parsing fails

- Use `client.parseToolArguments()` for safe parsing
- Check JSON schema matches expected format
- Log raw arguments for debugging

### Max iterations reached

- Increase `maxIterations` parameter
- Check if tools are returning proper results
- Ensure LLM has enough context to decide when to stop

### Performance issues

- Reduce `maxTokens` if responses are slow
- Lower `maxIterations` for faster execution
- Consider caching tool results
- Use simpler tool descriptions

---

**Need Help?**

Check the examples in `zai-function-calling-example.ts` or refer to the OpenAI function calling documentation for more details on the underlying format.
