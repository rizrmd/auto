#!/bin/bash

# Enhanced WhatsApp Pairing System Testing Script
# Comprehensive validation of the enhanced pairing solution

set -e

echo "🧪 Enhanced WhatsApp Pairing System - Comprehensive Testing"
echo "=========================================================="

# Configuration
BASE_URL="https://primamobil.id"
API_BASE="$BASE_URL/api"
WHATSAPP_API="http://localhost:8080"
DOCKER_CONTAINER="b8sc48s8s0c4w00008k808w8"

# Test results tracking
PASSED=0
FAILED=0
TEST_RESULTS=()

# Helper functions
log_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"

    if [ "$result" = "PASS" ]; then
        echo "✅ $test_name"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $test_name"
        echo "   Details: $details"
        FAILED=$((FAILED + 1))
    fi

    TEST_RESULTS+=("$test_name|$result|$details")
}

check_service_health() {
    echo ""
    echo "🏥 Testing Service Health..."

    # Test enhanced WhatsApp API health
    local api_health=$(curl -s "$WHATSAPP_API/health" | jq -r '.success // false')
    if [ "$api_health" = "true" ]; then
        log_test "Enhanced WhatsApp API Health" "PASS" "API responding correctly"
    else
        log_test "Enhanced WhatsApp API Health" "FAIL" "API health check failed"
    fi

    # Test backend WhatsApp proxy
    local proxy_health=$(curl -s "$API_BASE/whatsapp/health" -H "Host: primamobil.id" | jq -r '.success // false')
    if [ "$proxy_health" = "true" ]; then
        log_test "Backend WhatsApp Proxy Health" "PASS" "Proxy responding correctly"
    else
        log_test "Backend WhatsApp Proxy Health" "FAIL" "Proxy health check failed"
    fi

    # Test enhanced status endpoint
    local status_health=$(curl -s "$API_BASE/whatsapp/status" -H "Host: primamobil.id" | jq -r '.success // false')
    if [ "$status_health" = "true" ]; then
        log_test "Enhanced Status Endpoint" "PASS" "Status endpoint working"
    else
        log_test "Enhanced Status Endpoint" "FAIL" "Status endpoint not responding"
    fi
}

test_connection_management() {
    echo ""
    echo "🔗 Testing Connection Management..."

    # Test concurrent pairing prevention
    echo "  Testing concurrent pairing prevention..."

    # Start first pairing request
    local pairing1=$(curl -s "$API_BASE/whatsapp/pair" -H "Host: primamobil.id" &)

    # Wait a moment then start second pairing request
    sleep 1
    local pairing2=$(curl -s "$API_BASE/whatsapp/pair" -H "Host: primamobil.id" &)

    # Wait for both to complete
    wait

    # Check if second request was properly rejected
    local second_result=$(echo "$pairing2" | jq -r '.success // false')
    if [ "$second_result" = "false" ]; then
        local error_code=$(echo "$pairing2" | jq -r '.error.code // "unknown"')
        if [ "$error_code" = "PAIRING_IN_PROGRESS" ]; then
            log_test "Concurrent Pairing Prevention" "PASS" "Second request properly rejected"
        else
            log_test "Concurrent Pairing Prevention" "FAIL" "Unexpected error code: $error_code"
        fi
    else
        log_test "Concurrent Pairing Prevention" "FAIL" "Second request should have been rejected"
    fi

    # Clean up pairing state
    curl -X POST -s "$API_BASE/whatsapp/reset" -H "Host: primamobil.id" > /dev/null
}

test_rate_limiting() {
    echo ""
    echo "⏱️ Testing Rate Limiting..."

    local success_count=0
    local rate_limited=0

    # Send multiple rapid requests
    for i in {1..5}; do
        local response=$(curl -s "$API_BASE/whatsapp/pair" -H "Host: primamobil.id" -w "HTTPSTATUS:%{http_code}")
        local http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
        local body=$(echo "$response" | sed -E 's/HTTPSTATUS:[0-9]*$//')

        if [ "$http_code" = "200" ]; then
            success_count=$((success_count + 1))
        elif [ "$http_code" = "429" ]; then
            rate_limited=$((rate_limited + 1))
        fi
    done

    if [ $rate_limited -gt 0 ]; then
        log_test "Rate Limiting" "PASS" "$rate_limited requests properly rate limited"
    else
        log_test "Rate Limiting" "FAIL" "No requests were rate limited"
    fi

    # Clean up
    curl -X POST -s "$API_BASE/whatsapp/reset" -H "Host: primamobil.id" > /dev/null
}

