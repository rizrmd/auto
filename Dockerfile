FROM oven/bun:latest

WORKDIR /app

# Create uploads directory and declare as volume (legacy - for backward compatibility)
RUN mkdir -p /app/uploads && chmod 755 /app/uploads
VOLUME ["/app/uploads"]

# Create data directory and declare as volume (primary storage location)
RUN mkdir -p /app/data && chmod 755 /app/data
VOLUME ["/app/data"]

# Install PostgreSQL client and system dependencies
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package.json bunfig.toml ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client (production)
RUN bunx prisma generate

# Build frontend for production
RUN bun run build:frontend

# Make startup script executable
RUN chmod +x start.sh

# Expose port (use PORT environment variable or default to 3000)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Use startup script to handle Prisma setup
CMD ["./start.sh"]