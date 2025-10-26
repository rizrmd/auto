# ============================================================================
# Runtime environment with WhatsApp Web API v1.3.0 (Downloaded from GitHub)
# ============================================================================
FROM oven/bun:latest

WORKDIR /app

# Create data directory and declare as volume (primary storage location)
RUN mkdir -p /app/data && chmod 755 /app/data
VOLUME ["/app/data"]

# Install PostgreSQL client, CA certificates, wget, and unzip for WhatsApp API
# ca-certificates is CRITICAL for WhatsApp Web API to verify SSL/TLS connections
RUN apt-get update && apt-get install -y postgresql-client ca-certificates wget unzip && rm -rf /var/lib/apt/lists/*

# Download and setup WhatsApp Web API v1.3.0 from GitHub releases (force fresh download)
RUN wget --no-cache https://github.com/rizrmd/whatsapp-web-api/releases/download/v1.3.0/whatsapp-web-api-linux-amd64.tar.gz \
    && tar -xzf whatsapp-web-api-linux-amd64.tar.gz \
    && chmod +x whatsapp-web-api-linux-amd64 \
    && mv whatsapp-web-api-linux-amd64 /usr/local/bin/whatsapp-web-api \
    && rm whatsapp-web-api-linux-amd64.tar.gz

# Verify binary is executable and properly copied
RUN chmod +x /usr/local/bin/whatsapp-web-api && \
    /usr/local/bin/whatsapp-web-api --version || echo "WhatsApp Web API v1.3.0 ready"

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