test_error_handling() {
    echo ""
    echo "⚠️ Testing Error Handling..."

    # Test invalid tenant
    local invalid_tenant=$(curl -s "$API_BASE/whatsapp/health" -H "Host: invalid-tenant.example.com" | jq -r '.success // false')
    if [ "$invalid_tenant" = "false" ]; then
        log_test "Invalid Tenant Handling" "PASS" "Invalid tenant properly rejected"
    else
        log_test "Invalid Tenant Handling" "FAIL" "Invalid tenant should be rejected"
    fi

    # Test malformed requests
    local malformed=$(curl -s -X POST "$API_BASE/whatsapp/pair" -H "Host: primamobil.id" -d "invalid-json" | jq -r '.success // false')
    if [ "$malformed" = "false" ]; then
        log_test "Malformed Request Handling" "PASS" "Malformed requests properly rejected"
    else
        log_test "Malformed Request Handling" "FAIL" "Malformed requests should be rejected"
    fi
}

test_session_management() {
    echo ""
    echo "🔄 Testing Session Management..."

    # Get initial status
    local initial_status=$(curl -s "$API_BASE/whatsapp/status" -H "Host: primamobil.id")
    local initial_sessions=$(echo "$initial_status" | jq -r '.data.service.manager.active_sessions // 0')

    # Test pairing session tracking
    echo "  Testing session tracking..."

    # Start pairing and check if session is tracked
    timeout 10s curl -s "$API_BASE/whatsapp/pair" -H "Host: primamobil.id" > /dev/null &
    sleep 2

    local pairing_status=$(curl -s "$API_BASE/whatsapp/status" -H "Host: primamobil.id")
    local is_pairing=$(echo "$pairing_status" | jq -r '.data.service.manager.isPairing // false')

    if [ "$is_pairing" = "true" ]; then
        log_test "Pairing Session Tracking" "PASS" "Pairing state properly tracked"
    else
        log_test "Pairing Session Tracking" "FAIL" "Pairing state not tracked"
    fi

    # Test session cleanup
    curl -X POST -s "$API_BASE/whatsapp/reset" -H "Host: primamobil.id" > /dev/null
    sleep 2

    local reset_status=$(curl -s "$API_BASE/whatsapp/status" -H "Host: primamobil.id")
    local reset_is_pairing=$(echo "$reset_status" | jq -r '.data.service.manager.isPairing // false')

    if [ "$reset_is_pairing" = "false" ]; then
        log_test "Session Cleanup" "PASS" "Sessions properly cleaned up"
    else
        log_test "Session Cleanup" "FAIL" "Sessions not properly cleaned up"
    fi
}

test_enhanced_features() {
    echo ""
    echo "🚀 Testing Enhanced Features..."

    # Test enhanced health endpoint
    local enhanced_health=$(curl -s "$WHATSAPP_API/health")
    local has_enhanced_fields=$(echo "$enhanced_health" | jq -r '.data.pairing_active // "missing"')

    if [ "$has_enhanced_fields" != "missing" ]; then
        log_test "Enhanced Health Fields" "PASS" "Enhanced health fields present"
    else
        log_test "Enhanced Health Fields" "FAIL" "Enhanced health fields missing"
    fi

    # Test enhanced status endpoint
    local enhanced_status=$(curl -s "$API_BASE/whatsapp/status" -H "Host: primamobil.id")
    local has_service_state=$(echo "$enhanced_status" | jq -r '.data.service // "missing"')

    if [ "$has_service_state" != "missing" ]; then
        log_test "Enhanced Status Fields" "PASS" "Enhanced status fields present"
    else
        log_test "Enhanced Status Fields" "FAIL" "Enhanced status fields missing"
    fi
}

performance_test() {
    echo ""
    echo "⚡ Performance Testing..."

    local start_time=$(date +%s%N)

    # Test 10 consecutive pairing requests
    for i in {1..10}; do
        curl -s "$API_BASE/whatsapp/status" -H "Host: primamobil.id" > /dev/null
    done

    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds

    if [ $duration -lt 5000 ]; then # Less than 5 seconds
        log_test "API Response Time" "PASS" "${duration}ms for 10 requests"
    else
        log_test "API Response Time" "FAIL" "${duration}ms for 10 requests (too slow)"
    fi
}

generate_report() {
    echo ""
    echo "📊 Test Results Summary"
    echo "======================="
    echo ""
    echo "Total Tests: $((PASSED + FAILED))"
    echo "Passed: $PASSED"
    echo "Failed: $FAILED"
    echo ""

    if [ $FAILED -eq 0 ]; then
        echo "🎉 All tests passed! Enhanced WhatsApp pairing system is working correctly."
        return 0
    else
        echo "⚠️ Some tests failed. Please review the details above."
        echo ""
        echo "Failed Tests:"
        for result in "${TEST_RESULTS[@]}"; do
            IFS='|' read -r name status details <<< "$result"
            if [ "$status" = "FAIL" ]; then
                echo "  - $name: $details"
            fi
        done
        return 1
    fi
}

# Main test execution
echo "Starting comprehensive testing of Enhanced WhatsApp Pairing System..."
echo ""

check_service_health
test_connection_management
test_rate_limiting
test_error_handling
test_session_management
test_enhanced_features
performance_test

# Generate final report
echo ""
generate_report

exit $([ $FAILED -eq 0 ] && echo 0 || echo 1)