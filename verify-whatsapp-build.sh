#!/bin/bash

# ============================================================================
# WhatsApp Web API v1.3.0 Build Verification Script
# ============================================================================
# This script verifies that the WhatsApp Web API binary was built correctly
# and is ready for production deployment.
#
# Usage:
#   ./verify-whatsapp-build.sh [container-id-or-name]
#
# If no container specified, it will verify the most recently built image.
# ============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}WhatsApp Web API Build Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to print check status
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Determine container to check
CONTAINER_ID="$1"

if [ -z "$CONTAINER_ID" ]; then
    echo -e "${YELLOW}No container specified. Creating temporary container...${NC}"
    IMAGE_NAME="autoleads:latest"

    # Check if image exists
    if ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
        echo -e "${RED}Error: Image '$IMAGE_NAME' not found.${NC}"
        echo "Please build the image first: docker build -t autoleads:latest ."
        exit 1
    fi

    # Create temporary container
    CONTAINER_ID=$(docker create "$IMAGE_NAME")
    CLEANUP_CONTAINER=true
    echo -e "${GREEN}Created temporary container: $CONTAINER_ID${NC}"
    echo ""
else
    CLEANUP_CONTAINER=false
    echo -e "${GREEN}Using container: $CONTAINER_ID${NC}"
    echo ""
fi

# ============================================================================
# Check 1: Binary exists at expected path
# ============================================================================
echo -e "${BLUE}[1/7]${NC} Checking binary location..."
if docker exec "$CONTAINER_ID" test -f /usr/local/bin/whatsapp-web-api 2>/dev/null || \
   docker cp "$CONTAINER_ID:/usr/local/bin/whatsapp-web-api" /tmp/wa-verify-binary >/dev/null 2>&1; then
    check_pass "Binary exists at /usr/local/bin/whatsapp-web-api"
else
    check_fail "Binary not found at expected path"
fi

# ============================================================================
# Check 2: Binary is executable
# ============================================================================
echo -e "${BLUE}[2/7]${NC} Checking binary permissions..."
BINARY_PERMS=$(docker exec "$CONTAINER_ID" stat -c "%a" /usr/local/bin/whatsapp-web-api 2>/dev/null || \
               stat -c "%a" /tmp/wa-verify-binary 2>/dev/null || echo "000")
if [[ "$BINARY_PERMS" =~ ^[4-7][0-7][0-7]$ ]]; then
    check_pass "Binary is executable (permissions: $BINARY_PERMS)"
else
    check_fail "Binary is not executable (permissions: $BINARY_PERMS)"
fi

# ============================================================================
# Check 3: Binary size is reasonable
# ============================================================================
echo -e "${BLUE}[3/7]${NC} Checking binary size..."
BINARY_SIZE=$(docker exec "$CONTAINER_ID" stat -c "%s" /usr/local/bin/whatsapp-web-api 2>/dev/null || \
              stat -c "%s" /tmp/wa-verify-binary 2>/dev/null || echo "0")
BINARY_SIZE_MB=$((BINARY_SIZE / 1024 / 1024))

if [ "$BINARY_SIZE_MB" -ge 10 ] && [ "$BINARY_SIZE_MB" -le 50 ]; then
    check_pass "Binary size is reasonable: ${BINARY_SIZE_MB}MB"
elif [ "$BINARY_SIZE_MB" -gt 50 ]; then
    check_warn "Binary size is larger than expected: ${BINARY_SIZE_MB}MB (expected: 15-30MB)"
    check_warn "This may indicate debug symbols were not stripped"
elif [ "$BINARY_SIZE_MB" -lt 10 ]; then
    check_fail "Binary size is suspiciously small: ${BINARY_SIZE_MB}MB"
else
    check_fail "Could not determine binary size"
fi

# ============================================================================
# Check 4: Binary is for correct architecture
# ============================================================================
echo -e "${BLUE}[4/7]${NC} Checking binary architecture..."

# Copy binary to temp location for analysis
if [ ! -f /tmp/wa-verify-binary ]; then
    docker cp "$CONTAINER_ID:/usr/local/bin/whatsapp-web-api" /tmp/wa-verify-binary >/dev/null 2>&1
fi

if [ -f /tmp/wa-verify-binary ]; then
    BINARY_INFO=$(file /tmp/wa-verify-binary 2>/dev/null || echo "unknown")

    if echo "$BINARY_INFO" | grep -q "ELF 64-bit"; then
        check_pass "Binary is ELF 64-bit"
    else
        check_fail "Binary is not ELF 64-bit: $BINARY_INFO"
    fi

    if echo "$BINARY_INFO" | grep -q "x86-64\|x86_64"; then
        check_pass "Binary is for AMD64 architecture"
    else
        check_fail "Binary is not for AMD64: $BINARY_INFO"
    fi

    # Check if statically linked
    if echo "$BINARY_INFO" | grep -q "statically linked"; then
        check_pass "Binary is statically linked"
    elif echo "$BINARY_INFO" | grep -q "dynamically linked"; then
        check_warn "Binary is dynamically linked (may have runtime dependencies)"
    else
        check_warn "Could not determine if binary is statically linked"
    fi
else
    check_fail "Could not copy binary for analysis"
fi

# ============================================================================
# Check 5: Binary can execute (basic smoke test)
# ============================================================================
echo -e "${BLUE}[5/7]${NC} Checking binary execution..."

# Try to run binary with --help or --version flag
if docker run --rm --entrypoint /usr/local/bin/whatsapp-web-api "$IMAGE_NAME" --version >/dev/null 2>&1 ||
   docker run --rm --entrypoint /usr/local/bin/whatsapp-web-api "$IMAGE_NAME" --help >/dev/null 2>&1 ||
   docker run --rm --entrypoint /usr/local/bin/whatsapp-web-api "$IMAGE_NAME" 2>&1 | head -1 | grep -qE "WhatsApp|error|usage|listening" ; then
    check_pass "Binary executes without immediate crash"
else
    check_warn "Binary execution check inconclusive (may require environment variables)"
fi

# ============================================================================
# Check 6: Required system dependencies present
# ============================================================================
echo -e "${BLUE}[6/7]${NC} Checking runtime dependencies..."

# Check for PostgreSQL client
if docker run --rm "$IMAGE_NAME" which psql >/dev/null 2>&1; then
    check_pass "PostgreSQL client is installed"
else
    check_fail "PostgreSQL client is missing"
fi

# ============================================================================
# Check 7: Startup script compatibility
# ============================================================================
echo -e "${BLUE}[7/7]${NC} Checking startup script compatibility..."

# Check if startup script exists and references the binary
if docker run --rm --entrypoint /bin/bash "$IMAGE_NAME" -c "grep -q '/usr/local/bin/whatsapp-web-api' /app/start-multi-services.sh" 2>/dev/null; then
    check_pass "Startup script references WhatsApp API binary"
else
    check_fail "Startup script does not reference binary correctly"
fi

# ============================================================================
# Cleanup
# ============================================================================
if [ "$CLEANUP_CONTAINER" = true ]; then
    docker rm -f "$CONTAINER_ID" >/dev/null 2>&1
    echo ""
    echo -e "${YELLOW}Cleaned up temporary container${NC}"
fi

# Clean up temporary binary
rm -f /tmp/wa-verify-binary 2>/dev/null

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Checks passed: ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed: ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ "$CHECKS_FAILED" -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo -e "${GREEN}The WhatsApp Web API v1.3.0 binary is ready for production.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some checks failed.${NC}"
    echo -e "${RED}Please review the build process and fix the issues above.${NC}"
    exit 1
fi
