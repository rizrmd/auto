# WhatsApp Bot Integration Guide

Quick guide to integrate the WhatsApp bot system into your AutoLeads backend.

## Step 1: Install Dependencies

No additional dependencies needed! The bot system uses:
- Bun (already installed)
- Prisma (already configured)
- Native `fetch` API for HTTP calls

## Step 2: Environment Variables

Add to your `.env` file:

```env
# Fonnte WhatsApp Gateway
FONNTE_API_KEY=your_fonnte_api_key_here

# Google Gemini Pro API
GEMINI_API_KEY=your_gemini_api_key_here

# Upload directory for media files
UPLOAD_DIR=./uploads
```

### Getting API Keys

**Fonnte API Key:**
1. Sign up at https://fonnte.com
2. Go to Dashboard → Settings
3. Copy your API key
4. Cost: ~Rp 300k/month for unlimited messages

**Gemini API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create API key
3. Free tier: 60 requests/minute
4. Cost: Very cheap (~Rp 500k/month for 10k messages)

## Step 3: Update Backend Routes

Edit `backend/index.tsx` to add webhook endpoint:

```typescript
import { serve } from "bun";
import index from "../frontend/index.html";
import { PrismaClient } from "../generated/prisma";
import { BotOrchestrator } from "./src/bot";

const prisma = new PrismaClient();
const botOrchestrator = new BotOrchestrator(prisma);

const server = serve({
  routes: {
    // ... existing routes ...

    // Fonnte Webhook
    "/webhook/fonnte": {
      async POST(req) {
        try {
          const body = await req.json();

          console.log('Incoming WhatsApp message:', {
            device: body.device,
            sender: body.sender,
            message: body.message?.substring(0, 50)
          });

          // Process message
          const result = await botOrchestrator.processMessage({
            device: body.device,
            sender: body.sender,
            message: body.message,
            media: body.media,
            timestamp: new Date()
          });

          return Response.json(result);

        } catch (error) {
          console.error('Webhook error:', error);
          return Response.json(
            { success: false, error: 'Internal error' },
            { status: 500 }
          );
        }
      }
    },

    // Bot Health Check
    "/api/bot/health": {
      async GET(req) {
        const healthy = await botOrchestrator.healthCheck();
        return Response.json({ healthy });
      }
    },

    // ... rest of routes ...
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`📱 WhatsApp webhook: ${server.url}/webhook/fonnte`);
```

## Step 4: Configure Fonnte Webhook

1. Login to Fonnte dashboard
2. Go to **Settings** → **Webhook**
3. Set webhook URL: `https://auto.lumiku.com/webhook/fonnte`
4. Enable webhook
5. Test by sending a message to your WhatsApp number

## Step 5: Create Upload Directory

```bash
mkdir -p uploads
chmod 755 uploads
```

## Step 6: Test the Bot

### Test Customer Bot

Send WhatsApp message to your business number:

```
"Ada Avanza 2020 hitam?"
```

Expected response:
```
Ada nih! Saya menemukan 2 mobil:

1. Toyota Avanza 2020 Hitam #A01
   💰 185 juta | 📅 2020 | ⚙️ Manual
   Kode: #A01

Mau info lebih detail? 😊
```

### Test Admin Bot

Send WhatsApp message from admin phone:

```
"/upload"
```

Expected response:
```
🚗 Upload Mobil Baru

Step 1/8: Brand & Model
Contoh: Toyota Avanza 1.3 G

Ketik brand dan model mobil:
```

## Step 7: Register Admin Users

Admin bot only works for registered users. Add admin in database:

```typescript
// In prisma studio or seed script
await prisma.user.create({
  data: {
    tenantId: 1,
    name: "Admin Name",
    email: "admin@showroom.com",
    phone: "081234567890",
    whatsappNumber: "6281234567890", // Important: This number can use admin commands
    passwordHash: await hashPassword("password123"),
    role: "owner", // or "admin"
    status: "active"
  }
});
```

## Troubleshooting

### Bot not responding?

1. **Check webhook:**
   ```bash
   curl -X POST http://localhost:3000/webhook/fonnte \
     -H "Content-Type: application/json" \
     -d '{"device":"628xxx","sender":"628xxx","message":"test"}'
   ```

2. **Check logs:**
   ```bash
   # If deployed
   ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8"
   ```

3. **Verify API keys:**
   ```typescript
   // Test Gemini
   const gemini = new GeminiClient();
   const healthy = await gemini.healthCheck();
   console.log('Gemini healthy:', healthy);

   // Test Fonnte
   const fonnte = new FonnteClient();
   const healthy = await fonnte.healthCheck();
   console.log('Fonnte healthy:', healthy);
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Tenant not found" | Check tenant's `whatsappNumber` in database |
| "Gemini API error" | Check API key and quota |
| "Fonnte send failed" | Check Fonnte balance and device status |
| "State not persisting" | Check `conversation_states` table exists |
| "Upload stuck on step" | User can type `/cancel` to reset |

## Performance Monitoring

Monitor these metrics:

```typescript
// In your monitoring system
{
  bot_messages_processed: counter,
  bot_response_time: histogram,
  bot_llm_calls: counter,
  bot_cache_hits: counter,
  bot_errors: counter,
  bot_leads_created: counter
}
```

## Cost Estimates

For 1 tenant with 100 customer conversations/month:

| Service | Usage | Cost/Month |
|---------|-------|------------|
| Fonnte | Unlimited | Rp 300,000 |
| Gemini Pro | ~500 API calls (70% cached) | Rp 50,000 |
| Storage | ~1GB photos | Rp 0 (local) |
| **Total** | | **Rp 350,000** |

**ROI:** Cost Rp 350k, generates 5+ leads worth Rp 50M+ 🚀

## Scaling Considerations

### For 10+ Tenants:

1. **LLM Optimization:**
   - Increase cache TTL to 2 hours
   - Use batch processing for broadcasts
   - Consider cheaper models for simple queries

2. **Database:**
   - Add read replicas for queries
   - Partition `messages` table by month
   - Archive old conversation states

3. **Storage:**
   - Move to S3/R2 for photos
   - Implement CDN for image delivery
   - Set up automatic cleanup (90 days)

4. **Rate Limiting:**
   - Per-tenant rate limits
   - Priority queue for hot leads
   - Throttle during peak hours

## Next Steps

1. ✅ Bot system is ready
2. [ ] Add webhook endpoint to backend
3. [ ] Configure Fonnte webhook
4. [ ] Register admin users
5. [ ] Test customer bot
6. [ ] Test admin bot
7. [ ] Monitor performance
8. [ ] Iterate based on feedback

## Support

For issues or questions:
- Check logs first
- Review troubleshooting section
- Test with curl commands
- Verify environment variables

---

**Quick Start Checklist:**

- [ ] Add API keys to `.env`
- [ ] Add webhook endpoint to `backend/index.tsx`
- [ ] Create uploads directory
- [ ] Configure Fonnte webhook URL
- [ ] Register admin user in database
- [ ] Test customer bot (send WA message)
- [ ] Test admin bot (send `/upload`)
- [ ] Monitor logs for errors

**Time to complete:** ~15 minutes 🚀
