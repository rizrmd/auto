# AutoLeads Production Deployment - Manual Verification Checklist

After running automated verification scripts, perform these manual checks to ensure complete production readiness.

---

## 🚀 Pre-Verification Setup

- [ ] Automated smoke test passed: `./scripts/smoke-test.sh`
- [ ] Full verification script passed: `./scripts/verify-deployment.sh`
- [ ] Production dashboard is running: `./scripts/production-dashboard.sh`

---

## 📱 Visual & UI Tests

### Homepage (https://auto.lumiku.com)

- [ ] Homepage loads without errors
- [ ] Page loads in under 3 seconds
- [ ] No console errors in browser DevTools
- [ ] Tenant logo displays correctly (not broken image)
- [ ] Tenant name displays in header
- [ ] Hero section displays properly
- [ ] Featured cars section shows cars
- [ ] All car images load (not broken)
- [ ] Car prices display correctly formatted (Rp currency)
- [ ] "Cari Mobil" (search) input is visible and functional
- [ ] Footer displays with correct information

### Car Listing Page

- [ ] All cars display in grid/list format
- [ ] Car thumbnails load correctly
- [ ] Car names and prices visible
- [ ] Year, transmission, and mileage display
- [ ] "Detail" or "Lihat Detail" buttons work
- [ ] Pagination works (if more than 12 cars)
- [ ] Filter/sort options work (if implemented)

### Car Detail Page

- [ ] Navigate to individual car page via URL or click
- [ ] Car title displays (e.g., "Toyota Avanza 2023")
- [ ] Main image displays in full size
- [ ] Image gallery/thumbnails work
- [ ] All car specifications display:
  - [ ] Price (Rp formatted)
  - [ ] Year
  - [ ] Transmission
  - [ ] Mileage
  - [ ] Fuel type
  - [ ] Color
  - [ ] Description
- [ ] WhatsApp contact button displays
- [ ] Click WhatsApp button - opens WhatsApp with pre-filled message
- [ ] Related/similar cars section shows (if implemented)

### Search Functionality

- [ ] Click search input on homepage
- [ ] Type car name (e.g., "Toyota")
- [ ] Autocomplete suggestions appear
- [ ] Select suggestion - navigates to car
- [ ] Search with no results shows appropriate message
- [ ] Search special characters doesn't break page

---

## 🖥️ Browser Compatibility Tests

Test the site on multiple browsers and devices:

### Desktop Browsers

- [ ] **Chrome** (latest version)
  - [ ] Homepage loads
  - [ ] Images display
  - [ ] Navigation works
  - [ ] Forms submit
- [ ] **Firefox** (latest version)
  - [ ] Homepage loads
  - [ ] Images display
  - [ ] Navigation works
  - [ ] Forms submit
- [ ] **Safari** (latest version, Mac only)
  - [ ] Homepage loads
  - [ ] Images display
  - [ ] Navigation works
  - [ ] Forms submit
- [ ] **Edge** (latest version)
  - [ ] Homepage loads
  - [ ] Images display
  - [ ] Navigation works
  - [ ] Forms submit

### Mobile Browsers

- [ ] **Mobile Safari** (iOS)
  - [ ] Responsive layout works
  - [ ] Touch interactions work
  - [ ] Images scale properly
  - [ ] WhatsApp button works
- [ ] **Mobile Chrome** (Android)
  - [ ] Responsive layout works
  - [ ] Touch interactions work
  - [ ] Images scale properly
  - [ ] WhatsApp button works

### Responsive Design Tests

- [ ] Test at 320px width (smallest mobile)
- [ ] Test at 375px width (iPhone standard)
- [ ] Test at 768px width (tablet)
- [ ] Test at 1024px width (small desktop)
- [ ] Test at 1920px width (large desktop)
- [ ] No horizontal scrolling at any width
- [ ] Text remains readable at all sizes
- [ ] Buttons are tappable on mobile (min 44x44px)

---

## 🔐 Admin Panel Tests

### Admin Login

- [ ] Navigate to: https://auto.lumiku.com/admin/login
- [ ] Login form displays correctly
- [ ] Enter valid credentials
- [ ] Submit - redirects to admin dashboard
- [ ] Invalid credentials show error message
- [ ] Error message is clear and helpful

### Admin Dashboard

