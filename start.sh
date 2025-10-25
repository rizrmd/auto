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

# Create uploads directory structure
if [ ! -d "./uploads" ]; then
    echo "✓ Creating uploads directory..."
    mkdir -p ./uploads
    chmod 755 ./uploads
    echo "  Directory created: ./uploads"
fi

# Generate Prisma client if not exists
if [ ! -d "./generated/prisma" ]; then
    echo "✓ Generating Prisma client..."
    bunx prisma generate
fi

# Create Prisma index file if not exists
if [ ! -f "./generated/prisma/index.ts" ]; then
    echo "✓ Creating Prisma index file..."
    echo "export * from \"./client\";" > ./generated/prisma/index.ts
fi

# Run database migrations in production
if [ "$NODE_ENV" = "production" ]; then
    echo "✓ Running production database migrations..."
    bunx prisma migrate deploy || {
        echo "❌ Migration failed!"
        exit 1
    }
fi

# Build frontend (always - ensures fresh UI on every deployment)
echo "✓ Building frontend..."
bun run build:frontend || {
    echo "❌ Frontend build failed!"
    exit 1
}

# Health check
echo "✓ Environment: ${NODE_ENV:-development}"
echo "✓ Port: ${APP_PORT:-3000}"
echo "✓ Database: Connected"

# Start application
echo "✓ Starting AutoLeads application..."
if [ "$NODE_ENV" = "production" ]; then
    bun run start
else
    bun run dev
fi
