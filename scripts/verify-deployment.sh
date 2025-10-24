#!/bin/bash

#######################################################################
# AutoLeads Production Deployment Verification Script
#
# Tests all critical functionality after deployment
# Exit Code: 0 = All tests passed, 1 = Some tests failed
#
# Usage: ./scripts/verify-deployment.sh
#######################################################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="https://auto.lumiku.com"
PASSED=0
FAILED=0
WARNINGS=0

# Test timeout (seconds)
TIMEOUT=10

# Performance thresholds
MAX_RESPONSE_TIME=2000  # 2 seconds in milliseconds
MAX_TTFB=500           # 500ms time to first byte

#######################################################################
# Helper Functions
#######################################################################

test_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

test_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

test_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

test_info() {
    echo -e "${CYAN}ℹ️  INFO${NC}: $1"
}

section_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Check if required tools are installed
check_requirements() {
    local missing=0

    if ! command -v curl &> /dev/null; then
        echo -e "${RED}ERROR: curl is not installed${NC}"
        missing=1
    fi

    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}WARNING: jq is not installed - JSON validation will be skipped${NC}"
    fi

    if [ $missing -eq 1 ]; then
        echo "Please install missing dependencies and try again"
        exit 1
    fi
}

# Extract value from headers
get_header() {
    local headers="$1"
    local header_name="$2"
    echo "$headers" | grep -i "^$header_name:" | cut -d' ' -f2- | tr -d '\r'
}

#######################################################################
# Main Script
#######################################################################

clear
echo -e "${CYAN}"
cat << "EOF"
    _         _       _                    _
   / \  _   _| |_ ___| |    ___  __ _  __| |___
  / _ \| | | | __/ _ \ |   / _ \/ _` |/ _` / __|
 / ___ \ |_| | || (_) | |__|  __/ (_| | (_| \__ \
/_/   \_\__,_|\__\___/|_____\___|\__,_|\__,_|___/

Production Deployment Verification
EOF
echo -e "${NC}"

echo "=========================================="
echo "Target: $BASE_URL"
echo "Started: $(date)"
echo "=========================================="

# Check requirements
check_requirements

#######################################################################
# Test 1: Infrastructure Tests
#######################################################################

section_header "1. INFRASTRUCTURE TESTS"

# Test 1.1: Application is reachable
test_info "Testing if application is reachable..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    test_pass "Application is reachable (HTTP $HTTP_CODE)"
else
    test_fail "Application not reachable (HTTP $HTTP_CODE)"
fi

# Test 1.2: Health endpoint
test_info "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s --max-time $TIMEOUT "$BASE_URL/health" 2>/dev/null)
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/health" 2>/dev/null)

if [ "$HEALTH_CODE" = "200" ]; then
    test_pass "Health endpoint responds (HTTP 200)"

    # Check if response is valid JSON
    if command -v jq &> /dev/null; then
        if echo "$HEALTH_RESPONSE" | jq -e . >/dev/null 2>&1; then
            test_pass "Health endpoint returns valid JSON"

            # Check for status field
            STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null)
            if [ "$STATUS" = "ok" ]; then
                test_pass "Health status is 'ok'"
            else
                test_warn "Health status is '$STATUS' (expected 'ok')"
            fi
        else
            test_fail "Health endpoint returns invalid JSON"
        fi
    fi
else
    test_fail "Health endpoint not responding (HTTP $HEALTH_CODE)"
fi

# Test 1.3: HTTPS enforcement
test_info "Testing HTTPS enforcement..."
HTTP_URL="http://auto.lumiku.com"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$HTTP_URL" 2>/dev/null)
if [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "308" ]; then
    test_pass "HTTP redirects to HTTPS (HTTP $HTTP_CODE)"
else
    test_warn "HTTP does not redirect to HTTPS (HTTP $HTTP_CODE)"
fi

#######################################################################
# Test 2: API Endpoint Tests
#######################################################################

section_header "2. API ENDPOINT TESTS"

# Test 2.1: GET /api/tenant
test_info "Testing GET /api/tenant..."
TENANT_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/tenant" 2>/dev/null)
if [ "$TENANT_CODE" = "200" ]; then
    test_pass "GET /api/tenant responds (HTTP 200)"

    if command -v jq &> /dev/null; then
        TENANT_RESPONSE=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/tenant" 2>/dev/null)
        if echo "$TENANT_RESPONSE" | jq -e '.name' >/dev/null 2>&1; then
            TENANT_NAME=$(echo "$TENANT_RESPONSE" | jq -r '.name')
            test_pass "Tenant data includes name: '$TENANT_NAME'"
        fi
    fi
else
    test_fail "GET /api/tenant failed (HTTP $TENANT_CODE)"
fi

# Test 2.2: GET /api/cars
test_info "Testing GET /api/cars..."
CARS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null)
if [ "$CARS_CODE" = "200" ]; then
    test_pass "GET /api/cars responds (HTTP 200)"

    if command -v jq &> /dev/null; then
        CARS_RESPONSE=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null)
        CAR_COUNT=$(echo "$CARS_RESPONSE" | jq '.data | length' 2>/dev/null)
        if [ ! -z "$CAR_COUNT" ]; then
            test_info "Found $CAR_COUNT cars"
            if [ "$CAR_COUNT" -gt 0 ]; then
                test_pass "Cars data is not empty"
            else
                test_warn "No cars found in database"
            fi
        fi
    fi
