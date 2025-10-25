# Storage Migration Guide: `/app/uploads` → `/app/data`

## Overview

This document explains the storage architecture migration from `/app/uploads` (non-persistent) to `/app/data` (persistent volume in Coolify).

## Architecture Changes

### Before Migration
- **Storage location:** `/app/uploads/tenant-{id}/cars/`
- **Problem:** Files lost on every deployment (not persisted)
- **Database:** Photos stored as JSON array of paths: `["/uploads/tenant-1/cars/..."]`

### After Migration
- **Storage location:** `/app/data/tenant-{id}/cars/` (persisted as Docker volume)
- **URL mapping:** `/uploads/*` URLs served from `/data/` directory
- **Database:** **NO CHANGES** - still uses `/uploads/` paths for backward compatibility
- **Backend:** Routes `/uploads/*` requests to `/data/` directory

## Why Keep `/uploads` in URLs?

**Backward Compatibility Strategy:**
1. Database records keep `/uploads/` in photo paths
2. Backend maps `/uploads/*` URLs to `/data/` directory
3. No database migration needed
4. Existing API responses unchanged
5. Frontend code unchanged

## Files Modified

### 1. Backend - Static File Serving
**File:** `backend/index.tsx`
```typescript
// BEFORE:
app.get('/uploads/*', async (c) => {
  const filepath = `./uploads/${requestPath}`;
  // ...
});

// AFTER:
app.get('/uploads/*', async (c) => {
  const filepath = `./data/${requestPath}`;  // Serves from /data
  // ...
});
```

### 2. Backend - Media Downloader
**File:** `backend/src/whatsapp/media-downloader.ts`
```typescript
// BEFORE:
private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// AFTER:
private readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './data';

// Note: Still returns /uploads/ URLs for backward compatibility
return `/uploads/tenant-${tenantId}/${filename}`;
```

### 3. Database Seed
**File:** `prisma/seed.ts`
- **NO CHANGES NEEDED** - paths already use `/uploads/` which is correct
- Backend will serve these from `/data/` directory

## Migration Steps

### Step 1: Run Migration Script (Development/Staging)

Test in dry-run mode first:
```bash
DRY_RUN=true bun run scripts/migrate-storage-to-data.ts
```

Run actual migration:
```bash
bun run scripts/migrate-storage-to-data.ts
```

### Step 2: Verify Files Copied
```bash
# Check data directory exists
ls -la ./data/tenant-1/cars/

# Compare file counts
find ./uploads -type f | wc -l
find ./data -type f | wc -l
```

### Step 3: Deploy to Production

**Coolify Configuration:**
1. Add persistent volume mount in Coolify:
   - **Source:** `/data` (persistent volume)
   - **Destination:** `/app/data`
   - **Type:** Volume

2. Deploy the updated code:
   ```bash
   git add .
   git commit -m "Migration: Storage from /uploads to /data with persistent volume"
   git push
   ```

3. Monitor deployment:
   ```bash
   ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8"
   ```

### Step 4: Upload Files to Production

Since `/app/data` is a persistent volume in Coolify, you need to upload existing photos:

**Option A: Using SSH (Recommended)**
```bash
# Compress uploads directory
tar -czf uploads.tar.gz -C ./uploads .

# Upload to server
scp uploads.tar.gz root@cf.avolut.com:/tmp/

# SSH to server and extract to container volume
ssh root@cf.avolut.com
docker cp /tmp/uploads.tar.gz b8sc48s8s0c4w00008k808w8:/app/data/
docker exec -it b8sc48s8s0c4w00008k808w8 sh
cd /app/data
tar -xzf uploads.tar.gz
rm uploads.tar.gz
```

**Option B: Re-seed Database**
```bash
# SSH to server
ssh root@cf.avolut.com

# Enter container
docker exec -it b8sc48s8s0c4w00008k808w8 sh

# Run seed (will create data in /app/data)
bun run prisma/seed.ts
```

### Step 5: Verify in Production

Test image loading:
```bash
# Test image URL (should work)
curl -I https://auto.lumiku.com/uploads/tenant-1/cars/mercedes-c300-2010/1.webp

# Should return 200 OK with Content-Type: image/webp
```

Test API response:
```bash
curl https://auto.lumiku.com/api/cars | jq '.[0].photos'
# Should return array of /uploads/ URLs
```

### Step 6: Cleanup Old Directory (Optional)

After verifying everything works:
```bash
# Development/Local
rm -rf ./uploads/

# Production (in container)
ssh root@cf.avolut.com
docker exec -it b8sc48s8s0c4w00008k808w8 sh
rm -rf /app/uploads/
```

## Environment Variables

No changes needed! The default has changed in code:

**Before:**
```env
UPLOAD_DIR=./uploads  # Optional, was the default
```

**After:**
```env
UPLOAD_DIR=./data  # Optional, now the default
```

If you want to override:
```env
UPLOAD_DIR=/custom/path
```

## Rollback Plan

If something goes wrong:

### 1. Revert Code Changes
```bash
git revert HEAD
git push
```

### 2. Restore Old Environment Variable
```env
UPLOAD_DIR=./uploads
```

### 3. Copy Files Back
```bash
cp -r ./data/* ./uploads/
```

## Testing Checklist

- [ ] Images load on car listing page
- [ ] Images load on car detail page
- [ ] New car uploads via WhatsApp bot work
- [ ] Admin dashboard shows car photos
- [ ] Photo URLs in API responses are correct
- [ ] No 404 errors in browser console
- [ ] No errors in server logs

## Monitoring

After deployment, monitor:

```bash
# Server logs
ssh root@cf.avolut.com "docker logs -f b8sc48s8s0c4w00008k808w8"

# Look for:
# - [IMAGE] File not found errors
# - [SECURITY] Path traversal attempts
# - Any file serving errors
```

## FAQ

**Q: Why not update database paths to `/data/`?**
A: Backward compatibility. Keeping `/uploads/` in URLs means no API changes, no frontend changes, and simpler migration.

**Q: Will new uploads use `/data/`?**
A: Yes! `MediaDownloader` now saves to `./data/` but returns `/uploads/` URLs which are served from `/data/`.

**Q: What if I want to change URLs to `/data/` later?**
A: Run a database migration to update all photo paths, update frontend to handle both formats during transition.

**Q: How do I verify persistent volume in Coolify?**
A:
```bash
ssh root@cf.avolut.com
docker inspect b8sc48s8s0c4w00008k808w8 | grep -A 10 Mounts
# Should show /app/data mounted as volume
```

**Q: What about the seed data photos?**
A: Seed already uses `/uploads/` paths. You need to ensure actual photo files exist in `/data/tenant-1/cars/...` directory.

## Next Steps

1. **Phase 1:** Run migration script locally (DONE)
2. **Phase 2:** Test locally with new `/data/` directory
3. **Phase 3:** Deploy to staging/production
4. **Phase 4:** Configure Coolify persistent volume
5. **Phase 5:** Upload existing photos to production volume
6. **Phase 6:** Verify and monitor

## Support

If issues arise:
1. Check server logs: `docker logs b8sc48s8s0c4w00008k808w8`
2. Verify volume mount: `docker inspect b8sc48s8s0c4w00008k808w8`
3. Check file permissions: `ls -la /app/data/`
4. Test file access: `docker exec b8sc48s8s0c4w00008k808w8 ls -la /app/data/`
