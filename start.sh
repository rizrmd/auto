#!/bin/sh

# Set the environment
export DATABASE_URL="postgres://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/auto-lumiku"

# Generate Prisma client if not already generated
if [ ! -d "./generated/prisma" ]; then
    echo "Generating Prisma client..."
    bunx prisma generate
fi

# Create index file for proper imports if it doesn't exist
if [ ! -f "./generated/prisma/index.ts" ]; then
    echo "Creating Prisma index file..."
    echo "export * from \"./client\";" > ./generated/prisma/index.ts
fi

# Run the application
echo "Starting application..."
bun run dev