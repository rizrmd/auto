# Monitoring & Debugging Alternatives for AutoLeads

Since Jaeger distributed tracing doesn't fit the debugging needs, here are some practical alternatives for monitoring and debugging the WhatsApp bot and AutoLeads system.

## 🔧 **Recommended Alternatives**

### 1. **Enhanced Logging System**

#### **Structured Logging with Winston**
```bash
# Add to package.json
bun add winston winston-daily-rotate-file
```

#### **Implementation Benefits:**
- JSON structured logs for easy parsing
- Log levels (error, warn, info, debug)
- Automatic log rotation
- Request/response correlation IDs
- WhatsApp message flow tracking

#### **Log Structure:**
```json
{
  "timestamp": "2025-01-05T10:30:00.000Z",
  "level": "info",
  "correlationId": "req_abc123",
  "service": "whatsapp-webhook",
  "operation": "message_processing",
  "tenantId": 1,
  "sender": "628123****",
  "message": "test message",
  "duration": 150,
  "status": "success"
}
```

### 2. **Custom Performance Monitoring**

#### **Request Timing Middleware**
```typescript
// Simple performance tracking without external dependencies
export function performanceMiddleware(c: Context, next: Next) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  c.set('requestId', requestId);
  c.set('startTime', startTime);

  console.log(`[${requestId}] ${c.req.method} ${c.req.path} - START`);

  await next();

  const duration = Date.now() - startTime;
  console.log(`[${requestId}] ${c.req.method} ${c.req.path} - END (${duration}ms)`);
}
```

#### **WhatsApp Bot Metrics**
```typescript
// Track WhatsApp bot performance
const botMetrics = {
  totalMessages: 0,
  errorCount: 0,
  avgResponseTime: 0,
  lastHourMessages: 0,
};

// Update metrics in webhook
botMetrics.totalMessages++;
botMetrics.lastHourMessages++;
```

### 3. **Health Check & Status API**

#### **Comprehensive Health Endpoint**
```typescript
// GET /api/health
{
  "status": "healthy",
  "timestamp": "2025-01-05T10:30:00Z",
  "uptime": 86400,
  "services": {
    "whatsapp": {
      "status": "connected",
      "lastMessage": "2 minutes ago",
      "queueSize": 0
    },
    "database": {
      "status": "connected",
      "responseTime": "15ms"
    },
    "llm": {
      "status": "healthy",
      "provider": "zai",
      "avgResponseTime": "250ms"
    }
  },
  "metrics": {
    "messagesProcessed": 1234,
    "errorRate": "0.5%",
    "avgResponseTime": "150ms"
  }
}
```

### 4. **Simple Dashboard**

#### **React Dashboard Component**
```typescript
// Real-time monitoring without complex infrastructure
function MonitoringDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch metrics every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const [metricsData, logsData] = await Promise.all([
        fetch('/api/health').then(r => r.json()),
        fetch('/api/logs/recent').then(r => r.json())
      ]);

      setMetrics(metricsData);
      setLogs(logsData);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <HealthStatus services={metrics?.services} />
      <MetricsCards metrics={metrics?.metrics} />
      <RecentLogs logs={logs} />
    </div>
  );
}
```

### 5. **Error Tracking & Alerting**

#### **Simple Error Logger**
```typescript
// Enhanced error tracking
export function logError(error: Error, context: any) {
  const errorData = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context: {
      requestId: context.requestId,
      tenantId: context.tenantId,
      operation: context.operation,
      userId: context.userId
    }
  };

  console.error('[ERROR]', JSON.stringify(errorData));

  // Store in database for analysis
  storeErrorLog(errorData);
}
```

#### **Alert Conditions**
```typescript
// Simple alerting without external services
const alertConditions = {
  errorRate: { threshold: 0.05, window: '1h' },
  responseTime: { threshold: 2000, window: '5m' },
  whatsappQueue: { threshold: 100, window: '1m' }
};
```

## 🚀 **Implementation Priority**

### **Phase 1: Enhanced Logging (Week 1)**
1. Implement structured logging with Winston
2. Add correlation IDs to all requests
3. Log WhatsApp message flow with timing
4. Create log viewing endpoint for Super Admin

### **Phase 2: Performance Metrics (Week 1-2)**
1. Add request timing middleware
2. Implement WhatsApp bot metrics tracking
3. Create health check endpoint
4. Build simple metrics dashboard

### **Phase 3: Error Tracking (Week 2)**
1. Enhanced error logging with context
2. Error rate monitoring
3. Simple alerting system
4. Error analysis dashboard

## 📊 **Benefits of This Approach**

### **Simplicity**
- No external infrastructure required
- Easy to implement and maintain
- Minimal performance overhead
- No additional services to monitor

### **Effectiveness**
- Focus on actual debugging needs
- WhatsApp message flow visibility
- Performance bottleneck identification
- Quick root cause analysis

### **Cost-Effective**
- No additional hosting costs
- No external service subscriptions
- Minimal resource usage
- Scales with application

## 🔍 **What We Can Monitor**

### **WhatsApp Bot Performance**
- Message processing time
- Success/failure rates
- Queue depth and processing speed
- Response time by tenant

### **System Health**
- Database connection status
- LLM API response times
- Memory and CPU usage
- Error rates and patterns

### **Business Metrics**
- Messages per tenant
- Lead generation rates
- Response quality metrics
- User engagement patterns

## 🛠️ **Quick Start**

```bash
# 1. Add logging dependency
bun add winston winston-daily-rotate-file

# 2. Create logger configuration
# backend/src/utils/logger.ts

# 3. Add logging to WhatsApp webhook
# backend/src/routes/webhook/whatsapp.ts

# 4. Create health check endpoint
# backend/src/routes/health.ts

# 5. Build monitoring dashboard
# frontend/src/components/MonitoringDashboard.tsx
```

This approach provides practical debugging capabilities without the complexity of distributed tracing infrastructure.