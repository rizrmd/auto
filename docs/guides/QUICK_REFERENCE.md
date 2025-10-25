# AutoLeads Deployment Verification - Quick Reference Card

**Print this page and keep it handy during deployments!**

---

## 🚀 Standard Deployment Procedure

```bash
# 1. Deploy Application
# (via your CI/CD pipeline or manual deployment)

# 2. Wait for startup (30 seconds)
sleep 30

# 3. Run Smoke Test (30 seconds)
cd /path/to/auto
./scripts/smoke-test.sh

# ✅ Exit 0 = Continue   |   ❌ Exit 1 = ROLLBACK NOW

# 4. Run Full Verification (2-3 minutes)
./scripts/verify-deployment.sh

# ✅ >90% pass = Continue   |   ❌ <90% pass = ROLLBACK

# 5. Start Monitoring (separate terminal)
./scripts/production-dashboard.sh

# 6. Manual Verification (30-60 minutes)
# Follow MANUAL_VERIFICATION_CHECKLIST.md

# 7. Sign off and notify team
```

---

## ⚡ Quick Commands

| Command | Purpose | Duration |
|---------|---------|----------|
| `./scripts/smoke-test.sh` | Fast critical checks | 30 sec |
| `./scripts/verify-deployment.sh` | Full verification | 2-3 min |
| `./scripts/verify-deployment.ps1` | Windows version | 2-3 min |
| `./scripts/production-dashboard.sh` | Real-time monitoring | Continuous |

---

## 🎯 Success Criteria Cheat Sheet

### ✅ Safe to Proceed
- Smoke test: Exit code 0
- Full verification: >90% pass rate
- Response time: <2 seconds
- No red failures (❌)

### ⚠️ Investigate (May Proceed)
- Warnings only (⚠️)
- Pass rate: 80-89%
- Response time: 2-3 seconds
- Non-critical headers missing

### 🛑 ROLLBACK IMMEDIATELY
- Smoke test: Exit code 1
- Health endpoint down (HTTP 503/500)
- Database disconnected (HTTP 500 on /api/tenant)
- Pass rate: <80%
- Response time: >5 seconds

---

## 🔍 Quick Diagnosis

| Symptom | Probable Cause | Quick Fix |
|---------|----------------|-----------|
| Smoke test fails immediately | App not running | Check Docker: `docker ps` |
| All API tests return 500 | Database down | Check DB connection |
| All tests timeout | Network issue | Check firewall/DNS |
| Slow response times | Server overload | Check CPU/memory |
| Security warnings | Missing headers | Check Hono middleware |

---

## 📋 One-Minute Health Check

```bash
# Check application
curl https://auto.lumiku.com/health
# Expected: {"status":"ok"}

# Check API
curl https://auto.lumiku.com/api/tenant
# Expected: HTTP 200 with tenant JSON

# Check static files
curl -I https://auto.lumiku.com/
# Expected: HTTP 200, content-type: text/html

# Check HTTPS redirect
curl -I http://auto.lumiku.com
# Expected: HTTP 301/302 to https://
```

---

## 🐛 Emergency Troubleshooting

### Application Down
```bash
# Check container status
ssh user@cf.avolut.com
docker ps | grep b8sc48s8s0c4w00008k808w8

# View logs
docker logs b8sc48s8s0c4w00008k808w8 --tail 100

# Restart container
docker restart b8sc48s8s0c4w00008k808w8
```

### Database Issues
```bash
# Check database connection in container
docker exec -it b8sc48s8s0c4w00008k808w8 bun run prisma studio

# Check connection pool
docker exec b8sc48s8s0c4w00008k808w8 bun run prisma db execute --stdin <<< "SELECT 1"
```

### Performance Issues
```bash
# Check server resources
ssh user@cf.avolut.com
top
df -h
free -m

# Check container resources
docker stats b8sc48s8s0c4w00008k808w8
```

---

## 🔐 Security Quick Check

```bash
# Test security headers
curl -I https://auto.lumiku.com | grep -E "X-Frame-Options|Content-Security-Policy|Strict-Transport-Security"

# Test SQL injection protection
curl "https://auto.lumiku.com/api/cars/search?q=%27%20OR%201=1--"
# Should return: Empty results or 400, NOT all cars

# Test XSS protection
curl "https://auto.lumiku.com/api/cars/search?q=%3Cscript%3Ealert(1)%3C%2Fscript%3E"
# Should return: Escaped/sanitized, NOT execute script
```

---

## 📊 Performance Quick Check

```bash
# Measure response time
time curl -s https://auto.lumiku.com/api/cars > /dev/null
# Target: <2 seconds

# Check TTFB
curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null -s https://auto.lumiku.com/api/cars
# Target: <500ms

# Check SSL handshake
curl -w "SSL: %{time_connect}s\n" -o /dev/null -s https://auto.lumiku.com
# Target: <200ms
```

---

## 🎨 Output Color Guide

- 🟢 **Green (✅ PASS)** = All good, no action needed
- 🔴 **Red (❌ FAIL)** = Critical, fix immediately
- 🟡 **Yellow (⚠️ WARN)** = Investigate, may proceed with caution
- 🔵 **Blue (ℹ️ INFO)** = Informational, no action needed

---

## 📞 Emergency Contacts