else
    test_fail "GET /api/cars failed (HTTP $CARS_CODE)"
fi

# Test 2.3: GET /api/cars/featured
test_info "Testing GET /api/cars/featured..."
FEATURED_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars/featured" 2>/dev/null)
if [ "$FEATURED_CODE" = "200" ]; then
    test_pass "GET /api/cars/featured responds (HTTP 200)"
else
    test_fail "GET /api/cars/featured failed (HTTP $FEATURED_CODE)"
fi

# Test 2.4: GET /api/cars/search
test_info "Testing GET /api/cars/search..."
SEARCH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars/search?q=toyota" 2>/dev/null)
if [ "$SEARCH_CODE" = "200" ]; then
    test_pass "GET /api/cars/search responds (HTTP 200)"
else
    test_fail "GET /api/cars/search failed (HTTP $SEARCH_CODE)"
fi

# Test 2.5: GET /api/cars/:slug (get first car slug)
test_info "Testing GET /api/cars/:slug..."
if command -v jq &> /dev/null; then
    FIRST_SLUG=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null | jq -r '.data[0].slug' 2>/dev/null)
    if [ ! -z "$FIRST_SLUG" ] && [ "$FIRST_SLUG" != "null" ]; then
        SLUG_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars/$FIRST_SLUG" 2>/dev/null)
        if [ "$SLUG_CODE" = "200" ]; then
            test_pass "GET /api/cars/:slug responds (HTTP 200) for slug: $FIRST_SLUG"
        else
            test_fail "GET /api/cars/:slug failed (HTTP $SLUG_CODE)"
        fi
    else
        test_warn "Cannot test /api/cars/:slug - no cars available"
    fi
else
    test_warn "Cannot test /api/cars/:slug - jq not installed"
fi

# Test 2.6: POST /api/admin/auth/login (should fail without credentials)
test_info "Testing POST /api/admin/auth/login (without credentials)..."
LOGIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT -X POST "$BASE_URL/api/admin/auth/login" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
if [ "$LOGIN_CODE" = "400" ] || [ "$LOGIN_CODE" = "401" ] || [ "$LOGIN_CODE" = "422" ]; then
    test_pass "POST /api/admin/auth/login rejects invalid request (HTTP $LOGIN_CODE)"
else
    test_fail "POST /api/admin/auth/login unexpected response (HTTP $LOGIN_CODE)"
fi

