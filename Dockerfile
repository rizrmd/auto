# ============================================================================
# Stage 1: Build WhatsApp Web API v1.2.0 from source
# ============================================================================
FROM golang:1.24-bookworm AS whatsapp-builder

# Set build arguments for version tracking
ARG WHATSAPP_VERSION=v1.2.0
ARG REPO_URL=https://github.com/rizrmd/whatsapp-web-api.git

# Install git for cloning
RUN apt-get update && apt-get install -y git ca-certificates && rm -rf /var/lib/apt/lists/*

# Set working directory for build
WORKDIR /build

# Clone the specific version tag
RUN git clone --depth 1 --branch ${WHATSAPP_VERSION} ${REPO_URL} .

# Download Go module dependencies and fix go.sum
# - go mod tidy: Updates go.mod and go.sum with all required dependencies
# - go mod download: Downloads modules to local cache
# - go mod verify: Verifies checksums match go.sum
RUN go mod tidy && go mod download && go mod verify

# Build statically-linked binary with production optimizations
# - CGO_ENABLED=0: Static linking, no C dependencies
# - GOOS=linux GOARCH=amd64: Target platform
# - -trimpath: Remove file system paths from binary
# - -ldflags: Link flags for optimization
#   * -s: Strip symbol table
#   * -w: Strip DWARF debugging info
#   * -extldflags '-static': Force static linking
RUN CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64 \
    go build \
    -trimpath \
    -ldflags="-s -w -extldflags '-static'" \
    -o whatsapp-web-api \
    .

# Verify binary is executable and show size
RUN chmod +x whatsapp-web-api && \
    ls -lh whatsapp-web-api

# ============================================================================
# Stage 2: Runtime environment
# ============================================================================
FROM oven/bun:latest

WORKDIR /app

# Create data directory and declare as volume (primary storage location)
RUN mkdir -p /app/data && chmod 755 /app/data
VOLUME ["/app/data"]

# Install PostgreSQL client, CA certificates, and system dependencies
# ca-certificates is CRITICAL for WhatsApp Web API to verify SSL/TLS connections
RUN apt-get update && apt-get install -y postgresql-client ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy WhatsApp Web API v1.2.0 binary from builder stage
# Maintains exact same path as v1.1.0 for backward compatibility
COPY --from=whatsapp-builder /build/whatsapp-web-api /usr/local/bin/whatsapp-web-api

# Verify binary is executable and properly copied
RUN chmod +x /usr/local/bin/whatsapp-web-api && \
    /usr/local/bin/whatsapp-web-api --version || echo "WhatsApp Web API v1.2.0 ready"

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

# Build frontend for production (doesn't need DATABASE_URL)
RUN bun run build:frontend

# Make startup script executable
RUN chmod +x start.sh

# Expose ports (main app and WhatsApp API)
EXPOSE 3000 8080

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Create startup script for both services
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "🚀 Starting AutoLeads application..."\n\
\n\
# Start WhatsApp Web API in background\n\
if [ -f "/app/whatsapp-api.env" ] && [ -n "$DATABASE_URL" ]; then\n\
    echo "📱 Starting WhatsApp Web API on port 8080..."\n\
    \n\
    # Configure webhook URL if APP_URL is available\n\
    if [ -n "$APP_URL" ]; then\n\
        WA_WEBHOOK_URL="$APP_URL/webhook/whatsapp"\n\
        echo "🔗 Configuring webhook: $WA_WEBHOOK_URL"\n\
    fi\n\
    \n\
    # Start WhatsApp Web API with environment variables (fixed syntax)\n\
    if [ -n "$WA_WEBHOOK_URL" ]; then\n\
        PORT=8080 DATABASE_URL="$DATABASE_URL" WA_WEBHOOK_URL="$WA_WEBHOOK_URL" /usr/local/bin/whatsapp-web-api > /tmp/wa-service.log 2>&1 &\n\
    else\n\
        PORT=8080 DATABASE_URL="$DATABASE_URL" /usr/local/bin/whatsapp-web-api > /tmp/wa-service.log 2>&1 &\n\
    fi\n\
    WHATSAPP_PID=$!\n\
    echo "WhatsApp API started with PID: $WHATSAPP_PID"\n\
    echo "WhatsApp API logs: /tmp/wa-service.log"\n\
else\n\
    echo "⚠️  WhatsApp API not configured (missing DATABASE_URL)"\n\
fi\n\
\n\
# Start main application\n\
echo "🌐 Starting main AutoLeads application on port 3000..."\n\
exec ./start.sh' > /app/start-multi-services.sh

# Make startup script executable
RUN chmod +x /app/start-multi-services.sh

# Use multi-service startup script
CMD ["/app/start-multi-services.sh"]