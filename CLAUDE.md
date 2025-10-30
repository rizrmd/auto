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

## Deployment Environment
- **URL**: https://auto.lumiku.com
- **Docker Container**: b8sc48s8s0c4w00008k808w8
- **SSH Access**: `ssh root@cf.avolut.com`
- **Check logs**: `ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8"`
- **Deploy progress**: `curl https://cf.avolut.com/api/v1/deployments/applications/b8sc48s8s0c4w00008k808w8 --header 'Authorization: Bearer 7|rsu1vBA8EzDIeetffQQk8PhM2pUqAiAKeHoaObun2bec5fc5'`

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
- **Database**: Prisma ORM with typed models, always run migrations after schema changes
- **API**: Hono framework with Zod validation for request/response schemas
- **File Structure**: Backend in `/backend/src`, frontend in `/frontend/src`, shared types in root
- **Environment**: Bun automatically loads .env, so don't use dotenv

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