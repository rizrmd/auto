# AutoLeads WhatsApp Bot System

Complete WhatsApp bot infrastructure for AutoLeads with customer and admin bots.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp (Fonnte)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Bot Orchestrator (index.ts)                 │
│  • Routes messages to customer or admin bot                 │
│  • Identifies tenant by device number                       │
│  • Manages user type detection                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  Customer Bot    │      │    Admin Bot     │
│  • 24/7 support  │      │  • /upload flow  │
│  • RAG engine    │      │  • /status cmd   │
│  • Lead capture  │      │  • /list cmd     │
└──────────────────┘      └──────────────────┘
        │                           │
        └─────────────┬─────────────┘
                      ▼
        ┌──────────────────────────┐
        │  State Manager           │
        │  • Multi-step flows      │
        │  • Context storage       │
        │  • Auto-expiry (30min)   │
        └──────────────────────────┘
```

## File Structure

```
backend/src/
├── bot/
│   ├── index.ts                    # Main orchestrator
│   ├── state-manager.ts            # Conversation state management
│   │
│   ├── customer/                   # Customer Bot
│   │   ├── handler.ts              # Main message handler
│   │   ├── intent-recognizer.ts   # Intent classification
│   │   ├── rag-engine.ts           # RAG (DB → LLM → Response)
│   │   ├── response-builder.ts    # Format responses
│   │   └── lead-capture.ts         # Auto-create leads
│   │
│   └── admin/                      # Admin Bot
│       ├── handler.ts              # Command handler
│       ├── upload-flow.ts          # Multi-step upload state machine
│       ├── parser.ts               # Parse car info from text
│       ├── display-code-generator.ts # Generate #A01, #A02, etc
│       └── commands/
│           ├── upload.ts           # /upload command
│           ├── status.ts           # /status command
│           └── list.ts             # /list command
│
├── llm/
│   ├── gemini.ts                   # Gemini Pro API client
│   ├── prompt-builder.ts           # Build prompts with context
│   └── cache.ts                    # Cache common responses
│
└── whatsapp/
    ├── fonnte-client.ts            # Fonnte API wrapper
    ├── message-sender.ts           # Send WA messages
    └── media-downloader.ts         # Download photos from WA
```

## Key Features

### 1. Customer Bot (24/7 AI Support)

**Intent Recognition:**
- `inquiry` - General car questions
- `price` - Price queries
- `location` - Location/address
- `negotiation` - Price negotiation
- `greeting` - Hello/hi
- `test_drive` - Test drive requests

**RAG Engine (Retrieval-Augmented Generation):**
```typescript
// Flow: Query DB → Inject into Prompt → LLM → Response
1. Customer: "Ada Avanza 2020 hitam?"
2. Query DB: Find matching cars (brand, model, year, color)
3. Build prompt with car data + tenant info
4. Call Gemini Pro API
5. Return contextual response
```

**Lead Capture:**
- Auto-creates lead on first message
- Updates lead status based on intent (new → warm → hot)
- Tags conversations (inquiry, price-query, negotiation)
- Links lead to specific car

**Response Caching:**
Common queries cached to save LLM costs:
- "lokasi" → Location response
- "jam buka" → Business hours
- "kontak" → Contact info

### 2. Admin Bot (Inventory Management)

**Commands:**
- `/upload` - Upload car in 2 minutes via WA
- `/status B1234XYZ sold` - Update car status
- `/list available` - Show inventory
- `/cancel` - Cancel current process

**Upload Flow (8 Steps):**
1. Brand & Model (e.g., "Toyota Avanza 1.3 G")
2. Year & Color (e.g., "2020 Hitam Metalik")
3. Transmission & KM (e.g., "Manual 45000")
4. Price (e.g., "185jt" or "185000000")
5. Plate Number (optional) (e.g., "B 1234 XYZ")
6. Key Features (optional) (e.g., "Velg racing, Spoiler")
7. Photos (upload 1-10 images)
8. Confirm & Save

**Display Code Generator:**
Auto-generates unique codes:
- #A01, #A02 for Avanza
- #V01, #V02 for Veloz
- #H01, #H02 for Honda
- #X01, #X02 for Xenia
- etc.

### 3. State Management

**Conversation States:**
```typescript
{
  currentFlow: 'idle' | 'upload_car' | 'credit_calc',
  currentStep: number,
  context: {
    carData?: { brand, model, year, ... },
    calcData?: { carPrice, downPayment, ... }
  },
  expiresAt: Date // Auto-reset after 30 minutes
}
```

**Multi-Step Flows:**
- Maintains context between messages
- Auto-expires after 30 minutes of inactivity
- Supports cancellation (/cancel)
- Validates each step before proceeding

## Usage Examples

### Customer Interactions

```
Customer: "Ada Avanza 2020 hitam?"
Bot: "Ada nih! Saya menemukan 2 mobil:

