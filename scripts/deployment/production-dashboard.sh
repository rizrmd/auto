#!/bin/bash

#######################################################################
# AutoLeads Production Dashboard
#
# Real-time monitoring dashboard for production environment
# Refreshes every 5 seconds
#
# Usage: ./scripts/production-dashboard.sh
# Press Ctrl+C to exit
#######################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
BASE_URL="https://auto.lumiku.com"
SSH_HOST="cf.avolut.com"
CONTAINER_ID="b8sc48s8s0c4w00008k808w8"
REFRESH_INTERVAL=5

#######################################################################
# Helper Functions
#######################################################################

get_status_color() {
    local code=$1
    if [ "$code" = "200" ]; then
        echo -e "${GREEN}"
    elif [ "$code" = "404" ]; then
        echo -e "${YELLOW}"
    else
        echo -e "${RED}"
    fi
}

get_health_status() {
    local code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/health" 2>/dev/null)
    if [ "$code" = "200" ]; then
        echo -e "${GREEN}✅ HEALTHY${NC}"
    else
        echo -e "${RED}❌ DOWN${NC}"
    fi
}

get_response_time() {
    local url=$1
    local time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 5 "$url" 2>/dev/null)
    local time_ms=$(echo "$time * 1000" | bc 2>/dev/null || echo "999")
    time_ms=${time_ms%.*}

    if [ "$time_ms" -lt 500 ]; then
        echo -e "${GREEN}${time_ms}ms${NC}"
    elif [ "$time_ms" -lt 1000 ]; then
        echo -e "${YELLOW}${time_ms}ms${NC}"
    else
        echo -e "${RED}${time_ms}ms${NC}"
    fi
}

get_data_count() {
    local response=$(curl -s --max-time 5 "$BASE_URL/api/cars" 2>/dev/null)
    if command -v jq &> /dev/null; then
        echo "$response" | jq '.data | length' 2>/dev/null || echo "N/A"
    else
        echo "N/A"
    fi
}

format_uptime() {
    local seconds=$1
    local days=$((seconds / 86400))
    local hours=$(((seconds % 86400) / 3600))
    local minutes=$(((seconds % 3600) / 60))

    if [ $days -gt 0 ]; then
        echo "${days}d ${hours}h"
    elif [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m"
    else
        echo "${minutes}m"
    fi
}

#######################################################################
# Main Dashboard Loop
#######################################################################

trap 'echo ""; echo "Dashboard stopped."; exit 0' INT

while true; do
    clear

    # Header
    echo -e "${CYAN}"
    cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║           AutoLeads Production Dashboard                     ║
╚═══════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    echo -e "Target: ${BLUE}$BASE_URL${NC}"
    echo -e "Updated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""

    # System Status
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}SYSTEM STATUS${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    printf "%-20s : %s\n" "Application" "$(get_health_status)"

    # Check database
    DB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/api/tenant" 2>/dev/null)
    if [ "$DB_CODE" = "200" ]; then
        printf "%-20s : ${GREEN}✅ CONNECTED${NC}\n" "Database"
    else
        printf "%-20s : ${RED}❌ DISCONNECTED${NC}\n" "Database"
    fi

    echo ""

    # API Endpoints
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}API ENDPOINTS${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Health endpoint
    HEALTH_TIME=$(get_response_time "$BASE_URL/health")
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/health" 2>/dev/null)
    printf "%-20s : $(get_status_color $HEALTH_CODE)%-4s${NC}  Response: %s\n" "GET /health" "$HEALTH_CODE" "$HEALTH_TIME"

    # Tenant endpoint
    TENANT_TIME=$(get_response_time "$BASE_URL/api/tenant")
    TENANT_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/api/tenant" 2>/dev/null)
    printf "%-20s : $(get_status_color $TENANT_CODE)%-4s${NC}  Response: %s\n" "GET /api/tenant" "$TENANT_CODE" "$TENANT_TIME"

    # Cars endpoint
    CARS_TIME=$(get_response_time "$BASE_URL/api/cars")
    CARS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/api/cars" 2>/dev/null)
    printf "%-20s : $(get_status_color $CARS_CODE)%-4s${NC}  Response: %s\n" "GET /api/cars" "$CARS_CODE" "$CARS_TIME"

    # Featured endpoint
    FEATURED_TIME=$(get_response_time "$BASE_URL/api/cars/featured")
    FEATURED_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$BASE_URL/api/cars/featured" 2>/dev/null)
    printf "%-20s : $(get_status_color $FEATURED_CODE)%-4s${NC}  Response: %s\n" "GET /api/cars/featured" "$FEATURED_CODE" "$FEATURED_TIME"

    echo ""

    # Data Statistics
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}DATA STATISTICS${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    CAR_COUNT=$(get_data_count)
    printf "%-20s : ${CYAN}%s${NC}\n" "Total Cars" "$CAR_COUNT"

    if command -v jq &> /dev/null; then
        TENANT_NAME=$(curl -s --max-time 5 "$BASE_URL/api/tenant" 2>/dev/null | jq -r '.name' 2>/dev/null)
        if [ ! -z "$TENANT_NAME" ] && [ "$TENANT_NAME" != "null" ]; then
            printf "%-20s : ${CYAN}%s${NC}\n" "Tenant Name" "$TENANT_NAME"
        fi
    fi

    echo ""

    # Performance Metrics
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}PERFORMANCE METRICS${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    # Average response time
    API_TIME=$(get_response_time "$BASE_URL/api/cars")
    printf "%-20s : %s\n" "API Response Time" "$API_TIME"

    # Home page load
    HOME_TIME=$(get_response_time "$BASE_URL/")
    printf "%-20s : %s\n" "Home Page Load" "$HOME_TIME"

    # SSL handshake
    SSL_TIME=$(curl -s -o /dev/null -w "%{time_connect}" --max-time 5 "$BASE_URL" 2>/dev/null)
    SSL_TIME_MS=$(echo "$SSL_TIME * 1000" | bc 2>/dev/null || echo "N/A")
    SSL_TIME_MS=${SSL_TIME_MS%.*}
    if [ "$SSL_TIME_MS" != "N/A" ]; then
        if [ "$SSL_TIME_MS" -lt 200 ]; then
            printf "%-20s : ${GREEN}${SSL_TIME_MS}ms${NC}\n" "SSL Handshake"
        else
            printf "%-20s : ${YELLOW}${SSL_TIME_MS}ms${NC}\n" "SSL Handshake"
        fi
    fi

    echo ""

    # Security Status
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}SECURITY STATUS${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    HEADERS=$(curl -s -I --max-time 5 "$BASE_URL" 2>/dev/null)

    # Check security headers
    if echo "$HEADERS" | grep -qi "x-frame-options"; then
        printf "%-20s : ${GREEN}✅ Present${NC}\n" "X-Frame-Options"
    else
        printf "%-20s : ${RED}❌ Missing${NC}\n" "X-Frame-Options"
    fi

    if echo "$HEADERS" | grep -qi "content-security-policy"; then
        printf "%-20s : ${GREEN}✅ Present${NC}\n" "CSP"
    else
        printf "%-20s : ${YELLOW}⚠️  Missing${NC}\n" "CSP"
    fi

    if echo "$HEADERS" | grep -qi "strict-transport-security"; then
        printf "%-20s : ${GREEN}✅ Present${NC}\n" "HSTS"
    else
        printf "%-20s : ${YELLOW}⚠️  Missing${NC}\n" "HSTS"
    fi

    echo ""

    # Footer
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "Refreshing in ${REFRESH_INTERVAL}s... (Press Ctrl+C to exit)"

    sleep $REFRESH_INTERVAL
done
