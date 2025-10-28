# ✅ TEST UPLOAD VIA WHATSAPP - Natural Language Processing

## 🎉 DEPLOYMENT STATUS: **SUCCESS**

✅ Code sudah terdeploy di production (commit `abf257f`)
✅ Natural language processing sudah aktif
✅ Container running: b8sc48s8s0c4w00008k808w8
✅ File natural-language-extractor.ts ada di production

---

## ⚠️ IMPORTANT: Harus Pakai PREFIX "/"

**SALAH:**
```
upload Honda Freed PSD Matic tahun 2012 KM 145515 harga 145jt
```
❌ Bot akan balas help menu

**BENAR:**
```
/upload Honda Freed PSD Matic tahun 2012 KM 145515 harga 145jt
```
✅ Bot akan parse data dengan natural language

---

## 📝 TEST CASES (Via WhatsApp)

Kirim ke bot showroom via WhatsApp:

### Test 1: Complete Info (RECOMMENDED)
```
/upload Honda Freed PSD Matic tahun 2012 KM 145515 harga 145jt kondisi bagus
```

**Expected Response:**
```
✅ Data Mobil Berhasil Diproses!
🤖 AI Natural Language ✨ (atau 📝 Parser ⭐ jika LLM tidak tersedia)

📋 Informasi Mobil:
• Brand: Honda
• Model: Freed PSD
• Tahun: 2012
• Warna: Silver
• Transmisi: Matic
• KM: 145,515
• Harga: Rp 145 juta

📸 Langkah Selanjutnya:
Kirim foto mobil (1-10 foto).
Setelah semua foto terkirim, ketik "selesai" untuk lanjut.

Atau ketik "skip" jika tidak ada foto (dapat ditambah nanti).
```

---

### Test 2: Minimal Info
```
/upload freed matic 2012 harga 145jt
```

**Expected:** Bot parse dengan brand Honda inferred from "freed"

---

### Test 3: Natural Language
```
/upload freed matic 2012 harga 145jt kondisi bagus mulus
```

**Expected:** Bot extract semua data termasuk notes

---

### Test 4: Luxury Car
```
/upload Mercedes C300 2015 silver matic harga 350jt km 65000
```

**Expected:** Bot infer Mercedes-Benz from C300

---

## 📸 UPLOAD PHOTOS FLOW

**Setelah bot parse data, kirim foto:**

1. **Kirim Foto 1:**
   ```
   [📷 Send Image]
   ```
   Expected: `✅ Foto 1 diterima! Total: 1/10`

2. **Kirim Foto 2:**
   ```
   [📷 Send Image]
   ```
   Expected: `✅ Foto 2 diterima! Total: 2/10`

3. **Kirim Foto 3:**
   ```
   [📷 Send Image]
   ```
   Expected: `✅ Foto 3 diterima! Total: 3/10`

4. **Type "selesai":**
   ```
   selesai
   ```
   Expected: AI generate copywriting (2-3 detik), lalu show preview

5. **Type "ya" untuk confirm:**
   ```
   ya
   ```
   Expected:
   ```
   ✅ Mobil Berhasil Diupload!

   📋 Detail:
   • Kode: #F12
   • Nama: Honda Freed PSD 2012 Silver #F12
   • Harga: Rp 145 juta
   • Foto: 3 foto

   🔗 Link Katalog:
   https://auto.lumiku.com/cars/honda-freed-psd-2012-silver-f12

   🚀 Mobil sudah LIVE di website dan siap dilihat customer!
   ```

---

## 🐛 TROUBLESHOOTING

### Issue: Bot balas help menu

**Penyebab:** Lupa pakai "/" prefix

**Solusi:** Ketik `/upload` (dengan "/") bukan `upload`

---

### Issue: Bot balas "❌ Data tidak lengkap"

**Penyebab:** Missing required fields (brand, year, price)

**Solusi:** Minimal harus ada:
- Brand (atau model yang bisa inferred: freed→Honda, avanza→Toyota)
- Tahun (2000-2025)
- Harga (format: 145jt, 145juta, or 145000000)

Example:
```
/upload freed 2012 harga 145jt
```

---

### Issue: "❌ Terjadi kesalahan"

**Possible Causes:**
1. Parser error (typo di tahun: "tahub" instead of "tahun")
2. Database connection issue
3. State manager error

**Solution:**
- Check typo in message
- Try again with corrected message
- Contact admin if persists

---

## 📊 CHECK DEPLOYMENT

### 1. Verify Code Version
```bash
ssh root@cf.avolut.com "docker exec b8sc48s8s0c4w00008k808w8 ls -la /app/backend/src/bot/admin/ | grep natural"
```

Expected output:
```
-rw-r--r-- 1 root root 10050 Oct 28 06:21 natural-language-extractor.ts
```

### 2. Check Container Status
```bash
ssh root@cf.avolut.com "docker ps | grep b8sc48s8s0c4w00008k808w8"
```

Expected: Container Up and running

### 3. Check Recent Logs
```bash
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 --tail 50 | grep -E '(UPLOAD|WEBHOOK)'"
```

---

## ✅ SUCCESS CRITERIA

After successful upload, you should see:

1. ✅ Bot responds with parsed data immediately
2. ✅ Bot shows extraction method (🤖 LLM or 📝 Parser)
3. ✅ Bot accepts photos one by one with progress
4. ✅ Bot generates AI copywriting when user types "selesai"
5. ✅ Bot returns link with **auto.lumiku.com** domain (not subdomain)
6. ✅ Car is visible at the catalog URL

---

## 📞 WHO TO TEST

**Tester:** Yoppi (+6281235108908)
**Bot Number:** Registered WhatsApp number for showroom
**User Type:** Admin (verified in database)

---

**READY TO TEST!** 🚀

Kirim message via WhatsApp:
```
/upload Honda Freed PSD Matic tahun 2012 KM 145515 harga 145jt
```
