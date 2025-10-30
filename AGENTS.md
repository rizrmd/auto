# Agent Guidelines

## Database Safety
🚨 **CRITICAL**: Never reset the database or run database migrations that could destroy data
🚨 **CRITICAL**: Never run `bun run db:push` or any database push operations
🚨 **CRITICAL**: Only use `bun run db:migrate` for safe, versioned migrations
🚨 **CRITICAL**: Always backup data before any database operations

## Development Environment
- All development must be done in the deployed Docker environment via SSH
- Never run local development servers
- Use the deployment environment for all testing and development work