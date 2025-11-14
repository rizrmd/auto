#!/bin/bash
# Test Blog AI Generation via WhatsApp
# Tests the /blog command flow

CONTAINER_ID="b8sc48s8s0c4w00008k808w8"
WEBHOOK_URL="http://localhost:3000/webhook/whatsapp"
HOST_HEADER="auto.lumiku.com"

# Admin phone number (should have owner/admin role)
ADMIN_PHONE="6281235108908"

echo "===================================="
echo "Testing Blog AI Generation via WhatsApp"
echo "===================================="
echo ""

# Test 1: Send /blog command with prompt
echo "Test 1: Sending /blog command..."
docker exec $CONTAINER_ID curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Host: $HOST_HEADER" \
  -d "{
    \"event\": \"message\",
    \"sender\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"message\": \"/blog Tulis artikel tentang tips membeli Toyota Avanza bekas\",
    \"chat\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"time\": \"$(date -Iseconds)\",
    \"id\": \"test-blog-1\"
  }"

echo ""
echo ""
sleep 2

# Test 2: Select tone (Balanced)
echo "Test 2: Selecting tone (Balanced)..."
docker exec $CONTAINER_ID curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Host: $HOST_HEADER" \
  -d "{
    \"event\": \"message\",
    \"sender\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"message\": \"3\",
    \"chat\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"time\": \"$(date -Iseconds)\",
    \"id\": \"test-blog-2\"
  }"

echo ""
echo ""
sleep 2

# Test 3: Select category (Tips & Trik)
echo "Test 3: Selecting category (Tips & Trik)..."
docker exec $CONTAINER_ID curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Host: $HOST_HEADER" \
  -d "{
    \"event\": \"message\",
    \"sender\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"message\": \"1\",
    \"chat\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"time\": \"$(date -Iseconds)\",
    \"id\": \"test-blog-3\"
  }"

echo ""
echo ""
sleep 2

# Test 4: Skip car selection
echo "Test 4: Skipping car selection..."
docker exec $CONTAINER_ID curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Host: $HOST_HEADER" \
  -d "{
    \"event\": \"message\",
    \"sender\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"message\": \"skip\",
    \"chat\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"time\": \"$(date -Iseconds)\",
    \"id\": \"test-blog-4\"
  }"

echo ""
echo ""
sleep 2

# Test 5: Add keywords
echo "Test 5: Adding keywords..."
docker exec $CONTAINER_ID curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Host: $HOST_HEADER" \
  -d "{
    \"event\": \"message\",
    \"sender\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"message\": \"avanza bekas, tips beli mobil, mobil second\",
    \"chat\": \"${ADMIN_PHONE}@s.whatsapp.net\",
    \"time\": \"$(date -Iseconds)\",
    \"id\": \"test-blog-5\"
  }"

echo ""
echo ""
echo "===================================="
echo "Blog generation started!"
echo "Check WhatsApp for confirmation and result."
echo "Check logs:"
echo "ssh root@cf.avolut.com \"docker logs --tail 100 $CONTAINER_ID | grep -i blog\""
echo "===================================="
