# ============================================================================
# Stage 1: Build WhatsApp Web API from source using Go
# ============================================================================
FROM golang:1.23-bookworm AS whatsapp-builder

WORKDIR /build

# Copy the WhatsApp service source code from submodule
COPY backend/wapi/ .

# Copy and apply pairing fix patch
COPY whatsapp-pairing-fix.patch /build/
RUN apt-get update && apt-get install -y patch && \
    patch -p1 < whatsapp-pairing-fix.patch && \
    echo "✅ WhatsApp pairing fix applied" && \
    rm /build/whatsapp-pairing-fix.patch

# Set GOTOOLCHAIN to auto to allow downloading required Go version
ENV GOTOOLCHAIN=auto

# Generate go.sum and download Go module dependencies
RUN go mod tidy && go mod download

# Build the WhatsApp service binary for Linux AMD64
# CGO_ENABLED=0 creates a statically linked binary (no external dependencies)
# -ldflags="-w -s" strips debug information to reduce binary size
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-w -s" \
    -o whatsapp-web-api \
    main.go

# ============================================================================
# Stage 2: Runtime environment with compiled WhatsApp Web API
# ============================================================================
FROM oven/bun:latest

WORKDIR /app

# Create data directory and declare as volume (primary storage location)
RUN mkdir -p /app/data && chmod 755 /app/data
VOLUME ["/app/data"]

# Install PostgreSQL client, CA certificates, curl for WhatsApp API
# ca-certificates is CRITICAL for WhatsApp Web API to verify SSL/TLS connections
RUN apt-get update && apt-get install -y postgresql-client ca-certificates curl && rm -rf /var/lib/apt/lists/*

# Copy compiled WhatsApp Web API binary from builder stage
COPY --from=whatsapp-builder /build/whatsapp-web-api /usr/local/bin/whatsapp-web-api

# Make binary executable and verify
RUN chmod +x /usr/local/bin/whatsapp-web-api && \
    /usr/local/bin/whatsapp-web-api --version || echo "WhatsApp Web API compiled from source ready"

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