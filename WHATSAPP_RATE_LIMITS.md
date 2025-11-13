# WhatsApp Rate Limits & Warning System

## 📊 Rate Limit Research Summary

### 1. Pairing/QR Scanning (Observed Pattern)
**No official documentation available**, but from our experience:

| Metric | Value | Source |
|--------|-------|---------|
| **Failed Attempts Threshold** | ~3 attempts | Empirical observation |
| **Detection Pattern** | Device ID increment (`:73` → `:74` → `:76`) | Log analysis |
| **Lockout Duration** | 24-48 hours | Industry standard |
| **Symptom** | Server paired ✅ but mobile fails ❌ | Our case |

**Observed Timeline**:
```
Attempt 1 (device:73) → Failed after 60s
Attempt 2 (device:74) → Failed after 60s
Attempt 3 (device:76) → Failed after 60s ← Rate limit triggered
```

### 2. Messaging Rate Limits (Official - WhatsApp Business API)

#### Per-User Messaging
- **Pair Rate**: 1 message per 6 seconds per user
- **Error Code**: 131056 (rate limit exceeded)
- **Enforcement**: Per conversation thread

#### API Throughput
- **Default**: 80 messages/second per business phone number
- **Maximum**: 1,000 messages/second (auto-scalable)
- **API Calls**: 200-5,000 calls/hour per WABA

#### Daily Quotas (Moving 24-hour Window)
- **New Numbers**: 250 messages/day
- **Tier 1**: 1,000 messages/day
- **Tier 2**: 10,000 messages/day
- **Tier 3**: 100,000 messages/day
- **Unlimited**: After quality verification

**Update Effective October 7, 2025**:
- Limits applied at **business portfolio level** (shared across all numbers)

---

## 🛡️ Implementation Plan

### Phase 1: Database Tracking ✅ COMPLETED

**Migration Created**: `20251113_add_pairing_tracking/migration.sql`

**New Fields in `tenants` table**:
```sql
whatsapp_pairing_failures   INT DEFAULT 0
whatsapp_last_pairing_attempt TIMESTAMP
whatsapp_rate_limited_until   TIMESTAMP
```

**Prisma Schema Updated**: ✅ Added fields to Tenant model

---

### Phase 2: Backend Detection (TODO)

#### A. Admin Route for Rate Limit Check

**File**: `backend/src/routes/admin/whatsapp.ts`

```typescript
/**
 * GET /api/admin/whatsapp/rate-limit-status
 * Check if tenant is suspected to be rate-limited
 */
router.get('/rate-limit-status', authMiddleware, async (c) => {
  const user = c.get('user');

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: {
      whatsappPairingFailures: true,
      whatsappLastPairingAttempt: true,
      whatsappRateLimitedUntil: true,
      whatsappNumber: true,
    }
  });

  const now = new Date();
  const isRateLimited = tenant.whatsappRateLimitedUntil &&
                       tenant.whatsappRateLimitedUntil > now;

  const failureCount = tenant.whatsappPairingFailures || 0;
  const suspectedRateLimit = failureCount >= 3;

  return c.json({
    success: true,
    data: {
      isRateLimited,
      failureCount,
      suspectedRateLimit,
      lastAttempt: tenant.whatsappLastPairingAttempt,
      rateLimitedUntil: tenant.whatsappRateLimitedUntil,
      recommendations: suspectedRateLimit ? [
        'Use a different WhatsApp number (clean number with no previous attempts)',
        'Wait 24-48 hours before attempting again with the same number',
        'Clear WhatsApp mobile app cache and restart device',
        'Ensure stable internet connection on mobile device'
      ] : []
    }
  });
});
```

#### B. Webhook Update for Failure Detection

**File**: `backend/src/routes/webhook/whatsapp.ts`

Add detection after device removal:

```typescript
// Detect pairing failure pattern
if (payload.event === 'device_removed' || payload.event === 'disconnected') {
  const timeSincePairSuccess = Date.now() - lastPairSuccessTime;

  // If disconnected within 2 minutes after PairSuccess, likely rate limit
  if (timeSincePairSuccess < 120000) {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        whatsappPairingFailures: { increment: 1 },
        whatsappLastPairingAttempt: new Date(),
        // Set rate limit flag if >= 3 failures
        whatsappRateLimitedUntil: tenant.whatsappPairingFailures >= 2
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // +24 hours
          : null
      }
    });

    console.warn(`[RATE LIMIT] Suspected rate limiting for tenant ${tenant.id}: ${tenant.whatsappPairingFailures + 1} failures`);
  }
}

// Reset counter on successful pairing
if (payload.event === 'Connected' && isPaired) {
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      whatsappPairingFailures: 0,
      whatsappRateLimitedUntil: null,
      whatsappLastPairingAttempt: new Date()
    }
  });
}
```

---

### Phase 3: Frontend Warning Component (TODO)

#### A. Create Warning Component

**File**: `frontend/src/components/admin/RateLimitWarning.tsx`

```typescript
interface RateLimitWarningProps {
  failureCount: number;
  rateLimitedUntil: string | null;
  onDismiss?: () => void;
}

export function RateLimitWarning({
  failureCount,
  rateLimitedUntil,
  onDismiss
}: RateLimitWarningProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!rateLimitedUntil) return;

    const interval = setInterval(() => {
      const diff = new Date(rateLimitedUntil).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Rate limit expired - you can try again!');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [rateLimitedUntil]);

  if (failureCount < 2) return null;

  const severity = failureCount >= 3 ? 'error' : 'warning';

  return (
    <div className={`border-l-4 p-4 ${
      severity === 'error'
        ? 'bg-red-50 border-red-500'
        : 'bg-yellow-50 border-yellow-500'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {severity === 'error' ? '🚫' : '⚠️'}
        </div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${
            severity === 'error' ? 'text-red-800' : 'text-yellow-800'
          }`}>
            {severity === 'error'
              ? 'WhatsApp Rate Limit Detected'
              : 'Multiple Pairing Failures Detected'
            }
          </h3>
          <div className={`mt-2 text-sm ${
            severity === 'error' ? 'text-red-700' : 'text-yellow-700'
          }`}>
            <p className="mb-2">
              {severity === 'error'
                ? `You've had ${failureCount} failed pairing attempts. WhatsApp likely rate-limited this number.`
                : `You've had ${failureCount} failed pairing attempts. One more failure may trigger rate limiting.`
              }
            </p>

            {rateLimitedUntil && (
              <p className="mb-2 font-semibold">
                ⏰ Estimated recovery: {timeLeft}
              </p>
            )}

            <div className="mt-3 space-y-1">
              <p className="font-semibold">💡 Recommended Solutions:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li><strong>Best Option:</strong> Use a different WhatsApp number (clean, no previous attempts)</li>
                <li>Wait {severity === 'error' ? '24-48 hours' : '1-2 hours'} before retrying with the same number</li>
                <li>Clear WhatsApp cache on mobile: Settings → Storage → Clear Cache</li>
                <li>Restart your mobile device</li>
                <li>Ensure stable internet connection on both server and mobile</li>
              </ol>
            </div>

            {severity === 'error' && (
              <div className="mt-3 p-2 bg-red-100 rounded border border-red-200">
                <p className="text-xs font-medium">
                  <strong>⚠️ Important:</strong> Continuing to attempt pairing with this number
                  may extend the lockout period. Consider using a different number or waiting
                  the full 24-48 hours.
                </p>
              </div>
            )}
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-3 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### B. Integrate into AdminWhatsAppPage

**File**: `frontend/src/pages/AdminWhatsAppPage.tsx`

```typescript
export function AdminWhatsAppPage() {
  const { tenant } = useAdminAuth();
  const [rateLimitStatus, setRateLimitStatus] = useState(null);

  useEffect(() => {
    // Fetch rate limit status
    fetch('/api/admin/whatsapp/rate-limit-status')
      .then(res => res.json())
      .then(data => setRateLimitStatus(data.data));
  }, []);

  return (
    <div className="space-y-6">
      {/* Rate Limit Warning - Show BEFORE QR code section */}
      {rateLimitStatus?.suspectedRateLimit && (
        <RateLimitWarning
          failureCount={rateLimitStatus.failureCount}
          rateLimitedUntil={rateLimitStatus.rateLimitedUntil}
        />
      )}

      {/* Existing components */}
      <WhatsAppQR onConnectionChange={handleConnectionChange} />
    </div>
  );
}
```

