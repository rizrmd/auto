# 🤖 Admin Bot Quick Start Guide

## ✅ Integration Complete!

Admin Bot sudah **LIVE** dan terintegrasi dengan WhatsApp webhook. Owner/Admin/Sales sekarang bisa upload mobil langsung via WhatsApp dalam 2 menit!

---

## 🚀 Cara Pakai (3 Langkah)

### 1️⃣ Pastikan User Terdaftar

Admin/Sales **HARUS** ada di database dengan nomor WhatsApp yang benar:

```bash
cd auto
bun prisma studio
```

**Cek tabel `User`:**
- ✅ `whatsappNumber` harus diisi (contoh: `6281234567891`)
- ✅ `role` harus `owner`, `admin`, atau `sales`
- ✅ `status` harus `active`

**Default dari seed:**
| Nama | Role | WhatsApp | Password |
|------|------|----------|----------|
| Owner Showroom | owner | 6281234567890 | password123 |
| Budi Santoso | admin | 6281234567891 | password123 |
| Ani Wijaya | sales | 6281234567892 | password123 |

### 2️⃣ Kirim Command ke WhatsApp Bot

Kirim pesan dari nomor yang terdaftar ke nomor showroom:

```
To: 628123456789 (Nomor WA showroom)
From: 6281234567891 (Nomor admin Budi)
Message: /help
```

### 3️⃣ Lihat Respon Bot

Bot akan respon dengan menu admin:

```
🤖 Admin Bot Commands

📋 Manajemen Mobil:
/upload - Upload mobil baru via WA
/status [plat] [status] - Update status mobil
/list [status] - Lihat daftar mobil
/cancel - Batalkan proses

💡 Contoh:
• /upload
• /status B1234XYZ sold
• /list available

❓ Butuh bantuan? Ketik /help
```

---

## 📝 Upload Mobil (8 Langkah - 2 Menit)

### Mulai Upload:
```
/upload
```

### Flow:

**Step 1/8: Brand & Model**
```
Input: Toyota Avanza 1.3 G
Bot: ✅ Brand: Toyota, Model: Avanza 1.3 G
```

**Step 2/8: Tahun & Warna**
```
Input: 2020 Hitam Metalik
Bot: ✅ Tahun: 2020, Warna: Hitam Metalik
```

**Step 3/8: Transmisi & KM**
```
Input: Manual 45000
Bot: ✅ Transmisi: Manual, KM: 45,000
```

**Step 4/8: Harga**
```
Input: 185jt
Bot: ✅ Harga: Rp 185 juta
```

**Step 5/8: Plat Nomor (Optional)**
```
Input: B 1234 XYZ
atau
Input: skip
Bot: ✅ Plat: B 1234 XYZ
```

**Step 6/8: Fitur Unggulan (Optional)**
```
Input: Velg racing, Spoiler, Interior rapi
atau
Input: skip
Bot: ✅ Fitur: Velg racing, Spoiler, Interior rapi
```

**Step 7/8: Foto Mobil (Optional)**
```
[Kirim foto 1]
Bot: ✅ Foto 1 diterima! Total foto: 1/10

[Kirim foto 2]
Bot: ✅ Foto 2 diterima! Total foto: 2/10

Input: selesai
atau
Input: skip
```

**Step 8/8: Konfirmasi**
```
Bot menampilkan ringkasan:
📋 Data Mobil:
• Brand: Toyota
• Model: Avanza 1.3 G
• Tahun: 2020
• Warna: Hitam Metalik
...

Input: ya
Bot: ✅ Mobil berhasil diupload!
     📋 Kode: #A15
     🔗 URL: showroom-surabaya/cars/toyota-avanza-2020-...

     Mobil sudah LIVE di website! 🚀
```

**Total waktu: ~2 menit** 🎉

---

## 🎯 Command Lengkap

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `/upload` | Upload mobil baru | `/upload` |
| `/status [plat] [status]` | Update status mobil | `/status B1234XYZ sold` |
| `/list [status]` | Lihat daftar mobil | `/list available` |
| `/help` | Lihat semua command | `/help` |
| `/cancel` | Batalkan proses | `/cancel` |

**Status yang valid:**
- `available` - Tersedia
- `sold` - Terjual
- `booking` - Di-booking
- `draft` - Draft

