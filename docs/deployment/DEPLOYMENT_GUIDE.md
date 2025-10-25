# 🚀 AUTOLEADS - DEPLOYMENT GUIDE

Complete step-by-step guide to deploy AutoLeads to production.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### 1. Required API Keys & Services

- [ ] **Fonnte Account** - Get WhatsApp API access from https://fonnte.com
  - Cost: Rp 300,000/month per number
  - Sign up and get API token

- [ ] **Google Gemini API Key** - Get from https://ai.google.dev
  - Free tier: 60 requests/minute
  - Paid tier available for higher limits

- [ ] **PostgreSQL Database** - Already configured at 107.155.75.50:5986
  - Verify connection with: `psql postgres://postgres:PASSWORD@107.155.75.50:5986/auto-lumiku`

- [ ] **Domain/Subdomain** - Configure DNS for:
  - Primary: auto.lumiku.com
  - Tenant subdomains: *.autoleads.id (wildcard)

---

## 🔧 STEP 1: CONFIGURE ENVIRONMENT VARIABLES

### Update `.env` file:

```bash
cd /path/to/auto
nano .env
```

**Replace these values:**

```env
# Get from fonnte.com dashboard
FONNTE_API_TOKEN="YOUR_FONNTE_API_TOKEN_HERE"

# Get from https://ai.google.dev
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# Generate secure JWT secret (run this command):
# openssl rand -hex 32
JWT_SECRET="REPLACE_WITH_OUTPUT_OF_OPENSSL_RAND_HEX_32"
```

---

## 🗄️ STEP 2: DATABASE SETUP

### 2.1 Generate Prisma Client

```bash
cd /path/to/auto
bun run db:generate
```

Expected output:
```
✔ Generated Prisma Client
```

### 2.2 Create Database Migration

```bash
bun run db:migrate
```

When prompted for migration name, enter: `init_autoleads_schema`

Expected output:
```
✔ Prisma Migrate applied the following migration(s):
  └─ 20250123_init_autoleads_schema/
     └─ migration.sql
```

### 2.3 Verify Database Schema

```bash
bun run db:studio
```

This opens Prisma Studio at http://localhost:5555 where you can verify:
- Tables: tenants, cars, leads, messages, users, conversation_states
- All columns are present
- Indexes are created

### 2.4 Seed Test Data

```bash
bun run db:seed
```

Expected output:
```
✅ Seed completed!
Created:
  - 1 Tenant: Showroom Mobil Surabaya
  - 3 Users: Owner, Budi (admin), Ani (sales)
  - 15 Cars: Mix of Toyota, Honda, Daihatsu
  - 5 Leads: Various statuses
  - 10 Messages: Sample conversations
```

**Test Login Credentials:**
- Owner: owner@showroom-surabaya.com / password123
- Admin: budi@showroom-surabaya.com / password123
- Sales: ani@showroom-surabaya.com / password123

---

## 🧪 STEP 3: LOCAL TESTING (Optional but Recommended)

### 3.1 Start Development Server

```bash
bun run dev
```

Expected output:
```
✓ AutoLeads backend running on http://localhost:3000
✓ Health check: http://localhost:3000/health
✓ API docs: http://localhost:3000/api
```

### 3.2 Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-23T...",
  "services": {
    "database": "ok"
  }
}
```

### 3.3 Test Car Catalog API

```bash
curl http://localhost:3000/api/cars \
  -H "Host: showroom-surabaya.autoleads.id"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "cars": [...],
    "pagination": {...}
  }
}
```

### 3.4 Test Admin Login

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -H "Host: showroom-surabaya.autoleads.id" \
  -d '{
    "email": "owner@showroom-surabaya.com",
    "password": "password123"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "name": "Owner Showroom",
      "role": "owner"
    }
  }
}
```

---

## 🐳 STEP 4: DOCKER DEPLOYMENT

### 4.1 Update Dockerfile (Already Optimized)

The Dockerfile is already production-ready with:
- Multi-stage builds
- Non-root user
- Health checks
- Minimal image size

### 4.2 Build Docker Image

```bash
cd /path/to/auto
docker build -t autoleads:latest .
```

### 4.3 Test Docker Image Locally

```bash
docker run -p 3000:3000 \
  --env-file .env \
  autoleads:latest
```

Test: `curl http://localhost:3000/health`

### 4.4 Deploy to Coolify (cf.avolut.com)

#### Option A: Using Coolify Dashboard

1. Login to https://cf.avolut.com
2. Find container: `b8sc48s8s0c4w00008k808w8`
3. Go to "Settings" > "Environment Variables"
4. Add all variables from `.env` file
5. Click "Redeploy"

#### Option B: Using SSH + Docker

