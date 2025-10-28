# 🔄 Upload Flow Complete Walkthrough

## Step-by-Step Flow

### 1️⃣ User Upload Command
**User sends:**
```
upload freed matic 2012 harga 145jt kondisi bagus
```

**Bot processes:**
- Natural Language Extractor extracts data
- Method: 🤖 LLM (production) or 📝 Parser (fallback)

**Bot responds:**
```
✅ *Data Mobil Berhasil Diproses!*
🤖 AI Natural Language ✨

📋 *Informasi Mobil:*
• Brand: Honda
• Model: Freed
• Tahun: 2012
• Warna: Silver
• Transmisi: Matic
• KM: N/A
• Harga: Rp 145 juta
• Fitur: Kondisi Istimewa

📸 *Langkah Selanjutnya:*
Kirim foto mobil (1-10 foto).
Setelah semua foto terkirim, ketik "selesai" untuk lanjut.

Atau ketik "skip" jika tidak ada foto (dapat ditambah nanti).
```

---

### 2️⃣ User Upload Photos
**User sends photo 1:**
🖼️ [Image]

**Bot responds:**
```
✅ Foto 1 diterima!

📸 Total foto: 1/10

Kirim foto lagi atau ketik "selesai" untuk lanjut ke konfirmasi.
```

**User sends photo 2:**
🖼️ [Image]

**Bot responds:**
```
✅ Foto 2 diterima!

📸 Total foto: 2/10

Kirim foto lagi atau ketik "selesai" untuk lanjut ke konfirmasi.
```

**User sends photo 3:**
🖼️ [Image]

**Bot responds:**
```
✅ Foto 3 diterima!

📸 Total foto: 3/10

Kirim foto lagi atau ketik "selesai" untuk lanjut ke konfirmasi.
```

---

### 3️⃣ User Confirms "selesai"
**User sends:**
```
selesai
```

**Bot processes:**
- AI generates copywriting (2-3 detik)
- Creates professional description
- Shows preview with AI-enhanced copy

**Bot responds:**
```
🤖 *AI Sedang Membuat Copywriting...*

⏳ Tunggu sebentar...

📋 *Preview Data Mobil:*

*Honda Freed 2012 Silver #F12*

💰 Harga: Rp 145 juta

📝 *Deskripsi:*
Honda Freed 2012 dengan kapasitas 7 penumpang yang nyaman dan efisien.
Transmisi matic untuk kenyamanan berkendara di kota. Cocok untuk keluarga
yang menginginkan mobil serbaguna dengan biaya perawatan rendah.

✨ *Kondisi:*
Unit terawat dengan kondisi istimewa. Interior rapi, eksterior mulus.
Transmisi matic responsif, AC dingin. Siap pakai untuk keluarga.

📊 *Spesifikasi:*
• Brand: Honda
• Model: Freed
• Tahun: 2012
• Warna: Silver
• Transmisi: Matic
• KM: N/A

🎯 *Fitur Unggulan:*
• Kondisi Istimewa

📸 Foto: 3 foto

Apakah data sudah benar?
Ketik "ya" untuk upload atau "tidak" untuk batal.
```

---

### 4️⃣ User Confirms "ya"
**User sends:**
```
ya
```

**Bot processes:**
- Generates display code (e.g., #F12)
- Creates slug from public name
- Saves to database
- Returns success message with link

**Bot responds:**
```
✅ *Mobil Berhasil Diupload!*

📋 *Detail:*
• Kode: #F12
• Nama: Honda Freed 2012 Silver #F12
• Harga: Rp 145 juta
• Foto: 3 foto

🔗 *Link Katalog:*
https://showroom-surabaya.autoleads.id/cars/honda-freed-2012-silver-f12

🚀 Mobil sudah LIVE di website dan siap dilihat customer!

Ketik /list untuk lihat semua mobil atau /upload untuk upload lagi.
```

---

## 🌐 URL Katalog

**Current URL Format:**
```
https://showroom-surabaya.autoleads.id/cars/{slug}
```

**Example:**
```
https://showroom-surabaya.autoleads.id/cars/honda-freed-2012-silver-f12
```

**⚠️ Issue Detected:**
Tenant has verified custom domain: `auto.lumiku.com`
But bot uses subdomain instead of custom domain.

**Expected URL (with custom domain):**
```
https://auto.lumiku.com/cars/honda-freed-2012-silver-f12
```

---

## 📊 Flow Summary

| Step | User Action | Bot Response | Duration |
|------|-------------|--------------|----------|
| 1 | Send upload command | Parse data + request photos | <1s |
| 2 | Upload photo 1 | Confirm receipt (1/10) | <1s |
| 3 | Upload photo 2 | Confirm receipt (2/10) | <1s |
| 4 | Upload photo 3 | Confirm receipt (3/10) | <1s |
| 5 | Type "selesai" | AI copywriting + preview | 2-3s |
| 6 | Type "ya" | Save to DB + return link | <1s |

**Total Time:** ~7-10 seconds (vs 5-7 minutes with old flow)
**User Messages:** 6 messages (vs 16+ with old flow)

---

## ✅ What's Working

1. ✅ Natural language parsing
2. ✅ Photo upload (1-10 photos)
3. ✅ Progress feedback per photo
4. ✅ AI copywriting generation
5. ✅ Database save
6. ✅ Success message with link

## ⚠️ Needs Fix

1. URL should use custom domain `auto.lumiku.com` instead of subdomain
2. Need to prioritize customDomain if customDomainVerified = true
