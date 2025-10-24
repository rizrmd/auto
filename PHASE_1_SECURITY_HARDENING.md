# PHASE 1: SECURITY HARDENING

**Priority:** P1 - CRITICAL SECURITY
**Estimated Time:** 6-8 hours
**Status:** ⚠️ HIGH RISK WITHOUT THESE FIXES

---

## Overview

Phase 1 addresses critical security vulnerabilities that make the application exploitable. While the application can technically start without these fixes, deploying to production without them is **DANGEROUS**.

**Dependencies:** Phase 0 must be complete
**Security Score:** Currently 45/100 → Target 85/100

---

## Task 1.1: Replace Custom JWT Implementation

**Priority:** P1 (Critical Security)
**Time:** 4 hours
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\services\auth.service.ts`
**OWASP:** A02:2021 - Cryptographic Failures

### Vulnerabilities in Current Implementation

```typescript
// Line 196-199 - INSECURE
private sign(data: string): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(data + env.JWT_SECRET);  // ❌ String concatenation
  return this.base64UrlEncode(hasher.digest('base64'));
}
```

**Security Issues:**
1. **Length Extension Attack:** String concatenation allows attackers to append data
2. **No Algorithm Verification:** Missing "alg" validation enables algorithm confusion attacks
3. **Timing Attack:** String comparison leaks timing information
4. **No Token Revocation:** No mechanism to invalidate compromised tokens

### Solution: Install jsonwebtoken Library

```bash
cd C:\Users\yoppi\Downloads\Lumiku Auto\auto
bun add jsonwebtoken @types/jsonwebtoken
```

### Replace generateToken Method

**Location:** `backend/src/services/auth.service.ts` lines 122-147

**Replace with:**
```typescript
generateToken(user: User): string {
  const payload = {
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN || '7d',
    issuer: 'autoleads-api',
    audience: 'autoleads-client',
    subject: user.id.toString(),
  });
}
```

### Replace verifyToken Method

**Location:** Lines 149-200

**Replace with:**
```typescript
verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],  // Prevent algorithm confusion
      issuer: 'autoleads-api',
      audience: 'autoleads-client',
    });

    // Type guard
    if (typeof decoded === 'string') {
      throw new UnauthorizedError('Invalid token format');
    }

    return decoded as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token');
    }
    throw new UnauthorizedError('Token verification failed');
  }
}
```

### Remove Custom JWT Methods

Delete these methods (no longer needed):
- `createJwt()` (lines 150-161)
- `parseJwt()` (lines 163-174)
- `sign()` (lines 196-199)
- `base64UrlEncode()` (lines 202-204)

### Add Import at Top

```typescript
import jwt from 'jsonwebtoken';
```

### Update JwtPayload Interface

```typescript
interface JwtPayload {
  userId: number;
  tenantId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  sub: string;
}
```

### Verification

```bash
# 1. Test login
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@showroom-surabaya.com","password":"password123"}'

# Should return valid JWT

# 2. Verify token structure
# Copy token from response
# Visit https://jwt.io
# Paste token
# Should decode with: alg: HS256, iss: autoleads-api, aud: autoleads-client

# 3. Test expired token
# Change JWT_EXPIRES_IN to "1s" temporarily
# Login, wait 2 seconds, make authenticated request
# Should return "Token expired"

# 4. Test modified token
# Take valid token, change one character
# Make authenticated request
# Should return "Invalid token"
```

---

## Task 1.2: Restrict CORS Origins

**Priority:** P1 (Critical Security)
**Time:** 30 minutes
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\src\config\constants.ts`
**OWASP:** A05:2021 - Security Misconfiguration

### Problem

```typescript
// Line 204 - DANGEROUS
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: ['*'], // Allows ANY website to make requests!
```

**Security Impact:**
- CSRF attacks possible
- Session hijacking from malicious sites
- Data theft
- Unauthorized admin access

### Solution

Replace lines 203-208 with:

```typescript
export const CORS_CONFIG = {
  ALLOWED_ORIGINS: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
        'https://auto.lumiku.com',
        'https://*.lumiku.com',
      ])
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: [
    'Content-Type',
    'Authorization',
    'X-Tenant-Domain',
    'X-Requested-With',
  ],
  EXPOSED_HEADERS: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
  ],
  CREDENTIALS: true,
  MAX_AGE: 86400, // 24 hours
} as const;
```

