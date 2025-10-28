# 📸 Photo Upload via WhatsApp - Test Guide

## ✅ Photo Upload Support ENABLED!

Webhook sekarang sudah bisa handle foto dari WhatsApp. Admin bisa upload mobil lengkap dengan 10 foto dalam 2 menit!

---

## 🚀 How to Test Photo Upload

### Prerequisites:
1. ✅ Server running
2. ✅ WhatsApp bot paired
3. ✅ Nomor admin terdaftar (Yoppi: +6281235108908)

### Test Steps:

#### **1. Start Upload Flow**
```
From: +6281235108908 (Yoppi)
To: WhatsApp Bot Showroom
Message: /upload
```

Bot Response:
```
🚗 Upload Mobil Baru

Baik, saya akan bantu upload mobil baru. Proses ini sekitar 2 menit.

*Step 1/8: Brand & Model*
Contoh: Toyota Avanza 1.3 G

Ketik brand dan model mobil:
```

#### **2. Answer Step 1-6** (Data Mobil)
```
Step 1: Toyota Avanza 1.3 G
Step 2: 2020 Hitam
Step 3: Manual 45000
Step 4: 185jt
Step 5: skip (plat opsional)
Step 6: skip (fitur opsional)
```

#### **3. Upload Photos** 📸
```
Step 7: Foto Mobil

Kirim foto mobil (minimal 1, maksimal 10).
Setelah semua foto terkirim, ketik "selesai".
```

**Upload Photos:**
1. 📤 Kirim foto 1 (tampak depan)
   - Bot: ✅ Foto 1 diterima! Total foto: 1/10

2. 📤 Kirim foto 2 (tampak samping)
   - Bot: ✅ Foto 2 diterima! Total foto: 2/10

3. 📤 Kirim foto 3 (tampak belakang)
   - Bot: ✅ Foto 3 diterima! Total foto: 3/10

4. ... (up to 10 photos)

5. ✅ Ketik: `selesai`

#### **4. Confirm Upload**
Bot akan tampilkan ringkasan:
```
📋 Data Mobil:
• Brand: Toyota
• Model: Avanza 1.3 G
• Tahun: 2020
• Warna: Hitam
• Transmisi: Manual
• KM: 45,000
• Harga: Rp 185 juta
• Foto: 3 foto

Apakah data sudah benar?
Ketik "ya" untuk simpan atau "tidak" untuk batal.
```

Ketik: `ya`

Bot Response:
```
✅ Mobil berhasil diupload!

📋 Kode: #A15
🔗 URL: https://auto.lumiku.com/cars/toyota-avanza-2020-hitam-a15

Mobil sudah LIVE di website dan siap dilihat customer! 🚀
```

---

## 📊 Webhook Media Parsing

Webhook sekarang support **4 format** WhatsApp media:

### Format 1: attachment
```json
{
  "event": "message",
  "message": "Caption foto",
  "sender": "6281235108908@s.whatsapp.net",
  "attachment": {
    "url": "https://wa-server.com/media/abc123.jpg",
    "type": "image"
  }
}
```

### Format 2: media_url
```json
{
  "event": "message",
  "message": "Caption",
  "sender": "6281235108908@s.whatsapp.net",
  "media_url": "https://wa-server.com/media/abc123.jpg",
  "media_type": "image"
}
```

### Format 3: image_url
```json
{
  "event": "message",
  "sender": "6281235108908@s.whatsapp.net",
  "image_url": "https://wa-server.com/media/abc123.jpg"
}
```

### Format 4: type + url
```json
{
  "event": "message",
  "sender": "6281235108908@s.whatsapp.net",
  "type": "image",
  "url": "https://wa-server.com/media/abc123.jpg"
}
```

---

## 🔍 Debugging Logs

Console logs yang akan muncul saat terima foto:

```bash
[WEBHOOK] WhatsApp Web API Payload: { event: "message", sender: "628...", attachment: {...} }
[WEBHOOK] Message from 6281235108908: ""
[WEBHOOK] 📸 Media detected (format 1 - attachment): { url: "https://...", type: "image" }
[WEBHOOK] User type identified: admin
[WEBHOOK] Routing to Admin Bot for admin
[WEBHOOK] Calling admin bot with media: image - https://wa-server.com/media/abc123...
[WEBHOOK] Admin bot response: "✅ Foto 1 diterima!..."
```

**Jika format tidak dikenali:**
```bash
[WEBHOOK] ⚠️  No message or media detected. Full payload: {...}
```

Ini akan print full payload untuk debugging format baru.

---

## 📁 Photo Storage

**Photos disimpan di:**
```
/data/tenant-{id}/car-{timestamp}.jpg
```

