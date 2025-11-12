# AutoLeads Development Guidelines

## Critical Safety Instructions
🚨 **DATABASE SAFETY - NEVER DO THESE**:
- Never reset the database (`bun run db:reset` or similar)
- Never run db seed
- Never run `bun run db:push` - this can destroy data
- Never run destructive database operations without explicit approval
- Always backup data before any database changes
- Only use `bun run db:migrate` for safe, versioned migrations
- you can run psql or any database queries against production databases from local/AI environments

⚠️ **IMPORTANT**: Never run this project locally. Use deployed environments only. Do not execute `bun run dev`, `bun run start`, or any local development commands.

## 🤖 WhatsApp Bot AI - CRITICAL SYSTEM (DO NOT BREAK)
✅ **STATUS**: Multi-tenant operational, paired, and connected to AI (as of 2025-11-12)

🚨 **CRITICAL WARNINGS - DO NOT BREAK THESE**:
- **NEVER modify webhook handler** at `backend/src/routes/webhook/whatsapp.ts` without thorough testing
- **NEVER change bot handlers** (`CustomerBotHandler`, `AdminBotHandler`, `StateManager`) - they are working perfectly
- **NEVER edit Prisma enums** (`UserRole`, `UserType`) without proper migration - causes runtime failures
- **WhatsApp devices can be disconnected/unpaired ONLY** when:
  - Connectivity is verified before modification
  - Alternative devices are available for the tenant
  - Proper testing is done in staging environment
  - Multi-tenant requirements necessitate device rotation
  - Always verify device status in `whatsmeow_device` table before changes
- **NEVER modify** the bot initialization in webhook (stateManager, customerBot, adminBot instances)
- **NEVER change** the Host header logic for tenant-specific routing
- **🚨 NEVER change WhatsApp service port** - ALL tenants MUST use **port 8080 only**

### Current Configuration
- **Service**: Single WhatsApp service (port 8080) with multi-tenant support ✅ **IMPLEMENTED**
- **Architecture**: 1 service can handle multiple WhatsApp numbers (1 per tenant) ✅ **WORKING**
- **Webhook**: `https://auto.lumiku.com/webhook/whatsapp`
- **WhatsApp API Version**: v1.7.0
- **Connected Devices**:
  - AutoLeads Motors: +6281234567890 ✅ Paired
  - PrimaMobil Indonesia: +6283134446903 ⏳ Ready to pair
- **Port**: **ALL TENANTS MUST USE PORT 8080** - Never use port 8081 or other ports

### 🏗️ WhatsApp Multi-Tenant Architecture (FULLY IMPLEMENTED ✅)
**IMPLEMENTATION COMPLETE**: WhatsApp service now supports multi-tenant operations:
- ✅ **Single service** (port 8080) handles **multiple connections**
- ✅ **Each connection** = **1 WhatsApp number** = **1 tenant**
- ✅ **Tenant identification** via `tenant_id` and `instance_id` parameters
- ✅ **Enhanced ServiceManager**: `MAX_CONNECTIONS = 50` with per-tenant limits
- ✅ **Database updated**: All tenants use port 8080 (PrimaMobil updated from 8081)
- ✅ **Admin routes**: Single port (8080) with tenant parameters

### 📊 Current Multi-Tenant Implementation (WORKING ✅)
```typescript
// Active Architecture (IMPLEMENTED and TESTED)
Single Service (port 8080):
├── Instance 1: AutoLeads Motors (+6281234567890) ✅ Paired & Working
├── Instance 2: PrimaMobil (+6283134446903) ✅ Ready to pair
├── Instance 3: Future Tenant (+628xxx) ✅ Supported
└── ... Instance 50: Future Tenant (+628yyy) ✅ Supported
```

### 🔧 IMPLEMENTED SOLUTIONS
1. ✅ **Enhanced WhatsAppServiceManager**: `MAX_CONNECTIONS = 50` with tenant connection management
2. ✅ **Port consolidation**: All tenants now use port 8080 (PrimaMobil updated from 8081)
3. ✅ **Tenant routing enabled**: `tenant_id` and `instance_id` parameters working
4. ✅ **Database fixed**: No more port 8081 assignments

