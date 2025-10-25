#######################################################################
# AutoLeads Production Deployment Verification Script (PowerShell)
#
# Tests all critical functionality after deployment
# Exit Code: 0 = All tests passed, 1 = Some tests failed
#
# Usage: .\scripts\verify-deployment.ps1
#######################################################################

# Configuration
$BaseUrl = "https://auto.lumiku.com"
$Passed = 0
$Failed = 0
$Warnings = 0
$Timeout = 10

# Performance thresholds
$MaxResponseTime = 2000  # 2 seconds in milliseconds
$MaxTtfb = 500          # 500ms time to first byte

#######################################################################
# Helper Functions
#######################################################################

function Test-Pass {
    param([string]$Message)
    Write-Host "✅ PASS: $Message" -ForegroundColor Green
    $script:Passed++
}

function Test-Fail {
    param([string]$Message)
    Write-Host "❌ FAIL: $Message" -ForegroundColor Red
    $script:Failed++
}

function Test-Warn {
    param([string]$Message)
    Write-Host "⚠️  WARN: $Message" -ForegroundColor Yellow
    $script:Warnings++
}

function Test-Info {
    param([string]$Message)
    Write-Host "ℹ️  INFO: $Message" -ForegroundColor Cyan
}

function Section-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $Title -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

# HTTP GET request with error handling
function Invoke-HttpGet {
    param(
        [string]$Url,
        [hashtable]$Headers = @{}
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -Headers $Headers -TimeoutSec $Timeout -UseBasicParsing
        return $response
    }
    catch {
        return $_.Exception.Response
    }
}

# Get HTTP status code
function Get-StatusCode {
    param([string]$Url, [hashtable]$Headers = @{})

    try {
        $response = Invoke-WebRequest -Uri $Url -Method Get -Headers $Headers -TimeoutSec $Timeout -UseBasicParsing
        return $response.StatusCode
    }
    catch {
        if ($_.Exception.Response) {
            return [int]$_.Exception.Response.StatusCode
        }
        return 0
    }
}

# Get JSON response
function Get-JsonResponse {
    param([string]$Url)

    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec $Timeout
        return $response
    }
    catch {
        return $null
    }
}

# Measure response time
function Measure-ResponseTime {
    param([string]$Url)

    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $null = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec $Timeout -UseBasicParsing
        $stopwatch.Stop()
        return $stopwatch.ElapsedMilliseconds
    }
    catch {
        $stopwatch.Stop()
        return $stopwatch.ElapsedMilliseconds
    }
}

#######################################################################
# Main Script
#######################################################################

Clear-Host