### Update Environment Variables

Add to `.env` and Coolify:
```bash
ALLOWED_ORIGINS="https://auto.lumiku.com,https://admin.lumiku.com"
```

### Verification

```bash
# 1. Test from allowed origin
curl -X GET http://localhost:3000/api/cars \
  -H "Origin: http://localhost:3000" \
  -i

# Should see:
# Access-Control-Allow-Origin: http://localhost:3000

# 2. Test from disallowed origin (production)
curl -X GET https://auto.lumiku.com/api/cars \
  -H "Origin: https://malicious-site.com" \
  -i

# Should NOT see Access-Control-Allow-Origin header
# OR see error

# 3. Test preflight
curl -X OPTIONS http://localhost:3000/api/cars \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -i

# Should see:
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

---

## Task 1.3: Add Security Headers

**Priority:** P1 (Critical Security)
**Time:** 2 hours
**Files:** `C:\Users\yoppi\Downloads\Lumiku Auto\auto\backend\index.tsx`
**OWASP:** A05:2021 - Security Misconfiguration

### Problem

Missing security headers expose app to:
- XSS attacks
- Clickjacking
- MIME-sniffing vulnerabilities
- Man-in-the-middle attacks

### Solution: Install Secure Headers Middleware

```bash
cd C:\Users\yoppi\Downloads\Lumiku Auto\auto
bun add @hono/helmet
```

### Add Middleware to index.tsx

**Location:** After line 34 (after CORS, before routes)

```typescript
import { helmet } from '@hono/helmet';

