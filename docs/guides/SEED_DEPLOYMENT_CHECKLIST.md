# Seed Deployment Checklist

**Date:** October 25, 2025
**Task:** Deploy refactored seed.ts with 6 real cars

---

## Pre-Deployment Verification

### Code Quality
- ✅ TypeScript syntax validated (no errors)
- ✅ All BigInt prices properly formatted
- ✅ Photo paths follow production convention
- ✅ Indonesian language throughout
- ✅ Proper Prisma types and relationships

### File Status
- ✅ File location: `C:\Users\yoppi\Downloads\Lumiku Auto\auto\prisma\seed.ts`
- ✅ Total lines: 631 (down from 806)
- ✅ Total changes: ~400 lines modified
- ✅ No local execution attempted (per CLAUDE.md)

---

## Photo Upload Requirements

### Upload Directories Needed

Create the following directory structure in production:

```bash
/uploads/tenant-1/cars/
├── mercedes-c300-2010/
│   ├── 1.webp
│   ├── 2.webp
│   ├── 3.webp
│   ├── 4.webp
│   ├── 5.webp
│   ├── 6.webp
│   ├── 7.webp
│   ├── 8.webp
│   └── 9.webp
├── mazda-2-2014/
│   ├── 1.webp through 11.webp (11 photos)
├── honda-jazz-2017/
│   ├── 1.webp through 10.webp (10 photos)
├── toyota-yaris-2020/
│   ├── 1.webp through 10.webp (10 photos)
├── mitsubishi-pajero-2023/
│   ├── 1.webp through 6.webp (6 photos)
└── honda-brio-rs/
    ├── 1.webp through 8.webp (8 photos)
```

**Total Photos Required:** 54 images

### Photo Specifications
- **Format:** WebP (optimized for web)
- **Naming:** Sequential numbers (1.webp, 2.webp, etc.)
- **Quality:** High resolution, web-optimized
- **Orientation:** Landscape preferred for car photos

---

## Deployment Steps

### Step 1: Upload Photos to Production

```bash
# SSH into production server
ssh root@cf.avolut.com

# Navigate to uploads directory
docker exec -it b8sc48s8s0c4w00008k808w8 bash
cd /uploads/tenant-1/cars

# Create directories
mkdir -p mercedes-c300-2010
mkdir -p mazda-2-2014
mkdir -p honda-jazz-2017
mkdir -p toyota-yaris-2020
mkdir -p mitsubishi-pajero-2023
mkdir -p honda-brio-rs

# Exit container
exit
```

Then upload photos using SCP or your photo upload agent.

### Step 2: Verify Photo Upload

```bash
# Check photo counts
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 ls -l /uploads/tenant-1/cars/mercedes-c300-2010"
# Should show 9 files

ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 ls -l /uploads/tenant-1/cars/mazda-2-2014"
# Should show 11 files

ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 ls -l /uploads/tenant-1/cars/honda-jazz-2017"
# Should show 10 files

ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 ls -l /uploads/tenant-1/cars/toyota-yaris-2020"
# Should show 10 files

ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 ls -l /uploads/tenant-1/cars/mitsubishi-pajero-2023"
# Should show 6 files

ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 ls -l /uploads/tenant-1/cars/honda-brio-rs"
# Should show 8 files
```

### Step 3: Commit and Push Changes

```bash
# From local machine
cd "C:\Users\yoppi\Downloads\Lumiku Auto\auto"

# Add the modified seed file
git add prisma/seed.ts

# Commit with descriptive message
git commit -m "Refactor seed data with 6 real cars and production photos

- Replace 15 mock cars with 6 real vehicles
- Add Mercedes-Benz C300 2010 (9 photos)
- Add Mazda 2 R 2014 (11 photos)
- Add Honda Jazz RS 2017 (10 photos)
- Add Toyota Yaris G 2020 (10 photos)
- Add Mitsubishi Pajero Sport Dakar 2023 (6 photos)
- Add Honda Brio RS 2021 (8 photos)
- Update photo paths to /uploads/tenant-1/cars/
- Add realistic Indonesian market prices
- Update display codes to brand-specific format
- Update lead references and conversation messages
- All descriptions in Indonesian language

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger auto-deployment
git push origin main
```

### Step 4: Monitor Deployment

```bash
# Check deployment progress
curl https://cf.avolut.com/api/v1/deployments/applications/b8sc48s8s0c4w00008k808w8 \
  --header 'Authorization: Bearer 7|rsu1vBA8EzDIeetffQQk8PhM2pUqAiAKeHoaObun2bec5fc5'

# Watch deployment logs
ssh root@cf.avolut.com "docker logs -f b8sc48s8s0c4w00008k808w8"
```

### Step 5: Run Database Seed

**IMPORTANT:** Only run after photos are uploaded and deployment is complete.

```bash
# SSH into production
ssh root@cf.avolut.com

# Execute seed script in container
docker exec -it b8sc48s8s0c4w00008k808w8 bun prisma/seed.ts

# Expected output:
# 🌱 Starting seed...
# ✅ Cleaned up existing data
# ✅ Created tenant: Showroom Mobil Surabaya
# ✅ Created users: Owner, Budi (admin), Ani (sales)
# ✅ Created 6 cars
# ✅ Created 5 leads
# ✅ Created 10 messages across 3 conversations
#
# 📊 Seed Summary:
# ================
# ✅ 1 Tenant: Showroom Mobil Surabaya
# ✅ 3 Users: Owner, Budi (admin), Ani (sales)
# ✅ 6 Cars: 4 available, 1 booking
#    - Mercedes-Benz C300 2010 (9 photos)
#    - Mazda 2 R 2014 (11 photos)
#    - Honda Jazz RS 2017 (10 photos)
#    - Toyota Yaris G 2020 (10 photos)
#    - Mitsubishi Pajero Sport 2023 (6 photos)
#    - Honda Brio RS 2021 (8 photos)
# ✅ 5 Leads: 2 hot, 1 warm, 2 new
# ✅ 10 Messages across conversations
#
# 🔐 Login Credentials:
# ====================
# Owner: owner@showroom-surabaya.com / password123
# Admin: budi@showroom-surabaya.com / password123
# Sales: ani@showroom-surabaya.com / password123
#
# 🌍 Tenant URL:
# ==============
# https://showroom-surabaya.autoleads.id
#
# 🎉 Seed completed successfully!
```