1. Toyota Avanza 2020 Hitam Metalik #A01
   💰 185 juta | 📅 2020 | ⚙️ Manual | 🛣️ 45,000 km
   Kode: #A01

2. Toyota Avanza 2020 Hitam #A02
   💰 180 juta | 📅 2020 | ⚙️ Manual | 🛣️ 50,000 km
   Kode: #A02

Mau info lebih detail yang mana? Sebutkan kode mobilnya ya 😊"

---

Customer: "Berapa harga #A01?"
Bot: "🚗 Toyota Avanza 2020 Hitam Metalik #A01

💰 Harga: Rp 185 juta
📅 Tahun: 2020
🎨 Warna: Hitam Metalik
⚙️ Transmisi: Manual
🛣️ Kilometer: 45,000 km

✨ Kelebihan:
• Velg racing 16 inch
• Spoiler belakang
• Interior rapi

📝 Kondisi istimewa, service record lengkap

Tertarik test drive? 😊"

---

Customer: "Bisa nego?"
Bot: "💰 Untuk nego harga, saya akan hubungkan Anda dengan sales kami ya!

Harga yang tertera sudah harga terbaik kami, tapi tetap bisa dibicarakan langsung dengan sales untuk:
✅ Cash keras (pembayaran tunai)
✅ Trade-in (tukar tambah)
✅ Kredit dengan DP rendah

Mau saya hubungkan dengan sales sekarang? 😊"
```

### Admin Interactions

```
Admin: /upload
Bot: "🚗 Upload Mobil Baru

Baik, saya akan bantu upload mobil baru. Proses ini sekitar 2 menit.

Step 1/8: Brand & Model
Contoh: Toyota Avanza 1.3 G

Ketik brand dan model mobil:"

---

Admin: Toyota Avanza 1.3 G
Bot: "✅ Brand: Toyota, Model: Avanza 1.3 G

Step 2/8: Tahun & Warna
Contoh: 2020 Hitam Metalik

Ketik tahun dan warna:"

---

Admin: 2020 Hitam Metalik
Bot: "✅ Tahun: 2020, Warna: Hitam Metalik

Step 3/8: Transmisi & KM
Contoh: Manual 45000

Ketik transmisi (Manual/Matic) dan kilometer:"

---

[... continues through 8 steps ...]

---

Bot: "✅ Mobil berhasil diupload!

📋 Kode: #A01
🔗 URL: showroom-surabaya.autoleads.id/cars/avanza-2020-hitam-a01

Mobil sudah LIVE di website dan siap dilihat customer! 🚀"

---

Admin: /status B1234XYZ sold
Bot: "✅ Status Updated

Mobil: Toyota Avanza 2020 Hitam #A01
Status: SOLD
Terjual: 23 Oktober 2025"

---

Admin: /list available
Bot: "📋 Daftar Mobil (AVAILABLE)
Total: 15 mobil

1. #A01 - Toyota Avanza
   📅 2020 | 💰 185jt | ⚙️ Manual
   🔖 AVAILABLE | 🚗 B 1234 XYZ

2. #V01 - Toyota Veloz
   📅 2020 | 💰 215jt | ⚙️ Matic
   🔖 AVAILABLE | 🚗 L 9012 DEF

[...]

📊 Statistik:
• Available: 15
• Sold: 8
• Booking: 2
• Draft: 1"
```

## Integration Points

### 1. Webhook Endpoint

Create webhook endpoint in `backend/index.tsx`:

```typescript
import { BotOrchestrator } from './src/bot';