#######################################################################
# Test 3: Security Tests
#######################################################################

section_header "3. SECURITY TESTS"

# Test 3.1: Security Headers
test_info "Testing security headers..."
HEADERS=$(curl -s -I --max-time $TIMEOUT "$BASE_URL" 2>/dev/null)

# X-Frame-Options
if echo "$HEADERS" | grep -i "x-frame-options:" >/dev/null; then
    test_pass "X-Frame-Options header present"
else
    test_warn "X-Frame-Options header missing"
fi

# X-Content-Type-Options
if echo "$HEADERS" | grep -i "x-content-type-options:" >/dev/null; then
    test_pass "X-Content-Type-Options header present"
else
    test_warn "X-Content-Type-Options header missing"
fi

# X-XSS-Protection or Content-Security-Policy
if echo "$HEADERS" | grep -i "content-security-policy:" >/dev/null; then
    test_pass "Content-Security-Policy header present"
elif echo "$HEADERS" | grep -i "x-xss-protection:" >/dev/null; then
    test_pass "X-XSS-Protection header present"
else
    test_warn "No XSS protection headers found"
fi

# HSTS (Strict-Transport-Security)
if echo "$HEADERS" | grep -i "strict-transport-security:" >/dev/null; then
    test_pass "Strict-Transport-Security (HSTS) header present"
else
    test_warn "HSTS header missing"
fi

# Test 3.2: CORS Headers
test_info "Testing CORS configuration..."
CORS_HEADERS=$(curl -s -I --max-time $TIMEOUT -H "Origin: https://malicious-site.com" "$BASE_URL/api/tenant" 2>/dev/null)
CORS_ORIGIN=$(get_header "$CORS_HEADERS" "access-control-allow-origin")

if [ ! -z "$CORS_ORIGIN" ]; then
    if [ "$CORS_ORIGIN" = "*" ]; then
        test_warn "CORS allows all origins (*) - potential security risk"
    else
        test_pass "CORS is configured (Origin: $CORS_ORIGIN)"
    fi
else
    test_pass "CORS not allowing unauthorized origin"
fi

# Test 3.3: SQL Injection Prevention
test_info "Testing SQL injection prevention..."
SQL_INJECTION_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars/search?q=%27%20OR%201=1--" 2>/dev/null)
if [ "$SQL_INJECTION_CODE" = "200" ] || [ "$SQL_INJECTION_CODE" = "400" ]; then
    test_pass "SQL injection attempt handled safely (HTTP $SQL_INJECTION_CODE)"
else
    test_fail "SQL injection test unexpected response (HTTP $SQL_INJECTION_CODE)"
fi

# Test 3.4: XSS Prevention
test_info "Testing XSS prevention..."
XSS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars/search?q=%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E" 2>/dev/null)
if [ "$XSS_CODE" = "200" ] || [ "$XSS_CODE" = "400" ]; then
    test_pass "XSS attempt handled safely (HTTP $XSS_CODE)"
else
    test_fail "XSS test unexpected response (HTTP $XSS_CODE)"
fi

#######################################################################
# Test 4: File Serving Tests
#######################################################################

section_header "4. FILE SERVING TESTS"

# Test 4.1: Static files (index.html)
test_info "Testing static file serving..."
INDEX_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/" 2>/dev/null)
if [ "$INDEX_CODE" = "200" ]; then
    test_pass "Static files serve correctly (HTTP 200)"

    # Check Content-Type
    CONTENT_TYPE=$(curl -s -I --max-time $TIMEOUT "$BASE_URL/" 2>/dev/null | grep -i "content-type:" | cut -d' ' -f2- | tr -d '\r')
    if echo "$CONTENT_TYPE" | grep -i "text/html" >/dev/null; then
        test_pass "Correct MIME type for HTML (text/html)"
    else
        test_warn "Unexpected MIME type: $CONTENT_TYPE"
    fi
else
    test_fail "Static files not serving (HTTP $INDEX_CODE)"
