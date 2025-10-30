#!/usr/bin/env bun
/**
 * Traefik Health Check Script
 * Monitors AutoLeads multi-domain configuration status
 */

import { readFile, access } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface HealthStatus {
  configFileExists: boolean;
  domainsCount: number;
  servicesCount: number;
  lastModified?: string;
  containerRunning: boolean;
  traefikRunning: boolean;
}

async function checkTraefikHealth(): Promise<HealthStatus> {
  const status: HealthStatus = {
    configFileExists: false,
    domainsCount: 0,
    servicesCount: 0,
    containerRunning: false,
    traefikRunning: false
  };

  try {
    // Check if configuration file exists
    status.configFileExists = await access('/traefik-proxy/autolmk.yaml').then(() => true).catch(() => false);

    if (status.configFileExists) {
      // Read configuration and count domains/services
      const configContent = await readFile('/traefik-proxy/autolmk.yaml', 'utf8');
      
      // Count routers (domains)
      const routerMatches = configContent.match(/rule: "Host\(/g) || [];
      status.domainsCount = Math.floor(routerMatches.length / 2); // Each domain has HTTP + HTTPS

      // Count services
      const serviceMatches = configContent.match(/loadBalancer:/g) || [];
      status.servicesCount = serviceMatches.length;

      // Get file modification time
      const { stdout } = await execAsync('stat -c %y /traefik-proxy/autolmk.yaml');
      status.lastModified = stdout.trim();
    }

    // Check if AutoLeads container is running (from host)
    try {
      const { stdout: containerCheck } = await execAsync('docker ps --filter "name=b8sc48s8s0c4w00008k808w8" --format "{{.Status}}"');
      status.containerRunning = containerCheck.trim() === 'Up';
    } catch (error) {
      status.containerRunning = false;
    }

    // Check if Traefik is running (from host)
    try {
      const { stdout: traefikCheck } = await execAsync('docker ps --filter "name=coolify-proxy" --format "{{.Status}}"');
      status.traefikRunning = traefikCheck.trim() === 'Up';
    } catch (error) {
      status.traefikRunning = false;
    }

  } catch (error) {
    console.error('❌ Health check failed:', error);
  }

  return status;
}

async function main(): Promise<void> {
  console.log('🏥 AutoLeads Traefik Health Check');
  console.log('='.repeat(40));

  const health = await checkTraefikHealth();

  console.log(`📁 Configuration File: ${health.configFileExists ? '✅ EXISTS' : '❌ MISSING'}`);
  if (health.lastModified) {
    console.log(`📅 Last Modified: ${health.lastModified}`);
  }
  console.log(`🌐 Domains Configured: ${health.domainsCount}`);
  console.log(`🔧 Services Configured: ${health.servicesCount}`);
  console.log(`🐳 AutoLeads Container: ${health.containerRunning ? '✅ RUNNING' : '❌ STOPPED'}`);
  console.log(`🔄 Traefik Container: ${health.traefikRunning ? '✅ RUNNING' : '❌ STOPPED'}`);

  // Overall status
  const allGood = health.configFileExists && health.containerRunning && health.traefikRunning && health.domainsCount > 0;
  console.log(`\n🎯 Overall Status: ${allGood ? '✅ HEALTHY' : '⚠️  NEEDS ATTENTION'}`);

  if (!allGood) {
    console.log('\n🔧 Recommended Actions:');
    if (!health.configFileExists) {
      console.log('  - Run: bun run traefik:generate');
    }
    if (!health.containerRunning) {
      console.log('  - Check AutoLeads container status');
    }
    if (!health.traefikRunning) {
      console.log('  - Restart Traefik: docker restart coolify-proxy');
    }
    if (health.domainsCount === 0) {
      console.log('  - Check database for tenant domains');
    }
  }

  console.log('='.repeat(40));
}

// Run health check
if (import.meta.main) {
  main().catch(console.error);
}

export { checkTraefikHealth };