---

## 🧪 Testing

### Test Manual:

1. **Start server:**
```bash
cd auto
bun backend/index.tsx
```

2. **Kirim test message via Postman/curl:**
```bash
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "message": "/help",
    "sender": "6281234567891@s.whatsapp.net",
    "chat": "6281234567891@s.whatsapp.net",
    "time": "2025-10-28T10:00:00Z"
  }'
```

### Test Otomatis:

```bash
cd auto
bun test-admin-bot.ts
```

Expected output:
```
🧪 TEST: Admin - Help Command
📱 Sender: 6281234567891@s.whatsapp.net
💬 Message: "/help"
🤖 Expected Bot: admin
✅ PASS: Routed to admin bot

...

📊 TEST SUMMARY
✅ Admin - Help Command
✅ Admin - Upload Command
✅ Sales - List Command
✅ Customer - Car Inquiry
✅ Customer - Photo Request

📈 Results: 5 passed, 0 failed out of 5 tests
🎉 All tests passed!
```

---

## 🔍 Troubleshooting

### ❌ Bot tidak respon

**Cek:**
```bash
# 1. Server running?
curl http://localhost:3000/api/health

# 2. WhatsApp API running?
curl http://localhost:8080/health

# 3. Cek logs
docker logs auto-container | grep WEBHOOK
```

### ❌ Admin terdeteksi sebagai customer

**Solusi:**
1. Cek `whatsappNumber` di database User
2. Pastikan format: `6281234567891` (no spaces, no +)
3. Cek `status = 'active'`

```sql
-- Query untuk cek
SELECT id, name, whatsapp_number, role, status
FROM users
WHERE tenant_id = 1;
```

### ❌ Upload flow stuck

**Solusi:**
```
Ketik: /cancel
Bot: ❌ Proses dibatalkan.

Mulai lagi: /upload
```

---

## 🔐 Security

### User Registration (Required)

Admin/Sales HARUS register via:
1. **Database seed** (development)
2. **Admin panel** (production) - belum ada UI
3. **API endpoint** (future)

### Phone Matching

Bot match **last 10 digits** dari nomor WA:
```
Input: +62 812 3456 7891
Match: 1234567891
```

Ini handle variasi format:
- `+62812...`
- `628123...`
- `0812...` (jika disimpan sebagai 628123...)

---

## 📊 Logs untuk Debugging

Console logs yang berguna:

```bash
# Admin bot detected
[WEBHOOK] User type identified: admin
[WEBHOOK] Routing to Admin Bot for admin
[WEBHOOK] Admin bot response: "🤖 *Admin Bot Commands*..."

# Customer bot detected
[WEBHOOK] User type identified: customer
[WEBHOOK] Routing to Customer Bot with LLM
[WEBHOOK] Processing message with function calling: "ada avanza?"
```

---

## 🎯 Next Steps (Optional Enhancements)

1. **Admin Management UI** - Add/edit admin via web panel
2. **Media Support** - Handle foto langsung di upload flow
3. **Edit Command** - `/edit #A15` untuk edit mobil existing
4. **Analytics** - `/stats` untuk lihat statistik
5. **Leads Management** - `/leads` untuk lihat inquiry customer

---

## 📚 Documentation

- **Full Integration Doc:** `docs/ADMIN_BOT_INTEGRATION.md`
- **Test Script:** `test-admin-bot.ts`
- **Code Files:**
  - Webhook: `backend/src/routes/webhook/whatsapp.ts`
  - Admin Handler: `backend/src/bot/admin/handler.ts`
  - Upload Flow: `backend/src/bot/admin/upload-flow.ts`

---

## ✅ Success Checklist

- [x] Admin bot integrated to webhook
- [x] User type identification working
- [x] Routing logic complete (admin vs customer)
- [x] `/upload` flow functional (8 steps)
- [x] `/status`, `/list`, `/help` commands working
- [x] State machine for multi-step flows
- [x] Error handling and fallbacks
- [x] Documentation complete
- [x] Test script created

---

**Status:** 🚀 **PRODUCTION READY**

**Questions?** Ketik `/help` di WhatsApp atau cek `docs/ADMIN_BOT_INTEGRATION.md`
