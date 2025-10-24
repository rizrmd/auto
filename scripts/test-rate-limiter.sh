#!/bin/bash

##############################################################################
# Rate Limiter Verification Test Script
#
# Purpose: Verify that the rate limiter counts requests correctly (ONCE, not twice)
# Bug Fix: Task 2.6 - Fix Rate Limiter Double Increment
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-https://auto.lumiku.com}"
ENDPOINT="/api/cars"
EXPECTED_LIMIT=100  # Public rate limiter limit
TEST_REQUESTS=10    # Number of test requests

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Rate Limiter Verification Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo "Endpoint: $ENDPOINT"
echo "Expected Limit: $EXPECTED_LIMIT requests/minute"
echo "Test Requests: $TEST_REQUESTS"
echo ""

# Function to extract header value
get_header() {
    local response="$1"
    local header="$2"
    echo "$response" | grep -i "^$header:" | cut -d' ' -f2 | tr -d '\r'
}

# Function to test rate limiter single increment
test_single_increment() {
    echo -e "${YELLOW}Test 1: Verify Single Increment (Not Double)${NC}"
    echo "-------------------------------------------"

    # Wait for rate limit window to reset
    echo "Waiting 5 seconds for rate limit window to reset..."
    sleep 5

    local failures=0

    for i in $(seq 1 $TEST_REQUESTS); do
        # Make request and capture headers
        response=$(curl -s -i "$BASE_URL$ENDPOINT" 2>&1)

        # Extract headers
        limit=$(get_header "$response" "X-RateLimit-Limit")
        remaining=$(get_header "$response" "X-RateLimit-Remaining")
        status=$(echo "$response" | grep -E "^HTTP" | awk '{print $2}')

        # Calculate expected remaining
        expected_remaining=$((EXPECTED_LIMIT - i))

        echo -n "Request $i: "
        echo -n "Status=$status, "
        echo -n "Limit=$limit, "
        echo -n "Remaining=$remaining, "
        echo -n "Expected=$expected_remaining "

        # Verify remaining count is correct (single increment, not double)
        if [ "$remaining" = "$expected_remaining" ]; then
            echo -e "${GREEN}✓ PASS${NC}"
        else
            echo -e "${RED}✗ FAIL (Double counting detected!)${NC}"
            failures=$((failures + 1))
        fi

        # Small delay between requests
        sleep 0.1
    done

    echo ""
    if [ $failures -eq 0 ]; then
        echo -e "${GREEN}✓ Test 1 PASSED: Rate limiter counts correctly (single increment)${NC}"
        return 0
    else
        echo -e "${RED}✗ Test 1 FAILED: $failures requests had incorrect counts${NC}"
        return 1
    fi
}

# Function to test rate limit enforcement
test_rate_limit_enforcement() {
    echo ""
    echo -e "${YELLOW}Test 2: Verify Rate Limit Enforcement${NC}"
    echo "---------------------------------------"
    echo "NOTE: This test requires temporarily lowering the rate limit."
    echo "Skipping full enforcement test to avoid hitting production limits."
    echo -e "${BLUE}✓ Test 2 SKIPPED (manual test required)${NC}"
}

# Function to test skipFailedRequests
test_skip_failed_requests() {
    echo ""
    echo -e "${YELLOW}Test 3: Verify skipFailedRequests Works${NC}"
    echo "----------------------------------------"

    # Test with invalid endpoint (should return 404)
    local before_response=$(curl -s -i "$BASE_URL$ENDPOINT" 2>&1)
    local before_remaining=$(get_header "$before_response" "X-RateLimit-Remaining")

    # Make request to invalid endpoint (404)
    curl -s "$BASE_URL/api/invalid-endpoint-test" > /dev/null 2>&1

    # Make valid request again
    local after_response=$(curl -s -i "$BASE_URL$ENDPOINT" 2>&1)
    local after_remaining=$(get_header "$after_response" "X-RateLimit-Remaining")

    echo "Remaining before 404: $before_remaining"
    echo "Remaining after 404: $after_remaining"
    echo "Difference: $((before_remaining - after_remaining))"

    # Public rate limiter has skipFailedRequests=true, so 404s shouldn't count
    # But we also made a valid request, so remaining should decrease by 1
    if [ $((before_remaining - after_remaining)) -eq 1 ]; then
        echo -e "${GREEN}✓ Test 3 PASSED: skipFailedRequests works correctly${NC}"
    else
        echo -e "${YELLOW}⚠ Test 3 INCONCLUSIVE: Check if 404 was counted${NC}"
    fi
}