| Role | Contact | When to Call |
|------|---------|--------------|
| DevOps | [Contact] | Application down, server issues |
| Backend Lead | [Contact] | API failures, database issues |
| Frontend Lead | [Contact] | UI broken, client-side errors |
| Database Admin | [Contact] | Database corruption, migration issues |

---

## 🔗 Important URLs

| Purpose | URL |
|---------|-----|
| Production | https://auto.lumiku.com |
| Admin Panel | https://auto.lumiku.com/admin |
| Health Check | https://auto.lumiku.com/health |
| API Tenant | https://auto.lumiku.com/api/tenant |
| API Cars | https://auto.lumiku.com/api/cars |

---

## 📝 Rollback Procedure

```bash
# 1. Stop current deployment
ssh user@cf.avolut.com
docker stop b8sc48s8s0c4w00008k808w8

# 2. Restore previous version
docker start b8sc48s8s0c4w00008k808w8_backup
# Or redeploy previous image

# 3. Verify rollback
./scripts/smoke-test.sh

# 4. Restore database (if needed)
# Run database restore procedure

# 5. Notify team
# Send notification of rollback
```

---

## ✅ Manual Verification Priority

**Critical (Must Check):**
1. ✅ Homepage loads
2. ✅ Car listing displays
3. ✅ Car detail page works
4. ✅ Admin login works
5. ✅ WhatsApp button works
6. ✅ No console errors

**Important (Should Check):**
7. ✅ Search functionality
8. ✅ Image uploads
9. ✅ Form validation
10. ✅ Mobile responsive

**Nice to Have (Time Permitting):**
11. ✅ SEO meta tags
12. ✅ Browser compatibility
13. ✅ Performance audit
14. ✅ Accessibility

---

## 🕐 Timeline Reference

| Phase | Duration | Activity |
|-------|----------|----------|
| Deployment | 5-10 min | Deploy application |
| Startup | 30 sec | Wait for container ready |
| Smoke Test | 30 sec | Critical checks |
| Full Verification | 2-3 min | Comprehensive tests |
| Manual Testing | 30-60 min | UI/UX verification |
| Monitoring | 15 min | Watch for issues |
| **Total** | **~60 min** | **Complete verification** |

---

## 💾 Pre-Deployment Checklist

- [ ] Staging tests passed
- [ ] Database backup created
- [ ] Rollback plan documented
- [ ] Team notified
- [ ] Off-hours deployment scheduled
- [ ] Monitoring alerts configured

---

## 📈 Post-Deployment Checklist

- [ ] Smoke test passed (exit 0)
- [ ] Full verification >90% pass
- [ ] Dashboard shows all green
- [ ] Manual critical tests done
- [ ] No error spikes in logs
- [ ] Performance within thresholds
- [ ] Team notified of success
- [ ] Documentation updated

---

## 🎯 Key Metrics to Watch

| Metric | Threshold | Action if Exceeded |
|--------|-----------|-------------------|
| Error Rate | <1% | Investigate immediately |
| Response Time | <2s | Check server load |
| TTFB | <500ms | Check database queries |
| Uptime | >99.9% | Review availability |
| Failed Tests | 0 | Fix before next deploy |

---

## 🔄 Continuous Monitoring

```bash
# Set up cron jobs
crontab -e

# Smoke test every hour
0 * * * * cd /path/to/auto && ./scripts/smoke-test.sh >> /var/log/smoke.log 2>&1

# Full verification daily at 9 AM
0 9 * * * cd /path/to/auto && ./scripts/verify-deployment.sh >> /var/log/verify.log 2>&1

# Alert on failure
*/5 * * * * curl -fsS -m 10 --retry 5 https://auto.lumiku.com/health || echo "Health check failed" | mail -s "Alert" admin@example.com
```

---

## 📚 Documentation Quick Links

- **Full Documentation**: `scripts/README.md`
- **Manual Checklist**: `MANUAL_VERIFICATION_CHECKLIST.md`
- **Sample Outputs**: `scripts/SAMPLE_OUTPUT.md`
- **Deployment Report**: `DEPLOYMENT_VERIFICATION_REPORT.md`
- **This Quick Reference**: `QUICK_REFERENCE.md`

---

## 💡 Pro Tips

1. **Always run smoke test first** - Catches critical issues in 30 seconds
2. **Keep dashboard running** - Monitor while doing manual tests
3. **Document everything** - Note any warnings or issues
4. **Test in staging first** - Never skip staging verification
5. **Have rollback ready** - Don't deploy without backup plan
6. **Monitor logs** - Check for errors even if tests pass
7. **Verify manually** - Automated tests don't catch everything
8. **Update scripts** - Add tests when features are added

---

## 🏁 Final Sign-Off Template

```
Deployment Date: ________________
Deployed By: ____________________

Smoke Test:        [ ] PASS  [ ] FAIL
Full Verification: [ ] PASS  [ ] FAIL
Manual Testing:    [ ] PASS  [ ] FAIL
Performance:       [ ] GOOD  [ ] DEGRADED

Pass Rate: _____%
Response Time: _____ms
Issues Found: ____________________________________________

Approved:          [ ] YES   [ ] NO (rollback)
Signed: ____________________  Date: ________________
```

---

**🎉 Happy Deploying!**

*Keep this card accessible during all production deployments.*
*For detailed instructions, refer to the full documentation.*

**Questions?** Contact DevOps team or check `scripts/README.md`
