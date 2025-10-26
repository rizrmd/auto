# WhatsApp Web API v1.2.0 - Build from Source Documentation

## Overview

This document details the production-ready multi-stage Docker build process for WhatsApp Web API v1.2.0, replacing the previous v1.1.0 pre-compiled binary approach.

## Problem Statement

- **Issue**: WhatsApp Web API v1.2.0 pre-compiled binaries not available on GitHub releases (404 error)
- **Solution**: Build from source code using multi-stage Dockerfile
- **Tag**: v1.2.0 source code available at https://github.com/rizrmd/whatsapp-web-api/tree/v1.2.0

## Build Architecture

### Stage 1: Builder (golang:1.24-bookworm)

**Purpose**: Compile WhatsApp Web API from source code

**Key Features**:
- Uses official Go 1.24 image (matches project requirement: Go 1.24.3+)
- Clones specific v1.2.0 tag from GitHub repository
- Downloads and verifies all Go module dependencies
- Produces statically-linked binary for maximum compatibility

**Build Optimizations**:

```dockerfile
CGO_ENABLED=0         # Disable CGO for static linking
GOOS=linux            # Target Linux operating system
GOARCH=amd64          # Target AMD64 architecture
-trimpath             # Remove file system paths from binary
-ldflags="-s -w -extldflags '-static'"
  -s                  # Strip symbol table (-5% size)
  -w                  # Strip DWARF debug info (-15% size)
  -extldflags         # Force static linking
```

**Expected Binary Size**: ~20-25 MB (optimized, stripped)

### Stage 2: Runtime (oven/bun:latest)

**Purpose**: Production runtime environment

**Key Features**:
- Copies only the compiled binary from builder stage
- Maintains identical path as v1.1.0: `/usr/local/bin/whatsapp-web-api`
- Includes PostgreSQL client for database operations
- Removes unnecessary build tools (wget, unzip) to reduce attack surface

## Production Optimizations

### 1. Static Linking
- **Benefit**: No runtime dependencies on system libraries
- **Result**: Binary runs on any Linux distribution (Alpine, Debian, Ubuntu, etc.)
- **Verification**: `file whatsapp-web-api` shows "statically linked"

### 2. Size Reduction
- **Symbol stripping**: Removes debugging symbols (-s -w flags)
- **Path trimming**: Removes build-time file paths
- **Multi-stage build**: Only binary copied to final image
- **Estimated savings**: 40-50% compared to debug build

### 3. Security Hardening
- **Minimal dependencies**: Only PostgreSQL client in runtime
- **No build tools**: Removed wget, unzip, git from final image
- **Reproducible builds**: Git tag ensures consistent source
- **Supply chain security**: Build from verified source, not third-party binaries

### 4. Build Caching
- **Docker layer caching**: Each RUN command creates cached layer
- **Go module caching**: `go mod download` cached separately
- **Incremental builds**: Only rebuilds if source code changes

## Backward Compatibility

The new build maintains 100% compatibility with v1.1.0 setup:

| Aspect | v1.1.0 (Pre-compiled) | v1.2.0 (Built from Source) | Compatible? |
|--------|----------------------|----------------------------|-------------|
| Binary path | `/usr/local/bin/whatsapp-web-api` | `/usr/local/bin/whatsapp-web-api` | ✅ Yes |
| Execution command | `whatsapp-web-api` | `whatsapp-web-api` | ✅ Yes |
| Environment variables | PORT, DATABASE_URL, WA_WEBHOOK_URL | PORT, DATABASE_URL, WA_WEBHOOK_URL | ✅ Yes |
| Runtime dependencies | PostgreSQL client | PostgreSQL client | ✅ Yes |
| Startup script | `/app/start-multi-services.sh` | `/app/start-multi-services.sh` | ✅ Yes |

**No changes required** to existing startup scripts, environment configuration, or deployment workflows.

## Build Process

### Automated Build (Docker)

```bash
# Build the entire application (includes WhatsApp API compilation)
cd /path/to/Lumiku Auto/auto
docker build -t autoleads:latest .

# The multi-stage build automatically:
# 1. Clones WhatsApp Web API v1.2.0 source
# 2. Downloads Go dependencies
# 3. Compiles statically-linked binary
# 4. Copies binary to runtime image
# 5. Builds main application
```

### Manual Verification

To verify the WhatsApp API binary was built correctly:

```bash
# Run container interactively
docker run -it --entrypoint /bin/bash autoleads:latest

# Inside container, verify binary
which whatsapp-web-api
# Expected: /usr/local/bin/whatsapp-web-api

file /usr/local/bin/whatsapp-web-api
# Expected: ELF 64-bit LSB executable, statically linked

ls -lh /usr/local/bin/whatsapp-web-api
# Expected: ~20-25 MB

# Test execution (should show help or version)
/usr/local/bin/whatsapp-web-api --version || echo "Binary ready"
```

## Build Arguments

The Dockerfile accepts build arguments for flexibility:

```dockerfile
ARG WHATSAPP_VERSION=v1.2.0
ARG REPO_URL=https://github.com/rizrmd/whatsapp-web-api.git
```

**Usage**:

```bash
# Build specific version
docker build --build-arg WHATSAPP_VERSION=v1.2.1 -t autoleads:latest .

# Build from fork
docker build --build-arg REPO_URL=https://github.com/yourfork/whatsapp-web-api.git -t autoleads:latest .
```

