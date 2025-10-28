# WhatsApp Web API v1.2.0 - Deployment Checklist

Use this checklist to ensure a smooth deployment of the new build-from-source approach.

## Pre-Deployment

### 1. Review Changes
- [ ] Read `BUILD_SUMMARY.md` - Executive overview
- [ ] Read `DOCKERFILE_CHANGES.md` - Understand what changed
- [ ] Review `Dockerfile` - Verify multi-stage build structure
- [ ] Understand rollback procedure (if needed)

### 2. Prepare Environment
- [ ] Docker installed and running
- [ ] Sufficient disk space (~2GB for build)
- [ ] Network access to GitHub (git clone)
- [ ] Network access to Go package registry (go mod download)

### 3. Backup Current Setup
```bash
# Backup current Dockerfile (if needed for rollback)
cp Dockerfile Dockerfile.v1.1.0.backup

# Note current image ID
docker images | grep autoleads
```

## Build Phase

### 1. Initial Build
```bash
cd C:\Users\yoppi\Downloads\Lumiku Auto\auto

# Start build (expect 3-5 minutes first time)
docker build -t autoleads:v1.2.0 .
```

**Expected Output**:
- [x] Builder stage completes without errors
- [x] Go modules download successfully
- [x] Binary compilation succeeds
- [x] Binary size shown (~20-25MB)
- [x] Runtime stage copies binary
- [x] Final image built successfully

**If build fails**: See "Troubleshooting" section at bottom

### 2. Verify Build
```bash
# Make verification script executable
chmod +x verify-whatsapp-build.sh

# Run verification
./verify-whatsapp-build.sh
```

**Expected Results**:
- [x] ✓ Binary exists at /usr/local/bin/whatsapp-web-api
- [x] ✓ Binary is executable (permissions: 755)
- [x] ✓ Binary size is reasonable: 20-25MB
- [x] ✓ Binary is ELF 64-bit
- [x] ✓ Binary is for AMD64 architecture
- [x] ✓ Binary is statically linked
- [x] ✓ Binary executes without immediate crash
- [x] ✓ PostgreSQL client is installed
- [x] ✓ Startup script references WhatsApp API binary

**All checks must pass before proceeding to testing!**

## Testing Phase

### 1. Local Container Test
```bash
# Run container locally
docker run -d --name wa-test \
  -p 3000:3000 \
  -p 8080:8080 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e APP_URL="http://localhost:3000" \
  autoleads:v1.2.0

# Check logs
docker logs wa-test -f
```

**Verify Startup**:
- [x] Container starts without errors
- [x] "Starting WhatsApp Web API on port 8080..." appears
- [x] "WhatsApp API started with PID: ..." appears
- [x] "Starting main AutoLeads application on port 3000..." appears
- [x] No error messages in logs

### 2. WhatsApp API Functionality Test
```bash
# Check if WhatsApp API is responding
curl http://localhost:8080/health || curl http://localhost:8080/

# Check WhatsApp API process
docker exec wa-test ps aux | grep whatsapp-web-api

# View WhatsApp API logs
docker exec wa-test cat /tmp/wa-service.log
```

**Verify Functionality**:
- [x] WhatsApp API endpoint responds
- [x] Process is running (not crashed)
- [x] Can access QR code endpoint (if configured)
- [x] No errors in wa-service.log

### 3. Main Application Test
```bash
# Check main app is responding
curl http://localhost:3000/

# Test health endpoint (if you have one)
curl http://localhost:3000/health
```

**Verify Application**:
- [x] Main app responds on port 3000
- [x] Database connection works
- [x] No errors in application logs

### 4. Integration Test
- [x] Generate WhatsApp QR code
- [x] Scan QR code with WhatsApp mobile
- [x] Send test message
- [x] Receive test message
- [x] Verify webhook receives events
- [x] Check database records created

### 5. Cleanup Test Container
```bash
# Stop and remove test container
docker stop wa-test
docker rm wa-test
```

## Staging Deployment

### 1. Tag Image
```bash
# Tag for staging deployment
docker tag autoleads:v1.2.0 autoleads:staging-v1.2.0
docker tag autoleads:v1.2.0 autoleads:latest
```

### 2. Push to Registry (if using)
```bash
# Replace with your registry
docker tag autoleads:v1.2.0 your-registry/autoleads:v1.2.0
docker push your-registry/autoleads:v1.2.0
```

### 3. Deploy to Staging
```bash
# Option 1: Docker Compose
docker-compose -f docker-compose.staging.yml up -d

# Option 2: Direct deployment
# (Your specific deployment command)
```

### 4. Staging Verification
- [x] Container starts successfully
- [x] All services healthy
- [x] WhatsApp API accessible
- [x] QR code generation works
- [x] Message sending works
- [x] Message receiving works
- [x] Webhooks functioning
- [x] Database operations normal
- [x] No errors in logs

### 5. Staging Monitoring (24-48 hours)
- [x] Check logs daily for errors
- [x] Monitor resource usage (CPU, memory)
- [x] Verify message delivery rates
- [x] Test all critical user flows
- [x] Verify webhook reliability

**If issues found**: Document and fix before production

## Production Deployment

### Pre-Production Checklist
- [x] All staging tests passed
- [x] 24-48 hours monitoring completed
- [x] No critical issues found
- [x] Rollback plan documented and understood
- [x] Maintenance window scheduled (optional)
- [x] Team notified of deployment
- [x] Monitoring alerts configured

### 1. Final Build for Production
```bash
# Build production image
docker build -t autoleads:v1.2.0-prod .

# Tag as production
docker tag autoleads:v1.2.0-prod autoleads:production
```

