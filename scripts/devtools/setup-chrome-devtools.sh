#!/bin/bash

# Chrome DevTools MCP Setup Script for Auto Project
# Sets up Chrome with remote debugging for MCP integration

set -e

echo "🔧 Setting up Chrome DevTools for Auto project..."

# Check if Chrome is installed
if command -v google-chrome &> /dev/null; then
    CHROME_CMD="google-chrome"
elif command -v chrome &> /dev/null; then
    CHROME_CMD="chrome"
elif command -v chromium-browser &> /dev/null; then
    CHROME_CMD="chromium-browser"
else
    echo "❌ Chrome/Chromium not found. Please install Chrome first."
    exit 1
fi

# Chrome DevTools debugging port
DEBUG_PORT=9222

# Check if Chrome with remote debugging is already running
if curl -s http://localhost:$DEBUG_PORT/json/version &> /dev/null; then
    echo "✅ Chrome with remote debugging is already running on port $DEBUG_PORT"
    echo "🌐 Chrome DevTools available at: chrome-devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=localhost:$DEBUG_PORT"
    echo "🔗 WebSocket endpoint: ws://localhost:$DEBUG_PORT/devtools/browser"
else
    echo "🚀 Starting Chrome with remote debugging..."

    # Get project URLs from environment or defaults
    AUTO_URL=${AUTO_URL:-"https://auto.lumiku.com"}
    PRIMA_URL=${PRIMA_URL:-"https://primamobil.id"}

    # Start Chrome with remote debugging
    $CHROME_CMD \
        --remote-debugging-port=$DEBUG_PORT \
        --user-data-dir=/tmp/chrome-devtools-profile \
        --no-first-run \
        --no-default-browser-check \
        --disable-features=TranslateUI \
        --disable-extensions \
        --disable-background-networking \
        --disable-sync \
        --disable-default-apps \
        --mute-audio \
        --disable-web-security \
        --allow-running-insecure-content \
        --disable-features=VizDisplayCompositor \
        --window-size=1920,1080 \
        --window-position=0,0 \
        "$AUTO_URL" &

    CHROME_PID=$!
    echo "📝 Chrome PID: $CHROME_PID"

    # Wait for Chrome to start
    echo "⏳ Waiting for Chrome to start..."
    for i in {1..10}; do
        if curl -s http://localhost:$DEBUG_PORT/json/version &> /dev/null; then
            echo "✅ Chrome with remote debugging started successfully!"
            break
        fi
        sleep 1
    done

    # Check if Chrome is ready
    if curl -s http://localhost:$DEBUG_PORT/json/version &> /dev/null; then
        echo "🌐 Chrome DevTools available at: chrome-devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=localhost:$DEBUG_PORT"
        echo "🔗 WebSocket endpoint: ws://localhost:$DEBUG_PORT/devtools/browser"
        echo "📱 Auto URL: $AUTO_URL"
        echo "📱 Prima URL: $PRIMA_URL"
    else
        echo "❌ Failed to start Chrome with remote debugging"
        kill $CHROME_PID 2>/dev/null || true
        exit 1
    fi
fi

echo ""
echo "🎯 Chrome DevTools MCP is ready!"
echo ""
echo "Usage examples for Claude:"
echo "1. 'Check the performance of https://auto.lumiku.com'"
echo "2. 'Analyze the network requests when loading the WhatsApp page'"
echo "3. 'Take a screenshot of the admin dashboard'"
echo "4. 'Debug the JavaScript errors on the car listing page'"
echo ""
echo "📝 To stop Chrome: kill \$(cat /tmp/chrome-devtools-profile/chrome.pid || echo $CHROME_PID)"

# Save Chrome PID for cleanup
echo $CHROME_PID > /tmp/chrome-devtools-profile/chrome.pid 2>/dev/null || true