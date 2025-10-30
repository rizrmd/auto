# AutoLeads Multi-Platform CRM

🚀 **Multi-tenant automotive CRM platform** with WhatsApp integration, built for scale and security.

## 🌟 Features

- **Multi-tenant Architecture**: Isolated tenant environments with custom domains
- **WhatsApp Integration**: Automated lead capture and customer communication
- **Modern Tech Stack**: Bun runtime, Hono framework, React frontend
- **Database-driven Routing**: Automatic SSL and domain management via Traefik
- **Security First**: CORS protection, rate limiting, input validation
- **Docker Deployed**: Production-ready containerized deployment

## 🏗️ Architecture

### Core Components
- **Backend**: Hono API with Prisma ORM (TypeScript)
- **Frontend**: React SPA with Tailwind CSS
- **Database**: PostgreSQL with multi-tenant schema
- **WhatsApp**: Webhook-based integration with Web API
- **Proxy**: Traefik with automatic SSL certificate management

### Multi-Domain Support
- **Subdomains**: `tenant.autoleads.id`
- **Custom Domains`: Verified custom domains with automatic SSL
- **Database-driven**: Configuration generated from tenant database
- **Health Monitoring**: Automated domain and SSL certificate monitoring

## 🚀 Quick Start

### Development Environment
⚠️ **Important**: This project uses Docker deployment only. Do not run locally.

```bash
# Install dependencies
bun install

# Database operations
bun run db:generate
bun run db:migrate
bun run db:studio
bun run db:seed

# Traefik management
bun run traefik:generate  # Generate multi-domain config
bun run traefik:update    # Update and reload Traefik
bun run traefik:health     # Check system health
```

### Production Deployment
- **URL**: https://auto.lumiku.com
- **Container**: `b8sc48s8s0c4w00008k808w8`
- **Proxy**: Traefik with automatic SSL
- **Monitoring**: Health checks and automated alerts

## 📁 Project Structure

```
├── backend/src/           # Hono API server
│   ├── routes/           # API endpoints
│   ├── middleware/       # Security and validation
│   └── services/         # Business logic
├── frontend/src/         # React SPA
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route components
│   └── hooks/           # Custom React hooks
├── scripts/deployment/   # Deployment automation
├── prisma/              # Database schema and migrations
└── docs/               # Comprehensive documentation
```

## 🔧 Configuration

### Environment Variables
```bash
DATABASE_URL=postgresql://...
WHATSAPP_API_TOKEN=...
WHATSAPP_WEBHOOK_SECRET=...
CONTAINER_IP_ADDRESS=10.0.1.44
```

### Multi-Domain Setup
1. Add tenant to database with `subdomain` and/or `customDomain`
2. Run `bun run traefik:generate` to update routing
3. Traefik automatically handles SSL certificates
4. Monitor with `bun run traefik:health`

## 📚 Documentation

### Core Documentation
- **[Architecture Guide](docs/architecture/)** - System design and patterns
- **[Deployment Guide](docs/deployment/)** - Production deployment
- **[API Reference](docs/guides/API_ENDPOINTS.md)** - Complete API documentation
- **[Security Guide](docs/security/)** - Security implementation

### Integration Guides
- **[WhatsApp Integration](docs/bot/)** - WhatsApp Web API setup
- **[Component Library](docs/components/)** - UI component reference
- **[Storage Architecture](docs/storage/)** - File storage system

## 🔒 Security Features

- **CORS Protection**: Configured for production domains
- **Rate Limiting**: API endpoint protection
- **Input Validation**: Zod schema validation
- **Security Headers**: HSTS, CSP, XSS protection
- **Multi-tenant Isolation**: Database-level tenant separation

## 📊 Monitoring & Health

### Health Endpoints
- `/api/health` - Application health status
- `/api/traefik/status` - Proxy configuration status
- `/api/wa/health` - WhatsApp API status

### Monitoring Scripts
- `scripts/deployment/traefik-health-check.ts` - System health monitoring
- `scripts/testing/smoke-test.sh` - Production smoke tests

## 🤝 Contributing

1. **Code Style**: Follow existing TypeScript patterns
2. **Testing**: Use smoke-test.sh for manual testing
3. **Documentation**: Update relevant docs in `/docs`
4. **Security**: Never commit secrets or API keys

## 📄 License

Private project - All rights reserved.

---

**AutoLeads** - Built for automotive dealerships who need modern, scalable CRM solutions.