fi

# Test 4.2: Cache headers
test_info "Testing cache headers..."
CACHE_HEADERS=$(curl -s -I --max-time $TIMEOUT "$BASE_URL/" 2>/dev/null)
if echo "$CACHE_HEADERS" | grep -i "cache-control:" >/dev/null; then
    CACHE_CONTROL=$(get_header "$CACHE_HEADERS" "cache-control")
    test_pass "Cache-Control header present: $CACHE_CONTROL"
else
    test_info "No cache headers found (may be intentional for HTML)"
fi

# Test 4.3: Image serving (if available)
test_info "Testing image file serving..."
# Try common image paths
IMAGE_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/logo.svg" 2>/dev/null)
if [ "$IMAGE_CODE" = "200" ]; then
    test_pass "Image files serve correctly (HTTP 200)"
elif [ "$IMAGE_CODE" = "404" ]; then
    test_info "Logo not found at /logo.svg (expected if no logo uploaded)"
else
    test_warn "Image serving test inconclusive (HTTP $IMAGE_CODE)"
fi

#######################################################################
# Test 5: Database Tests
#######################################################################

section_header "5. DATABASE TESTS"

# Test 5.1: Database connectivity (via API)
test_info "Testing database connectivity..."
if [ "$TENANT_CODE" = "200" ] && [ "$CARS_CODE" = "200" ]; then
    test_pass "Database is connected and responding"
else
    test_fail "Database connectivity issues detected"
fi

# Test 5.2: Sample data exists
test_info "Testing sample data presence..."
if command -v jq &> /dev/null; then
    TENANT_RESPONSE=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/tenant" 2>/dev/null)
    CARS_RESPONSE=$(curl -s --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null)

    TENANT_EXISTS=$(echo "$TENANT_RESPONSE" | jq -e '.id' >/dev/null 2>&1 && echo "yes" || echo "no")
    CAR_COUNT=$(echo "$CARS_RESPONSE" | jq '.data | length' 2>/dev/null)

    if [ "$TENANT_EXISTS" = "yes" ]; then
        test_pass "Tenant data exists in database"
    else
        test_fail "No tenant data found"
    fi

    if [ ! -z "$CAR_COUNT" ] && [ "$CAR_COUNT" -gt 0 ]; then
        test_pass "Car inventory exists ($CAR_COUNT cars)"
    else
        test_warn "No cars in inventory"
    fi
else
    test_info "Skipping sample data test - jq not installed"
fi

#######################################################################
# Test 6: Performance Tests
#######################################################################

section_header "6. PERFORMANCE TESTS"

# Test 6.1: Response time
test_info "Testing API response time..."
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null)
RESPONSE_TIME_MS=$(echo "$RESPONSE_TIME * 1000" | bc 2>/dev/null || echo "0")
RESPONSE_TIME_MS=${RESPONSE_TIME_MS%.*}  # Remove decimal

if [ ! -z "$RESPONSE_TIME_MS" ] && [ "$RESPONSE_TIME_MS" -gt 0 ]; then
    if [ "$RESPONSE_TIME_MS" -lt "$MAX_RESPONSE_TIME" ]; then
        test_pass "API response time: ${RESPONSE_TIME_MS}ms (< ${MAX_RESPONSE_TIME}ms)"
    else
        test_warn "API response time: ${RESPONSE_TIME_MS}ms (> ${MAX_RESPONSE_TIME}ms threshold)"
    fi
else
    test_info "Could not measure response time (bc not installed)"
fi

# Test 6.2: Time to first byte
test_info "Testing time to first byte (TTFB)..."
TTFB=$(curl -s -o /dev/null -w "%{time_starttransfer}" --max-time $TIMEOUT "$BASE_URL/api/cars" 2>/dev/null)
TTFB_MS=$(echo "$TTFB * 1000" | bc 2>/dev/null || echo "0")
TTFB_MS=${TTFB_MS%.*}

