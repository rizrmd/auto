/**
 * Health Check Route
 *
 * Provides system health status and diagnostics.
 */

import { Hono } from 'hono';
import { checkDatabaseHealth } from '../db';
import type { HealthCheckResponse } from '../types/context';

const health = new Hono();

/**
 * GET /health
 * Health check endpoint
 */
health.get('/', async (c) => {
  const startTime = Date.now();

  // Check database connectivity
  const dbHealth = await checkDatabaseHealth();

  const healthResponse: HealthCheckResponse = {
    status: dbHealth.connected ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealth,
    version: '1.0.0',
  };

  const statusCode = dbHealth.connected ? 200 : 503;

  return c.json(healthResponse, statusCode);
});

export default health;
