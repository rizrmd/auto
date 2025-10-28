/**
 * Response Streamer
 * Implements streaming responses for long-running operations
 * Provides real-time feedback to users during processing
 */

import type { Context } from 'hono';

interface StreamChunk {
  type: 'progress' | 'data' | 'error' | 'complete';
  data?: any;
  progress?: number;
  message?: string;
  timestamp: number;
}

interface StreamingOptions {
  chunkDelay?: number;
  maxChunks?: number;
  timeout?: number;
  enableHeartbeat?: boolean;
}

/**
 * Response streamer for real-time feedback
 */
export class ResponseStreamer {
  private chunks: StreamChunk[] = [];
  private isStreaming = false;
  private startTime = 0;
  private options: StreamingOptions;

  constructor(options: StreamingOptions = {}) {
    this.options = {
      chunkDelay: 500,        // 500ms between chunks
      maxChunks: 100,         // Max 100 chunks
      timeout: 60000,         // 60 second timeout
      enableHeartbeat: true,  // Send heartbeat chunks
      ...options
    };
  }

  /**
   * Start streaming response
   */
  async stream(
    c: Context,
    operation: (streamer: ResponseStreamer) => Promise<void>
  ): Promise<void> {
    if (this.isStreaming) {
      throw new Error('Streamer already in use');
    }

    this.isStreaming = true;
    this.startTime = Date.now();
    this.chunks = [];

    try {
      // Set SSE headers
      c.header('Content-Type', 'text/event-stream');
      c.header('Cache-Control', 'no-cache');
      c.header('Connection', 'keep-alive');
      c.header('Access-Control-Allow-Origin', '*');
      c.header('Access-Control-Allow-Headers', 'Cache-Control');

      // Send initial connection event
      this.sendChunk(c, {
        type: 'progress',
        message: 'Processing started...',
        timestamp: Date.now()
      });

      // Start heartbeat if enabled
      let heartbeatTimer: Timer | null = null;
      if (this.options.enableHeartbeat) {
        heartbeatTimer = setInterval(() => {
          this.sendHeartbeat(c);
        }, 10000); // Every 10 seconds
      }

      // Execute operation with timeout
      const operationPromise = operation(this);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Operation timeout')), this.options.timeout);
      });

      await Promise.race([operationPromise, timeoutPromise]);