- [ ] Dashboard displays after login
- [ ] Navigation sidebar/menu visible
- [ ] Quick stats display (total cars, leads, etc.)
- [ ] No console errors

### Car Management

- [ ] Navigate to car list page
- [ ] All cars display in table/grid
- [ ] "Add New Car" button visible and functional
- [ ] Click on car - view detail page
- [ ] Edit car - form pre-fills with data
- [ ] Update car information
- [ ] Save - shows success message
- [ ] Changes reflect on frontend immediately
- [ ] Delete car (use test car only!)
- [ ] Confirm deletion works
- [ ] Car removed from frontend

### Lead Management

- [ ] Navigate to leads/inquiries page
- [ ] Leads display in table format
- [ ] Can view lead details
- [ ] Lead information is complete (name, phone, car, etc.)
- [ ] Can mark lead as contacted/closed
- [ ] Lead status updates successfully

### Admin Logout

- [ ] Click logout button
- [ ] Redirects to login page
- [ ] Cannot access admin pages without re-login
- [ ] Session expired properly

---

## ✅ Form Validation Tests

### Car Creation Form (Admin)

Test with **invalid data first**:

- [ ] Leave required fields empty - shows validation errors
- [ ] Enter negative price - shows error
- [ ] Enter invalid year (e.g., 1800 or 2100) - shows error
- [ ] Enter non-numeric mileage - shows error
- [ ] Upload invalid file type - shows error
- [ ] Upload oversized image - shows error
- [ ] Error messages are clear and specific
- [ ] Errors display near their respective fields

Test with **valid data**:

- [ ] Fill all required fields correctly
- [ ] Upload valid image (JPG/PNG under 5MB)
- [ ] Submit form
- [ ] Success message displays
- [ ] Car appears in car list
- [ ] Car accessible on frontend

### Lead/Inquiry Form (Frontend)

- [ ] Fill out inquiry form (if public-facing)
- [ ] Leave required fields empty - validation triggers
- [ ] Enter invalid phone number - validation error
- [ ] Enter invalid email - validation error
- [ ] Submit valid form - success message
- [ ] Lead appears in admin panel

---

## 🛡️ Security Tests

### SQL Injection Prevention

- [ ] Navigate to search: `/api/cars/search?q=' OR 1=1--`
- [ ] Should return empty results or error (not all cars)
- [ ] No database error messages exposed
- [ ] Navigate to car detail: `/api/cars/' OR '1'='1`
- [ ] Should return 404 (not crash)

### XSS Prevention

- [ ] Search for: `<script>alert('xss')</script>`
- [ ] Script should NOT execute
- [ ] Text should be escaped or sanitized
- [ ] Try in URL: `/api/cars/search?q=<script>alert(1)</script>`
- [ ] No alert popup appears

### CSRF Protection

- [ ] Open DevTools Network tab
- [ ] Submit admin form (edit car, create lead, etc.)
- [ ] Check request headers for CSRF token
- [ ] Token should be present and validated

### Security Headers (Browser DevTools)