Write-Host @"
    _         _       _                    _
   / \  _   _| |_ ___| |    ___  __ _  __| |___
  / _ \| | | | __/ _ \ |   / _ \/ _\` |/ _\` / __|
 / ___ \ |_| | || (_) | |__|  __/ (_| | (_| \__ \
/_/   \_\__,_|\__\___/|_____\___|\__,_|\__,_|___/

Production Deployment Verification
"@ -ForegroundColor Cyan

Write-Host "=========================================="
Write-Host "Target: $BaseUrl"
Write-Host "Started: $(Get-Date)"
Write-Host "=========================================="

#######################################################################
# Test 1: Infrastructure Tests
#######################################################################

Section-Header "1. INFRASTRUCTURE TESTS"

# Test 1.1: Application is reachable
Test-Info "Testing if application is reachable..."
$appCode = Get-StatusCode -Url $BaseUrl
if ($appCode -in @(200, 301, 302)) {
    Test-Pass "Application is reachable (HTTP $appCode)"
}
else {
    Test-Fail "Application not reachable (HTTP $appCode)"
}

# Test 1.2: Health endpoint
Test-Info "Testing health endpoint..."
$healthCode = Get-StatusCode -Url "$BaseUrl/health"

if ($healthCode -eq 200) {
    Test-Pass "Health endpoint responds (HTTP 200)"

    $healthResponse = Get-JsonResponse -Url "$BaseUrl/health"
    if ($healthResponse) {
        Test-Pass "Health endpoint returns valid JSON"

        if ($healthResponse.status -eq "ok") {
            Test-Pass "Health status is 'ok'"
        }
        else {
            Test-Warn "Health status is '$($healthResponse.status)' (expected 'ok')"
        }
    }
    else {
        Test-Fail "Health endpoint returns invalid JSON"
    }
}
else {
    Test-Fail "Health endpoint not responding (HTTP $healthCode)"
}

# Test 1.3: HTTPS enforcement
Test-Info "Testing HTTPS enforcement..."
$httpCode = Get-StatusCode -Url "http://auto.lumiku.com"
if ($httpCode -in @(301, 302, 308)) {
    Test-Pass "HTTP redirects to HTTPS (HTTP $httpCode)"
}
else {
    Test-Warn "HTTP does not redirect to HTTPS (HTTP $httpCode)"
}

#######################################################################
# Test 2: API Endpoint Tests
#######################################################################

Section-Header "2. API ENDPOINT TESTS"

# Test 2.1: GET /api/tenant
Test-Info "Testing GET /api/tenant..."
$tenantCode = Get-StatusCode -Url "$BaseUrl/api/tenant"
if ($tenantCode -eq 200) {
    Test-Pass "GET /api/tenant responds (HTTP 200)"

    $tenantResponse = Get-JsonResponse -Url "$BaseUrl/api/tenant"
    if ($tenantResponse -and $tenantResponse.name) {
        Test-Pass "Tenant data includes name: '$($tenantResponse.name)'"
    }
}
else {
    Test-Fail "GET /api/tenant failed (HTTP $tenantCode)"
}

# Test 2.2: GET /api/cars
Test-Info "Testing GET /api/cars..."
$carsCode = Get-StatusCode -Url "$BaseUrl/api/cars"
if ($carsCode -eq 200) {
    Test-Pass "GET /api/cars responds (HTTP 200)"

    $carsResponse = Get-JsonResponse -Url "$BaseUrl/api/cars"
    if ($carsResponse -and $carsResponse.data) {
        $carCount = $carsResponse.data.Count
        Test-Info "Found $carCount cars"
        if ($carCount -gt 0) {
            Test-Pass "Cars data is not empty"
        }
        else {
            Test-Warn "No cars found in database"
        }
    }
}
else {
    Test-Fail "GET /api/cars failed (HTTP $carsCode)"
}

# Test 2.3: GET /api/cars/featured
Test-Info "Testing GET /api/cars/featured..."
$featuredCode = Get-StatusCode -Url "$BaseUrl/api/cars/featured"
if ($featuredCode -eq 200) {
    Test-Pass "GET /api/cars/featured responds (HTTP 200)"
}
else {
    Test-Fail "GET /api/cars/featured failed (HTTP $featuredCode)"
}

# Test 2.4: GET /api/cars/search
Test-Info "Testing GET /api/cars/search..."
$searchCode = Get-StatusCode -Url "$BaseUrl/api/cars/search?q=toyota"
if ($searchCode -eq 200) {
    Test-Pass "GET /api/cars/search responds (HTTP 200)"
}
else {
    Test-Fail "GET /api/cars/search failed (HTTP $searchCode)"
}

# Test 2.5: GET /api/cars/:slug
Test-Info "Testing GET /api/cars/:slug..."
$carsData = Get-JsonResponse -Url "$BaseUrl/api/cars"
if ($carsData -and $carsData.data -and $carsData.data.Count -gt 0) {
    $firstSlug = $carsData.data[0].slug
    if ($firstSlug) {
        $slugCode = Get-StatusCode -Url "$BaseUrl/api/cars/$firstSlug"
        if ($slugCode -eq 200) {
            Test-Pass "GET /api/cars/:slug responds (HTTP 200) for slug: $firstSlug"
        }
        else {
            Test-Fail "GET /api/cars/:slug failed (HTTP $slugCode)"
        }
    }
    else {
        Test-Warn "Cannot test /api/cars/:slug - no slug available"
    }
}
else {
    Test-Warn "Cannot test /api/cars/:slug - no cars available"
}

# Test 2.6: POST /api/admin/auth/login (should fail without credentials)
Test-Info "Testing POST /api/admin/auth/login (without credentials)..."
try {
    $loginResponse = Invoke-WebRequest -Uri "$BaseUrl/api/admin/auth/login" -Method Post -Body "{}" -ContentType "application/json" -TimeoutSec $Timeout -UseBasicParsing
    $loginCode = $loginResponse.StatusCode
}
catch {
    if ($_.Exception.Response) {
        $loginCode = [int]$_.Exception.Response.StatusCode
    }
    else {
        $loginCode = 0
    }
}

if ($loginCode -in @(400, 401, 422)) {
    Test-Pass "POST /api/admin/auth/login rejects invalid request (HTTP $loginCode)"
}
else {
    Test-Fail "POST /api/admin/auth/login unexpected response (HTTP $loginCode)"
}

#######################################################################
# Test 3: Security Tests
#######################################################################

Section-Header "3. SECURITY TESTS"

# Test 3.1: Security Headers
Test-Info "Testing security headers..."
try {
    $response = Invoke-WebRequest -Uri $BaseUrl -Method Get -TimeoutSec $Timeout -UseBasicParsing
    $headers = $response.Headers

    # X-Frame-Options
    if ($headers.ContainsKey("X-Frame-Options")) {
        Test-Pass "X-Frame-Options header present"
    }
    else {
        Test-Warn "X-Frame-Options header missing"
    }

    # X-Content-Type-Options
    if ($headers.ContainsKey("X-Content-Type-Options")) {
        Test-Pass "X-Content-Type-Options header present"
    }
    else {
        Test-Warn "X-Content-Type-Options header missing"
    }

    # Content-Security-Policy or X-XSS-Protection
    if ($headers.ContainsKey("Content-Security-Policy")) {
        Test-Pass "Content-Security-Policy header present"
    }
    elseif ($headers.ContainsKey("X-XSS-Protection")) {
        Test-Pass "X-XSS-Protection header present"
    }
    else {
        Test-Warn "No XSS protection headers found"
    }

    # HSTS
    if ($headers.ContainsKey("Strict-Transport-Security")) {
        Test-Pass "Strict-Transport-Security (HSTS) header present"
    }
    else {
        Test-Warn "HSTS header missing"
    }
}
catch {
    Test-Warn "Could not retrieve security headers"
}

# Test 3.2: CORS Headers
Test-Info "Testing CORS configuration..."
try {
    $corsHeaders = @{ "Origin" = "https://malicious-site.com" }
    $corsResponse = Invoke-WebRequest -Uri "$BaseUrl/api/tenant" -Method Get -Headers $corsHeaders -TimeoutSec $Timeout -UseBasicParsing

    if ($corsResponse.Headers.ContainsKey("Access-Control-Allow-Origin")) {
        $corsOrigin = $corsResponse.Headers["Access-Control-Allow-Origin"]
        if ($corsOrigin -eq "*") {
            Test-Warn "CORS allows all origins (*) - potential security risk"
        }
        else {
            Test-Pass "CORS is configured (Origin: $corsOrigin)"
        }
    }
    else {
        Test-Pass "CORS not allowing unauthorized origin"
    }
}
catch {
    Test-Pass "CORS not allowing unauthorized origin"
}

# Test 3.3: SQL Injection Prevention
Test-Info "Testing SQL injection prevention..."
$sqlCode = Get-StatusCode -Url "$BaseUrl/api/cars/search?q=%27%20OR%201=1--"
if ($sqlCode -in @(200, 400)) {
    Test-Pass "SQL injection attempt handled safely (HTTP $sqlCode)"
}
else {
    Test-Fail "SQL injection test unexpected response (HTTP $sqlCode)"
}

# Test 3.4: XSS Prevention
Test-Info "Testing XSS prevention..."
$xssCode = Get-StatusCode -Url "$BaseUrl/api/cars/search?q=%3Cscript%3Ealert%28%27xss%27%29%3C%2Fscript%3E"
if ($xssCode -in @(200, 400)) {
    Test-Pass "XSS attempt handled safely (HTTP $xssCode)"
}
else {
    Test-Fail "XSS test unexpected response (HTTP $xssCode)"
}

#######################################################################
# Test 4: File Serving Tests
#######################################################################

Section-Header "4. FILE SERVING TESTS"

# Test 4.1: Static files
Test-Info "Testing static file serving..."
try {
    $indexResponse = Invoke-WebRequest -Uri "$BaseUrl/" -Method Get -TimeoutSec $Timeout -UseBasicParsing
    if ($indexResponse.StatusCode -eq 200) {
        Test-Pass "Static files serve correctly (HTTP 200)"

        $contentType = $indexResponse.Headers["Content-Type"]
        if ($contentType -match "text/html") {
            Test-Pass "Correct MIME type for HTML (text/html)"
        }
        else {
            Test-Warn "Unexpected MIME type: $contentType"
        }
    }
}
catch {
    Test-Fail "Static files not serving"
}

# Test 4.2: Cache headers
Test-Info "Testing cache headers..."
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/" -Method Get -TimeoutSec $Timeout -UseBasicParsing
    if ($response.Headers.ContainsKey("Cache-Control")) {
        $cacheControl = $response.Headers["Cache-Control"]
        Test-Pass "Cache-Control header present: $cacheControl"
    }
    else {
        Test-Info "No cache headers found (may be intentional for HTML)"
    }
}
catch {
    Test-Info "Could not check cache headers"
}

# Test 4.3: Image serving
Test-Info "Testing image file serving..."
$imageCode = Get-StatusCode -Url "$BaseUrl/logo.svg"
if ($imageCode -eq 200) {
    Test-Pass "Image files serve correctly (HTTP 200)"
}
elseif ($imageCode -eq 404) {
    Test-Info "Logo not found at /logo.svg (expected if no logo uploaded)"
}
else {
    Test-Warn "Image serving test inconclusive (HTTP $imageCode)"
}

#######################################################################
# Test 5: Database Tests
#######################################################################

Section-Header "5. DATABASE TESTS"

# Test 5.1: Database connectivity
Test-Info "Testing database connectivity..."
if ($tenantCode -eq 200 -and $carsCode -eq 200) {
    Test-Pass "Database is connected and responding"
}
else {
    Test-Fail "Database connectivity issues detected"
}

# Test 5.2: Sample data exists
Test-Info "Testing sample data presence..."
$tenantData = Get-JsonResponse -Url "$BaseUrl/api/tenant"
$carsData = Get-JsonResponse -Url "$BaseUrl/api/cars"

if ($tenantData -and $tenantData.id) {
    Test-Pass "Tenant data exists in database"
}
else {
    Test-Fail "No tenant data found"
}

if ($carsData -and $carsData.data -and $carsData.data.Count -gt 0) {
    $count = $carsData.data.Count
    Test-Pass "Car inventory exists ($count cars)"
}
else {
    Test-Warn "No cars in inventory"
}

#######################################################################
# Test 6: Performance Tests
#######################################################################

Section-Header "6. PERFORMANCE TESTS"

# Test 6.1: Response time
Test-Info "Testing API response time..."
$responseTime = Measure-ResponseTime -Url "$BaseUrl/api/cars"
if ($responseTime -lt $MaxResponseTime) {
    Test-Pass "API response time: ${responseTime}ms (< ${MaxResponseTime}ms)"
}
else {
    Test-Warn "API response time: ${responseTime}ms (> ${MaxResponseTime}ms threshold)"
}

# Test 6.2: Home page load time
Test-Info "Testing home page load time..."
$homeTime = Measure-ResponseTime -Url $BaseUrl
if ($homeTime -lt 3000) {
    Test-Pass "Home page load time: ${homeTime}ms (< 3000ms)"
}
else {
    Test-Warn "Home page load time: ${homeTime}ms (> 3000ms)"
}

#######################################################################
# Test 7: Error Handling Tests
#######################################################################

Section-Header "7. ERROR HANDLING TESTS"

# Test 7.1: 404 handling
Test-Info "Testing 404 error handling..."
$notFoundCode = Get-StatusCode -Url "$BaseUrl/api/nonexistent-endpoint-12345"
if ($notFoundCode -eq 404) {
    Test-Pass "404 errors handled correctly (HTTP 404)"
}
else {
    Test-Warn "404 handling unexpected (HTTP $notFoundCode)"
}

# Test 7.2: Invalid car slug
Test-Info "Testing invalid resource handling..."
$invalidSlugCode = Get-StatusCode -Url "$BaseUrl/api/cars/nonexistent-car-slug-12345"
if ($invalidSlugCode -eq 404) {
    Test-Pass "Invalid resource returns 404"
}
else {
    Test-Info "Invalid resource returns HTTP $invalidSlugCode"
}

#######################################################################
# Summary
#######################################################################

Section-Header "VERIFICATION SUMMARY"

$Total = $Passed + $Failed + $Warnings

Write-Host "✅ Passed:   $Passed" -ForegroundColor Green
Write-Host "❌ Failed:   $Failed" -ForegroundColor Red
Write-Host "⚠️  Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "   Total:    $Total"
Write-Host ""

# Calculate success rate
if ($Total -gt 0) {
    $successRate = [math]::Round(($Passed / $Total) * 100, 1)
    Write-Host "Success Rate: $successRate%"
}

Write-Host ""
Write-Host "Completed: $(Get-Date)"
Write-Host "=========================================="

if ($Failed -eq 0) {
    Write-Host @"

╔═══════════════════════════════════════╗
║   ✅ ALL CRITICAL TESTS PASSED ✅    ║
╚═══════════════════════════════════════╝
"@ -ForegroundColor Green

    if ($Warnings -gt 0) {
        Write-Host "Note: $Warnings warning(s) detected - review recommended" -ForegroundColor Yellow
    }

    exit 0
}
else {
    Write-Host @"

╔═══════════════════════════════════════╗
║   ❌ SOME TESTS FAILED - FIX NOW ❌  ║
╚═══════════════════════════════════════╝
"@ -ForegroundColor Red

    Write-Host "Please review the failed tests above and fix issues before proceeding."
    exit 1
}
