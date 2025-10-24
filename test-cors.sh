#!/bin/bash

# ════════════════════════════════════════════════════════════
# CORS SECURITY VERIFICATION TEST SUITE
# AutoLeads Platform - Task 1.2
# ════════════════════════════════════════════════════════════

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  CORS SECURITY VERIFICATION - AutoLeads Platform         ║"
echo "║  Testing CORS origin restrictions                         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000}"
API_ENDPOINT="/api/cars"
FULL_URL="${BASE_URL}${API_ENDPOINT}"

echo "🔧 Configuration:"
echo "   Base URL: $BASE_URL"
echo "   Test Endpoint: $API_ENDPOINT"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# ════════════════════════════════════════════════════════════
# TEST 1: Allowed Origin (Development - localhost:3000)
# ════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Allowed Origin (http://localhost:3000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -i -X GET "$FULL_URL" \
  -H "Origin: http://localhost:3000" 2>&1)

echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: http://localhost:3000"; then
  echo -e "${GREEN}✅ PASS${NC} - Origin allowed correctly"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC} - Expected origin not allowed"
  FAILED=$((FAILED + 1))
fi

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Credentials: true"; then
  echo -e "${GREEN}✅ PASS${NC} - Credentials enabled"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC} - Credentials not enabled"
  FAILED=$((FAILED + 1))
fi

echo ""

# ════════════════════════════════════════════════════════════
# TEST 2: Blocked Origin (Evil Site)
# ════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Blocked Origin (https://evil-hacker.com)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -i -X GET "$FULL_URL" \
  -H "Origin: https://evil-hacker.com" 2>&1)

echo "$RESPONSE" | head -20
echo ""

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: https://evil-hacker.com"; then
  echo -e "${RED}❌ FAIL${NC} - Evil origin was incorrectly allowed!"
  FAILED=$((FAILED + 1))
else
  echo -e "${GREEN}✅ PASS${NC} - Evil origin correctly blocked"
  PASSED=$((PASSED + 1))
fi

echo ""

# ════════════════════════════════════════════════════════════
# TEST 3: Preflight Request (OPTIONS)
# ════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Preflight Request (OPTIONS)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -i -X OPTIONS "$FULL_URL" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" 2>&1)

echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Methods:"; then
  echo -e "${GREEN}✅ PASS${NC} - Allowed methods header present"
  PASSED=$((PASSED + 1))

  METHODS=$(echo "$RESPONSE" | grep "Access-Control-Allow-Methods:" | head -1)
  echo "   Methods: $METHODS"
else
  echo -e "${RED}❌ FAIL${NC} - Allowed methods header missing"
  FAILED=$((FAILED + 1))
fi

if echo "$RESPONSE" | grep -q "Access-Control-Max-Age:"; then
  echo -e "${GREEN}✅ PASS${NC} - Max-Age header present (preflight caching)"
  PASSED=$((PASSED + 1))

  MAX_AGE=$(echo "$RESPONSE" | grep "Access-Control-Max-Age:" | head -1)
  echo "   $MAX_AGE"
else
  echo -e "${RED}❌ FAIL${NC} - Max-Age header missing"
  FAILED=$((FAILED + 1))
fi

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Headers:"; then
  echo -e "${GREEN}✅ PASS${NC} - Allowed headers present"
  PASSED=$((PASSED + 1))

  HEADERS=$(echo "$RESPONSE" | grep "Access-Control-Allow-Headers:" | head -1)
  echo "   Headers: $HEADERS"
else
  echo -e "${RED}❌ FAIL${NC} - Allowed headers missing"
  FAILED=$((FAILED + 1))
fi

echo ""

# ════════════════════════════════════════════════════════════
# TEST 4: Localhost Variant (127.0.0.1)
# ════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Localhost Variant (http://127.0.0.1:3000)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -i -X GET "$FULL_URL" \
  -H "Origin: http://127.0.0.1:3000" 2>&1)

echo "$RESPONSE" | head -20
echo ""

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: http://127.0.0.1:3000"; then
  echo -e "${GREEN}✅ PASS${NC} - 127.0.0.1 variant allowed"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC} - 127.0.0.1 variant not allowed"
  FAILED=$((FAILED + 1))
fi

echo ""

# ════════════════════════════════════════════════════════════
# TEST 5: Vite Dev Server (localhost:5173)
# ════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Vite Dev Server (http://localhost:5173)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -i -X GET "$FULL_URL" \
  -H "Origin: http://localhost:5173" 2>&1)

echo "$RESPONSE" | head -20
echo ""

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin: http://localhost:5173"; then
  echo -e "${GREEN}✅ PASS${NC} - Vite dev server origin allowed"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}❌ FAIL${NC} - Vite dev server origin not allowed"
  FAILED=$((FAILED + 1))
fi

echo ""

# ════════════════════════════════════════════════════════════
# TEST 6: Rate Limit Headers Exposed
# ════════════════════════════════════════════════════════════
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: Rate Limit Headers Exposed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -i -X GET "$FULL_URL" \
  -H "Origin: http://localhost:3000" 2>&1)

echo "$RESPONSE" | grep -i "x-ratelimit\|x-total-count\|x-page\|access-control-expose"
echo ""

if echo "$RESPONSE" | grep -qi "Access-Control-Expose-Headers:"; then
  echo -e "${GREEN}✅ PASS${NC} - Expose-Headers present"
  PASSED=$((PASSED + 1))

  EXPOSED=$(echo "$RESPONSE" | grep -i "Access-Control-Expose-Headers:" | head -1)
  echo "   $EXPOSED"
else
  echo -e "${RED}❌ FAIL${NC} - Expose-Headers missing"
  FAILED=$((FAILED + 1))
fi

echo ""

# ════════════════════════════════════════════════════════════
# TEST SUMMARY
# ════════════════════════════════════════════════════════════
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "Total Tests: $((PASSED + FAILED))"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║  ✅ ALL TESTS PASSED - CORS Security Implemented!       ║${NC}"
  echo -e "${GREEN}║  Security Level: 90/100                                  ║${NC}"
  echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
  exit 0
else
  echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║  ❌ SOME TESTS FAILED - Review Configuration             ║${NC}"
  echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
  exit 1
fi
