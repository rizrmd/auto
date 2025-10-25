#!/bin/bash
set -e

echo "🚀 Starting AutoLeads application..."

if [ -f "/app/whatsapp-api.env" ] && [ -n "$DATABASE_URL" ]; then
    echo "📱 Starting WhatsApp Web API on port 8080..."
    PORT=8080 DATABASE_URL="$DATABASE_URL" /usr/local/bin/whatsapp-web-api &
    WHATSAPP_PID=$!
    echo "WhatsApp API started with PID: $WHATSAPP_PID"
else
    echo "⚠️  WhatsApp API not configured (missing DATABASE_URL)"
fi

echo "🌐 Starting main AutoLeads application on port 3000..."
exec ./start.sh