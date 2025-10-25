# ZAI Function Calling - Quick Start Guide

## 5-Minute Quick Start

### 1. Import

```typescript
import { ZaiClient, Tool } from './llm/zai';
```

### 2. Create Client

```typescript
const client = new ZaiClient();
```

### 3. Define Tools

```typescript
const tools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'get_lead_info',
      description: 'Get lead information by phone number',
      parameters: {
        type: 'object',
        properties: {
          phone: { type: 'string', description: 'Phone number' }
        },
        required: ['phone']
      }
    }
  }
];
```

### 4. Create Tool Executor

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

### 5. Use It!

**Simple (Recommended):**

```typescript
const response = await client.handleToolCallingLoop(
  "Get info for +1234567890",
  tools,
  executeTools,
  5 // max iterations
);

console.log(response); // Final text response
```

**Advanced (Manual Control):**

```typescript
const result = await client.generateWithTools(
  "Get info for +1234567890",
  tools
);

if (result.tool_calls) {
  // Handle tool calls manually
  for (const call of result.tool_calls) {
    const args = client.parseToolArguments(call);
    const result = await executeTools(call.function.name, args);
  }
}
```

## Common Patterns

### Pattern 1: WhatsApp Bot Handler

```typescript
class BotHandler {
  private llm = new ZaiClient();
  private conversations = new Map();

  async handleMessage(phone: string, message: string) {
    const history = this.conversations.get(phone) || [];

    const response = await this.llm.handleToolCallingLoop(
      message,
      tools,
      executeTools,
      5,
      history
    );

    history.push(
      { role: 'user', content: message },
      { role: 'assistant', content: response }
    );
    this.conversations.set(phone, history);

    return response;
  }
}
```

### Pattern 2: Helper Method Usage

```typescript
// Create tool easily
const tool = client.createTool(
  'send_message',
  'Send WhatsApp message',
  {
    properties: {
      to: { type: 'string' },
      message: { type: 'string' }
    },
    required: ['to', 'message']
  }
);

// Validate before use
const validation = client.validateTools([tool]);
if (!validation.valid) {
  console.error(validation.errors);
}
```

### Pattern 3: Configuration

```typescript
const client = new ZaiClient();
client.setTemperature(0.3); // More deterministic
client.setMaxTokens(2048);  // Longer responses

const config = client.getConfig();
console.log(config); // { model, temperature, maxTokens, hasApiKey }
```

## Tool Definition Cheat Sheet

```typescript
// String parameter
{
  type: 'string',
  description: 'Description here'
}

// Number parameter
{
  type: 'number',
  description: 'Numeric value'
}

// Enum (restricted values)
{
  type: 'string',
  enum: ['option1', 'option2'],
  description: 'Pick one'
}

// Boolean
{
  type: 'boolean',
  description: 'True or false'
}

// Array
{
  type: 'array',
  items: { type: 'string' },
  description: 'List of items'
}
```

## Error Handling

```typescript
try {
  const response = await client.handleToolCallingLoop(
    message,
    tools,
    async (name, args) => {
      try {
        return await executeReal(name, args);
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  );
} catch (error) {
  console.error('Failed:', error);
  return "Sorry, I encountered an error.";
}
```

## Testing

```bash
# Type check
bunx tsc --noEmit backend/src/llm/zai.ts

# Run examples
bun run backend/src/llm/zai-function-calling-example.ts
```

## Environment Variables

```env
ZAI_API_KEY=your_key_here
ZAI_API_URL=https://api.z.ai/api/coding/paas/v4
ZAI_MODEL=glm-4.5v
```

## Full Documentation

- **Complete API Reference:** `FUNCTION_CALLING.md`
- **Working Examples:** `zai-function-calling-example.ts`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tool not called | Check description clarity |
| Parse errors | Use `parseToolArguments()` |
| Max iterations | Increase limit or check tools |
| Slow responses | Reduce `maxTokens` |
| API errors | Check API key and network |

## Ready to Go!

You now have everything needed to implement function calling in your AutoLeads bot. Start with the simple pattern and expand as needed.

**Next Steps:**
1. Define your tools in `tools.ts`
2. Implement executors in `tool-executor.ts`
3. Integrate with WhatsApp bot handler
4. Test with real messages
5. Monitor and optimize

Happy coding! 🚀
