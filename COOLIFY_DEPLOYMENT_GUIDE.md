# COOLIFY DEPLOYMENT GUIDE - AutoLeads Platform

## Prerequisites

- Coolify account access at https://cf.avolut.com
- Application ID: `b8sc48s8s0c4w00008k808w8`
- Database connection details (PostgreSQL)
- Domain configured: `auto.lumiku.com`
- Git repository access: https://github.com/rizrmd/auto

---

## Step-by-Step Deployment

### Step 1: Access Coolify Dashboard

1. Navigate to: **https://cf.avolut.com**
2. Log in with your admin credentials
3. Locate application: `b8sc48s8s0c4w00008k808w8`
4. Click on the application name to open settings

---

### Step 2: Configure Environment Variables

Click on **Environment Variables** tab in the Coolify dashboard. Add the following variables:

#### CRITICAL - Required Variables

These variables MUST be configured for the application to start:

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/auto-lumiku"

# Security - JWT Authentication (CHANGE THIS VALUE)
JWT_SECRET="e4322ded430c65d60cfbaf0d622dfab310c81d334b46f0fccf6db78ed605fd78"
JWT_EXPIRY_HOURS="24"

# Application Configuration
NODE_ENV="production"
APP_PORT="3000"
APP_URL="https://auto.lumiku.com"

# CORS Security
ALLOWED_ORIGINS="https://auto.lumiku.com,https://admin.lumiku.com"
```

**IMPORTANT SECURITY NOTES:**
- Mark `JWT_SECRET` as **Secret** (click the eye icon to hide value)
- Mark `DATABASE_URL` as **Secret** (click the eye icon to hide value)
- The JWT_SECRET above has been cryptographically generated
- DO NOT share these values publicly

#### Recommended Variables

```bash
# File Storage
UPLOAD_DIR="/app/uploads"
MAX_FILE_SIZE_MB="10"
ALLOWED_IMAGE_TYPES="jpg,jpeg,png,webp"

# Logging
LOG_LEVEL="info"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="60000"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_BOT_MAX_MESSAGES="10"
```

#### Optional Variables (External Services)

Only add these if you're using the respective services:

```bash
# WhatsApp Integration (Fonnte)
FONNTE_API_URL="https://api.fonnte.com"
FONNTE_API_TOKEN="your-fonnte-api-token-here"

# AI Integration (Google Gemini)
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1"
GEMINI_MODEL="gemini-pro"

# Error Tracking (Sentry)
SENTRY_DSN=""

# Analytics
GA_TRACKING_ID=""

