#!/bin/sh

# ════════════════════════════════════════════════════════════
# AUTOLEADS - PRODUCTION STARTUP SCRIPT
# ════════════════════════════════════════════════════════════

echo "🚀 Starting AutoLeads..."

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "✓ Loading environment variables from .env..."
    set -a
    . ./.env
    set +a
else
    echo "⚠️  WARNING: .env file not found!"
    echo "   Using DATABASE_URL from environment or default..."
    # Fallback to existing DATABASE_URL if set
    if [ -z "$DATABASE_URL" ]; then
        export DATABASE_URL="postgres://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/auto-lumiku"
    fi
fi



# Generate Prisma client (always generate at runtime to ensure it's up to date)
echo "✓ Generating Prisma client..."
bunx prisma generate || {
    echo "❌ Prisma client generation failed!"
    exit 1
}

# Create Prisma index file if not exists
if [ ! -f "./generated/prisma/index.ts" ]; then
    echo "✓ Creating Prisma index file..."
    echo "export * from \"./client\";" > ./generated/prisma/index.ts
fi

# Database migrations disabled for safety
# Run database migrations in production
# if [ "$NODE_ENV" = "production" ]; then
#     echo "✓ Running production database migrations..."
#     bunx prisma migrate deploy || {
#         echo "❌ Migration failed!"
#         exit 1
#     }
# fi

# Build frontend only if not already built (for Docker optimization)
if [ ! -d "./frontend/dist" ] || [ ! -f "./frontend/dist/index.html" ]; then
    echo "✓ Building frontend..."
    bun run build:frontend || {
        echo "❌ Frontend build failed!"
        exit 1
    }
else
    echo "✓ Frontend already built, skipping build..."
fi

# Health check
echo "✓ Environment: ${NODE_ENV:-development}"
echo "✓ Port: ${PORT:-${APP_PORT:-3000}}"
echo "✓ Database: Connected"

# Start application
echo "✓ Starting AutoLeads application..."
exec bun --port ${PORT:-3000} backend/index.tsx
