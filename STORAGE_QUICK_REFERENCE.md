# Storage Migration - Quick Reference Card

## 🎯 What Changed

| Aspect | Before | After |
|--------|--------|-------|
| **Files stored in** | `/app/uploads/` ❌ Not persistent | `/app/data/` ✅ Persistent volume |
| **URLs in database** | `/uploads/tenant-1/...` | `/uploads/tenant-1/...` (unchanged) |
| **Backend serves from** | `./uploads/` | `./data/` |
| **Survives deployment?** | ❌ NO | ✅ YES |

## 🚀 Quick Commands

### Local Development

```bash
# Run migration (copy files from uploads to data)
bun run scripts/migrate-storage-to-data.ts

# Verify migration
bun run scripts/verify-storage-migration.ts

# Check files exist
ls -la ./data/tenant-1/cars/
```

### Production Deployment

```bash
# 1. Configure Coolify volume mount
#    UI → Storage → Add Volume: /data → /app/data

# 2. Deploy code
git add .
git commit -m "Storage migration: /uploads to /data"
git push

# 3. Monitor deployment
ssh root@cf.avolut.com "docker logs -f b8sc48s8s0c4w00008k808w8"

# 4. Upload photos to persistent volume
# Option A: Copy from local
scp uploads.tar.gz root@cf.avolut.com:/tmp/
ssh root@cf.avolut.com
docker cp /tmp/uploads.tar.gz b8sc48s8s0c4w00008k808w8:/app/data/
docker exec -it b8sc48s8s0c4w00008k808w8 sh
cd /app/data && tar -xzf uploads.tar.gz && rm uploads.tar.gz

# Option B: Copy from temp_upload
docker exec -it b8sc48s8s0c4w00008k808w8 sh
mkdir -p /app/data/tenant-1/cars/car-slug/
cp /app/temp_upload/car-photos/*.webp /app/data/tenant-1/cars/car-slug/

# 5. Verify
curl -I https://auto.lumiku.com/uploads/tenant-1/cars/car-slug/1.webp
```

## 🔍 Troubleshooting

### Images not loading (404)

```bash
# Check if files exist in /data
docker exec b8sc48s8s0c4w00008k808w8 ls -la /app/data/tenant-1/cars/

# Check server logs
docker logs b8sc48s8s0c4w00008k808w8 | grep IMAGE

# Test file serving
curl -I https://auto.lumiku.com/uploads/tenant-1/cars/car-slug/1.webp
```

**Fix:** Upload photos to `/app/data/` directory

### New uploads not saving

```bash
# Check volume mount
docker inspect b8sc48s8s0c4w00008k808w8 | grep -A 5 Mounts

# Check write permissions
docker exec b8sc48s8s0c4w00008k808w8 touch /app/data/test.txt
```

**Fix:** Configure Coolify volume mount

### Files disappear after redeploy

**Problem:** Volume not configured in Coolify

**Fix:**
1. Coolify → App → Storage
2. Add volume: `/data` → `/app/data`
3. Redeploy

## 📁 File Locations

### Code
- `backend/index.tsx` (Line 185-236) - Static file serving
- `backend/src/whatsapp/media-downloader.ts` (Line 10-50) - File uploads

### Scripts
- `scripts/migrate-storage-to-data.ts` - Copy files from /uploads to /data
- `scripts/verify-storage-migration.ts` - Verify migration complete

### Documentation
- `STORAGE_MIGRATION_GUIDE.md` - Detailed migration steps
- `STORAGE_ARCHITECTURE.md` - Technical architecture
- `STORAGE_MIGRATION_COMPLETE.md` - Summary and status

## 🎓 Key Concepts

### Why /uploads URLs in database?

**Backward compatibility!**
- Database keeps `/uploads/` paths
- Backend maps `/uploads/*` → `./data/` files
- No database migration needed
- No frontend changes needed
- Zero breaking changes

### Request Flow

```
Frontend: GET /uploads/tenant-1/cars/car1/1.webp
    ↓
Backend:  app.get('/uploads/*')
    ↓
Maps to:  ./data/tenant-1/cars/car1/1.webp
    ↓
Serves:   File from persistent volume
```

## ✅ Verification Checklist

### After Local Migration
- [ ] Files exist in `./data/tenant-1/cars/`
- [ ] Run verification script: `bun run scripts/verify-storage-migration.ts`
- [ ] All photos found in /data

### After Production Deployment
- [ ] Coolify volume configured
- [ ] Code deployed successfully
- [ ] Photos uploaded to `/app/data/`
- [ ] Images load on website
- [ ] WhatsApp bot uploads work
- [ ] Files persist after redeploy

## 🆘 Emergency Rollback

```bash
# 1. Revert code
git revert HEAD
git push

# 2. (Optional) Set old path in env
# Coolify → Env → Add: UPLOAD_DIR=/app/uploads
```

## 📞 Support

**Issues?** Check these docs:
1. `STORAGE_MIGRATION_GUIDE.md` - Step-by-step guide
2. `STORAGE_ARCHITECTURE.md` - Architecture details
3. Server logs: `docker logs b8sc48s8s0c4w00008k808w8`

**Common Issues:**
- 404 on images → Upload photos to `/app/data/`
- Upload fails → Check Coolify volume mount
- Files disappear → Configure persistent volume

---

**Remember:** URLs in database stay `/uploads/`, backend serves from `/data/`!
