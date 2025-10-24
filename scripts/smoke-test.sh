#!/bin/bash

#######################################################################
# AutoLeads Production Smoke Test
#
# Quick 30-second deployment verification
# Tests only the most critical functionality
# Fails fast on first error
#
# Usage: ./scripts/smoke-test.sh
#######################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BASE_URL="https://auto.lumiku.com"
TIMEOUT=10

#######################################################################
# Helper Functions
#######################################################################

test_pass() {
    echo -e "${GREEN}✅${NC} $1"
}

test_fail() {
    echo -e "${RED}❌ FAILED:${NC} $1"
    echo ""
    echo -e "${RED}Smoke test failed. Deployment verification incomplete.${NC}"
    exit 1
}

test_info() {
    echo -e "${CYAN}→${NC} $1"
}

#######################################################################
# Smoke Tests (Fail Fast)
#######################################################################

clear
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}   AutoLeads Smoke Test (30 seconds)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 1: Health Check
test_info "Testing health endpoint..."
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/health" 2>/dev/null)
if [ "$HEALTH_CODE" = "200" ]; then
    test_pass "Health endpoint OK"
else
    test_fail "Health endpoint returned HTTP $HEALTH_CODE (expected 200)"
fi

# Test 2: Database Connection
test_info "Testing database connection..."
TENANT_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/tenant" 2>/dev/null)
if [ "$TENANT_CODE" = "200" ]; then
    test_pass "Database connected"
else
    test_fail "Cannot connect to database (HTTP $TENANT_CODE)"
fi

# Test 3: API Response
test_info "Testing API endpoints..."
CARS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null)
if [ "$CARS_CODE" = "200" ]; then
    test_pass "API responding"
else
    test_fail "API not responding (HTTP $CARS_CODE)"
fi

# Test 4: Static Files
test_info "Testing static file serving..."
INDEX_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/" 2>/dev/null)
if [ "$INDEX_CODE" = "200" ] || [ "$INDEX_CODE" = "304" ]; then
    test_pass "Static files serving"
else
    test_fail "Static files not serving (HTTP $INDEX_CODE)"
fi

# Test 5: Security Headers
test_info "Testing security headers..."
HEADERS=$(curl -s -I --max-time $TIMEOUT "$BASE_URL" 2>/dev/null)
if echo "$HEADERS" | grep -qi "x-frame-options\|content-security-policy"; then
    test_pass "Security headers present"
else
    test_fail "Security headers missing"
fi

# Test 6: Response Time
test_info "Testing response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null)
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "999")
RESPONSE_TIME_MS=${RESPONSE_TIME_MS%.*}

if [ "$RESPONSE_TIME_MS" -lt 3000 ]; then
    test_pass "Response time acceptable (${RESPONSE_TIME_MS}ms)"
else
    test_fail "Response time too slow (${RESPONSE_TIME_MS}ms > 3000ms)"
fi

# All tests passed
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ SMOKE TEST PASSED${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "All critical systems are operational."
echo "Run './scripts/verify-deployment.sh' for comprehensive testing."
echo ""

exit 0
