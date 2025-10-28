# WhatsApp Web API v1.2.0 - Quick Reference Card

## One-Line Summary
Multi-stage Docker build for WhatsApp Web API v1.2.0 from source. 100% backward compatible. No deployment changes required.

## Quick Start (3 Commands)

```bash
# 1. Build
docker build -t autoleads:latest .

# 2. Verify
./verify-whatsapp-build.sh

# 3. Deploy (same as before)
docker-compose up -d
```

## What Changed?

| Aspect | v1.1.0 | v1.2.0 |
|--------|--------|--------|
| **Binary Source** | Pre-compiled download | Built from source |
| **Build Method** | Single-stage | Multi-stage |
| **Build Time** | 10 seconds | 3-5 minutes |
| **Binary Path** | `/usr/local/bin/whatsapp-web-api` | `/usr/local/bin/whatsapp-web-api` ✅ Same |
| **Environment** | No changes | No changes ✅ Same |
| **Startup** | No changes | No changes ✅ Same |
| **Deployment** | No changes | No changes ✅ Same |

## Key Features

✅ Statically-linked binary (works on any Linux)
✅ Production-optimized (stripped symbols)
✅ Security-hardened (build from verified source)
✅ Reproducible (git tag v1.2.0)
✅ Future-proof (upgradeable)

## File Guide

| File | Purpose | When to Read |
|------|---------|--------------|
| `README-WHATSAPP-BUILD.md` | Quick start | First time, need TL;DR |
| `BUILD_SUMMARY.md` | Executive summary | Understanding overview |
| `DOCKERFILE_CHANGES.md` | What changed | Understanding migration |
| `WHATSAPP_BUILD_GUIDE.md` | Technical deep dive | Troubleshooting, details |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment | During deployment |
| `verify-whatsapp-build.sh` | Build verification | After every build |

## Essential Commands

### Build
```bash
# Standard build
docker build -t autoleads:latest .

# Clean build (no cache)
docker build --no-cache -t autoleads:latest .

# Custom version
docker build --build-arg WHATSAPP_VERSION=v1.2.1 -t autoleads:latest .
```

### Verify
```bash
# Quick verification
./verify-whatsapp-build.sh

# Manual check
docker run --rm autoleads:latest /usr/local/bin/whatsapp-web-api --version
```

### Test
```bash
# Local test
docker run -d --name test \
  -p 3000:3000 -p 8080:8080 \
  -e DATABASE_URL="your_db_url" \
  autoleads:latest

# Check logs
docker logs test -f

# Check WhatsApp API
docker exec test cat /tmp/wa-service.log

# Cleanup
docker stop test && docker rm test
```

### Deploy
```bash
# Same as before - no changes!
docker-compose up -d

# Or direct run
docker run -d -p 3000:3000 -p 8080:8080 \
  -e DATABASE_URL="..." \
  -e APP_URL="..." \
  autoleads:latest
```

## Troubleshooting

| Problem | Quick Fix |
|---------|-----------|
| Build fails: network error | Wait 5 min, retry: `docker build --no-cache .` |
| Build fails: module not found | Check tag exists: `git ls-remote --tags https://github.com/rizrmd/whatsapp-web-api.git` |
| Binary not found | Verify builder succeeded: `docker build --target whatsapp-builder -t test .` |
| Binary crashes | Check logs: `docker exec <container> cat /tmp/wa-service.log` |
| Verification fails | Review specific check, rebuild with `--no-cache` |

## Rollback

If issues occur:

```bash
# Quick rollback to v1.1.0
# Edit Dockerfile - replace builder section with:
RUN wget https://github.com/rizrmd/whatsapp-web-api/releases/download/v1.1.0/whatsapp-web-api-linux-amd64.zip \
    && unzip whatsapp-web-api-linux-amd64.zip \
    && chmod +x whatsapp-web-api-linux-amd64 \
    && mv whatsapp-web-api-linux-amd64 /usr/local/bin/whatsapp-web-api \
    && rm whatsapp-web-api-linux-amd64.zip

# Rebuild and deploy
docker build -t autoleads:v1.1.0 .
docker-compose up -d
```

## Build Performance

| Scenario | Time |
|----------|------|
| First build (cold) | 3-5 min |
| Rebuild (cached) | 1-2 min |
| App change only | <1 min |

## Expected Binary

- **Size**: 20-25 MB
- **Type**: ELF 64-bit LSB executable
- **Linking**: statically linked
- **Location**: `/usr/local/bin/whatsapp-web-api`
- **Permissions**: 755 (executable)

## Verification Checklist

After build, expect:
- ✅ Binary exists at `/usr/local/bin/whatsapp-web-api`
- ✅ Binary is executable (755)
- ✅ Binary size ~20-25MB
- ✅ Binary is ELF 64-bit AMD64
- ✅ Binary is statically linked
- ✅ Container starts without errors
- ✅ WhatsApp API responds
- ✅ All 7 verification checks pass

## Support Resources

**Documentation**:
- Quick Start: `README-WHATSAPP-BUILD.md`
- Technical Guide: `WHATSAPP_BUILD_GUIDE.md`
- Change Summary: `DOCKERFILE_CHANGES.md`
- Deployment: `DEPLOYMENT_CHECKLIST.md`

**External**:
- Repository: https://github.com/rizrmd/whatsapp-web-api
- v1.2.0 Source: https://github.com/rizrmd/whatsapp-web-api/tree/v1.2.0
- Issues: https://github.com/rizrmd/whatsapp-web-api/issues

## Status

✅ **Production Ready**
- All deliverables complete
- Build process verified
- Documentation complete
- Backward compatible
- Security hardened
- Performance optimized

---

**Version**: WhatsApp Web API v1.2.0
**Build Method**: Multi-stage Docker build from source
**Compatibility**: 100% with v1.1.0 deployment
**Updated**: 2025-10-26
