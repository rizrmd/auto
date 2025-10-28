# 📊 Data yang Dikirim oleh Webhook WhatsApp

## ✅ GOOD NEWS: Bot Sudah Menerima & Acknowledge Foto dengan Benar!

Berdasarkan log terbaru (08:44-08:45), bot **SUDAH BERHASIL** detect dan acknowledge semua foto! 🎉

---

## 📸 Contoh Payload untuk Image (Format Terbaru)

### Payload 1: Image 1 (191 KB)
```json
{
  "event": "message",
  "message": "Image received",
  "sender": "6281235108908@s.whatsapp.net",
  "chat": "6281235108908@s.whatsapp.net",
  "time": "2025-10-28T08:44:59.141305942Z",
  "attachment": {
    "caption": "",
    "file_length": 191346,
    "mimetype": "image/jpeg",
    "type": "image"
  }
}
```

**Bot Response:** ✅
```
📸 Foto terdeteksi!

⚠️ Catatan: Webhook WhatsApp tidak mengirim URL foto.
Foto perlu diupload via Web Dashboard setelah mobil tersimpan.

💡 Solusi:
1. Ketik "selesai" untuk lanjut tanpa foto
2. Upload foto via https://auto.lumiku.com/admin setelah mobil tersimpan

Atau ketik "/cancel" untuk batal dan upload via web langsung.
```

---

### Payload 2: Image 2 (196 KB)
```json
{
  "event": "message",
  "message": "Image received",
  "sender": "6281235108908@s.whatsapp.net",
  "chat": "6281235108908@s.whatsapp.net",
  "time": "2025-10-28T08:45:00.215291922Z",
  "attachment": {
    "caption": "",
    "file_length": 196753,
    "mimetype": "image/jpeg",
    "type": "image"
  }
}
```

**Bot Response:** ✅ (Silent - avoid spam)

---

### Payload 3-6: Images 3-6
Similar structure, different sizes:
- Image 3: 182,653 bytes (182 KB)
- Image 4: 194,688 bytes (194 KB)
- Image 5: 324,191 bytes (324 KB)
- Image 6: 298,097 bytes (298 KB)

**Bot Response:** ✅ (Silent - avoid spam)

---

## 📋 Struktur Payload Lengkap

### Field-by-Field Explanation:

| Field | Value Example | Keterangan |
|-------|---------------|------------|
| `event` | `"message"` | Tipe event (always "message" for incoming) |
| `message` | `"Image received"` | Text message (for images, always "Image received") |
| `sender` | `"6281235108908@s.whatsapp.net"` | Phone number pengirim (JID format) |
| `chat` | `"6281235108908@s.whatsapp.net"` | Chat ID (sama dengan sender untuk private chat) |
| `time` | `"2025-10-28T08:44:59.141305942Z"` | Timestamp ISO 8601 format |
| `attachment.caption` | `""` | Caption foto (empty jika tidak ada) |
| `attachment.file_length` | `191346` | Ukuran file dalam bytes |
| `attachment.mimetype` | `"image/jpeg"` | MIME type (image/jpeg, image/png, dll) |
| `attachment.type` | `"image"` | Tipe attachment (image, video, document, dll) |

---

## ⚠️ MISSING FIELD: URL

### Yang TIDAK Ada di Payload:

❌ **`attachment.url`** - URL untuk download foto

**Contoh yang diharapkan (tapi TIDAK ada):**
```json
{
  "attachment": {
    "type": "image",
    "url": "https://api.whatsapp.com/media/xxx",  // ← TIDAK ADA!
    "mimetype": "image/jpeg",
    "file_length": 191346
  }
}
```

**Dampak:**
- Bot bisa detect attachment ✅
- Bot tahu type, size, mimetype ✅
- Bot TIDAK bisa download karena no URL ❌

---

## 📊 Contoh Payload untuk Text Message

### Text Message Normal:
```json
{
  "event": "message",
  "message": "selesai",
  "sender": "6281235108908@s.whatsapp.net",
  "chat": "6281235108908@s.whatsapp.net",
  "time": "2025-10-28T08:38:31.368613545Z"
}
```

**Perbedaan:**
- ✅ Ada field `message` dengan text actual
- ❌ TIDAK ada field `attachment`

---

## 🔍 Analisis Bot Processing

### Flow untuk Image (6 foto terakhir):

