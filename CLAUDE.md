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
✅ **STATUS**: Fully operational, paired, and connected to AI (as of 2025-10-31)

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

### Current Configuration
- **Paired Device**: 6283134446903 (Lumiku.com)
- **Webhook**: `https://auto.lumiku.com/webhook/whatsapp`
- **Status**: Connected, paired, AI fully functional
- **WhatsApp API Version**: v1.7.0
- **Port**: 8080 (AutoLeads Motors), 8081 (PrimaMobil)

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