# ============================================================================
# Runtime environment with WhatsApp Web API v1.7.0 (Downloaded from GitHub)
# ============================================================================
FROM oven/bun:latest

WORKDIR /app

# Create data directory and declare as volume (primary storage location)
RUN mkdir -p /app/data && chmod 755 /app/data
VOLUME ["/app/data"]

# Install PostgreSQL client, CA certificates, wget, curl, and unzip for WhatsApp API
# ca-certificates is CRITICAL for WhatsApp Web API to verify SSL/TLS connections
RUN apt-get update && apt-get install -y postgresql-client ca-certificates wget curl unzip && rm -rf /var/lib/apt/lists/*

# Download and setup WhatsApp Web API v1.7.0 from GitHub releases (force fresh download)
RUN wget --no-cache https://github.com/rizrmd/whatsapp-web-api/releases/download/v1.7.0/whatsapp-web-api-linux-amd64.zip \
    && unzip whatsapp-web-api-linux-amd64.zip \
    && chmod +x whatsapp-web-api-linux-amd64 \
    && mv whatsapp-web-api-linux-amd64 /usr/local/bin/whatsapp-web-api \
    && rm whatsapp-web-api-linux-amd64.zip

# Verify binary is executable and properly copied
RUN chmod +x /usr/local/bin/whatsapp-web-api && \
    /usr/local/bin/whatsapp-web-api --version || echo "WhatsApp Web API v1.7.0 ready"

# Create WhatsApp API environment file
RUN echo "PORT=8080" > /app/whatsapp-api.env \
    && echo "# Add your DATABASE_URL here for WhatsApp API" >> /app/whatsapp-api.env \
    && echo "# Webhook URL will be configured at runtime" >> /app/whatsapp-api.env

# Copy package files first for better caching
COPY package.json bunfig.toml ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client (needs to happen after copying source code)
RUN echo "📦 Generating Prisma client..." && \
    bunx prisma generate && \
    echo "✅ Prisma client generated successfully" || \
    (echo "⚠️  Prisma generate failed during build - will retry at runtime" && \
     ls -la prisma/ && \
     ls -la generated/ 2>/dev/null || echo "generated/ folder not found")

# Build frontend for production (doesn't need DATABASE_URL)
RUN bun run build:frontend

# Make startup script executable
RUN chmod +x start.sh

# Expose ports (main app and WhatsApp API)
EXPOSE 3000 8080

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV APP_URL=https://auto.lumiku.com

# Install additional tools for service supervision
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Copy enhanced multi-service startup script
COPY scripts/startup/whatsapp-multi-service.sh /app/start-multi-services.sh

# Make startup script executable
RUN chmod +x /app/start-multi-services.sh

# Use enhanced multi-service startup script
CMD ["/app/start-multi-services.sh"]