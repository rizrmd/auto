# Storage Architecture - AutoLeads

## Quick Reference

### Storage Locations

| What | Where | Persistent? | Purpose |
|------|-------|-------------|---------|
| **Physical Files** | `/app/data/tenant-{id}/` | ✅ Yes (Docker volume) | Actual photo/media storage |
| **Database Paths** | `/uploads/tenant-{id}/...` | N/A | URL paths stored in DB |
| **URL Endpoints** | `GET /uploads/*` | N/A | Public API for images |

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     REQUEST FLOW                             │
└─────────────────────────────────────────────────────────────┘

1. Frontend requests: GET /uploads/tenant-1/cars/car1/1.webp
                              ↓
2. Backend receives:  app.get('/uploads/*')
                              ↓
3. Backend maps to:   ./data/tenant-1/cars/car1/1.webp
                              ↓
4. Serves file from:  /app/data/ (persistent volume)
                              ↓
5. Returns:           image/webp with file content
```

### Database Schema

```typescript
// Car model (NO CHANGES from before)
model Car {
  photos String[]  // e.g., ["/uploads/tenant-1/cars/car1/1.webp"]
}
```

**Why `/uploads/` in database?**
- Backward compatibility with existing records
- No API response changes needed
- No frontend code changes needed
- Backend transparently maps to `/data/`

### File Structure

```
/app/
├── data/                          # ← NEW: Persistent storage
│   ├── tenant-1/
│   │   ├── cars/
│   │   │   ├── mercedes-c300-2010/
│   │   │   │   ├── 1.webp
│   │   │   │   ├── 2.webp
│   │   │   │   └── ...
│   │   │   └── honda-jazz-2017/
│   │   │       └── ...
│   │   └── logos/
│   │       └── showroom.png
│   └── tenant-2/
│       └── ...
└── uploads/                       # ← OLD: Can be deleted after migration
    └── (deprecated - delete after migration verified)