### 2. Push to Production Registry
```bash
# Push to production registry
docker tag autoleads:production your-registry/autoleads:production
docker push your-registry/autoleads:production
```

### 3. Deploy to Production
```bash
# Your production deployment command
# Example:
docker-compose -f docker-compose.prod.yml up -d

# Or Kubernetes:
kubectl set image deployment/autoleads autoleads=your-registry/autoleads:production
```

### 4. Post-Deployment Verification
**Immediate (0-5 minutes)**:
- [x] Container/pod started successfully
- [x] Health checks passing
- [x] WhatsApp API responding on port 8080
- [x] Main app responding on port 3000
- [x] No errors in startup logs

**Short-term (15-30 minutes)**:
- [x] Generate test QR code
- [x] Send test message
- [x] Verify webhook delivery
- [x] Check database writes
- [x] Monitor resource usage
- [x] Review application logs

**Medium-term (1-4 hours)**:
- [x] Monitor error rates
- [x] Check message delivery success rate
- [x] Verify all features functioning
- [x] Review user reports (if any)
- [x] Monitor system metrics

**Long-term (24-48 hours)**:
- [x] Daily log review
- [x] Performance comparison with v1.1.0
- [x] User feedback collection
- [x] System stability assessment

## Rollback Procedure

**If critical issues occur, execute rollback immediately:**

### Option 1: Revert to Previous Image
```bash
# If you have previous image
docker tag autoleads:v1.1.0 autoleads:latest
docker-compose up -d

# Or
kubectl rollout undo deployment/autoleads
```

### Option 2: Rebuild with v1.1.0 Dockerfile
```bash
# Restore backup Dockerfile
cp Dockerfile.v1.1.0.backup Dockerfile

# Rebuild
docker build -t autoleads:rollback .

# Deploy
docker-compose up -d
```

### Post-Rollback
- [x] Verify services restored
- [x] Document issue that caused rollback
- [x] Create bug report
- [x] Plan fix and redeployment

## Troubleshooting

### Build Fails

**Error: "fatal: unable to access 'https://github.com/...'"**
- **Cause**: Network issue or GitHub rate limiting
- **Fix**: Wait 5 minutes, retry. Check network connectivity.
- **Command**: `docker build --no-cache -t autoleads:v1.2.0 .`

**Error: "go: module ... not found"**
- **Cause**: Dependency resolution failure
- **Fix**: Verify v1.2.0 tag exists
- **Command**: `git ls-remote --tags https://github.com/rizrmd/whatsapp-web-api.git | grep v1.2.0`

**Error: Binary size > 50MB**
- **Cause**: Debug symbols not stripped
- **Fix**: Verify `-ldflags="-s -w"` in Dockerfile

### Runtime Fails

**Error: "/usr/local/bin/whatsapp-web-api: not found"**
- **Cause**: Binary not copied from builder
- **Fix**: Check COPY --from=whatsapp-builder line in Dockerfile

**Error: "error while loading shared libraries"**
- **Cause**: Not statically linked
- **Fix**: Verify CGO_ENABLED=0 in Dockerfile, rebuild

**WhatsApp API not starting**
- **Check**: `docker exec <container> cat /tmp/wa-service.log`
- **Common**: Missing DATABASE_URL environment variable

### Verification Fails

**If verification script fails**:
1. Review specific failed check
2. Check corresponding documentation section
3. Rebuild with `--no-cache` if needed
4. Verify prerequisites (Go version, network, etc.)

## Success Metrics

### Build Success
- [x] Build completes in <5 minutes
- [x] Binary size: 20-25MB
- [x] All verification checks pass
- [x] No build warnings or errors

### Deployment Success
- [x] Zero downtime deployment
- [x] All services start correctly
- [x] No increase in error rates
- [x] Performance comparable to v1.1.0
- [x] No user-reported issues

### Production Stability (7 days)
- [x] No crashes or restarts
- [x] Stable memory usage
- [x] Normal message delivery rates
- [x] Webhook reliability maintained
- [x] No rollback required

## Post-Deployment

### Documentation Updates
- [ ] Update deployment runbook
- [ ] Document any issues encountered
- [ ] Update monitoring dashboards
- [ ] Share success metrics with team

### Cleanup
- [ ] Remove old images: `docker image prune`
- [ ] Remove build artifacts
- [ ] Archive deployment logs
- [ ] Update version tracking

### Next Steps
- [ ] Schedule next version review
- [ ] Monitor for WhatsApp API updates
- [ ] Plan for v1.2.1+ (if released)
- [ ] Review and optimize build times

---

## Quick Reference

**Files**:
- `BUILD_SUMMARY.md` - Overview and technical details
- `DOCKERFILE_CHANGES.md` - What changed and why
- `README-WHATSAPP-BUILD.md` - Quick start guide
- `WHATSAPP_BUILD_GUIDE.md` - Complete technical guide
- `verify-whatsapp-build.sh` - Build verification script

**Commands**:
```bash
# Build
docker build -t autoleads:v1.2.0 .

# Verify
./verify-whatsapp-build.sh

# Test
docker run -d -p 3000:3000 -p 8080:8080 -e DATABASE_URL="..." autoleads:v1.2.0

# Deploy
docker-compose up -d
```

**Support**:
- Check logs: `docker logs <container>`
- WhatsApp API logs: `docker exec <container> cat /tmp/wa-service.log`
- Process check: `docker exec <container> ps aux | grep whatsapp`

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Production URL**: _____________
**Status**: ☐ Planning ☐ Building ☐ Testing ☐ Staging ☐ Production ☐ Verified
