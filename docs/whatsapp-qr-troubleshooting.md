# WhatsApp QR Code Troubleshooting Guide

## Overview
Guide for troubleshooting WhatsApp QR code pairing issues in AutoLeads system.

## Common Issues & Solutions

### 1. QR Code Not Appearing
**Symptoms:** No QR code displayed on admin dashboard
**Causes:** WhatsApp already connected to another device
**Solution:**
```bash
# Force disconnect existing device
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -X POST 'http://localhost:8080/disconnect' -H 'Content-Type: application/json' -d '{}'"
```

### 2. QR Code Not Scanning
**Symptoms:** WhatsApp mobile app shows "Cannot connect device" or similar error
**Causes:**
- Existing device still registered
- Network issues
- WhatsApp app cache issues

**Solutions:**
1. **Force Disconnect (Recommended):**
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -X POST 'http://localhost:8080/disconnect' -H 'Content-Type: application/json' -d '{}'"
```

2. **Restart Container:**
```bash
ssh root@cf.avolut.com "docker restart b8sc48s8s0c4w00008k808w8"
```

3. **Clear WhatsApp Mobile App Cache:**
   - iOS: Settings → WhatsApp → Clear Cache
   - Android: Settings → Apps → WhatsApp → Storage → Clear Cache

### 3. Countdown Timer Issues
**Symptoms:** Timer shows incorrect time or doesn't count down
**Fixed in:** Commit cc0dcc8
**Solution:** Timer now shows fixed 120 seconds (2:00 format)

### 4. Real-time Status Not Updating
**Symptoms:** QR doesn't disappear after successful scan
**Fixed in:** Commit cc0dcc8
**Solution:** Implemented rapid polling (2 seconds) when QR active

## Quick Fix Commands

### Check WhatsApp Status
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -s http://localhost:8080/health"
```

### Force Disconnect Device
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -X POST 'http://localhost:8080/disconnect' -H 'Content-Type: application/json' -d '{}'"
```

### Test QR Generation
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -s http://localhost:8080/pair | head -c 100"
```

### Monitor Real-time Logs
```bash
ssh root@cf.avolut.com "docker logs --follow --tail=20 b8sc48s8s0c4w00008k808w8 | grep -E '(WHATSAPP|pair|scan|connect)'"
```

## Step-by-Step Troubleshooting

### Step 1: Check Current Status
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -s http://localhost:8080/health"
```
Expected: `{"success":true,"data":{"connected":false,"paired":false,...}}`

### Step 2: Force Disconnect if Connected
If status shows `connected: true`, force disconnect:
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -X POST 'http://localhost:8080/disconnect' -H 'Content-Type: application/json' -d '{}'"
```

### Step 3: Verify Disconnected
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -s http://localhost:8080/health"
```
Expected: `{"connected":false,"paired":false}`

### Step 4: Test QR Generation
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -s http://localhost:8080/pair | head -c 100"
```
Expected: Binary PNG data (starts with `�PNG`)

### Step 5: Test via Admin Dashboard
1. Open https://primamobil.id/admin/whatsapp
2. Click "Refresh QR"
3. Scan with WhatsApp mobile app
4. Verify auto-hide and success message

## Monitoring Tools

### Use Built-in Monitor
```bash
cd scripts/monitoring
./whatsapp-qr-monitor.sh
```

### Manual Monitoring
```bash
# Real-time status check
watch -n 2 'ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 curl -s http://localhost:8080/health"'

# Real-time logs
ssh root@cf.avolut.com "docker logs --follow --tail=50 b8sc48s8s0c4w00008k808w8"
```

## Expected Behavior After Fix

### QR Code Display
- ✅ Shows with countdown timer (2:00 format)
- ✅ Refresh button works properly
- ✅ Expires after 120 seconds

### Scanning Process
- ✅ Mobile WhatsApp can scan QR
- ✅ Admin dashboard detects pairing within 2 seconds
- ✅ QR auto-hides after successful pairing
- ✅ Success message appears: "🎉 WhatsApp connected successfully!"

### Post-Connection
- ✅ Status shows "Connected"
- ✅ Webhook configured properly
- ✅ Bot ready to send/receive messages

## Recent Improvements (Commit cc0dcc8)

1. **Fixed countdown timer** - Now exactly 120 seconds with MM:SS format
2. **Real-time status polling** - 2 seconds when QR active, 10 seconds when connected
3. **Auto-hide QR** - Immediately disappears after successful pairing
4. **Connection state detection** - Instant feedback when status changes
5. **Success feedback** - Clear success message after pairing

## Support

If issues persist:
1. Check container logs for errors
2. Verify database connectivity
3. Test with different mobile device
4. Check network connectivity
5. Contact development team with logs