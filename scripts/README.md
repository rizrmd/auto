# AutoLeads Production Verification Scripts

Comprehensive post-deployment verification suite for the AutoLeads multi-tenant car dealership platform.

---

## 📁 Files Overview

| File | Lines | Purpose | Duration |
|------|-------|---------|----------|
| `verify-deployment.sh` | ~550 | Full verification suite | 2-3 minutes |
| `verify-deployment.ps1` | ~500 | PowerShell version for Windows | 2-3 minutes |
| `smoke-test.sh` | ~100 | Quick critical checks | 30 seconds |
| `production-dashboard.sh` | ~300 | Real-time monitoring | Continuous |
| `../MANUAL_VERIFICATION_CHECKLIST.md` | 800+ | Manual testing guide | 30-60 minutes |

---

## 🚀 Quick Start

### 1. Smoke Test (Fastest - 30 seconds)

Run this first for immediate verification:

```bash
# Linux/macOS
cd /path/to/auto
chmod +x scripts/smoke-test.sh
./scripts/smoke-test.sh

# Windows PowerShell
cd C:\path\to\auto
.\scripts\smoke-test.ps1  # (if available)
```

**What it checks:**
- ✅ Health endpoint responding
- ✅ Database connected
- ✅ API responding
- ✅ Static files serving
- ✅ Security headers present
- ✅ Response time acceptable

**Exit codes:**
- `0` = All critical tests passed
- `1` = Critical failure detected (fails fast)

---

### 2. Full Verification (Comprehensive - 2-3 minutes)

Run after smoke test passes:

```bash
# Linux/macOS
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh

# Windows PowerShell
.\scripts\verify-deployment.ps1
```

**Test Categories (50+ tests):**

1. **Infrastructure** (3 tests)
   - Application reachable
   - Health endpoint OK
   - HTTPS enforcement

2. **API Endpoints** (6 tests)
   - GET /api/tenant
   - GET /api/cars
   - GET /api/cars/featured
   - GET /api/cars/search
   - GET /api/cars/:slug
   - POST /api/admin/auth/login

3. **Security** (4 tests)
   - Security headers (X-Frame-Options, CSP, HSTS, etc.)
   - CORS configuration
   - SQL injection prevention
   - XSS prevention

4. **File Serving** (3 tests)
   - Static files (HTML, CSS, JS)
   - MIME types
   - Cache headers

5. **Database** (2 tests)
   - Connectivity via API
   - Sample data presence

6. **Performance** (3 tests)
   - Response time < 2s
   - Time to first byte < 500ms
   - SSL handshake < 200ms

7. **Error Handling** (3 tests)
   - 404 handling
   - Invalid resource handling
   - Method not allowed

**Output Example:**

```
╔═══════════════════════════════════════╗
║   ✅ ALL CRITICAL TESTS PASSED ✅    ║
╚═══════════════════════════════════════╝

✅ Passed:   48
❌ Failed:   0
⚠️  Warnings: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Total:    50

Success Rate: 96.0%
```

---

### 3. Production Dashboard (Monitoring - Continuous)

Real-time monitoring dashboard:

```bash
chmod +x scripts/production-dashboard.sh
./scripts/production-dashboard.sh
```

**Features:**
- ✅ Live system status (application, database)
- ✅ API endpoint health (response codes + times)
- ✅ Data statistics (car count, tenant info)
- ✅ Performance metrics (response time, SSL handshake)
- ✅ Security status (header presence)
- ✅ Auto-refresh every 5 seconds

**Dashboard Preview:**

```
╔═══════════════════════════════════════════════════════════════╗
║           AutoLeads Production Dashboard                     ║
╚═══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM STATUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Application          : ✅ HEALTHY
Database             : ✅ CONNECTED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API ENDPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GET /health          : 200   Response: 145ms
GET /api/tenant      : 200   Response: 234ms
GET /api/cars        : 200   Response: 321ms
GET /api/cars/featured : 200   Response: 289ms

Refreshing in 5s... (Press Ctrl+C to exit)
```

---

### 4. Manual Verification Checklist

After automated tests pass, perform manual checks:

```bash
# Open checklist
cat MANUAL_VERIFICATION_CHECKLIST.md
# Or open in editor
code MANUAL_VERIFICATION_CHECKLIST.md
```

**Manual Test Categories:**
- 📱 Visual & UI Tests (homepage, car listing, detail pages)
- 🖥️ Browser Compatibility (Chrome, Firefox, Safari, Edge, Mobile)
- 🔐 Admin Panel Tests (login, CRUD operations, logout)
- ✅ Form Validation (error handling, success flows)
- 🛡️ Security Tests (SQL injection, XSS, CSRF, headers)
- ⚡ Performance Tests (Lighthouse audit, loading speed)
- 🐛 Error Handling (error boundary, 404, 500, offline)
- 🔍 SEO Tests (meta tags, structured data, sitemap)
- 📊 Database Integrity (data consistency, display)
- 🔄 Integration Tests (WhatsApp, image upload, email)