---

## Post-Deployment Verification

### Step 6: Verify Cars in Database

```bash
# Query cars table
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 psql \$DATABASE_URL -c 'SELECT \"displayCode\", brand, model, year, price, status FROM \"Car\" ORDER BY \"displayCode\";'"

# Expected output (6 cars):
# displayCode | brand          | model                      | year | price       | status
# ------------|----------------|----------------------------|------|-------------|--------
# #M01        | Mercedes-Benz  | C300 Avantgarde            | 2010 | 245000000   | available
# #MZ01       | Mazda          | Mazda 2 R Hatchback        | 2014 | 135000000   | available
# #J01        | Honda          | Jazz RS CVT                | 2017 | 225000000   | available
# #Y01        | Toyota         | Yaris G CVT                | 2020 | 255000000   | available
# #P01        | Mitsubishi     | Pajero Sport Dakar 4x2 AT  | 2023 | 565000000   | booking
# #B01        | Honda          | Brio RS CVT                | 2021 | 185000000   | available
```

### Step 7: Verify Photos Are Accessible

```bash
# Test photo URLs (replace with your domain)
curl -I https://auto.lumiku.com/uploads/tenant-1/cars/mercedes-c300-2010/1.webp
# Should return: HTTP/1.1 200 OK

curl -I https://auto.lumiku.com/uploads/tenant-1/cars/mazda-2-2014/1.webp
# Should return: HTTP/1.1 200 OK

curl -I https://auto.lumiku.com/uploads/tenant-1/cars/honda-jazz-2017/1.webp
# Should return: HTTP/1.1 200 OK
```

### Step 8: Test Frontend Display

1. Visit: `https://auto.lumiku.com`
2. Navigate to car catalog
3. Verify all 6 cars are displayed
4. Click on each car to verify:
   - Photos load correctly
   - Specifications are displayed
   - Prices are formatted properly
   - Indonesian descriptions render correctly

### Step 9: Test WhatsApp Bot Integration

1. Send WhatsApp message to: `628123456789`
2. Inquire about a car using display code (e.g., "#M01")
3. Verify bot responds with correct car details
4. Check that photos are sent correctly

---

## Rollback Plan

If issues occur after seeding:

### Option 1: Re-seed with Clean Data

```bash
# SSH into production
ssh root@cf.avolut.com

# Run seed again (will clean and recreate)
docker exec -it b8sc48s8s0c4w00008k808w8 bun prisma/seed.ts
```

### Option 2: Manual Database Cleanup

```bash
# SSH into production
ssh root@cf.avolut.com

# Connect to database
docker exec -it b8sc48s8s0c4w00008k808w8 psql $DATABASE_URL

# Delete all data (in order of foreign key dependencies)
DELETE FROM "Message";
DELETE FROM "Lead";
DELETE FROM "Car";
DELETE FROM "User";
DELETE FROM "ConversationState";
DELETE FROM "Tenant";

# Exit psql
\q

# Re-run seed
docker exec -it b8sc48s8s0c4w00008k808w8 bun prisma/seed.ts
```

### Option 3: Restore from Backup

```bash
# If you have a database backup, restore it
# (Backup command should be run BEFORE seeding)
```

---

## Success Criteria

✅ All 6 cars are visible in admin dashboard
✅ 54 photos are accessible via URLs
✅ Prices display correctly in Indonesian Rupiah format
✅ Descriptions are in Indonesian language
✅ WhatsApp bot can query cars by display code
✅ Lead conversations reference correct cars
✅ Users can log in with provided credentials
✅ No 404 errors on photo paths
✅ No database constraint errors

---

## Known Issues / Notes

1. **Photo Upload Timing**
   - Photos must be uploaded BEFORE running seed
   - Seed will succeed even if photos are missing, but frontend will show broken images

2. **Database Connection**
   - Do NOT run seed locally
   - Always run in production Docker container
   - Requires valid DATABASE_URL environment variable

3. **Data Cleanup**
   - Seed script will DELETE all existing data
   - Make sure to backup production data if needed
   - Consider commenting out cleanup section if preserving data

4. **BigInt Prices**
   - Prices are stored as BigInt in PostgreSQL
   - Frontend must format with Indonesian number separators
   - Example: `Rp 245.000.000`

---

## Contact & Support

**File Modified:**
```
C:\Users\yoppi\Downloads\Lumiku Auto\auto\prisma\seed.ts
```

**Summary Document:**
```
C:\Users\yoppi\Downloads\Lumiku Auto\auto\SEED_REFACTOR_SUMMARY.md
```

**Deployment Checklist:**
```
C:\Users\yoppi\Downloads\Lumiku Auto\auto\SEED_DEPLOYMENT_CHECKLIST.md
```

---

**Task Status:** ✅ Ready for deployment
**Last Updated:** October 25, 2025