- [ ] Open DevTools → Network tab
- [ ] Refresh homepage
- [ ] Click on document request
- [ ] Check Response Headers:
  - [ ] `X-Frame-Options: DENY` or `SAMEORIGIN`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Content-Security-Policy` present
  - [ ] `Strict-Transport-Security` present (HSTS)
  - [ ] No sensitive info in headers (tokens, keys)

### Authentication & Authorization

- [ ] Access admin page without login: `/admin/cars`
- [ ] Should redirect to login page (not error 500)
- [ ] Copy admin session cookie (DevTools → Application)
- [ ] Open incognito window
- [ ] Paste cookie and refresh
- [ ] Session should work OR expire properly
- [ ] Logout from original window
- [ ] Incognito session should also invalidate

---

## ⚡ Performance Tests

### Lighthouse Audit (Chrome DevTools)

Run Lighthouse test on homepage:

- [ ] Open Chrome DevTools
- [ ] Go to Lighthouse tab
- [ ] Select "Mobile" and all categories
- [ ] Click "Analyze page load"
- [ ] **Performance Score**: Target ≥ 70
- [ ] **Accessibility Score**: Target ≥ 90
- [ ] **Best Practices Score**: Target ≥ 90
- [ ] **SEO Score**: Target ≥ 80

### Loading Speed

- [ ] Clear browser cache
- [ ] Open DevTools Network tab
- [ ] Navigate to homepage
- [ ] **DOMContentLoaded**: Under 1.5 seconds
- [ ] **Load Event**: Under 3 seconds
- [ ] **Largest Contentful Paint (LCP)**: Under 2.5s
- [ ] **First Input Delay (FID)**: Under 100ms
- [ ] **Cumulative Layout Shift (CLS)**: Under 0.1

### Image Optimization

- [ ] All images load progressively (blur-up effect)
- [ ] No images over 500KB
- [ ] Images use modern formats (WebP with fallback)
- [ ] Lazy loading works (images load as you scroll)
- [ ] Thumbnails are appropriately sized (not full-res)

### API Response Times

Check in Network tab:

- [ ] `/api/tenant`: Under 200ms
- [ ] `/api/cars`: Under 500ms
- [ ] `/api/cars/featured`: Under 300ms
- [ ] `/api/cars/search`: Under 400ms
- [ ] `/api/cars/:slug`: Under 300ms

---

## 🐛 Error Handling Tests

### Frontend Error Boundary

- [ ] Navigate to: https://auto.lumiku.com/test-error
- [ ] Page displays "Test Error Page" heading
- [ ] Click "Throw Render Error" button
- [ ] Error boundary should catch it
- [ ] Fallback UI displays (not blank white screen)
- [ ] Error message is user-friendly (in Bahasa Indonesia)
- [ ] "Coba Lagi" (Try Again) button displays
- [ ] Click "Coba Lagi" - component resets
- [ ] Click "Kembali ke Beranda" - navigates to homepage

### 404 Page

- [ ] Navigate to non-existent page: `/this-page-does-not-exist`
- [ ] Custom 404 page displays (not default nginx/server page)
- [ ] 404 message is clear and helpful
- [ ] Navigation links work from 404 page
- [ ] "Back to Home" button works

### 500 Error Handling

Simulate server error (admin only - be careful!):

- [ ] In admin, try to create car with invalid data that bypasses client validation
- [ ] Server should return 500 or 422 error
- [ ] Error message displays to user
- [ ] Error is logged (check server logs)
- [ ] Application doesn't crash (other pages still work)
- [ ] User can navigate away from error

### Network Error Handling

- [ ] Open DevTools → Network tab
- [ ] Throttle network to "Offline"
- [ ] Try to load a page
- [ ] Appropriate offline message displays
- [ ] Re-enable network
- [ ] Page should recover (retry automatically or show retry button)

---

## 🔍 SEO Tests

### Meta Tags

View page source and check for:

- [ ] `<title>` tag present and descriptive
- [ ] `<meta name="description">` present
- [ ] `<meta property="og:title">` (Open Graph)
- [ ] `<meta property="og:description">`
- [ ] `<meta property="og:image">` (for social sharing)
- [ ] `<meta property="og:url">`
- [ ] `<meta name="twitter:card">`
- [ ] `<link rel="canonical">` if applicable

### Structured Data

- [ ] Open Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] Enter car detail page URL
- [ ] Check if structured data is detected (Product, Offer, etc.)
- [ ] No errors or warnings

### Sitemap

- [ ] Navigate to: https://auto.lumiku.com/sitemap.xml
- [ ] Sitemap exists and returns 200
- [ ] Contains all main pages (homepage, car listings)
- [ ] Contains individual car detail pages
- [ ] Valid XML format

### Robots.txt

- [ ] Navigate to: https://auto.lumiku.com/robots.txt
- [ ] Robots.txt exists
- [ ] Sitemap URL is listed
- [ ] Admin pages are disallowed (e.g., `Disallow: /admin`)

---

## 📊 Database Integrity Tests

### Data Consistency

- [ ] All cars have required fields (name, price, year, etc.)
- [ ] No orphaned records (cars without tenant, etc.)
- [ ] Image paths are valid (no broken references)
- [ ] Slugs are unique (no duplicate slugs)
- [ ] Foreign key relationships are intact

### Data Display

- [ ] Prices display with proper formatting (Rp 150.000.000)
- [ ] Dates display correctly (created_at, updated_at)
- [ ] Boolean fields display as expected (featured: yes/no)
- [ ] Enum fields display correctly (transmission: Manual/Automatic)
- [ ] Long text fields don't break layout (description)

---

## 🔄 Integration Tests

### WhatsApp Integration

- [ ] Click WhatsApp button on car detail page
- [ ] WhatsApp Web or app opens
- [ ] Message is pre-filled with:
  - [ ] Car name
  - [ ] Car price
  - [ ] Inquiry message
  - [ ] Dealership name
- [ ] Phone number is correct (tenant's WhatsApp)

### Image Upload Integration

- [ ] Upload car image in admin panel
- [ ] Image uploads successfully
- [ ] Image displays in admin preview
- [ ] Image appears on frontend car card
- [ ] Image appears on frontend car detail page
- [ ] Image URL is correct (accessible publicly)

### Email Notifications (if implemented)

- [ ] Submit lead/inquiry form
- [ ] Admin receives email notification
- [ ] Email contains lead details
- [ ] Email is formatted correctly (not plain text dump)
- [ ] Reply-to email is correct

---

## 🚨 Stress & Edge Cases

### Large Dataset

- [ ] Create 100+ cars (use seed script)
- [ ] Homepage still loads in under 3 seconds
- [ ] Pagination works correctly
- [ ] Search remains performant
- [ ] No memory leaks in browser

### Long Text

- [ ] Create car with very long description (1000+ words)
- [ ] Description displays without breaking layout
- [ ] Truncation works on listing page
- [ ] Full description shows on detail page
- [ ] No horizontal scrolling

### Special Characters

- [ ] Create car with special chars in name: `"Test & Car's <Name>"`
- [ ] Name displays correctly (not HTML-encoded on frontend)
- [ ] Slug is generated properly (no invalid characters)
- [ ] Search works with special characters
- [ ] URL encoding is correct

### Missing Images

- [ ] Create car without uploading image
- [ ] Placeholder image displays
- [ ] No broken image icon
- [ ] Alt text is present
- [ ] Can still view car details

### Concurrent Users

- [ ] Open site in 5+ browser tabs
- [ ] Navigate different pages in each tab
- [ ] No conflicts or errors
- [ ] Data remains consistent across tabs
- [ ] No race conditions

---

## 📝 Content Verification

### Text Content

- [ ] All text is in correct language (Bahasa Indonesia for Indonesian tenant)
- [ ] No Lorem Ipsum placeholder text
- [ ] No spelling errors in critical text
- [ ] CTAs are clear ("Hubungi Kami", "Lihat Detail", etc.)
- [ ] Error messages are user-friendly (not technical jargon)

### Contact Information

- [ ] Dealership name is correct
- [ ] Phone number is correct and clickable
- [ ] WhatsApp number is correct
- [ ] Address is correct (if displayed)
- [ ] Business hours are correct (if displayed)
- [ ] Social media links work (if present)

---

## ✅ Final Checks

### Deployment Verification

- [ ] Application is running on correct domain (auto.lumiku.com)
- [ ] SSL certificate is valid (https, no warnings)
- [ ] Environment variables are set correctly (production, not development)
- [ ] Database migrations are applied
- [ ] Seed data is loaded (if applicable)
- [ ] Static files are being served
- [ ] Logs are being written correctly

### Rollback Plan

- [ ] Previous deployment backup exists
- [ ] Can rollback to previous version if needed
- [ ] Rollback command is documented
- [ ] Database backup is recent (within 24 hours)

### Monitoring & Alerts

- [ ] Health check endpoint is monitored
- [ ] Error rate alert is configured
- [ ] Response time alert is configured
- [ ] Uptime monitoring is active (e.g., UptimeRobot)
- [ ] Admin has access to logs

---

## 🎉 Sign-Off

**Verification completed by**: ___________________________

**Date**: ___________________________

**All critical tests passed**: ☐ Yes  ☐ No (see notes below)

**Production approved**: ☐ Yes  ☐ No

**Notes/Issues**:

```
[Add any issues found, warnings, or follow-up tasks here]
```

---

## 📞 Emergency Contacts

- **DevOps**: [Contact info]
- **Backend Lead**: [Contact info]
- **Frontend Lead**: [Contact info]
- **Database Admin**: [Contact info]

## 🔗 Useful Links

- Production URL: https://auto.lumiku.com
- Admin Panel: https://auto.lumiku.com/admin
- Server: cf.avolut.com
- Container: b8sc48s8s0c4w00008k808w8
- Repository: [Git URL]

---

**Note**: If any test fails, do NOT proceed with production launch. Fix issues and re-run verification.