      // Send completion event
      this.sendChunk(c, {
        type: 'complete',
        message: 'Processing completed',
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('[STREAMER] Streaming error:', error);
      
      this.sendChunk(c, {
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      });
      
    } finally {
      this.isStreaming = false;
      
      // Send final event to close connection
      this.sendChunk(c, {
        type: 'complete',
        message: 'Stream ended',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Send progress update
   */
  sendProgress(
    c: Context,
    progress: number,
    message?: string,
    data?: any
  ): void {
    if (!this.isStreaming) return;

    this.sendChunk(c, {
      type: 'progress',
      progress: Math.max(0, Math.min(100, progress)),
      message: message || `Processing... ${progress}%`,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send data chunk
   */
  sendData(c: Context, data: any): void {
    if (!this.isStreaming) return;

    this.sendChunk(c, {
      type: 'data',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Send error
   */
  sendError(c: Context, error: Error | string): void {
    if (!this.isStreaming) return;

    const message = error instanceof Error ? error.message : error;
    
    this.sendChunk(c, {
      type: 'error',
      message,
      timestamp: Date.now()
    });
  }

  /**
   * Send chunk to client
   * @private
   */
  private sendChunk(c: Context, chunk: StreamChunk): void {
    if (this.chunks.length >= this.options.maxChunks!) {
      return;
    }

    this.chunks.push(chunk);

    const data = `data: ${JSON.stringify(chunk)}\n\n`;
    
    // Use c.req.raw to write directly to response
    try {
      c.req.raw?.write?.(data);
    } catch (error) {
      console.error('[STREAMER] Failed to send chunk:', error);
    }
  }

  /**
   * Send heartbeat to keep connection alive
   * @private
   */
  private sendHeartbeat(c: Context): void {
    if (!this.isStreaming) return;

    this.sendChunk(c, {
      type: 'progress',
      message: 'heartbeat',
      timestamp: Date.now()
    });
  }

  /**
   * Get streaming statistics
   */
  getStats(): {
    isStreaming: boolean;
    duration: number;
    chunkCount: number;
    averageChunkInterval: number;
  } {
    const duration = this.isStreaming ? Date.now() - this.startTime : 0;
    const averageInterval = this.chunks.length > 1 
      ? duration / (this.chunks.length - 1) 
      : 0;

    return {
      isStreaming: this.isStreaming,
      duration,
      chunkCount: this.chunks.length,
      averageChunkInterval
    };
  }

  /**
   * Reset streamer
   */
  reset(): void {
    this.isStreaming = false;
    this.chunks = [];
    this.startTime = 0;
  }
}

/**
 * Streaming bot response handler
 */
export class StreamingBotHandler {
  private streamer: ResponseStreamer;

  constructor() {
    this.streamer = new ResponseStreamer({
      chunkDelay: 800,
      enableHeartbeat: true
    });
  }

  /**
   * Stream LLM response generation
   */
  async streamLLMResponse(
    c: Context,
    tenantId: number,
    prompt: string,
    options: {
      showThinking?: boolean;
      showProgress?: boolean;
    } = {}
  ): Promise<void> {
    await this.streamer.stream(c, async (streamer) => {
      try {
        if (options.showThinking) {
          streamer.sendProgress(c, 10, 'Thinking about your request...');
          await this.delay(1000);
        }

        if (options.showProgress) {
          streamer.sendProgress(c, 30, 'Analyzing context...');
          await this.delay(800);
          
          streamer.sendProgress(c, 50, 'Generating response...');
          await this.delay(1200);
          
          streamer.sendProgress(c, 80, 'Finalizing response...');
          await this.delay(800);
        }

        // Generate actual response
        // This would integrate with the LLM service
        const response = await this.generateLLMResponse(tenantId, prompt);
        
        streamer.sendData(c, { response });
        streamer.sendProgress(c, 100, 'Response ready!');

      } catch (error) {
        streamer.sendError(c, error instanceof Error ? error : 'Unknown error');
      }
    });
  }

  /**
   * Stream car upload process
   */
  async streamCarUpload(
    c: Context,
    tenantId: number,
    carData: any,
    photos: string[]
  ): Promise<void> {
    await this.streamer.stream(c, async (streamer) => {
      try {
        streamer.sendProgress(c, 10, 'Validating car data...');
        await this.delay(500);

        streamer.sendProgress(c, 20, 'Processing photos...');
        for (let i = 0; i < photos.length; i++) {
          streamer.sendProgress(c, 20 + (i / photos.length) * 30, `Processing photo ${i + 1}/${photos.length}...`);
          await this.delay(300);
        }

        streamer.sendProgress(c, 60, 'Generating AI description...');
        await this.delay(2000);

        streamer.sendProgress(c, 80, 'Saving to database...');
        await this.delay(1000);

        // Save car data
        const savedCar = await this.saveCarData(tenantId, carData, photos);
        
        streamer.sendData(c, { car: savedCar });
        streamer.sendProgress(c, 100, 'Car uploaded successfully!');

      } catch (error) {
        streamer.sendError(c, error instanceof Error ? error : 'Unknown error');
      }
    });
  }

  /**
   * Stream car search results
   */
  async streamCarSearch(
    c: Context,
    tenantId: number,
    searchParams: any
  ): Promise<void> {
    await this.streamer.stream(c, async (streamer) => {
      try {
        streamer.sendProgress(c, 20, 'Searching cars...');
        await this.delay(800);

        streamer.sendProgress(c, 50, 'Filtering results...');
        await this.delay(600);

        streamer.sendProgress(c, 80, 'Loading details...');
        await this.delay(400);

        // Perform search
        const results = await this.searchCars(tenantId, searchParams);
        
        streamer.sendData(c, { 
          cars: results.cars,
          total: results.total,
          searchParams
        });
        
        streamer.sendProgress(c, 100, `Found ${results.total} cars`);

      } catch (error) {
        streamer.sendError(c, error instanceof Error ? error : 'Unknown error');
      }
    });
  }

  /**
   * Generate LLM response (mock implementation)
   * @private
   */
  private async generateLLMResponse(tenantId: number, prompt: string): Promise<string> {
    // This would integrate with the actual LLM service
    await this.delay(2000);
    return `This is a simulated response for: "${prompt}"`;
  }

  /**
   * Save car data (mock implementation)
   * @private
   */
  private async saveCarData(tenantId: number, carData: any, photos: string[]): Promise<any> {
    // This would integrate with the actual database service
    await this.delay(1000);
    return { id: Date.now(), ...carData, photos, tenantId };
  }

  /**
   * Search cars (mock implementation)
   * @private
   */
  private async searchCars(tenantId: number, searchParams: any): Promise<{ cars: any[]; total: number }> {
    // This would integrate with the actual search service
    await this.delay(1000);
    return {
      cars: [
        { id: 1, brand: 'Toyota', model: 'Avanza', year: 2020, price: 185000000 },
        { id: 2, brand: 'Honda', model: 'Jazz', year: 2019, price: 187000000 }
      ],
      total: 2
    };
  }

  /**
   * Delay helper
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Helper function to create streaming response
 */
export function createStreamingResponse(
  operation: (streamer: ResponseStreamer) => Promise<void>,
  options?: StreamingOptions
): (c: Context) => Promise<void> {
  const streamer = new ResponseStreamer(options);
  
  return async (c: Context) => {
    await streamer.stream(c, operation);
  };
}

/**
 * Global streaming handler instance
 */
export const streamingHandler = new StreamingBotHandler();