# Future: Redis for Session Storage
REDIS_URL=""
```

---

### Step 3: Configure Application Settings

Navigate to **General Settings** tab:

#### Build Configuration

```bash
Build Command: bun install && bun run build
Start Command: ./start.sh
Port: 3000
```

#### Repository Settings

```bash
Repository URL: https://github.com/rizrmd/auto
Branch: main
Auto-deploy on push: ✓ Enabled
```

#### Container Settings

```bash
Base Image: oven/bun:latest (defined in Dockerfile)
Working Directory: /app
Health Check Path: /health
Restart Policy: unless-stopped
```

---

### Step 4: Configure Persistent Storage

Navigate to **Volumes** tab:

#### Volume Mapping for Uploads

```bash
Volume Name: autoleads-uploads
Host Path: /var/lib/coolify/volumes/autoleads-uploads
Container Path: /app/uploads
Purpose: Persistent image storage for car listings
Permissions: 755
```

**Why this matters:**
- Prevents image loss during redeployments
- Enables persistent storage across container restarts
- Images uploaded by users remain available

---

### Step 5: Configure Domain & SSL

Navigate to **Domains** tab:

```bash
Primary Domain: auto.lumiku.com
SSL Certificate: Auto (Let's Encrypt)
Force HTTPS: ✓ Yes
WWW Redirect: Disabled
```

**SSL Configuration:**
- Let's Encrypt automatically issues and renews certificates
- Certificate renewal happens automatically every 90 days
- Force HTTPS redirects all HTTP traffic to HTTPS

---

### Step 6: Trigger Deployment

1. Click the **Deploy** button (top right corner)
2. Select **Deploy from latest commit**
3. Confirm deployment

#### Monitor Deployment Progress

Watch the build logs in real-time:

```bash
# Expected log sequence:
1. "Cloning repository..."
2. "Running build command..."
3. "Building Docker image..."
4. "Starting container..."
5. "✓ Deployed successfully"
```

**Typical deployment time:** 2-5 minutes

---

### Step 7: Post-Deployment Verification

Run these verification commands to ensure everything is working:

#### Health Check

```bash
# Basic health check
curl https://auto.lumiku.com/health

# Expected response:
{"status":"ok","timestamp":"2025-10-24T..."}
```

#### API Endpoint Test

```bash
# Test cars API
curl https://auto.lumiku.com/api/cars

# Expected: JSON array of car listings (may be empty initially)
```

#### Security Headers Check

```bash
# Verify security headers are present
curl -I https://auto.lumiku.com | grep -E "(X-Frame|Content-Security|Strict-Transport)"

# Expected headers:
# X-Frame-Options: DENY
# Content-Security-Policy: ...
# Strict-Transport-Security: max-age=31536000
```

#### Application Logs

```bash
# SSH into Coolify server and check logs
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 50"

# Look for:
# "✓ Starting AutoLeads..."
# "✓ Database: Connected"
# "✓ Starting AutoLeads application..."
```

#### Database Connection Test

```bash
# Check Prisma migrations status
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bunx prisma migrate status"

# Expected: "Database schema is up to date!"
```

---

## Troubleshooting

### Issue: Environment Variables Not Applied

**Symptoms:**
- Application fails to start
- Connection errors to database
- JWT authentication fails

**Solution:**
1. Go to Coolify → Environment Variables
2. Verify all CRITICAL variables are set
3. Click **Save** button
4. Click **Restart** button (not redeploy)
5. Wait 30 seconds
6. Check logs for confirmation

```bash
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 20"
```

---

### Issue: Database Connection Failed

**Symptoms:**
- Error: "Can't reach database server"
- Migration failures
- 500 errors on API calls

**Solution 1: Verify DATABASE_URL Format**

```bash
# Correct format:
postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Check your connection string matches:
postgresql://postgres:6LP0Ojegy7IUU6kaX9lLkmZRUiAdAUNOltWyL3LegfYGR6rPQtB4DUSVqjdA78ES@107.155.75.50:5986/auto-lumiku
```

**Solution 2: Test Database Connection**

```bash
# SSH into container and test connection
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 sh"

# Inside container:
bunx prisma db pull

# Expected: "Introspecting database..."
```

**Solution 3: Check Database Server**

```bash
# Test database server is reachable
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 pg_isready -h 107.155.75.50 -p 5986"

# Expected: "accepting connections"
```

---

### Issue: Images Not Serving / 404 on Uploads

**Symptoms:**
- Uploaded images return 404
- Images disappear after redeployment
- Empty uploads directory

**Solution 1: Verify Volume Mapping**

```bash
# Check volume is mounted
ssh root@cf.avolut.com "docker inspect b8sc48s8s0c4w00008k808w8 | grep -A 5 Mounts"

# Expected:
# "Source": "/var/lib/coolify/volumes/autoleads-uploads"
# "Destination": "/app/uploads"
```

**Solution 2: Check Permissions**

```bash
# Verify directory permissions
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 ls -la /app | grep uploads"

# Expected: drwxr-xr-x ... uploads

# Fix permissions if needed:
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 chmod 755 /app/uploads"
```

**Solution 3: Test File Upload**

```bash
# Create test file
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 touch /app/uploads/test.txt"

# Verify it persists after restart
ssh root@cf.avolut.com "docker restart b8sc48s8s0c4w00008k808w8"
sleep 10
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 ls /app/uploads"
```

---

### Issue: SSL Certificate Error

**Symptoms:**
- "Your connection is not private" warning
- Certificate invalid or expired
- HTTPS not working

**Solution:**

1. Go to Coolify → Domains tab
2. Find `auto.lumiku.com`
3. Click **Regenerate SSL Certificate**
4. Wait 1-2 minutes for Let's Encrypt
5. Test with: `curl -I https://auto.lumiku.com`

---

### Issue: Build Fails

**Symptoms:**
- Deployment stuck at "Building..."
- Red error messages in build logs
- Container exits immediately

**Common Causes & Solutions:**

**Cause 1: Missing Dependencies**

```bash
# Check package.json is committed
git ls-files package.json

# Ensure bun.lock is committed
git ls-files bun.lock
```

**Cause 2: TypeScript Errors**

```bash
# Check for type errors locally
bun run build

# Fix any TypeScript errors before deploying
```

**Cause 3: Out of Memory**

- Increase container memory in Coolify → Resources tab
- Recommended: At least 512MB RAM

---

### Issue: Application Crashes After Deployment

**Symptoms:**
- Container restarts repeatedly
- 502 Bad Gateway errors
- Logs show crash dumps

**Solution:**

```bash
# Check crash logs
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 100"

# Common issues:
# 1. Missing JWT_SECRET → Add to env vars
# 2. Invalid DATABASE_URL → Fix connection string
# 3. Port conflict → Verify PORT=3000
# 4. Migration failure → Run migrations manually:

ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bunx prisma migrate deploy"
```

---

## Rollback Procedure

If deployment introduces critical bugs:

### Step 1: Identify Last Working Version

1. Go to Coolify → **Deployments** tab
2. Review deployment history
3. Find last successful deployment (green checkmark)
4. Note the commit hash

### Step 2: Perform Rollback

```bash
# Option A: Via Coolify UI
1. Click on successful deployment
2. Click "Rollback to this version"
3. Confirm rollback
4. Wait for redeployment

# Option B: Via Git
1. Revert commit in repository
2. Push to main branch
3. Coolify auto-deploys
```

### Step 3: Verify Rollback

```bash
# Check application version
curl https://auto.lumiku.com/health

# Check logs for startup
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 50"
```

---

## Monitoring & Maintenance

### Daily Health Checks

Run these commands daily to monitor application health:

```bash
# Application status
ssh root@cf.avolut.com "docker ps | grep b8sc48s8s0c4w00008k808w8"

# Recent logs (errors only)
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 100 | grep -i error"

# Database connection
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bunx prisma db pull"

# Disk usage (uploads directory)
ssh root@cf.avolut.com "du -sh /var/lib/coolify/volumes/autoleads-uploads"
```

### Weekly Maintenance

```bash
# Check for pending migrations
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bunx prisma migrate status"

# Review disk space
ssh root@cf.avolut.com "df -h | grep -E '(Filesystem|/var/lib/coolify)'"

# Check SSL certificate expiry
curl -vI https://auto.lumiku.com 2>&1 | grep "expire date"
```

### Monthly Tasks

```bash
# Review security headers
curl -I https://auto.lumiku.com | grep -E "X-|Content-Security|Strict-Transport"

# Check dependency updates
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bun outdated"

# Backup database
pg_dump -h 107.155.75.50 -p 5986 -U postgres -d auto-lumiku > backup_$(date +%Y%m%d).sql
```

---

## Useful Commands Reference

### Container Management

```bash
# View container status
ssh root@cf.avolut.com "docker ps | grep b8sc48s8s0c4w00008k808w8"

# Restart container
ssh root@cf.avolut.com "docker restart b8sc48s8s0c4w00008k808w8"

# Stop container
ssh root@cf.avolut.com "docker stop b8sc48s8s0c4w00008k808w8"

# Start container
ssh root@cf.avolut.com "docker start b8sc48s8s0c4w00008k808w8"

# Shell access
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 sh"
```

### Logs & Debugging

```bash
# Last 50 lines of logs
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 50"

# Follow logs in real-time
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 -f"

# Logs from last hour
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --since 1h"

# Search logs for errors
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 | grep -i 'error\|fail\|exception'"
```

### Database Operations

```bash
# Check migration status
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bunx prisma migrate status"

# Apply pending migrations
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bunx prisma migrate deploy"

# Open Prisma Studio (use port forwarding)
ssh -L 5555:localhost:5555 root@cf.avolut.com
docker exec -it b8sc48s8s0c4w00008k808w8 bunx prisma studio
# Then open: http://localhost:5555

# Query database directly
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql $DATABASE_URL"
```

### File & Storage Management

```bash
# Check uploads directory size
ssh root@cf.avolut.com "du -sh /var/lib/coolify/volumes/autoleads-uploads"

# List uploaded files
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 ls -lh /app/uploads"

# Check available disk space
ssh root@cf.avolut.com "df -h /var/lib/coolify/volumes"

# Clean up old uploads (BE CAREFUL!)
# ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 find /app/uploads -mtime +90 -delete"
```

---

## Security Checklist

Before marking deployment as complete, verify:

- [ ] **JWT_SECRET** is cryptographically random (64 characters hex)
- [ ] **DATABASE_URL** contains a strong password (20+ characters)
- [ ] **ALLOWED_ORIGINS** is restricted to production domains only
- [ ] **SSL/HTTPS** is enforced (no HTTP access)
- [ ] Sensitive variables marked as **Secret** in Coolify (hidden values)
- [ ] **.env files** are NOT committed to git repository
- [ ] **Volume permissions** are correct (755 for uploads directory)
- [ ] **Security headers** are present (X-Frame-Options, CSP, HSTS)
- [ ] **Rate limiting** is configured in environment variables
- [ ] **Error messages** don't expose sensitive information
- [ ] **Database credentials** are strong and unique
- [ ] **SSH keys** are properly configured (if using private repo)

---

## Success Criteria

Deployment is considered successful when ALL of the following are true:

### Application Health

- [ ] Application accessible at https://auto.lumiku.com
- [ ] Health endpoint returns `200 OK` status
- [ ] No 5xx errors in logs (first 5 minutes)
- [ ] Container status shows "healthy" or "running"

### Functionality

- [ ] Car catalog page loads with data
- [ ] Car detail pages display correctly
- [ ] Images load and display properly
- [ ] Search functionality works
- [ ] Tenant branding displays correctly
- [ ] Navigation menus work

### Security

- [ ] HTTPS certificate is valid (green lock in browser)
- [ ] Security headers present in response
- [ ] CORS policy blocks unauthorized origins
- [ ] JWT authentication works correctly
- [ ] No sensitive data exposed in error messages

### Performance

- [ ] Page load time under 2 seconds
- [ ] API response time under 500ms
- [ ] Images load progressively
- [ ] No memory leaks (stable memory usage)

### Data Persistence

- [ ] Database queries work correctly
- [ ] File uploads persist after restart
- [ ] Tenant data is isolated properly
- [ ] Migrations completed successfully

---

## Emergency Contacts

**Deployment Issues:**
- Check Coolify dashboard: https://cf.avolut.com
- Review deployment logs in real-time
- Contact DevOps team if persistent failures

**Database Issues:**
- Database host: 107.155.75.50:5986
- Connection issues: Check network/firewall
- Data corruption: Restore from backup

**Security Issues:**
- Suspected breach: Rotate all secrets immediately
- SSL issues: Regenerate certificate via Coolify
- DDoS attack: Enable rate limiting and notify hosting provider

---

## Additional Resources

- **Coolify Documentation:** https://coolify.io/docs
- **Bun Runtime Documentation:** https://bun.sh/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Hono Framework:** https://hono.dev

---

**Document Version:** 1.0.0
**Last Updated:** 2025-10-24
**Status:** Production Ready
**Generated For:** AutoLeads Multi-Tenant Platform

---

## Quick Start Summary

For experienced DevOps engineers, here's the TL;DR:

```bash
# 1. Set environment variables in Coolify
DATABASE_URL="postgresql://..."
JWT_SECRET="e4322ded430c65d60cfbaf0d622dfab310c81d334b46f0fccf6db78ed605fd78"
NODE_ENV="production"
APP_PORT="3000"
ALLOWED_ORIGINS="https://auto.lumiku.com"

# 2. Configure volume
Host: /var/lib/coolify/volumes/autoleads-uploads
Container: /app/uploads

# 3. Deploy
Click "Deploy" in Coolify UI

# 4. Verify
curl https://auto.lumiku.com/health
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 50"
```

Done!