### Bot Architecture (WORKING - DO NOT MODIFY)
```
Webhook → identifyUserType → Route to Handler:
├─ Admin/Sales → AdminBotHandler
│  ├─ /help - Show commands
│  ├─ /upload - AI-powered car catalog upload
│  ├─ /list - List cars by status
│  ├─ /status - Update car status
│  ├─ /delete - Delete catalog items
│  └─ /cancel - Cancel current flow
└─ Customer → CustomerBotHandler (AI-powered)
   ├─ Intent Recognition (greeting, inquiry, price, location, test drive)
   ├─ RAG Engine for intelligent responses
   ├─ Auto lead capture and tracking
   └─ Conversation state management
```

### Admin Users (Tenant: AutoLeads Motors)
- Owner: 6281234567890
- Admin: 6281234567891, 6281235108908
- Sales: 6281234567892

### Key Files (DO NOT BREAK)
- `backend/src/routes/webhook/whatsapp.ts` - Main webhook handler
- `backend/src/bot/customer/handler.ts` - Customer AI bot
- `backend/src/bot/admin/handler.ts` - Admin command handler
- `backend/src/bot/state-manager.ts` - Conversation flow manager
- `prisma/schema.prisma` - UserRole MUST be {owner, admin, sales}, UserType MUST be {customer, admin, sales}

### Testing Bot
```bash
# Test webhook (from SSH)
docker exec b8sc48s8s0c4w00008k808w8 curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -H "Host: auto.lumiku.com" \
  -d '{"event":"message","sender":"628xxx@s.whatsapp.net","message":"test"}'
```

### If Bot Breaks
1. Check logs: `ssh root@cf.avolut.com "docker logs --tail 100 b8sc48s8s0c4w00008k808w8"`
2. Look for: `[WEBHOOK]`, `AdminBotHandler`, `CustomerBotHandler`, `Prisma` errors
3. Check WhatsApp pairing: Query `whatsmeow_device` table
4. Verify Prisma client generation: `bun run db:generate` in container
5. DO NOT attempt to "fix" by editing bot handlers - they are already correct

## Deployment Environment
- **URL**: https://auto.lumiku.com
- **Docker Container**: b8sc48s8s0c4w00008k808w8
- **SSH Access**: `ssh root@cf.avolut.com`
- **Check logs**: `ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8"`
- **Deploy progress**: `curl https://cf.avolut.com/api/v1/deployments/applications/b8sc48s8s0c4w00008k808w8 --header 'Authorization: Bearer 7|rsu1vBA8EzDIeetffQQk8PhM2pUqAiAKeHoaObun2bec5fc5"`
- **Traefik Config**: `/traefik-proxy/autolmk.yaml` (inside Docker container)

## Commands (Docker Environment Only)
- **Install**: `bun install` (instead of npm install)
- **Run scripts**: `bun run <script>` (instead of npm run)
- **Database**: `bun run db:generate`, `bun run db:migrate`, `bun run db:studio`, `bun run db:seed`
- **Testing**: Use manual testing with smoke-test.sh in scripts/testing/
- **File operations**: Prefer `Bun.file` over node:fs

## Code Style
- **Runtime**: Use Bun instead of Node.js, npm, pnpm, or vite
- **TypeScript**: Strict mode enabled, use `@/*` path alias for frontend imports
- **Imports**: Use absolute imports with `@/` for frontend, relative for backend
- **Components**: React functional components with TypeScript interfaces
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Error Handling**: Use ErrorBoundary components, centralized error middleware in backend
- **Custom Errors**: Use predefined error classes from `../middleware/error-handler` (BadRequestError, NotFoundError, etc.)
- **Database**: Prisma ORM with typed models, always run migrations after schema changes
- **API**: Hono framework with Zod validation for request/response schemas
- **Validation**: Use Zod regex patterns for IP addresses, not `.ip()` method
- **Zod Validators**: Use `Schema.optional()` for optional validation, not `zValidator().optional()`
- **Zod Imports**: Always import both `z` from 'zod' and `zValidator` from '@hono/zod-validator' when using Zod schemas
- **File Structure**: Backend in `/backend/src`, frontend in `/frontend/src`, shared types in root
- **Environment**: Bun automatically loads .env, so don't use dotenv

