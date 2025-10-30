#!/usr/bin/env bun
/**
 * Generate Traefik Proxy Configuration
 * 
 * This script queries all tenants from the database and generates
 * /traefik-proxy/autolmk.yaml with routing configuration for:
 * - All subdomains (tenant.subdomain)
 * - All verified custom domains (tenant.customDomain where customDomainVerified = true)
 */

import { prisma } from '../../backend/src/db';
import { TenantStatus } from '../../generated/prisma';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

// Using centralized prisma instance

interface TraefikRoute {
  host: string;
  service: string;
  middlewares?: string[];
}

interface TraefikConfig {
  http: {
    routers: Record<string, {
      rule: string;
      service: string;
      entryPoints: string[];
      middlewares?: string[];
      tls?: {
        certResolver: string;
      };
    }>;
    services: Record<string, {
      loadBalancer: {
        servers: Array<{
          url: string;
        }>;
      };
    }>;
    middlewares?: Record<string, {
      redirectScheme?: {
        scheme: string;
        permanent?: boolean;
      };
      headers?: {
        customRequestHeaders?: Record<string, string>;
      };
    }>;
  };
}

async function generateTraefikConfig(): Promise<void> {
  try {
    console.log('🔍 Fetching tenants from database...');
    
    // Fetch all active tenants with their domains
    const tenants = await prisma.tenant.findMany({
      where: {
        status: {
          in: [TenantStatus.trial, TenantStatus.active]
        }
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        customDomainVerified: true,
        slug: true
      }
    });

    console.log(`📊 Found ${tenants.length} tenants`);

    // Use container name for service discovery (containers now on same network)
    const containerIdentifier = 'b8sc48s8s0c4w00008k808w8';
    console.log(`🔧 Using container identifier: ${containerIdentifier}`);
    
    const config: TraefikConfig = {
      http: {
        routers: {},
        services: {},
        middlewares: {
          "https-redirect": {
            redirectScheme: {
              scheme: "https",
              permanent: true
            }
          },
          "security-headers": {
            headers: {
              customRequestHeaders: {
                "X-Frame-Options": "DENY",
                "X-Content-Type-Options": "nosniff",
                "X-XSS-Protection": "1; mode=block",
                "Referrer-Policy": "strict-origin-when-cross-origin"
              }
            }
          }
        }
      }
    };

    // Generate routes for each tenant
    for (const tenant of tenants) {
      const domains: Array<{ host: string; type: 'subdomain' | 'custom' }> = [];
      
      // Always include subdomain
      domains.push({
        host: tenant.subdomain,
        type: 'subdomain'
      });
      
      // Include custom domain if verified
      if (tenant.customDomain && tenant.customDomainVerified) {
        domains.push({
          host: tenant.customDomain,
          type: 'custom'
        });
      }

      // Create router and service for each domain
      for (const domain of domains) {
        const serviceName = `app-autoleads`;
        
        // HTTP router (with HTTPS redirect)
        const httpRouterName = `autoleads-${tenant.slug}-${domain.type.replace('-', '')}-http`;
        config.http.routers[httpRouterName] = {
          rule: `Host(\`${domain.host}\`)`,
          service: serviceName,
          entryPoints: ['http'],
          middlewares: ['https-redirect']
        };
        
        // HTTPS router (with TLS)
        const httpsRouterName = `autoleads-${tenant.slug}-${domain.type.replace('-', '')}-https`;
        config.http.routers[httpsRouterName] = {
          rule: `Host(\`${domain.host}\`)`,
          service: serviceName,
          entryPoints: ['https'],
          tls: {
            certResolver: 'letsencrypt'
          }
        };

        console.log(`🌐 Added routes: ${domain.host} -> ${tenant.name} (${domain.type})`);
      }

      // Add service (shared by all domains)
      const serviceName = `app-autoleads`;
      if (!config.http.services[serviceName]) {
        config.http.services[serviceName] = {
          loadBalancer: {
            servers: [
              {
                url: `http://${containerIdentifier}:3000` // Container name (same network as Traefik)
              }
            ]
          }
        };
      }
    }

    // NO DEFAULT ROUTER - Let other applications handle their own domains
    // This prevents AutoLeads from hijacking other domains on the server

    // Ensure traefik-proxy directory exists
    const traefikDir = process.env.TRAEFIK_CONFIG_DIR || '/traefik-proxy';
    try {
      await mkdir(traefikDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }

    // Write configuration file
    const configPath = join(traefikDir, 'autolmk.yaml');
    const yamlContent = generateYaml(config);
    
    await writeFile(configPath, yamlContent, 'utf8');
    
    console.log(`✅ Traefik configuration generated: ${configPath}`);
    console.log(`📈 Total routes: ${Object.keys(config.http.routers).length}`);
    console.log(`🔧 Total services: ${Object.keys(config.http.services).length}`);
    
    // Log summary
    const subdomainCount = tenants.length;
    const customDomainCount = tenants.filter(t => t.customDomain && t.customDomainVerified).length;
    console.log(`\n📊 Summary:`);
    console.log(`   - Subdomains: ${subdomainCount}`);
    console.log(`   - Verified custom domains: ${customDomainCount}`);
    console.log(`   - Total domains: ${subdomainCount + customDomainCount}`);

  } catch (error) {
    console.error('❌ Error generating traefik configuration:', error);
    process.exit(1);
  }
}

function generateYaml(config: TraefikConfig): string {
  let yaml = '# AutoLeads Traefik Configuration\n';
  yaml += '# Generated automatically from tenant database\n';
  yaml += '# DO NOT EDIT MANUALLY - Run generate-traefik-config.ts to update\n\n';

  yaml += 'http:\n';

  // Generate routers
  yaml += '  routers:\n';
  for (const [name, router] of Object.entries(config.http.routers)) {
    yaml += `    ${name}:\n`;
    yaml += `      rule: "${router.rule}"\n`;
    yaml += `      service: ${router.service}\n`;
    yaml += `      entryPoints: [${router.entryPoints.map(e => `"${e}"`).join(', ')}]\n`;
    if (router.middlewares) {
      yaml += `      middlewares: [${router.middlewares.map(m => `"${m}"`).join(', ')}]\n`;
    }
    if (router.tls) {
      yaml += `      tls:\n`;
      yaml += `        certResolver: "${router.tls.certResolver}"\n`;
    }
    yaml += '\n';
  }

  // Generate services
  yaml += '  services:\n';
  for (const [name, service] of Object.entries(config.http.services)) {
    yaml += `    ${name}:\n`;
    yaml += '      loadBalancer:\n';
    yaml += '        servers:\n';
    for (const server of service.loadBalancer.servers) {
      yaml += `          - url: "${server.url}"\n`;
    }
    yaml += '\n';
  }

  // Generate middlewares
  if (config.http.middlewares) {
    yaml += '  middlewares:\n';
    for (const [name, middleware] of Object.entries(config.http.middlewares)) {
      yaml += `    ${name}:\n`;
      if (middleware.redirectScheme) {
        yaml += '      redirectScheme:\n';
        yaml += `        scheme: "${middleware.redirectScheme.scheme}"\n`;
        if (middleware.redirectScheme.permanent) {
          yaml += `        permanent: ${middleware.redirectScheme.permanent}\n`;
        }
      }
      if (middleware.headers) {
        yaml += '      headers:\n';
        if (middleware.headers.customRequestHeaders) {
          yaml += '        customRequestHeaders:\n';
          for (const [key, value] of Object.entries(middleware.headers.customRequestHeaders)) {
            yaml += `          ${key}: "${value}"\n`;
          }
        }
      }
      yaml += '\n';
    }
  }

  return yaml;
}

// Run the script
if (import.meta.main) {
  generateTraefikConfig().catch(console.error);
}

export { generateTraefikConfig };