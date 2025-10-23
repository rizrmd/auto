/**
 * Prisma Client Singleton
 *
 * Ensures a single instance of PrismaClient is used throughout the application.
 * Prevents connection pool exhaustion in development with hot reloading.
 */

import { PrismaClient } from '../../../generated/prisma';
import { isDevelopment } from '../config/env';

/**
 * Global type augmentation for development hot reloading
 */
declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Create PrismaClient with appropriate logging based on environment
 */
function createPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: isDevelopment
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: isDevelopment ? 'pretty' : 'minimal',
  });

  return prisma;
}

/**
 * Singleton PrismaClient instance
 * In development, store in global to survive hot reloads
 * In production, create new instance
 */
export const prisma = global.__prisma || createPrismaClient();

if (isDevelopment) {
  global.__prisma = prisma;
}

/**
 * Graceful shutdown - disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw error;
  }
}

/**
 * Health check - verify database connection
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  responseTime?: number;
}> {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    return {
      connected: true,
      responseTime,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      connected: false,
    };
  }
}

/**
 * Transaction helper with retry logic
 */
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        return await callback(tx as PrismaClient);
      });
    } catch (error) {
      lastError = error as Error;
      console.error(`Transaction attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Transaction failed after maximum retries');
}

/**
 * Soft delete helper - sets deletedAt timestamp instead of hard delete
 */
export async function softDelete(
  model: any,
  where: any
): Promise<any> {
  return await model.update({
    where,
    data: {
      deletedAt: new Date(),
    },
  });
}

export default prisma;
