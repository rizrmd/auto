#!/bin/bash

# Chrome DevTools Cleanup Script for Auto Project
# Stops Chrome with remote debugging and cleans up profiles

set -e

echo "🧹 Cleaning up Chrome DevTools..."

DEBUG_PORT=9222

# Kill Chrome processes using the debug port
echo "🛑 Stopping Chrome processes on port $DEBUG_PORT..."
if lsof -ti:$DEBUG_PORT 2>/dev/null | xargs kill -9 2>/dev/null; then
    echo "✅ Chrome processes on port $DEBUG_PORT stopped"
else
    echo "ℹ️  No Chrome processes found on port $DEBUG_PORT"
fi

# Kill Chrome using saved PID
if [ -f "/tmp/chrome-devtools-profile/chrome.pid" ]; then
    CHROME_PID=$(cat /tmp/chrome-devtools-profile/chrome.pid)
    if kill -0 $CHROME_PID 2>/dev/null; then
        kill $CHROME_PID
        echo "✅ Chrome process with PID $CHROME_PID stopped"
    fi
    rm -f /tmp/chrome-devtools-profile/chrome.pid
fi

# Clean up Chrome profile
if [ -d "/tmp/chrome-devtools-profile" ]; then
    rm -rf /tmp/chrome-devtools-profile
    echo "🗑️  Chrome profile cleaned up"
fi

echo "✅ Chrome DevTools cleanup completed!"