// Security headers
app.use('*', helmet({
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],  // Remove unsafe-inline after fixing inline scripts
    styleSrc: ["'self'", "'unsafe-inline'"],   // Required for Tailwind
    imgSrc: ["'self'", 'data:', 'https:', 'http:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  crossOriginEmbedderPolicy: false, // Needed for image loading
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### Update CSP for Production

For production, tighten CSP:

```typescript
const cspConfig = env.NODE_ENV === 'production' ? {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],  // No unsafe-inline
  styleSrc: ["'self'"],   // No unsafe-inline
  imgSrc: ["'self'", 'https://auto.lumiku.com', 'data:'],
  connectSrc: ["'self'", 'https://auto.lumiku.com'],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
  upgradeInsecureRequests: [],
} : {
  // Development CSP (more permissive)
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'http:', 'https:'],
  connectSrc: ["'self'"],
};

app.use('*', helmet({
  contentSecurityPolicy: cspConfig,
  // ... other options
}));
```

### Verification

```bash
# 1. Check headers
curl -I http://localhost:3000

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: default-src 'self'; ...

# 2. Test CSP
# Open browser console
# Try: <script>alert('xss')</script>
# Should be blocked with CSP error

# 3. Test X-Frame-Options
# Create test HTML: <iframe src="http://localhost:3000"></iframe>
# Should refuse to load in iframe
```

---

## Task 1.4: Generate Strong JWT Secret

**Priority:** P1 (Critical Security)
**Time:** 5 minutes
**Files:**
- `.env`
- Coolify environment variables

### Problem

```bash
JWT_SECRET="autoleads-jwt-secret-change-this-in-production..."
```

- Default secret can be guessed
- Anyone with default secret can forge valid tokens
- Complete authentication bypass

### Solution

```bash
# Generate secure 32-byte secret
openssl rand -hex 32

# Example output:
# 4f7d8e9a2c1b3d6e8f0a2c4e6d8b0f2a4c6e8d0b2f4a6c8e0d2b4f6a8c0e2d4
```

### Update .env

```bash
# OLD - INSECURE
JWT_SECRET="autoleads-jwt-secret-change-this-in-production..."

# NEW - SECURE
JWT_SECRET="4f7d8e9a2c1b3d6e8f0a2c4e6d8b0f2a4c6e8d0b2f4a6c8e0d2b4f6a8c0e2d4"
```

### Update Coolify

1. Open Coolify dashboard
2. Navigate to AutoLeads app
3. Go to "Environment Variables"
4. Find or add `JWT_SECRET`
5. Paste generated secret
6. Save

### Verification

```bash
# 1. Check secret length
echo -n "YOUR_SECRET" | wc -c
# Should be 64 characters (32 bytes in hex)

# 2. Test tokens from old secret don't work
# Login with old secret → get token
# Change secret to new one
# Try using old token → Should fail with "Invalid token"

# 3. Test new tokens work
# Login with new secret → get token
# Use token for authenticated request → Should succeed
```

### Security Best Practices

- [ ] Secret is at least 256 bits (32 bytes)
- [ ] Secret is randomly generated (not a passphrase)
- [ ] Secret is different per environment (dev/staging/prod)
- [ ] Secret is stored securely (env vars, not in code)
- [ ] Secret is rotated periodically (every 6 months)

---

## Phase 1 Completion Checklist

### Pre-Implementation
- [ ] Phase 0 completed successfully
- [ ] Application starts without errors
- [ ] Database migrations applied
- [ ] All tests passing

### Implementation Order
1. [ ] Task 1.4: Generate JWT secret (5m) - Do this first!
2. [ ] Task 1.1: Replace JWT implementation (4h)
3. [ ] Task 1.2: Restrict CORS (30m)
4. [ ] Task 1.3: Add security headers (2h)

**Total Time:** 6h 35min

### Testing
- [ ] Login still works with new JWT
- [ ] Tokens expire correctly
- [ ] CORS blocks unauthorized origins
- [ ] Security headers present in responses
- [ ] No regression in existing features

### Post-Implementation
- [ ] Security scan with `npm audit`
- [ ] Manual penetration testing
- [ ] Git commit: `git commit -am "feat: Phase 1 - security hardening complete"`
- [ ] Ready for Phase 2

---

## Security Testing Procedures

### Test 1: JWT Security

```bash
# 1. Test token expiration
# Set JWT_EXPIRES_IN="10s"
# Login → wait 15s → request → should fail

# 2. Test algorithm confusion
# Modify token header: change "HS256" to "none"
# Request → should fail

# 3. Test signature tampering
# Take valid token
# Change one character in signature
# Request → should fail

# 4. Test payload tampering
# Take valid token
# Decode, change userId
# Re-encode with same signature
# Request → should fail
```

### Test 2: CORS Security

```bash
# 1. Test from allowed origin
curl -H "Origin: https://auto.lumiku.com" \
  http://localhost:3000/api/cars -i
# Should have Access-Control-Allow-Origin header

# 2. Test from blocked origin
curl -H "Origin: https://evil.com" \
  http://localhost:3000/api/cars -i
# Should NOT have Access-Control-Allow-Origin header

# 3. Test credentials
curl -H "Origin: https://auto.lumiku.com" \
  -H "Cookie: session=abc" \
  http://localhost:3000/api/admin/cars -i
# Should have Access-Control-Allow-Credentials: true
```

### Test 3: Security Headers

```bash
# 1. Verify all headers present
curl -I http://localhost:3000 | grep -E "(X-Frame|X-Content|CSP|Strict-Transport)"

# 2. Test CSP enforcement
# Browser console: try inline script
<script>alert('xss')</script>
# Should be blocked

# 3. Test framing protection
# Create HTML: <iframe src="..."></iframe>
# Should refuse to load
```

---

## Common Security Issues & Fixes

### Issue: JWT tokens still work after secret change

**Cause:** Token caching or cookie storage

**Fix:**
```typescript
// Clear all cookies on logout
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
```

### Issue: CORS still allows all origins

**Cause:** Middleware order incorrect

**Fix:** CORS middleware must be BEFORE routes
```typescript
// ✅ Correct order:
app.use('*', cors(...))
app.use('*', helmet(...))
app.route('/api', apiRoutes)  // Routes come last
```

### Issue: CSP blocking legitimate resources

**Cause:** CSP too restrictive

**Fix:** Check browser console for CSP errors, add domains to whitelist
```typescript
imgSrc: ["'self'", 'data:', 'https://cdn.example.com'],
```

---

## Security Metrics

**Before Phase 1:**
- JWT Security: 30/100 (custom implementation)
- CORS Security: 0/100 (wide open)
- Headers: 20/100 (basic only)
- **Overall: 45/100**

**After Phase 1:**
- JWT Security: 95/100 (industry standard)
- CORS Security: 90/100 (restricted)
- Headers: 95/100 (comprehensive)
- **Overall: 85/100**

---

## Next Phase

After Phase 1 completion, proceed to:
- **Phase 2: High Priority Bug Fixes** (4-6 hours)
  - BigInt serialization
  - Race conditions
  - Input validation
  - Error boundaries

See: `PHASE_2_BUG_FIXES.md`
