# Restart WhatsApp Web API Service

## Masalah
QR code tidak muncul atau gagal connect karena WhatsApp Web API service (port 8080) tidak berjalan.

## Solusi: Restart Container di Production

### Option 1: Via Coolify Dashboard (Paling Mudah)
1. Login ke Coolify: https://cf.avolut.com
2. Pilih aplikasi **AutoLeads** (auto.lumiku.com)
3. Klik tombol **Restart** di pojok kanan atas
4. Tunggu 30-60 detik hingga container restart
5. Test QR code: https://auto.lumiku.com/api/wa/pair

### Option 2: Via SSH Manual
```bash
# 1. SSH ke production server
ssh root@cf.avolut.com

# 2. Find AutoLeads container ID
docker ps | grep auto

# Output example:
# b8sc48s8s0c4w00008k808w8   autoleads:latest   ...

# 3. Restart container (ganti dengan container ID Anda)
docker restart b8sc48s8s0c4w00008k808w8

# 4. Check logs untuk memastikan WhatsApp service started
docker logs -f b8sc48s8s0c4w00008k808w8 | grep -i whatsapp

# Expected output:
# 📱 Starting WhatsApp Web API on port 8080...
# WhatsApp API started with PID: 123

# 5. Test WhatsApp API health
curl http://localhost:8080/health
```

### Option 3: Restart WhatsApp Service Only (Tanpa Restart Main App)
Jika main app tidak boleh down:

```bash
# 1. SSH ke server
ssh root@cf.avolut.com

# 2. Exec into container
docker exec -it b8sc48s8s0c4w00008k808w8 bash

# 3. Kill WhatsApp process
pkill whatsapp-web-api

# 4. Start WhatsApp service manually
PORT=8080 DATABASE_URL="$DATABASE_URL" /usr/local/bin/whatsapp-web-api &

# 5. Verify it's running
ps aux | grep whatsapp
curl http://localhost:8080/health
```

## Verifikasi

### 1. Check WhatsApp Service Health
```bash
# From production server
curl http://localhost:8080/health

# Expected response:
{
  "success": true,
  "data": {
    "paired": false,
    "connected": false
  }
}
```

### 2. Check QR Code Generation
```bash
# From production server
curl http://localhost:8080/pair

# Expected: QR code JSON with qr_image_url
```

### 3. Check from Browser
```
https://auto.lumiku.com/api/wa/pair
```
- QR code harus muncul dalam 2-3 detik
- Jika ada spinner terus, berarti port 8080 masih belum aktif

## Troubleshooting

### QR Code Masih Tidak Muncul Setelah Restart

**Check 1: Port 8080 listening?**
```bash
docker exec b8sc48s8s0c4w00008k808w8 netstat -tlnp | grep 8080
```

**Check 2: WhatsApp process running?**
```bash
docker exec b8sc48s8s0c4w00008k808w8 ps aux | grep whatsapp
```

**Check 3: Database connection OK?**
```bash
docker exec b8sc48s8s0c4w00008k808w8 env | grep DATABASE_URL
```

**Check 4: Logs for errors**
```bash
docker logs b8sc48s8s0c4w00008k808w8 2>&1 | grep -i "error\|whatsapp" | tail -50
```

### Port 8080 Not Exposed
Jika Docker container tidak expose port 8080:

```bash
# Check exposed ports
docker port b8sc48s8s0c4w00008k808w8

# If 8080 not listed, rebuild with correct Dockerfile
```

### WhatsApp Binary Missing
```bash
# Check if binary exists
docker exec b8sc48s8s0c4w00008k808w8 ls -lh /usr/local/bin/whatsapp-web-api

# If missing, rebuild Docker image from latest Dockerfile
```

## Root Cause Analysis

Masalah ini terjadi karena:
1. ✅ Database session sudah di-clear (0 rows in whatsmeow_sessions)
2. ❌ WhatsApp Web API service tidak start saat container boot
3. ❌ Atau binary tidak ada / corrupt

Solusi permanen:
- Pastikan `start-multi-services.sh` di-execute saat container start
- Pastikan binary ada di `/usr/local/bin/whatsapp-web-api`
- Pastikan `DATABASE_URL` environment variable di-set dengan benar

## Next Steps After Restart

1. **Test pairing immediately**: https://auto.lumiku.com/api/wa/pair
2. **Scan QR code** dengan WhatsApp di HP dalam 60 detik
3. **Verify connected**:
   ```bash
   curl https://auto.lumiku.com/api/wa/health
   # Should return: "paired": true, "connected": true
   ```
4. **Test send message** via admin bot

---

**Status**: Database cleared ✅ | Service restart needed ⏳