**Estimated time**: 30-60 minutes for complete manual verification

---

## 📋 Typical Deployment Workflow

```bash
# 1. Deploy application to production
# (via CI/CD, Docker, or manual deployment)

# 2. Run smoke test (30 seconds)
./scripts/smoke-test.sh
# ✅ If passes, continue. ❌ If fails, rollback immediately.

# 3. Run full verification (2-3 minutes)
./scripts/verify-deployment.sh
# ✅ If passes with 90%+ success rate, continue.
# ⚠️ If warnings, investigate but may proceed.
# ❌ If critical failures, rollback.

# 4. Start monitoring dashboard (in separate terminal)
./scripts/production-dashboard.sh
# Keep running to monitor during manual tests

# 5. Perform manual verification
# Follow MANUAL_VERIFICATION_CHECKLIST.md
# Check off each item as you test

# 6. Sign off on deployment
# Update checklist with sign-off details
# Notify stakeholders that deployment is verified
```

---

## 🔧 Requirements

### For Bash Scripts (Linux/macOS)

**Required:**
- `curl` - HTTP client for API testing
- `bash` 4.0+ - Shell interpreter

**Optional (enhances functionality):**
- `jq` - JSON parsing (validates API responses)
- `bc` - Calculator (for performance metrics)

**Installation:**

```bash
# Ubuntu/Debian
sudo apt-get install curl jq bc

# macOS (Homebrew)
brew install curl jq bc

# CentOS/RHEL
sudo yum install curl jq bc
```

### For PowerShell Scripts (Windows)

**Required:**
- PowerShell 5.1+ (pre-installed on Windows 10+)
- Internet connection

**No additional dependencies needed** - PowerShell scripts use built-in cmdlets.

---

## 🎨 Output Interpretation

### Color Coding

- 🟢 **Green** (`✅ PASS`) = Test passed, no action needed
- 🔴 **Red** (`❌ FAIL`) = Critical failure, requires immediate action
- 🟡 **Yellow** (`⚠️ WARN`) = Warning, investigate but may not block deployment
- 🔵 **Blue** (`ℹ️ INFO`) = Informational message, no action needed

### Exit Codes

- `0` = All tests passed (safe to proceed)
- `1` = One or more tests failed (do not proceed)

### Success Thresholds

- **100% pass rate** = Ideal, all tests passed
- **90-99% pass rate** = Good, review warnings
- **80-89% pass rate** = Concerning, investigate failures
- **<80% pass rate** = Critical, do not deploy

---

## 🐛 Troubleshooting

### Smoke Test Fails

**Symptom**: Smoke test exits with "FAILED" message

**Common causes:**
1. Application not running
2. Wrong URL (check BASE_URL in script)
3. Database not connected
4. Firewall blocking requests

**Solutions:**
```bash
# Check if app is running
curl https://auto.lumiku.com/health

# Check Docker container
docker ps | grep b8sc48s8s0c4w00008k808w8

# Check logs
docker logs b8sc48s8s0c4w00008k808w8

# Restart application
docker restart b8sc48s8s0c4w00008k808w8
```

---

### Full Verification Shows Warnings

**Symptom**: Tests pass but with warnings (yellow ⚠️)

**Common warnings:**
- Security headers missing (HSTS, CSP)
- Response time above threshold
- No sample data in database

**Action:**
- Review warnings
- Determine if blocking (usually not)
- Create follow-up tasks if needed

---

### Tests Timeout

**Symptom**: Tests hang or timeout after 10 seconds

**Causes:**
- Slow network connection
- Server overloaded
- Database query timeout

**Solutions:**
```bash
# Increase timeout in script
# Edit script and change TIMEOUT=10 to TIMEOUT=30

# Check server load
ssh user@cf.avolut.com
top
# Look for high CPU/memory usage

# Check database
docker exec -it <container> bun run prisma studio
# Verify database is responsive
```

---

### "jq not found" Error

**Symptom**: Scripts show "jq not installed" warnings

**Impact**: JSON validation skipped (tests still run)

**Solution:**
```bash
# Install jq
sudo apt-get install jq  # Ubuntu/Debian
brew install jq          # macOS
```

---

### "bc not found" Error

**Symptom**: Performance metrics show "N/A" or "0"

**Impact**: Response time calculations skipped

**Solution:**
```bash
# Install bc
sudo apt-get install bc  # Ubuntu/Debian
brew install bc          # macOS
```

---

