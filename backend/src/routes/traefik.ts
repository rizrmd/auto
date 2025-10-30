import { Hono } from 'hono';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const traefik = new Hono();

/**
 * POST /api/traefik/reload
 * Reload traefik configuration by regenerating the config file
 * This endpoint should be secured in production
 */
traefik.post('/reload', async (c) => {
  try {
    console.log('[TRAEFIK] Reloading traefik configuration...');
    
    // Run the traefik update script
    const { stdout, stderr } = await execAsync('bun run traefik:update', {
      cwd: '/app',
      timeout: 30000 // 30 seconds timeout
    });

    if (stderr && !stderr.includes('Warning')) {
      console.error('[TRAEFIK] Error generating config:', stderr);
      return c.json({
        success: false,
        error: 'Failed to generate traefik configuration',
        details: stderr
      }, 500);
    }

    console.log('[TRAEFIK] Configuration generated successfully');
    console.log('[TRAEFIK] Output:', stdout);

    // Optionally reload traefik service if it's running
    try {
      await execAsync('pkill -HUP traefik || true', { timeout: 5000 });
      console.log('[TRAEFIK] Traefik service reloaded');
    } catch (error) {
      console.log('[TRAEFIK] Traefik reload skipped (service not running)');
    }

    return c.json({
      success: true,
      message: 'Traefik configuration reloaded successfully',
      output: stdout
    });

  } catch (error) {
    console.error('[TRAEFIK] Error reloading configuration:', error);
    return c.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/traefik/status
 * Get current traefik configuration status
 */
traefik.get('/status', async (c) => {
  try {
    const fs = await import('node:fs/promises');
    
    // Check if traefik config exists
    const configExists = await fs.access('/traefik-proxy/autolmk.yaml')
      .then(() => true)
      .catch(() => false);

    if (!configExists) {
      return c.json({
        success: false,
        configExists: false,
        message: 'Traefik configuration file not found'
      });
    }

    // Read config file stats
    const stats = await fs.stat('/traefik-proxy/autolmk.yaml');
    const configContent = await fs.readFile('/traefik-proxy/autolmk.yaml', 'utf8');
    
    // Count routes and services
    const routeCount = (configContent.match(/rule:/g) || []).length;
    const serviceCount = (configContent.match(/servers:/g) || []).length;

    return c.json({
      success: true,
      configExists: true,
      lastModified: stats.mtime.toISOString(),
      routes: routeCount,
      services: serviceCount,
      message: 'Traefik configuration is active'
    });

  } catch (error) {
    console.error('[TRAEFIK] Error checking status:', error);
    return c.json({
      success: false,
      error: 'Failed to check traefik status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default traefik;