## Import Path Guidelines
- **Backend imports**: Use relative paths (`../`, `./`) from current file location
- **Frontend imports**: Use absolute paths with `@/` alias (e.g., `@/components/Button`)
- **Service imports**: From middleware, use `../services/`; from routes, use `../../services/`
- **Database imports**: Always use `../db` for the centralized prisma instance
- **Type imports**: Prefer local type definitions over generated Prisma types to avoid import errors
- **Verify paths**: Always double-check relative import paths before committing

## Database & Prisma Guidelines
- **NEVER import PrismaClient directly** from `../../../generated/prisma` - this causes runtime import errors
- **ALWAYS import the singleton prisma instance** from `../../db` (relative to backend files) or `backend/src/db`
- **Example**: `import { prisma } from '../../db';` instead of `import { PrismaClient } from '../../../generated/prisma';`
- **Prisma client generation**: Happens automatically during Docker build and runtime startup
- **Database operations**: Use the centralized prisma instance for all database queries

### 🚨 WhatsApp Port Configuration Rules (CRITICAL)
- **ALL TENANTS MUST USE PORT 8080 ONLY** - Never use port 8081 or other ports
- **Database field**: `tenants.whatsapp_port` must ALWAYS be `8080` for every tenant
- **NEVER assign different ports to different tenants** - This breaks the multi-tenant architecture
- **Port 8081 is DEPRECATED** - All existing assignments have been updated to 8080
- **Future tenant creation**: Always set `whatsapp_port = 8080` in database
- **Multi-tenant isolation**: Handled via `tenant_id` and `instance_id` parameters, NOT different ports

### WhatsApp Database Schema Rules
```sql
-- CORRECT: All tenants use same port
UPDATE tenants SET whatsapp_port = 8080 WHERE id = 'new_tenant_id';

-- WRONG: Never assign different ports
-- UPDATE tenants SET whatsapp_port = 8081 WHERE id = 'new_tenant_id'; -- DON'T DO THIS
```

### Verification Queries
```sql
-- Check all tenants use correct port
SELECT id, name, whatsapp_port FROM tenants WHERE whatsapp_port != 8080;

-- Should return 0 rows - if any rows returned, fix them immediately
```

## Architecture Notes
- Multi-tenant system with tenant isolation
- WhatsApp integration via webhooks
- React SPA with client-side routing
- Bun runtime for optimal performance
- DATABASE_URL already set in docker container
- Use psql in docker container when testing database queries

## Feature Development
- **Always check both frontend and backend** when creating features
- Frontend pages go in `/frontend/src/pages/`
- Backend routes go in `/backend/src/routes/`
- Ensure API endpoints exist before building frontend components
- Test full integration between frontend and backend
- **All development must be done in deployed environment via SSH**

## File Organization Guidelines

### Documentation Files (.md/.txt)
- **Project README**: `/README.md` (root level) - Main project overview and quick start
- **Development Guidelines**: `/CLAUDE.md` (root level) - This file, comprehensive development rules
- **API Documentation**: `/docs/api/` - API endpoint documentation and schemas
- **User Guides**: `/docs/user-guides/` - End-user documentation and manuals
- **Technical Docs**: `/docs/technical/` - Architecture, setup, and technical specifications
- **Deployment Docs**: `/docs/deployment/` - Deployment procedures and environment configs
- **Testing Docs**: `/docs/testing/` - Test procedures and coverage reports
- **Change Logs**: `/CHANGELOG.md` (root level) - Version history and changes
- **License**: `/LICENSE.md` (root level) - Project license information
- **Contributing**: `/CONTRIBUTING.md` (root level) - Contribution guidelines

### File Naming Conventions
- **Markdown files**: Use kebab-case (e.g., `api-endpoints.md`, `user-authentication.md`)
- **Text files**: Use descriptive names with purpose (e.g., `deployment-notes.txt`, `debug-logs.txt`)
- **Documentation structure**: Follow hierarchical organization with clear folder structure
- **Index files**: Use `README.md` or `index.md` for folder navigation

### Documentation Standards
- **Markdown format**: Use GitHub Flavored Markdown (GFM) for consistency
- **Headers**: Use consistent header hierarchy (# ## ### ####)
- **Code blocks**: Specify language for syntax highlighting (```typescript, ```bash)
- **Links**: Use relative paths for internal documentation links
- **Images**: Store in `/docs/images/` and use relative paths
- **Version control**: Keep documentation versioned with code changes