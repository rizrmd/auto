#!/bin/bash

# WhatsApp QR Code Monitoring Script
# Monitor real-time WhatsApp pairing process

echo "🔍 WhatsApp QR Code Monitoring Started"
echo "====================================="

CONTAINER_ID="b8sc48s8s0c4w00008k808w8"
WHATSAPP_API="http://localhost:8080"

while true; do
    clear
    echo "🕐 $(date)"
    echo "====================================="

    # Check WhatsApp health status
    HEALTH=$(ssh root@cf.avolut.com "docker exec $CONTAINER_ID curl -s $WHATSAPP_API/health" 2>/dev/null)

    if [ $? -eq 0 ]; then
        CONNECTED=$(echo $HEALTH | grep -o '"connected":[^,]*' | cut -d: -f2)
        PAIRED=$(echo $HEALTH | grep -o '"paired":[^,]*' | cut -d: -f2)
        VERSION=$(echo $HEALTH | grep -o '"version":"[^"]*"' | cut -d: -f2 | tr -d '"')

        echo "📊 WhatsApp Status:"
        echo "   Version: $VERSION"
        echo "   Connected: $CONNECTED"
        echo "   Paired: $PAIRED"

        if [ "$CONNECTED" = "true" ]; then
            echo "✅ WhatsApp is CONNECTED and ready!"
            echo ""
            echo "🔥 Recent logs (last 10 lines):"
            ssh root@cf.avolut.com "docker logs $CONTAINER_ID --tail=10 | grep -E '(WHATSAPP|CONNECT|PAIR|SCAN)'" 2>/dev/null
        else
            echo "❌ WhatsApp is NOT connected"
            echo ""
            echo "🔄 QR Code Status: Ready to generate"
            echo "💡 Next steps:"
            echo "   1. Open https://primamobil.id/admin/whatsapp"
            echo "   2. Click 'Refresh QR'"
            echo "   3. Scan with WhatsApp mobile app"
            echo ""
            echo "📋 Recent WhatsApp logs:"
            ssh root@cf.avolut.com "docker logs $CONTAINER_ID --tail=5 | grep -E '(WHATSAPP|health|pair)'" 2>/dev/null
        fi
    else
        echo "❌ Unable to connect to WhatsApp API"
        echo "🔄 Container might be restarting..."
    fi

    echo ""
    echo "🔄 Refreshing in 5 seconds... (Ctrl+C to exit)"
    sleep 5
done