```

### Code Locations

**1. File Upload Handler**
- **File:** `backend/src/whatsapp/media-downloader.ts`
- **Line:** 12
- **Code:** `UPLOAD_DIR = './data'`
- **Action:** Downloads WhatsApp media → saves to `/data/`

**2. Static File Serving**
- **File:** `backend/index.tsx`
- **Line:** 191-236
- **Code:** `app.get('/uploads/*')` → serves from `./data/`
- **Action:** Maps `/uploads/*` URLs → `/data/` files

**3. Seed Data**
- **File:** `prisma/seed.ts`
- **Line:** 149-416
- **Code:** `photos: ["/uploads/tenant-1/cars/..."]`
- **Action:** Creates DB records with `/uploads/` paths

## Implementation Details

### MediaDownloader Class

```typescript
// backend/src/whatsapp/media-downloader.ts
export class MediaDownloader {
  private readonly UPLOAD_DIR = './data';  // ← Changed from ./uploads

  async downloadAndSave(url: string, tenantId: number, filename: string) {
    const tenantDir = join(this.UPLOAD_DIR, `tenant-${tenantId}`);
    await mkdir(tenantDir, { recursive: true });

    // ... download logic ...

    // Returns /uploads/ URL for backward compatibility
    return `/uploads/tenant-${tenantId}/${filename}`;
    //      ^^^^^^^^ DB stores this path
    //               Backend serves from ./data/
  }
}
```

### Static File Route

```typescript
// backend/index.tsx
app.get('/uploads/*', async (c) => {
  const requestPath = c.req.path.replace('/uploads/', '');
  const filepath = `./data/${requestPath}`;  // ← Maps to /data
  //                 ^^^^^^^
  //                 Serves from here (persistent)

  const file = Bun.file(filepath);
  if (!(await file.exists())) {
    console.error('[IMAGE] File not found:', filepath);
    return c.notFound();
  }

  // Serve file with proper Content-Type
  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=86400',
    }
  });
});
```

## Coolify Configuration

### Persistent Volume Setup

**Volume Mount:**
```yaml
# In Coolify UI → Storage tab
Source:      /data
Destination: /app/data
Type:        Volume
```

**Why this works:**
1. Docker creates persistent volume mapped to `/app/data`
2. Files in `/app/data` survive container restarts
3. Files in `/app/data` survive deployments
4. Files in `/app/data` survive image rebuilds

**Before (WRONG):**
```
Container filesystem: /app/uploads/
                      ↓
                   [NOT PERSISTED]
                      ↓
                   ❌ Lost on deployment
```

**After (CORRECT):**
```
Docker volume:     /volumes/autoleads/data
                      ↓ (mounted to)
Container path:    /app/data/
                      ↓
                   ✅ Persisted across deployments
```

## Migration Checklist

### Pre-Migration
- [x] Update `media-downloader.ts` to use `./data`
- [x] Update `backend/index.tsx` to serve from `./data`
- [x] Add logging for debugging
- [x] Create migration script
- [x] Create documentation

### Local Migration
- [ ] Run migration script: `bun run scripts/migrate-storage-to-data.ts`
- [ ] Verify files copied: `ls -la ./data/tenant-1/cars/`
- [ ] Test locally: Start server and check images load
- [ ] Check browser console for 404 errors
- [ ] Check server logs for file serving errors

### Production Migration
- [ ] Configure Coolify volume mount: `/data` → `/app/data`
- [ ] Deploy updated code: `git push`
- [ ] Upload existing photos to volume (see STORAGE_MIGRATION_GUIDE.md)
- [ ] Verify images load: `curl -I https://auto.lumiku.com/uploads/...`
- [ ] Monitor logs: `docker logs -f b8sc48s8s0c4w00008k808w8`
- [ ] Test WhatsApp bot upload (creates new files in `/data`)
- [ ] Verify new uploads persist after redeployment

### Post-Migration
- [ ] Delete old `./uploads/` directory
- [ ] Update deployment documentation
- [ ] Train team on new architecture

## Troubleshooting

### Images Not Loading (404)

**Symptom:** API returns `/uploads/...` paths but images don't load

**Check:**
```bash
# 1. Verify files exist
docker exec b8sc48s8s0c4w00008k808w8 ls -la /app/data/tenant-1/cars/

# 2. Check server logs
docker logs b8sc48s8s0c4w00008k808w8 | grep IMAGE

# 3. Test file serving
curl -I https://auto.lumiku.com/uploads/tenant-1/cars/car1/1.webp
```

**Fix:**
- Files missing in `/app/data/` → Run migration script or upload photos
- Permission errors → Check file ownership: `chown -R node:node /app/data`
- Path mismatch → Verify DB paths match file structure

### New Uploads Not Saving

**Symptom:** WhatsApp bot uploads fail or files disappear

**Check:**
```bash
# 1. Verify volume mount
docker inspect b8sc48s8s0c4w00008k808w8 | grep -A 5 Mounts

# 2. Check write permissions
docker exec b8sc48s8s0c4w00008k808w8 touch /app/data/test.txt

# 3. Check environment variable
docker exec b8sc48s8s0c4w00008k808w8 env | grep UPLOAD_DIR
```

**Fix:**
- Volume not mounted → Configure in Coolify Storage settings
- Permission denied → Fix ownership: `chown -R node:node /app/data`
- Wrong directory → Set env: `UPLOAD_DIR=/app/data`

### Files Disappear After Deployment

**Symptom:** Images work after upload but gone after redeploy

**Root Cause:** Volume not configured in Coolify

**Fix:**
1. Go to Coolify → Your App → Storage
2. Add volume: `/data` → `/app/data`
3. Redeploy
4. Upload photos again

## Performance Considerations

### Caching

Files are served with cache headers:
```typescript
'Cache-Control': 'public, max-age=86400'  // 24 hours
```

**CDN Integration (Future):**
- Upload to CloudFlare R2 / AWS S3
- Store CDN URLs in database
- Fallback to local `/data/` if CDN fails

### Storage Limits

**Current:**
- No file size limits enforced
- No storage quota per tenant
- No cleanup of old files

**Recommendations:**
1. Add file size validation (max 10MB)
2. Implement storage quota per tenant
3. Add cleanup job for deleted cars
4. Monitor disk usage: `df -h /app/data`

## Security

### Path Traversal Prevention

```typescript
// Security check in backend/index.tsx
const normalizedPath = path.normalize(filepath);
if (!normalizedPath.startsWith('./data/')) {
  return c.text('Forbidden', 403);
}
```

**Prevents:**
- `GET /uploads/../../../etc/passwd` → Blocked ✅
- `GET /uploads/tenant-1/../../secret.env` → Blocked ✅

### File Type Validation

**Current:** Only MIME type check on serving

**Recommendations:**
1. Validate file extensions on upload
2. Scan uploaded files for malware
3. Strip EXIF data from images (privacy)
4. Generate thumbnails server-side

## Future Enhancements

### Option A: Dedicated Photo Model

```prisma
model CarPhoto {
  id        Int      @id @default(autoincrement())
  carId     Int
  car       Car      @relation(fields: [carId], references: [id])
  filePath  String   // "/uploads/tenant-1/cars/car1/1.webp"
  fileName  String   // "1.webp"
  fileSize  Int
  mimeType  String   // "image/webp"
  width     Int?     // Image dimensions
  height    Int?
  order     Int      // Display order
  createdAt DateTime @default(now())

  @@index([carId, order])
}
```

**Benefits:**
- Individual file metadata (size, dimensions, upload date)
- Better ordering control
- Easy to add variants (thumbnail, medium, large)
- Can track who uploaded each photo

### Option B: CDN Integration

```typescript
// Future: Upload to CDN
async uploadToS3(file: Buffer, key: string): Promise<string> {
  // Upload to S3/R2
  const url = await s3.upload(file, key);

  // Store CDN URL in database
  return url; // "https://cdn.autoleads.com/tenant-1/cars/car1/1.webp"
}
```

**Benefits:**
- Global CDN distribution
- Reduced server load
- Automatic image optimization
- Better performance

## Summary

| Aspect | Old (`/uploads`) | New (`/data`) |
|--------|------------------|---------------|
| **Storage Path** | `./uploads/` | `./data/` |
| **Persistent?** | ❌ No | ✅ Yes (Docker volume) |
| **Database URLs** | `/uploads/...` | `/uploads/...` (unchanged) |
| **API Endpoint** | `GET /uploads/*` | `GET /uploads/*` (unchanged) |
| **Migration Needed?** | N/A | File copy only |
| **DB Migration?** | N/A | ❌ Not required |
| **Frontend Changes?** | N/A | ❌ Not required |
| **Backward Compatible?** | N/A | ✅ Yes (URL mapping) |

**Key Insight:** URLs in database stay `/uploads/`, but backend serves from `/data/` for persistence. This allows zero-downtime migration with full backward compatibility.