```bash
# SSH to deployment server
ssh root@cf.avolut.com

# Navigate to project
cd /path/to/auto

# Pull latest code
git pull origin main

# Build and restart
docker-compose up -d --build
```

### 4.5 Check Deployment Logs

```bash
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8"
```

Look for:
```
✓ AutoLeads backend running on port 3000
✓ Database connected
✓ Prisma client initialized
```

---

## 📱 STEP 5: WHATSAPP BOT SETUP

### 5.1 Configure Fonnte Webhook

1. Login to https://fonnte.com
2. Go to "Settings" > "Webhook"
3. Set webhook URL:
   ```
   https://auto.lumiku.com/webhook/fonnte
   ```
4. Method: **POST**
5. Save settings

### 5.2 Test Webhook (Send Test Message)

From your phone, send WhatsApp message to your Fonnte number:

```
Ada Avanza 2020?
```

Expected bot response (within 3 seconds):
```
Halo! Ada 2 unit Avanza 2020 nih:

1. Avanza 1.3 G 2020 Hitam (#A01)
   💰 Rp 185.000.000
   📏 45.000 km | ⚙️ Manual
   ✨ Velg racing, Spoiler

2. Avanza 1.3 G 2020 Hitam (#A02)
   💰 Rp 180.000.000
   📏 50.000 km | ⚙️ Manual
   ✨ Ban baru, Service record

Mau tanya apa? 😊
```

### 5.3 Test Admin Bot Upload

From owner's phone (registered in database), send:

```
/upload
```

Expected bot response:
```
Kirim foto mobil (max 10 foto)
```

Send 3-5 car photos, then:

```
B1234XYZ | Toyota Avanza 1.5 Veloz | 2023 | 220jt | 30rb | Matic | Hitam
```

Bot will guide through remaining steps and publish car.

---

## 🌐 STEP 6: DNS & DOMAIN SETUP

### 6.1 Primary Domain (auto.lumiku.com)

Already configured via Coolify. Verify:

```bash
curl https://auto.lumiku.com/health
```

### 6.2 Tenant Subdomains (*.autoleads.id)

**DNS Records (Add to Cloudflare):**

```
Type: A
Name: @
Value: <YOUR_SERVER_IP>
TTL: Auto
Proxy: Enabled (Orange cloud)

Type: A
Name: *
Value: <YOUR_SERVER_IP>
TTL: Auto
Proxy: Enabled (Orange cloud)
```

**Test tenant subdomain:**

```bash
curl https://showroom-surabaya.autoleads.id/api/cars
```

### 6.3 Custom Domains (Per Tenant)

For tenant with custom domain (e.g., showroommobil.com):

1. Customer adds DNS record:
   ```
   Type: CNAME
   Name: @
   Value: auto.lumiku.com
   ```

2. Verify in admin dashboard:
   - POST /api/admin/domain/verify
   - Body: { "customDomain": "showroommobil.com" }

3. SSL certificate auto-provisioned by Cloudflare

---

## 🧪 STEP 7: END-TO-END TESTING

### 7.1 Test Customer Journey

1. **Browse Catalog**
   - Visit: https://showroom-surabaya.autoleads.id
   - Search: "Avanza 2020"
   - Click car: #A01

2. **Send WhatsApp Inquiry**
   - Click "Chat via WhatsApp" button
   - Send pre-filled message
   - Verify bot response <3s

3. **Lead Captured**
   - Check admin dashboard
   - Verify lead created with status "new"
   - Verify message history saved

### 7.2 Test Admin Journey

1. **Login to Dashboard**
   - Visit: https://showroom-surabaya.autoleads.id/admin
   - Email: owner@showroom-surabaya.com
   - Password: password123

2. **View Leads**
   - Go to "Leads" tab
   - See recent inquiries
   - Click lead to view conversation history

3. **Upload Car via WhatsApp**
   - Send "/upload" command
   - Follow 5-step flow
   - Verify car appears on website instantly

### 7.3 Test Multi-Tenant Isolation

Create second tenant in database:

```sql
INSERT INTO tenants (name, slug, subdomain, phone, whatsapp_number, plan, status)
VALUES ('Showroom Jakarta', 'showroom-jakarta', 'showroom-jakarta.autoleads.id', '021-1234567', '628987654321', 'growth', 'active');
```

Verify:
- showroom-jakarta.autoleads.id shows only Jakarta's cars
- showroom-surabaya.autoleads.id shows only Surabaya's cars
- No cross-contamination

---

## 📊 STEP 8: MONITORING & MAINTENANCE

### 8.1 Check Application Health

**Automated monitoring:**

```bash
# Add to cron (runs every 5 minutes)
*/5 * * * * curl -f https://auto.lumiku.com/health || echo "AutoLeads is DOWN" | mail -s "Alert" admin@lumiku.com
```