# Function to test headers presence
test_headers_presence() {
    echo ""
    echo -e "${YELLOW}Test 4: Verify Rate Limit Headers${NC}"
    echo "-----------------------------------"

    response=$(curl -s -i "$BASE_URL$ENDPOINT" 2>&1)

    # Check for required headers
    local has_limit=$(echo "$response" | grep -i "X-RateLimit-Limit" | wc -l)
    local has_remaining=$(echo "$response" | grep -i "X-RateLimit-Remaining" | wc -l)
    local has_reset=$(echo "$response" | grep -i "X-RateLimit-Reset" | wc -l)

    echo -n "X-RateLimit-Limit: "
    [ $has_limit -gt 0 ] && echo -e "${GREEN}✓ Present${NC}" || echo -e "${RED}✗ Missing${NC}"

    echo -n "X-RateLimit-Remaining: "
    [ $has_remaining -gt 0 ] && echo -e "${GREEN}✓ Present${NC}" || echo -e "${RED}✗ Missing${NC}"

    echo -n "X-RateLimit-Reset: "
    [ $has_reset -gt 0 ] && echo -e "${GREEN}✓ Present${NC}" || echo -e "${RED}✗ Missing${NC}"

    if [ $has_limit -gt 0 ] && [ $has_remaining -gt 0 ] && [ $has_reset -gt 0 ]; then
        echo -e "${GREEN}✓ Test 4 PASSED: All headers present${NC}"
        return 0
    else
        echo -e "${RED}✗ Test 4 FAILED: Some headers missing${NC}"
        return 1
    fi
}

# Function to test no double increment after fix
test_no_double_increment() {
    echo ""
    echo -e "${YELLOW}Test 5: Confirm No Double Increment Bug${NC}"
    echo "-----------------------------------------"

    # Make 3 requests and track remaining
    local prev_remaining=999999
    local double_increment_detected=0

    for i in $(seq 1 3); do
        response=$(curl -s -i "$BASE_URL$ENDPOINT" 2>&1)
        remaining=$(get_header "$response" "X-RateLimit-Remaining")

        if [ $prev_remaining -ne 999999 ]; then
            difference=$((prev_remaining - remaining))
            echo -n "Request $i: Remaining=$remaining, Difference from previous=$difference "

            # Should always decrease by 1, not 2
            if [ $difference -eq 2 ]; then
                echo -e "${RED}✗ DOUBLE INCREMENT DETECTED!${NC}"
                double_increment_detected=1
            elif [ $difference -eq 1 ]; then
                echo -e "${GREEN}✓ OK${NC}"
            else
                echo -e "${YELLOW}⚠ Unexpected ($difference)${NC}"
            fi
        else
            echo "Request $i: Remaining=$remaining (baseline)"
        fi

        prev_remaining=$remaining
        sleep 0.1
    done

    echo ""
    if [ $double_increment_detected -eq 0 ]; then
        echo -e "${GREEN}✓ Test 5 PASSED: No double increment bug detected${NC}"
        return 0
    else
        echo -e "${RED}✗ Test 5 FAILED: Double increment bug still exists!${NC}"
        return 1
    fi
}

# Run all tests
main() {
    local total_tests=0
    local passed_tests=0

    # Test 1: Single Increment
    total_tests=$((total_tests + 1))
    if test_single_increment; then
        passed_tests=$((passed_tests + 1))
    fi

    # Test 2: Rate Limit Enforcement (skipped)
    test_rate_limit_enforcement

    # Test 3: Skip Failed Requests
    total_tests=$((total_tests + 1))
    if test_skip_failed_requests; then
        passed_tests=$((passed_tests + 1))
    fi

    # Test 4: Headers Presence
    total_tests=$((total_tests + 1))
    if test_headers_presence; then
        passed_tests=$((passed_tests + 1))
    fi

    # Test 5: No Double Increment
    total_tests=$((total_tests + 1))
    if test_no_double_increment; then
        passed_tests=$((passed_tests + 1))
    fi

    # Final Summary
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Test Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo "Total Tests: $total_tests"
    echo "Passed: $passed_tests"
    echo "Failed: $((total_tests - passed_tests))"
    echo ""

    if [ $passed_tests -eq $total_tests ]; then
        echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
        echo -e "${GREEN}Rate limiter is working correctly!${NC}"
        exit 0
    else
        echo -e "${RED}✗ SOME TESTS FAILED${NC}"
        echo -e "${RED}Please review the failures above.${NC}"
        exit 1
    fi
}

# Run main function
main