## Troubleshooting

### Build Failures

**Problem**: `fatal: unable to access 'https://github.com/...'`
- **Cause**: Network connectivity or GitHub API rate limiting
- **Solution**: Wait a few minutes and retry, or use GitHub personal access token

**Problem**: `go: module ... not found`
- **Cause**: Dependency resolution failure
- **Solution**: Check if v1.2.0 tag exists and go.mod is valid

**Problem**: Binary size unexpectedly large (>50 MB)
- **Cause**: Debug symbols not stripped or CGO enabled
- **Solution**: Verify CGO_ENABLED=0 and -ldflags="-s -w" are set

### Runtime Failures

**Problem**: `/usr/local/bin/whatsapp-web-api: not found`
- **Cause**: Binary not copied from builder stage
- **Solution**: Check COPY --from=whatsapp-builder command succeeded

**Problem**: `error while loading shared libraries`
- **Cause**: Binary not statically linked
- **Solution**: Rebuild with CGO_ENABLED=0

## Performance Benchmarks

### Build Times (Approximate)

| Stage | Cold Build | Cached Build |
|-------|-----------|--------------|
| Go module download | 30-60s | 5-10s (cached) |
| Binary compilation | 45-90s | 45-90s (source changed) |
| Total build overhead | +2-3 min | +1 min |

### Image Size Impact

| Component | Size |
|-----------|------|
| WhatsApp API binary (v1.1.0 pre-compiled) | ~18 MB |
| WhatsApp API binary (v1.2.0 built, stripped) | ~20-25 MB |
| Builder stage (not in final image) | ~1.2 GB |
| Final image size increase | <10 MB |

## Migration from v1.1.0 to v1.2.0

### What Changed
- ✅ Build process: Pre-compiled binary → Built from source
- ✅ Dockerfile: Single-stage → Multi-stage
- ❌ Binary path: No change (still `/usr/local/bin/whatsapp-web-api`)
- ❌ Startup process: No change
- ❌ Environment variables: No change
- ❌ API endpoints: No change

### Deployment Steps

1. **Update Dockerfile** (already completed)
2. **Rebuild Docker image**:
   ```bash
   docker build -t autoleads:v1.2.0 .
   ```
3. **Test locally** (optional):
   ```bash
   docker run -p 3000:3000 -p 8080:8080 -e DATABASE_URL="your_db_url" autoleads:v1.2.0
   ```
4. **Deploy to production**:
   ```bash
   docker tag autoleads:v1.2.0 autoleads:latest
   # Push to your registry
   # Update deployment
   ```

### Rollback Plan

If issues occur, revert to v1.1.0:

```dockerfile
# Replace builder stage with original download method
RUN wget https://github.com/rizrmd/whatsapp-web-api/releases/download/v1.1.0/whatsapp-web-api-linux-amd64.zip \
    && unzip whatsapp-web-api-linux-amd64.zip \
    && chmod +x whatsapp-web-api-linux-amd64 \
    && mv whatsapp-web-api-linux-amd64 /usr/local/bin/whatsapp-web-api \
    && rm whatsapp-web-api-linux-amd64.zip
```

## Security Considerations

### Supply Chain Security

**v1.1.0 Approach** (Pre-compiled binary):
- ❌ Downloading binary from GitHub releases
- ❌ No visibility into build process
- ❌ Potential for compromised artifacts
- ✅ Faster build times

**v1.2.0 Approach** (Build from source):
- ✅ Build from verified source code
- ✅ Full transparency of build process
- ✅ Reproducible builds from git tag
- ✅ Control over compilation flags
- ❌ Slightly longer build times

### Dependency Management

All dependencies defined in `go.mod` and locked with checksums:
- gorilla/mux v1.8.1 (HTTP routing)
- joho/godotenv v1.5.1 (environment variables)
- lib/pq v1.10.9 (PostgreSQL driver)
- skip2/go-qrcode v0.0.0-20200617195104-da1b6568686e (QR code generation)
- go.mau.fi/whatsmeow (WhatsApp protocol implementation)
- google.golang.org/protobuf v1.36.10 (Protocol buffers)

Dependencies are verified with `go mod verify` during build.

## Best Practices

1. **Pin versions**: Always specify exact version tag (v1.2.0) instead of latest
2. **Verify builds**: Check binary size and file type after each build
3. **Test before deploy**: Run integration tests with built binary
4. **Monitor build times**: Cache Go modules to speed up builds
5. **Review dependencies**: Periodically audit go.mod for security updates
6. **Document changes**: Update this guide when modifying build process

## Additional Resources

- **Repository**: https://github.com/rizrmd/whatsapp-web-api
- **v1.2.0 Tag**: https://github.com/rizrmd/whatsapp-web-api/tree/v1.2.0
- **Go Documentation**: https://go.dev/doc/
- **Docker Multi-stage Builds**: https://docs.docker.com/build/building/multi-stage/

## Support

For issues related to:
- **WhatsApp Web API**: Open issue at https://github.com/rizrmd/whatsapp-web-api/issues
- **Build process**: Check this documentation or Docker build logs
- **Runtime issues**: Review `/tmp/wa-service.log` in container

---

**Version**: 1.0
**Last Updated**: 2025-10-26
**Maintained By**: AutoLeads Development Team
