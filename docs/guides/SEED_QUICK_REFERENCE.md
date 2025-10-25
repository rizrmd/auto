# Seed Data - Quick Reference Card

**Updated:** October 25, 2025

---

## 🚗 Car Inventory (6 Cars)

| Code | Brand | Model | Year | Price | Photos | Status |
|------|-------|-------|------|-------|--------|--------|
| #M01 | Mercedes-Benz | C300 Avantgarde | 2010 | Rp 245 jt | 9 | Available |
| #MZ01 | Mazda | 2 R Hatchback | 2014 | Rp 135 jt | 11 | Available |
| #J01 | Honda | Jazz RS CVT | 2017 | Rp 225 jt | 10 | Available |
| #Y01 | Toyota | Yaris G CVT | 2020 | Rp 255 jt | 10 | Available |
| #P01 | Mitsubishi | Pajero Sport Dakar | 2023 | Rp 565 jt | 6 | **Booking** |
| #B01 | Honda | Brio RS CVT | 2021 | Rp 185 jt | 8 | Available |

**Total:** 54 photos across 6 cars

---

## 📂 Photo Paths

```
/uploads/tenant-1/cars/mercedes-c300-2010/[1-9].webp
/uploads/tenant-1/cars/mazda-2-2014/[1-11].webp
/uploads/tenant-1/cars/honda-jazz-2017/[1-10].webp
/uploads/tenant-1/cars/toyota-yaris-2020/[1-10].webp
/uploads/tenant-1/cars/mitsubishi-pajero-2023/[1-6].webp
/uploads/tenant-1/cars/honda-brio-rs/[1-8].webp
```

---

## 👥 User Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | owner@showroom-surabaya.com | password123 |
| Admin | budi@showroom-surabaya.com | password123 |
| Sales | ani@showroom-surabaya.com | password123 |

---

## 📞 Sample Leads (5 Leads)

| Customer | Car | Status | Assigned |
|----------|-----|--------|----------|
| Ibu Siti | Mazda 2 (#MZ01) | New | - |
| Pak Andi | Mercedes C300 (#M01) | **Hot** | Budi |
| Dika | Brio RS (#B01) | Warm | Ani |
| Bu Nina | Jazz RS (#J01) | **Hot** | Budi |
| Pak Rudi | None (general) | New | - |

---

## 🚀 One-Command Deployment

```bash
# After photos uploaded, run:
ssh root@cf.avolut.com "docker exec -it b8sc48s8s0c4w00008k808w8 bun prisma/seed.ts"
```

---

## ✅ Verification Queries

```sql
-- Count cars
SELECT COUNT(*) FROM "Car";  -- Should return 6

-- List all cars
SELECT "displayCode", brand, model, year FROM "Car";

-- Count photos
SELECT "displayCode", array_length(photos, 1) as photo_count
FROM "Car"
ORDER BY "displayCode";
```

---

## 🎯 Key Features by Car

**Mercedes C300 (#M01):**
- V6 3.0L 231 HP, Sunroof Panoramic, Harman Kardon

**Mazda 2 (#MZ01):**
- SKYACTIV 1.5L, Irit 1:16 km/L, Touchscreen

**Jazz RS (#J01):**
- i-VTEC 1.5L, Paddle Shift, Cruise Control, Leather

**Yaris (#Y01):**
- Dual VVT-i 1.5L, 6 Airbags, VSC+TRC, Camera

**Pajero Sport (#P01):**
- Turbo Diesel 2.4L, Camera 360, Blind Spot, Sunroof

**Brio RS (#B01):**
- i-VTEC 1.2L, Paddle Shift, LED Headlamp, Eco 1:18

---

## 📱 Test URLs

```
https://auto.lumiku.com
https://auto.lumiku.com/uploads/tenant-1/cars/mercedes-c300-2010/1.webp
https://showroom-surabaya.autoleads.id
```

---

**Files Modified:**
- `prisma/seed.ts` (631 lines, -175 from original)

**Status:** ✅ Ready to deploy