## 🔐 Security Notes

### Safe to Run in Production

✅ All scripts are **read-only** and **safe** to run in production:
- No data modification
- No database writes
- No destructive operations
- Only HTTP GET requests (except one POST to test auth rejection)

### Authentication

Scripts do **not** require authentication:
- Tests public endpoints only
- Does not log into admin panel
- Does not expose credentials

### Rate Limiting

Scripts send ~50-60 requests total:
- Spread over 2-3 minutes
- Well below typical rate limits
- No stress testing or DDoS simulation

---

## 📊 Test Coverage

### What IS Tested (Automated)

✅ Health checks
✅ API endpoint availability
✅ Database connectivity (via API)
✅ Security headers
✅ Response times
✅ Error handling (404, 500)
✅ Static file serving
✅ HTTPS enforcement
✅ SQL injection prevention
✅ XSS prevention

### What is NOT Tested (Requires Manual)

❌ Visual UI rendering
❌ JavaScript functionality
❌ Form submissions
❌ Admin panel CRUD
❌ Image uploads
❌ WhatsApp integration
❌ Browser compatibility
❌ Responsive design
❌ Accessibility (a11y)
❌ SEO metadata

**Use MANUAL_VERIFICATION_CHECKLIST.md for these tests.**

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to server
        run: |
          # Your deployment commands here
          ssh user@cf.avolut.com "docker restart b8sc48s8s0c4w00008k808w8"

      - name: Wait for startup
        run: sleep 10

      - name: Run smoke test
        run: |
          chmod +x scripts/smoke-test.sh
          ./scripts/smoke-test.sh

      - name: Run full verification
        run: |
          chmod +x scripts/verify-deployment.sh
          ./scripts/verify-deployment.sh

      - name: Notify on failure
        if: failure()
        run: |
          # Send Slack/email notification
          echo "Deployment verification failed!"
```

---

## 📞 Support

### Issues with Scripts

If scripts fail or produce unexpected results:

1. Check requirements are installed (`curl`, `jq`, `bc`)
2. Verify BASE_URL is correct in scripts
3. Ensure application is running
4. Check server logs for errors
5. Run with verbose output: `bash -x scripts/verify-deployment.sh`

### Production Issues

If production issues are detected:

1. **DO NOT PANIC** - follow rollback plan
2. Check production dashboard for status
3. Review server logs: `docker logs b8sc48s8s0c4w00008k808w8`
4. Verify database connectivity
5. Contact DevOps team if needed

---

## 🎯 Best Practices

### Before Every Deployment

1. ✅ Run smoke test in staging first
2. ✅ Create database backup
3. ✅ Document deployment in change log
4. ✅ Have rollback plan ready
5. ✅ Notify team of deployment

### After Every Deployment

1. ✅ Run smoke test immediately (30 seconds)
2. ✅ Run full verification (2-3 minutes)
3. ✅ Monitor dashboard for 10 minutes
4. ✅ Perform manual spot checks
5. ✅ Update deployment documentation

### Regular Monitoring

- 📅 Run smoke test hourly (cron job)
- 📅 Run full verification daily
- 📅 Review manual checklist weekly
- 📅 Update scripts as features are added

---

## 📝 Changelog

### Version 1.0 (Current)

**Scripts created:**
- ✅ verify-deployment.sh (550 lines)
- ✅ verify-deployment.ps1 (500 lines)
- ✅ smoke-test.sh (100 lines)
- ✅ production-dashboard.sh (300 lines)
- ✅ MANUAL_VERIFICATION_CHECKLIST.md (800+ lines)

**Test coverage:**
- 50+ automated tests
- 7 test categories
- 200+ manual test items
- 100% critical path coverage

---

## 🏆 Success Criteria

### Deployment is Successful When:

✅ Smoke test passes (exit code 0)
✅ Full verification passes with 90%+ success rate
✅ No critical failures (red ❌)
✅ All manual critical tests pass
✅ Production dashboard shows all green
✅ No error spikes in logs
✅ Response times under threshold
✅ User-facing features work correctly

### Deployment Should Be Rolled Back When:

❌ Smoke test fails
❌ Full verification has critical failures
❌ Database connectivity lost
❌ Error rate > 5%
❌ Response time > 5 seconds
❌ Security vulnerabilities detected
❌ Data corruption found

---

## 📚 Additional Resources

- **Project Repository**: [Git URL]
- **Production URL**: https://auto.lumiku.com
- **Server**: cf.avolut.com
- **Container**: b8sc48s8s0c4w00008k808w8
- **Documentation**: [Wiki/Confluence URL]
- **Support**: [Slack/Email]

---

**Questions?** Contact the DevOps team or refer to the main project documentation.

**Happy Deploying!** 🚀