const botOrchestrator = new BotOrchestrator(prisma);

// Fonnte webhook
"/webhook/fonnte": {
  async POST(req) {
    const body = await req.json();

    const result = await botOrchestrator.processMessage({
      device: body.device,      // Showroom WA number
      sender: body.sender,      // Customer phone
      message: body.message,
      media: body.media,
      timestamp: new Date()
    });

    return Response.json(result);
  }
}
```

### 2. Environment Variables

Add to `.env`:

```env
# Fonnte API
FONNTE_API_KEY=your_fonnte_api_key

# Gemini Pro API
GEMINI_API_KEY=your_gemini_api_key

# Storage
UPLOAD_DIR=./uploads
```

### 3. Database Setup

Already configured in `prisma/schema.prisma`:
- `conversation_states` table for state management
- `leads` table for lead tracking
- `messages` table for chat history

## Performance & Optimization

### LLM Cost Control

1. **Response Caching:**
   - Common queries cached (location, hours, contact)
   - Cache hit rate: ~30-40%
   - Saves ~Rp 150k-200k/month per tenant

2. **Rate Limiting:**
   - Max 10 messages per customer per minute
   - Prevents spam and abuse

3. **Prompt Optimization:**
   - Only include top 3 matching cars
   - Keep prompts under 30k tokens
   - Use efficient prompt templates

### Database Optimization

1. **Indexes:**
   - `(tenantId, userPhone)` for state lookup
   - `(tenantId, status)` for car queries
   - `(tenantId, brand, model, year)` for search

2. **Query Optimization:**
   - Limit results to 3 cars for RAG
   - Use `select` to fetch only needed fields
   - Paginate list commands (20 items max)

## Testing

### Manual Testing

```bash
# Send test message to bot
curl -X POST http://localhost:3000/webhook/fonnte \
  -H "Content-Type: application/json" \
  -d '{
    "device": "628123456789",
    "sender": "6281234567890",
    "message": "Ada Avanza 2020?"
  }'
```

### Test Scenarios

**Customer Bot:**
- [ ] General inquiry (brand + model)
- [ ] Price query
- [ ] Location query (cached)
- [ ] Negotiation request
- [ ] Test drive request
- [ ] Unknown query (fallback to LLM)

**Admin Bot:**
- [ ] Complete upload flow (8 steps)
- [ ] Cancel mid-flow
- [ ] Update car status
- [ ] List inventory
- [ ] Invalid command

## Monitoring

### Metrics to Track

1. **Customer Bot:**
   - Messages processed per day
   - Intent distribution
   - Leads created
   - Cache hit rate
   - LLM API calls

2. **Admin Bot:**
   - Cars uploaded per day
   - Upload completion rate
   - Average upload time
   - Command usage

3. **System:**
   - Response time (<3s target)
   - Error rate
   - Webhook success rate

### Logs

```typescript
console.log('Bot message processed:', {
  tenantId,
  userType,
  intent: intent.type,
  cached: isCached,
  responseTime: endTime - startTime
});
```

## Troubleshooting

### Common Issues

1. **Bot not responding:**
   - Check Fonnte API key
   - Verify webhook URL is accessible
   - Check tenant WhatsApp number mapping

2. **LLM errors:**
   - Check Gemini API key
   - Verify API quota
   - Check prompt length (<30k tokens)

3. **State not persisting:**
   - Check database connection
   - Verify conversation_states table
   - Check expiry time (30 min default)

4. **Upload flow stuck:**
   - User can type `/cancel` to reset
   - State auto-expires after 30 min
   - Check parser logic for step validation

## Future Enhancements

- [ ] Voice message support
- [ ] Video message support
- [ ] Multi-language support (English, Chinese)
- [ ] Advanced analytics dashboard
- [ ] Broadcast campaigns
- [ ] Scheduled messages
- [ ] AI-powered lead scoring
- [ ] Integration with CRM systems

## License

Proprietary - AutoLeads Platform

---

**Created:** 2025-10-23
**Last Updated:** 2025-10-23
**Version:** 1.0.0