```
08:44:59 - Image 1 (191 KB)
[WEBHOOK] Media detected BUT NO URL (format 5)
[UPLOAD V2] Photo received but no URL available
[WEBHOOK] Bot response: "📸 Foto terdeteksi! ⚠️ Catatan..."
✅ User menerima acknowledgment

08:45:00 - Image 2 (196 KB)
[WEBHOOK] Media detected BUT NO URL
[UPLOAD V2] Photo received but no URL available
[WEBHOOK] Bot response: "📸 Foto terdeteksi! ⚠️ Catatan..."
✅ User menerima acknowledgment (seharusnya silent di foto ke-2+)

08:45:01 - Image 3 (182 KB)
✅ Same pattern

08:45:02 - Image 4 (194 KB)
✅ Same pattern

08:45:03 - Image 5 (324 KB)
✅ Same pattern

08:45:05 - Image 6 (298 KB)
✅ Same pattern
```

**Problem:** Bot kirim acknowledgment untuk SEMUA foto, padahal seharusnya hanya foto pertama! 🤔

---

## 🐛 BUG DITEMUKAN: Spam Acknowledgment

**Expected Behavior:**
- Photo 1: Send acknowledgment ✅
- Photos 2-4: Silent (avoid spam) ✅
- Photo 5: Send progress update ✅
- Photos 6-9: Silent ✅

**Actual Behavior (dari log):**
- Photo 1: ✅ "📸 Foto terdeteksi!"
- Photo 2: ❌ "📸 Foto terdeteksi!" (should be silent!)
- Photo 3: ❌ "📸 Foto terdeteksi!" (should be silent!)
- Photo 4: ❌ "📸 Foto terdeteksi!" (should be silent!)
- Photo 5: ❌ "📸 Foto terdeteksi!" (should be silent!)
- Photo 6: ❌ "📸 Foto terdeteksi!" (should be silent!)

**Root Cause:**
Code checks `if (photoCount === 1)` tapi photoCount tidak persistent! Setiap foto baru, context di-reset jadi photoCount selalu 1!

---

## 📋 Summary Data Webhook

### Image Payload Structure:
```typescript
interface ImagePayload {
  event: "message";
  message: "Image received";
  sender: string;  // Format: "62xxx@s.whatsapp.net"
  chat: string;    // Same as sender for private chat
  time: string;    // ISO 8601 timestamp
  attachment: {
    caption: string;      // Caption foto (bisa kosong)
    file_length: number;  // Ukuran file (bytes)
    mimetype: string;     // MIME type (image/jpeg, image/png)
    type: "image";        // Tipe attachment
    // ❌ url: string;    // MISSING - tidak ada!
  };
}
```

### Text Payload Structure:
```typescript
interface TextPayload {
  event: "message";
  message: string;  // Text actual dari user
  sender: string;
  chat: string;
  time: string;
  // ❌ NO attachment field
}
```

---

## ✅ STATUS BOT PROCESSING

### What Works:
- ✅ Webhook sends image data
- ✅ Bot detects image attachment
- ✅ Bot acknowledges photo receipt
- ✅ Bot informs user about URL limitation
- ✅ Bot provides solution (upload via web)

### What Doesn't Work:
- ❌ Webhook doesn't send download URL
- ❌ Bot can't download photos automatically
- ❌ Bot sends acknowledgment for ALL photos (should be selective)
- ❌ photoCount doesn't persist across photos

### What Needs Fix:
1. **Fix photoCount persistence** - Store in state properly
2. **Fix acknowledgment spam** - Only first photo + every 5th
3. **Alternative:** Configure webhook to send URLs (permanent solution)

---

## 🔧 NEXT STEPS

### Option 1: Fix photoCount Persistence (Quick Fix)
```typescript
// CURRENT (broken):
const photoCount = existingPhotos.length + 1;  // Always 1!

// SHOULD BE:
const photoCount = (context.carData?.photoCount || 0) + 1;
await this.stateManager.updateState(tenant.id, userPhone, {
  context: {
    ...context,
    carData: {
      ...context.carData,
      photoCount: photoCount
    }
  }
});
```

### Option 2: Configure Webhook to Send URLs (Permanent)
Contact WhatsApp API provider untuk enable URL field di webhook payload.

### Option 3: Fetch Media from WhatsApp API
Implement `getMedia(messageId)` method to fetch URL separately.

---

## 📊 STATISTICS dari Log

**Test terakhir (08:44-08:45):**
- Total images received: 6
- Total acknowledgments sent: 6 (should be 2: photo 1 + photo 5)
- Average image size: 231 KB
- Image format: All JPEG
- Processing time: ~1 second per image

---

**Kesimpulan:**
Bot **SUDAH MENERIMA** data foto dari webhook dengan lengkap (type, size, mimetype) ✅

Yang **TIDAK ADA** hanya URL untuk download ❌

Bot **SUDAH ACKNOWLEDGE** tapi terlalu banyak (spam) karena photoCount bug 🐛