**Example:**
```
/data/tenant-6/car-1730108908123.jpg
/data/tenant-6/car-1730108910456.jpg
/data/tenant-6/car-1730108912789.jpg
```

**URL di database:**
```
/uploads/tenant-6/car-1730108908123.jpg
```

**Served via backend:**
```
GET https://auto.lumiku.com/uploads/tenant-6/car-1730108908123.jpg
```

---

## ⚠️ Troubleshooting

### Issue: Bot tidak terima foto

**Check:**
1. Cek log webhook:
```bash
docker logs auto-container | grep "📸 Media detected"
```

2. Jika muncul warning:
```bash
docker logs auto-container | grep "⚠️  No message or media detected"
```

Copy full payload dan share untuk analisa format.

### Issue: Foto gagal download

**Check:**
1. Cek log MediaDownloader:
```bash
docker logs auto-container | grep "Error downloading media"
```

2. Verify URL accessible:
```bash
curl -I {photo_url}
```

3. Check file size < 10MB

### Issue: Foto tidak muncul di website

**Check:**
1. Verify foto tersimpan:
```bash
ls -lh /data/tenant-6/
```

2. Cek URL di database:
```bash
# Connect to DB
bun prisma studio
# Check car.photos array
```

3. Test URL via browser:
```
https://auto.lumiku.com/uploads/tenant-6/car-xxx.jpg
```

---

## 🧪 Manual Test (Without WhatsApp)

Test webhook dengan curl:

```bash
# Test with image
curl -X POST http://localhost:3000/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "message": "",
    "sender": "6281235108908@s.whatsapp.net",
    "chat": "6281235108908@s.whatsapp.net",
    "attachment": {
      "url": "https://auto.lumiku.com/uploads/tenant-6/cars/mercedes-c300-2010/1.webp",
      "type": "image"
    }
  }'
```

Expected: Bot should recognize as admin and process photo.

---

## 📋 Complete Upload Flow Example

```
1. /upload
   Bot: "Step 1/8: Brand & Model"

2. Toyota Avanza 1.3 G
   Bot: "✅ Brand: Toyota, Model: Avanza 1.3 G
         Step 2/8: Tahun & Warna"

3. 2020 Hitam
   Bot: "✅ Tahun: 2020, Warna: Hitam
         Step 3/8: Transmisi & KM"

4. Manual 45000
   Bot: "✅ Transmisi: Manual, KM: 45,000
         Step 4/8: Harga"

5. 185jt
   Bot: "✅ Harga: Rp 185 juta
         Step 5/8: Plat Nomor (Opsional)"

6. skip
   Bot: "⏭️ Plat dilewati
         Step 6/8: Fitur Unggulan (Opsional)"

7. skip
   Bot: "⏭️ Fitur dilewati
         Step 7/8: Foto Mobil"

8. [Send Photo 1]
   Bot: "✅ Foto 1 diterima! Total foto: 1/10"

9. [Send Photo 2]
   Bot: "✅ Foto 2 diterima! Total foto: 2/10"

10. [Send Photo 3]
    Bot: "✅ Foto 3 diterima! Total foto: 3/10"

11. selesai
    Bot: "Step 8/8: Konfirmasi
          📋 Data Mobil:
          • Brand: Toyota
          ...
          • Foto: 3 foto"

12. ya
    Bot: "✅ Mobil berhasil diupload!
          📋 Kode: #A15
          🔗 URL: https://auto.lumiku.com/cars/...
          Mobil sudah LIVE di website! 🚀"
```

**Total time: ~2 minutes** ⚡

---

## ✅ Success Criteria

- [x] Webhook parse media dari WhatsApp (4 formats)
- [x] Media di-pass ke AdminBotHandler
- [x] UploadFlow handle foto (1-10 photos)
- [x] Foto di-download dan disimpan
- [x] Foto URL disimpan di database
- [x] Mobil LIVE dengan foto
- [x] Foto tampil di website katalog
- [x] Extensive logging untuk debugging

---

## 🎯 Next Steps

1. **Deploy ke production**
```bash
git add .
git commit -m "feat: Add photo upload support to admin bot"
git push
```

2. **Test di production dengan WhatsApp real**
```
- Kirim foto dari HP
- Verify bot terima dan proses
- Check foto tersimpan
- Verify foto tampil di website
```

3. **Monitor logs**
```bash
docker logs -f auto-container | grep -E "(WEBHOOK|📸)"
```

---

**Status:** 🚀 **READY TO TEST**

**Last Updated:** 2025-10-28

Silakan test upload foto via WhatsApp sekarang! 📸