### 8.2 Check Database Performance

```bash
# Connect to database
psql $DATABASE_URL

# Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

# Check table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 8.3 Check Docker Logs

```bash
# Real-time logs
ssh root@cf.avolut.com "docker logs -f b8sc48s8s0c4w00008k808w8"

# Last 100 lines
ssh root@cf.avolut.com "docker logs --tail 100 b8sc48s8s0c4w00008k808w8"

# Errors only
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 2>&1 | grep ERROR"
```

### 8.4 Check WhatsApp Bot Stats

**Query database:**

```sql
-- Messages per day (last 7 days)
SELECT DATE(created_at) as date, COUNT(*) as messages
FROM messages
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Bot response time (average)
SELECT
  AVG(EXTRACT(EPOCH FROM (bot_msg.created_at - customer_msg.created_at))) as avg_response_seconds
FROM messages customer_msg
JOIN messages bot_msg ON bot_msg.lead_id = customer_msg.lead_id
WHERE customer_msg.sender = 'customer'
  AND bot_msg.sender = 'bot'
  AND bot_msg.created_at > customer_msg.created_at;

-- Top 10 leads by message count
SELECT l.customer_name, l.customer_phone, COUNT(m.id) as message_count
FROM leads l
JOIN messages m ON m.lead_id = l.id
GROUP BY l.id
ORDER BY message_count DESC
LIMIT 10;
```

---

## 🔧 TROUBLESHOOTING

### Issue: Database connection failed

**Symptoms:** `Error: Can't reach database server`

**Solution:**
```bash
# Check database is running
psql $DATABASE_URL -c "SELECT 1"

# Check firewall allows connection
telnet 107.155.75.50 5986

# Verify DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

### Issue: WhatsApp bot not responding

**Symptoms:** Customer sends message, no response

**Debug steps:**
```bash
# 1. Check webhook logs
ssh root@cf.avolut.com "docker logs b8sc48s8s0c4w00008k808w8 | grep /webhook/fonnte"

# 2. Verify Fonnte webhook URL
curl https://api.fonnte.com/webhook \
  -H "Authorization: $FONNTE_API_TOKEN"

# 3. Check if tenant exists
psql $DATABASE_URL -c "SELECT * FROM tenants WHERE whatsapp_number = '628123456789';"

# 4. Test webhook manually
curl -X POST https://auto.lumiku.com/webhook/fonnte \
  -H "Content-Type: application/json" \
  -d '{
    "device": "628123456789",
    "sender": "6281234567890",
    "message": "test",
    "type": "text"
  }'
```

### Issue: Gemini API rate limit exceeded

**Symptoms:** `Error: 429 Too Many Requests`

**Solutions:**
1. Enable response caching (already implemented)
2. Upgrade to paid Gemini tier
3. Add fallback responses for common queries

### Issue: Car images not loading

**Symptoms:** 404 errors for /uploads/cars/...

**Solution:**
```bash
# Check uploads directory exists
ssh root@cf.avolut.com "ls -la /path/to/auto/uploads/cars/"

# Fix permissions
ssh root@cf.avolut.com "chmod -R 755 /path/to/auto/uploads && chown -R bunuser:nodejs /path/to/auto/uploads"

# Verify in Docker
docker exec b8sc48s8s0c4w00008k808w8 ls -la /app/uploads/cars/
```

---

## 🎯 SUCCESS CRITERIA

Your deployment is successful if:

- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] Car catalog loads at https://showroom-surabaya.autoleads.id
- [ ] Admin login works with seed credentials
- [ ] WhatsApp bot responds to "Ada Avanza 2020?" <3s
- [ ] Admin bot accepts "/upload" command
- [ ] Car uploaded via WhatsApp appears on website instantly
- [ ] Multi-tenant isolation verified (no cross-contamination)
- [ ] Database queries complete <100ms
- [ ] All tests pass in testing checklist

---

## 📞 SUPPORT & RESOURCES

- **Technical Documentation:** See `backend/README.md`
- **API Reference:** See `backend/src/routes/` files
- **Bot Documentation:** See `backend/src/bot/README.md`
- **UI Components:** See `frontend/CAR_CATALOG_README.md`

---

## 🚀 POST-LAUNCH CHECKLIST

After successful deployment:

- [ ] Remove seed data (if in production)
- [ ] Change all default passwords
- [ ] Enable Sentry error tracking (Phase 2)
- [ ] Setup automated backups (daily)
- [ ] Configure monitoring alerts (UptimeRobot)
- [ ] Update DNS TTL to 1 hour (after stability)
- [ ] Document custom configurations
- [ ] Train first customer on admin dashboard
- [ ] Schedule weekly check-ins with first customer

---

**Deployment completed! 🎉**

Next: Onboard your first customer and iterate based on feedback.
