/**
 * ZAI API Client (OpenAI Compatible)
 * Integration with ZAI API for natural language generation
 */

export class ZaiClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.ZAI_API_KEY || '';
    this.baseUrl = process.env.ZAI_API_URL || 'https://api.z.ai/api/coding/paas/v4';
    this.model = process.env.ZAI_MODEL || 'glm-4.5v';

    if (!this.apiKey) {
      console.warn('⚠️ ZAI_API_KEY not set. LLM features will not work.');
    }
  }

  /**
   * Generate response from prompt
   */
  async generateResponse(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ZAI API key not configured');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/chat/completions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.95,
            stream: false
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('ZAI API error:', errorData);
        throw new Error(`ZAI API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract text from OpenAI-compatible response
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
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
}