---

### Phase 4: Admin Controls (TODO)

#### Reset Rate Limit Counter

**Endpoint**: `POST /api/admin/whatsapp/reset-rate-limit`

```typescript
router.post('/reset-rate-limit', authMiddleware, ownerOnly, async (c) => {
  const user = c.get('user');

  await prisma.tenant.update({
    where: { id: user.tenantId },
    data: {
      whatsappPairingFailures: 0,
      whatsappRateLimitedUntil: null
    }
  });

  return c.json({
    success: true,
    message: 'Rate limit counter reset successfully'
  });
});
```

---

## 🎯 Detection Logic Summary

### Trigger Conditions
```
IF (
  server shows "paired" = true
  AND device disconnects within 120 seconds
  AND this is not the first attempt
) THEN
  increment whatsappPairingFailures

  IF whatsappPairingFailures >= 3 THEN
    set whatsappRateLimitedUntil = now() + 24 hours
    show ERROR-level warning
  ELSE IF whatsappPairingFailures >= 2 THEN
    show WARNING-level warning
  END IF
END IF
```

### Reset Conditions
```
IF (device successfully pairs AND stays connected > 2 minutes) THEN
  reset whatsappPairingFailures = 0
  clear whatsappRateLimitedUntil
END IF
```

---

## 📋 Implementation Checklist

### Backend
- [x] Create database migration
- [x] Update Prisma schema
- [ ] Add rate limit status endpoint
- [ ] Update webhook to detect failures
- [ ] Add reset endpoint for owners
- [ ] Add logging for rate limit events

### Frontend
- [ ] Create RateLimitWarning component
- [ ] Integrate warning into AdminWhatsAppPage
- [ ] Update AdminAuthContext interface
- [ ] Add countdown timer for lockout period
- [ ] Add "Use Different Number" CTA button

### Testing
- [ ] Test failure detection with mock webhook events
- [ ] Test warning display at different failure counts
- [ ] Test countdown timer accuracy
- [ ] Test reset functionality
- [ ] Document in WHATSAPP_PAIRING_FIX.md

---

## 🔍 Monitoring Queries

### Check Rate-Limited Tenants
```sql
SELECT
  id,
  name,
  whatsapp_number,
  whatsapp_pairing_failures,
  whatsapp_last_pairing_attempt,
  whatsapp_rate_limited_until
FROM tenants
WHERE whatsapp_pairing_failures >= 3
  OR whatsapp_rate_limited_until > NOW();
```

### Reset Specific Tenant
```sql
UPDATE tenants
SET
  whatsapp_pairing_failures = 0,
  whatsapp_rate_limited_until = NULL
WHERE id = 4;
```

---

## 📚 References

- [Meta WhatsApp Messaging Limits](https://developers.facebook.com/docs/whatsapp/messaging-limits/)
- [WhatsApp Rate Limiting Guide](https://www.fyno.io/blog/whatsapp-rate-limits-for-developers)
- [DoubleTick Rate Limit Docs](https://learn.doubletick.io/whatsapp-business-api/messaging-limits-in-whatsapp-api)
- Our Experience: WHATSAPP_PAIRING_FIX.md

---

## 🚀 Deployment Strategy

### Phase 1 (Now)
- Deploy database migration
- No code changes yet (backward compatible)

### Phase 2 (After Testing)
- Deploy backend detection logic
- Monitor logs for false positives

### Phase 3 (After Validation)
- Deploy frontend warning component
- A/B test user response to warnings

### Phase 4 (Production)
- Full rollout with documentation
- Monitor rate limit hit frequency
- Optimize thresholds based on data

---

**Last Updated**: 2025-11-13
**Status**: Schema Ready | Implementation Pending
**Priority**: High (Improves User Experience)
