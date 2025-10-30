#!/usr/bin/env bun
/**
 * Update Traefik Configuration Script (TypeScript/Bun version)
 * This script regenerates the traefik-proxy/autolmk.yaml file
 * and can be called via webhook or cron
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { access, stat, readFile } from 'node:fs/promises';
import { generateTraefikConfig } from './generate-traefik-config';

const execAsync = promisify(exec);

async function updateTraefik(): Promise<void> {
  try {
    console.log('🔄 Updating Traefik configuration...');

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not available');
    }

    // Generate new traefik configuration
    console.log('🔧 Generating new traefik configuration...');
    await generateTraefikConfig();

    // Check if configuration was generated successfully
    try {
      const configPath = `${process.env.TRAEFIK_CONFIG_DIR || '/traefik-proxy'}/autolmk.yaml`;
      await access(configPath);
      console.log('✅ Traefik configuration updated successfully');
      
      // Get configuration stats
      const stats = await stat(configPath);
      const configContent = await readFile(configPath, 'utf8');
      
      const routeCount = (configContent.match(/rule:/g) || []).length;
      const serviceCount = (configContent.match(/servers:/g) || []).length;
      
      console.log('📊 Configuration summary:');
      console.log(`   - Routes: ${routeCount}`);
      console.log(`   - Services: ${serviceCount}`);
      console.log(`   - Last updated: ${stats.mtime.toISOString()}`);
      
      // Optionally reload traefik if it's running
      try {
        await execAsync('pkill -HUP traefik || true', { timeout: 5000 });
        console.log('🔄 Traefik service reloaded');
      } catch (error) {
        console.log('⚠️  Traefik reload skipped (service not running)');
      }
      
    } catch (error) {
      throw new Error('Failed to generate or access traefik configuration file');
    }

    console.log('🎉 Traefik update completed');

  } catch (error) {
    console.error('❌ Error updating traefik configuration:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.main) {
  updateTraefik().catch(console.error);
}

export { updateTraefik };