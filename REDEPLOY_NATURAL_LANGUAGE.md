# 🚀 REDEPLOY: Natural Language Processing Update

## ⚠️ STATUS: Code sudah di-push, BELUM di-deploy ke production

**Commits yang perlu di-deploy:**
1. `6f6703f` - Natural language processing untuk upload
2. `abf257f` - Custom domain fix (auto.lumiku.com)

**Bukti code belum aktif:**
- Yoppi test upload: `upload Honda Freed PSD Matic tahun 2012 KM 145515 harga 145jt`
- Bot balas: `❌ Terjadi kesalahan` (old code)
- Expected: Bot parse data dengan natural language ✅

---

## 📋 CARA REDEPLOY (3 OPTIONS)

### **OPTION 1: Via Coolify Dashboard (RECOMMENDED)**

1. **Login ke Coolify:**
   ```
   https://cf.avolut.com
   ```

2. **Cari Application:**
   - Application ID: `b8sc48s8s0c4w00008k808w8`
   - Nama: AutoLeads

3. **Manual Redeploy:**
   - Klik tab **"Deployments"**
   - Klik button **"Deploy"** atau **"Redeploy"**
   - Wait 2-3 minutes untuk rebuild

4. **Verifikasi:**
   - Check "Latest Deployment" status = Success
   - Check "Last Commit" = `abf257f` (custom domain fix)

---

### **OPTION 2: Via SSH Command**

**Cepat & Simple:**

```bash
# SSH ke server
ssh root@cf.avolut.com

# Restart container (jika auto-pull sudah jalan)
docker restart b8sc48s8s0c4w00008k808w8

# Atau rebuild manual (jika perlu pull code baru)
docker exec b8sc48s8s0c4w00008k808w8 sh -c "cd /app && git pull origin main && bun install && exit"
docker restart b8sc48s8s0c4w00008k808w8
```

**Check logs setelah restart:**

```bash
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 50"
```

Expected output:
```
🚀 AutoLeads Backend Server
📦 Version: Production
🌐 Server: http://localhost:3000
✅ Database connected
✅ WhatsApp Web API initialized
✅ Natural Language Processing enabled
```

---

### **OPTION 3: Full Rebuild (jika option 1 & 2 gagal)**

```bash
# SSH ke server
ssh root@cf.avolut.com

# Stop container
docker stop b8sc48s8s0c4w00008k808w8

# Remove container (HATI-HATI: data uploads tetap aman di volume)
docker rm b8sc48s8s0c4w00008k808w8

# Rebuild via Coolify dashboard atau manual pull & build
# (Coolify akan auto-create container baru dengan code terbaru)
```

---

## ✅ VERIFICATION STEPS

### 1. Check Container Status

```bash
ssh root@cf.avolut.com "docker ps | grep b8sc48s8s0c4w00008k808w8"
```

Expected:
```
b8sc48s8s0c4w00008k808w8   auto   Up 2 minutes   0.0.0.0:3000->3000/tcp
```

### 2. Check Latest Commit in Container

```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 sh -c 'cd /app && git log --oneline -1'"
```

Expected:
```
abf257f fix: Use custom domain for catalog URL in upload success message
```

### 3. Test Natural Language Upload via WhatsApp

**Send to bot:**
```
upload freed matic 2012 harga 145jt kondisi bagus
```

**Expected bot response:**
```
✅ Data Mobil Berhasil Diproses!
🤖 AI Natural Language ✨

📋 Informasi Mobil:
• Brand: Honda
• Model: Freed
• Tahun: 2012
• Transmisi: Matic
• Harga: Rp 145 juta
• Fitur: Kondisi Istimewa

📸 Langkah Selanjutnya:
Kirim foto mobil (1-10 foto).
Ketik "selesai" untuk lanjut.
```

**❌ Old Response (if code not deployed):**
```
❌ Terjadi kesalahan. Silakan coba lagi atau ketik /help untuk bantuan.
```

### 4. Check Environment Variables (PENTING!)

```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 env | grep ZAI"
```

**MUST HAVE:**
```
ZAI_API_KEY=sk-xxxxxxxxxxxxxx
ZAI_API_URL=https://api.z.ai/api/coding/paas/v4
ZAI_MODEL=glm-4.5v
```

**⚠️ Jika ZAI_API_KEY tidak ada:**
- Natural language LLM akan fail
- Fallback to parser (85.7% accuracy)
- Masih bisa jalan, tapi tidak optimal

**Cara set ZAI_API_KEY di Coolify:**
1. Login cf.avolut.com
2. Application → Environment Variables
3. Add variable:
   - Key: `ZAI_API_KEY`
   - Value: `your-zai-api-key-here`
   - Secret: ✓ (centang)
4. Save & Redeploy

---

## 🧪 TEST CASES (After Redeploy)

Test these natural language inputs via WhatsApp:

### Test 1: Minimal Input
```
upload freed matic 2012 harga 145jt
```
✅ Should work: Brand Honda inferred from "freed"

### Test 2: Natural Language
```
upload freed matic 2012 harga 145jt kondisi bagus
```
✅ Should work: Extract all data including kondisi

### Test 3: Complete Info
```
upload Honda Jazz 2019 hitam matic harga 187jt km 88000 velg racing
```
✅ Should work: Extract all details

### Test 4: Luxury Car
```
upload Mercedes C300 2015 silver harga 350jt km 65000
```
✅ Should work: Infer Mercedes-Benz from C300

---

## 📊 EXPECTED IMPROVEMENTS (After Deploy)

| Feature | Before (Old Code) | After (New Code) |
|---------|-------------------|------------------|
| **Natural Input** | ❌ Strict format required | ✅ Freeform text |
| **Brand Inference** | ❌ Must type brand | ✅ Auto-infer from model |
| **Success Rate** | 42.9% (6/14 tests) | 85.7% (12/14 tests) |
| **Catalog URL** | ❌ subdomain | ✅ auto.lumiku.com |
| **AI Enhancement** | ❌ Manual copywriting | ✅ AI auto-generate |

---

## 🐛 TROUBLESHOOTING

### Issue: Bot masih balas error "❌ Terjadi kesalahan"

**Solusi:**
```bash
# 1. Check logs untuk lihat actual error
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 100 | grep ERROR"

# 2. Restart container
ssh root@cf.avolut.com "docker restart b8sc48s8s0c4w00008k808w8"

# 3. Verify code version
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 sh -c 'cd /app && git log --oneline -5'"
```

### Issue: Auto-deploy tidak jalan

**Solusi:**
1. Check Coolify webhook settings
2. Manual trigger deploy via dashboard
3. Check GitHub webhook logs

### Issue: LLM extraction fail

**Solusi:**
1. Check ZAI_API_KEY di environment variables
2. Parser fallback akan tetap jalan (85.7% success)
3. Test with simpler input: `upload freed 2012 145jt`

---

## 📞 SUPPORT

Jika masih ada masalah setelah redeploy:

1. **Check container logs:**
   ```bash
   ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 200"
   ```

2. **Check database connection:**
   ```bash
   ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 bunx prisma db pull"
   ```

3. **Check WhatsApp webhook:**
   ```bash
   curl -X POST https://auto.lumiku.com/webhook/whatsapp \
     -H "Content-Type: application/json" \
     -d '{"event":"message","message":"test","sender":"6281235108908@s.whatsapp.net"}'
   ```

---

**Status:** 🔴 **AWAITING REDEPLOY**

**Next Action:** Pilih salah satu option di atas dan redeploy ke production

**After Deploy:** Test dengan Yoppi WhatsApp +6281235108908
