#!/bin/bash

# ============================================================================
# Enhanced Multi-Service Startup Script with Auto-Recovery
# ============================================================================

set -e

echo "🚀 Starting AutoLeads Multi-Service System..."

# Function to wait for database
wait_for_db() {
    echo "⏳ Waiting for database connection..."
    while ! nc -z 107.155.75.50 5986 2>/dev/null; do
        sleep 2
    done
    echo "✅ Database is accessible"
}

# Function to start WhatsApp service with auto-recovery
start_whatsapp_service() {
    echo "📱 Starting WhatsApp Web API..."

    # Kill any existing WhatsApp processes
    pkill -f whatsapp-web-api || true
    sleep 2

    # Start WhatsApp service with proper environment
    PORT=8080 \
    DATABASE_URL="postgres://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/auto-lumiku" \
    WA_WEBHOOK_URL="https://primamobil.id/webhook/whatsapp" \
    /usr/local/bin/whatsapp-web-api > /tmp/wa-service.log 2>&1 &

    WHATSAPP_PID=$!
    echo "📱 WhatsApp API started with PID: $WHATSAPP_PID"

    # Wait for service to be ready
    local retries=0
    local max_retries=30
    while [ $retries -lt $max_retries ]; do
        if curl -s http://localhost:8080/health >/dev/null 2>&1; then
            echo "✅ WhatsApp API is ready on port 8080"
            return 0
        fi
        echo "⏳ Waiting for WhatsApp API to start... ($((retries + 1))/$max_retries)"
        sleep 2
        retries=$((retries + 1))
    done

    echo "❌ WhatsApp API failed to start within timeout"
    return 1
}

# Function to monitor and restart services if needed
monitor_services() {
    echo "🔍 Starting service monitoring..."

    while true; do
        # Check WhatsApp service health
        if ! curl -s http://localhost:8080/health >/dev/null 2>&1; then
            echo "⚠️ WhatsApp service is down, attempting restart..."
            start_whatsapp_service || echo "❌ Failed to restart WhatsApp service"
        fi

        # Check main application health
        if ! curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
            echo "⚠️ Main application is down!"
            # Main app restart requires container restart
            break
        fi

        sleep 30  # Check every 30 seconds
    done
}

# Main startup sequence
main() {
    # Wait for database
    wait_for_db

    # Generate Traefik configuration if DATABASE_URL is available
    if [ -n "$DATABASE_URL" ]; then
        echo "🔧 Generating Traefik proxy configuration..."
        CONTAINER_SERVICE_NAME=${CONTAINER_SERVICE_NAME:-autoleads}
        export CONTAINER_SERVICE_NAME
        bun run traefik:generate || echo "⚠️ Warning: Failed to generate traefik config"

        # Ensure configuration is loaded by restarting traefik
        echo "🔄 Restarting Traefik to load new configuration..."
        if command -v docker >/dev/null 2>&1; then
            docker restart coolify-proxy || echo "⚠️ Could not restart traefik"
        fi
    else
        echo "⚠️ DATABASE_URL not available, skipping traefik config generation"
    fi

    # Start WhatsApp service
    if ! start_whatsapp_service; then
        echo "❌ Failed to start WhatsApp service, but continuing with main application..."
    fi

    # Start service monitoring in background
    monitor_services &
    MONITOR_PID=$!
    echo "🔍 Service monitoring started with PID: $MONITOR_PID"

    # Start main application
    echo "🌐 Starting main AutoLeads application on port 3000..."
    exec ./start.sh
}

# Trap signals for graceful shutdown
trap 'echo "🛑 Shutting down services..."; kill $WHATSAPP_PID $MONITOR_PID 2>/dev/null || true; exit 0' SIGTERM SIGINT

# Run main function
main