#!/bin/bash

# Smoke Test - Quick production verification
# Run this after deployment to check critical functionality

DOMAIN="https://auto.lumiku.com"
PASS=0
FAIL=0

echo "🔥 AutoLeads Production Smoke Test"
echo "=================================="
echo ""

# Test 1: Health Check
echo -n "1. Health endpoint... "
if curl -s "$DOMAIN/health" | grep -q '"status":"ok"'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 2: Database Connection
echo -n "2. Database connection... "
if curl -s "$DOMAIN/health" | grep -q '"connected":true'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 3: Tenant API
echo -n "3. Tenant endpoint... "
if curl -s "$DOMAIN/api/tenant" | grep -q 'success'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 4: Car Catalog
echo -n "4. Car catalog... "
if curl -s "$DOMAIN/api/cars?limit=1" | grep -q 'success'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 5: Search Endpoint
echo -n "5. Search functionality... "
if curl -s "$DOMAIN/api/cars/search?search=Toyota" | grep -q 'success'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 6: Security Headers - CSP
echo -n "6. CSP header... "
if curl -sI "$DOMAIN" | grep -q 'Content-Security-Policy'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 7: Security Headers - X-Frame-Options
echo -n "7. X-Frame-Options... "
if curl -sI "$DOMAIN" | grep -q 'X-Frame-Options'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Test 8: Security Headers - X-Content-Type-Options
echo -n "8. X-Content-Type-Options... "
if curl -sI "$DOMAIN" | grep -q 'X-Content-Type-Options'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  ((FAIL++))
fi

# Summary
echo ""
echo "=================================="
echo "Results: $PASS passed, $FAIL failed"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "🎉 All smoke tests PASSED!"
  echo "Production deployment is healthy."
  exit 0
else
  echo "⚠️  Some tests FAILED!"
  echo "Review errors above and check logs:"
  echo "  ssh root@cf.avolut.com \"docker logs b8sc48s8s0c4w00008k808w8 --tail 50\""
  exit 1
fi