if [ ! -z "$TTFB_MS" ] && [ "$TTFB_MS" -gt 0 ]; then
    if [ "$TTFB_MS" -lt "$MAX_TTFB" ]; then
        test_pass "Time to first byte: ${TTFB_MS}ms (< ${MAX_TTFB}ms)"
    else
        test_warn "Time to first byte: ${TTFB_MS}ms (> ${MAX_TTFB}ms threshold)"
    fi
else
    test_info "Could not measure TTFB (bc not installed)"
fi

# Test 6.3: SSL handshake time
test_info "Testing SSL handshake performance..."
SSL_TIME=$(curl -s -o /dev/null -w "%{time_connect}" --max-time $TIMEOUT "$BASE_URL" 2>/dev/null)
SSL_TIME_MS=$(echo "$SSL_TIME * 1000" | bc 2>/dev/null || echo "0")
SSL_TIME_MS=${SSL_TIME_MS%.*}

if [ ! -z "$SSL_TIME_MS" ] && [ "$SSL_TIME_MS" -gt 0 ]; then
    if [ "$SSL_TIME_MS" -lt 200 ]; then
        test_pass "SSL handshake time: ${SSL_TIME_MS}ms (< 200ms)"
    else
        test_info "SSL handshake time: ${SSL_TIME_MS}ms"
    fi
else
    test_info "Could not measure SSL handshake time"
fi

#######################################################################
# Test 7: Error Handling Tests
#######################################################################

section_header "7. ERROR HANDLING TESTS"

# Test 7.1: 404 handling
test_info "Testing 404 error handling..."
NOT_FOUND_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/nonexistent-endpoint-12345" 2>/dev/null)
if [ "$NOT_FOUND_CODE" = "404" ]; then
    test_pass "404 errors handled correctly (HTTP 404)"
else
    test_warn "404 handling unexpected (HTTP $NOT_FOUND_CODE)"
fi

# Test 7.2: Invalid car slug
test_info "Testing invalid resource handling..."
INVALID_SLUG_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL/api/cars/nonexistent-car-slug-12345" 2>/dev/null)
if [ "$INVALID_SLUG_CODE" = "404" ]; then
    test_pass "Invalid resource returns 404"
else
    test_info "Invalid resource returns HTTP $INVALID_SLUG_CODE"
fi

# Test 7.3: Method not allowed
test_info "Testing method not allowed handling..."
METHOD_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT -X DELETE "$BASE_URL/api/cars" 2>/dev/null)
if [ "$METHOD_CODE" = "405" ] || [ "$METHOD_CODE" = "404" ]; then
    test_pass "Invalid HTTP methods rejected (HTTP $METHOD_CODE)"
else
    test_info "Method not allowed returns HTTP $METHOD_CODE"
fi

#######################################################################
# Summary
#######################################################################

section_header "VERIFICATION SUMMARY"

TOTAL=$((PASSED + FAILED + WARNINGS))

echo -e "${GREEN}✅ Passed:  $PASSED${NC}"
echo -e "${RED}❌ Failed:  $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Total:   $TOTAL"
echo ""

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc 2>/dev/null || echo "N/A")
    echo "Success Rate: ${SUCCESS_RATE}%"
fi

echo ""
echo "Completed: $(date)"
echo "=========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}"
    cat << "EOF"
╔═══════════════════════════════════════╗
║   ✅ ALL CRITICAL TESTS PASSED ✅    ║
╚═══════════════════════════════════════╝
EOF
    echo -e "${NC}"

    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Note: $WARNINGS warning(s) detected - review recommended${NC}"
    fi

    exit 0
else
    echo -e "${RED}"
    cat << "EOF"
╔═══════════════════════════════════════╗
║   ❌ SOME TESTS FAILED - FIX NOW ❌  ║
╚═══════════════════════════════════════╝
EOF
    echo -e "${NC}"
    echo "Please review the failed tests above and fix issues before proceeding."
    exit 1
fi
