# WhatsApp Web API v1.1.0 Integration Guide

## Overview

This document describes the integration of WhatsApp Web API v1.1.0 into the AutoLeads platform. The new binary provides enhanced features including message read receipts and QR code image support.

## Features

### ✅ New in v1.1.0

- **Message Read Receipts**: Automatically mark received messages as read (blue checkmarks)
- **QR Code Image Support**: Generate QR codes as PNG images directly from `/pair` endpoint
- **Enhanced Message Handling**: Improved message processing with proper read receipt functionality

### 🔧 Existing Features

- **QR Code Pairing**: Generate QR codes to pair WhatsApp accounts
- **Message Sending**: Send text messages to any WhatsApp number via REST API
- **Webhook Support**: Receive incoming messages via HTTP webhooks
- **PostgreSQL Storage**: Secure WhatsApp session persistence in PostgreSQL
- **Auto SSL Handling**: Automatically configures PostgreSQL SSL mode
- **Session Management**: Automatic reconnection and session handling

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend     │    │   Backend       │    │  WhatsApp Web  │
│   (React)      │◄──►│   (Hono/Bun)   │◄──►│  API v1.1.0    │
│                │    │                  │    │                 │
│ - Admin Panel  │    │ - Webhook Routes │    │ - QR Pairing   │
│ - Car Catalog  │    │ - Message Logic  │    │ - Send API     │
│ - Lead Mgmt    │    │ - Read Receipts │    │ - Read API     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   File Storage  │    │   WhatsApp      │
│   Database      │    │   (/app/data)    │    │   Network      │
│                │    │                  │    │                 │
│ - Tenants      │    │ - Car Images    │    │ - Messages     │
│ - Leads        │    │ - Uploads       │    │ - Status       │
│ - Messages     │    │ - Static Files  │    │ - QR Codes     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Installation & Setup

### 1. Docker Deployment (Recommended)

The WhatsApp Web API binary is automatically downloaded and configured in Docker:

```dockerfile
# Download and setup WhatsApp Web API v1.1.0
RUN wget https://github.com/rizrmd/whatsapp-web-api/releases/download/v1.1.0/whatsapp-web-api-linux-amd64.zip \
    && unzip whatsapp-web-api-linux-amd64.zip \
    && chmod +x whatsapp-web-api-linux-amd64 \
    && mv whatsapp-web-api-linux-amd64 /usr/local/bin/whatsapp-web-api \
    && rm whatsapp-web-api-linux-amd64.zip
```

### 2. Environment Configuration

```bash
# WhatsApp Web API Configuration
WHATSAPP_API_URL="http://localhost:8080/send"
WHATSAPP_API_KEY=""

# WhatsApp Webhook URL (optional - for receiving messages)
WA_WEBHOOK_URL="https://your-domain.com/webhook/whatsapp"

# Database (shared with main application)
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 3. Service Startup

The WhatsApp Web API runs on port 8080 alongside the main application:

```bash
# Both services start automatically
./start-multi-services.sh

# Or manually:
# Terminal 1: WhatsApp Web API
PORT=8080 DATABASE_URL="$DATABASE_URL" /usr/local/bin/whatsapp-web-api

# Terminal 2: Main Application
bun backend/index.tsx
```

## API Endpoints

### WhatsApp Web API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check service status and pairing state |
| GET | `/pair` | Generate QR code for pairing (JSON format) |
| GET | `/pair?format=image` | Generate QR code as PNG image |
| POST | `/send` | Send text message to WhatsApp number |
| POST | `/read` | Mark messages as read (v1.1.0 feature) |
| GET | `/swagger` | API documentation (Swagger UI) |
| GET | `/swagger.yaml` | OpenAPI 3.0 specification |

### Backend Integration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/whatsapp/status` | Get WhatsApp connection status |
| GET | `/api/admin/whatsapp/qr` | Generate QR code for pairing |
| POST | `/api/admin/whatsapp/test` | Send test message |
| GET | `/api/admin/whatsapp/logs` | Get recent WhatsApp activity |
| POST | `/api/admin/whatsapp/mark-read` | Mark messages as read (test) |
| POST | `/webhook/whatsapp` | Receive incoming messages |

## Usage Examples

### 1. Generate QR Code for Pairing

```typescript
import { WhatsAppClient } from './whatsapp/whatsapp-client';

const whatsapp = new WhatsAppClient();

// JSON format
const qrJson = await whatsapp.generateQR('json');
console.log('QR Code:', qrJson.data?.qr_code);

// Image format
const qrImage = await whatsapp.generateQR('image');
console.log('QR Image URL:', qrImage.data?.qr_image_url);
```

### 2. Send Message

```typescript
const result = await whatsapp.sendMessage({
  target: '628123456789',
  message: 'Hello from AutoLeads! 🚗'
});

if (result.success) {
  console.log('Message sent successfully');
} else {
  console.error('Failed to send:', result.error);
}
```

### 3. Send Image

```typescript
const result = await whatsapp.sendImage(
  '628123456789',
  'https://example.com/car-photo.jpg',
  'Check out this amazing car!'
);
```

### 4. Mark Messages as Read (v1.1.0)

```typescript
// Mark specific messages as read
const readResult = await whatsapp.markAsRead(
  '628123456789',
  ['msg_123', 'msg_456']
);

// Mark all messages as read
const readResult = await whatsapp.markAsRead('628123456789');
```

### 5. Health Check

```typescript
const health = await whatsapp.healthCheck();
console.log('WhatsApp Status:', {
  paired: health.data?.paired,
  connected: health.data?.connected,
  webhook_configured: health.data?.webhook_configured
});
```

## Webhook Integration

### Incoming Message Format

```json
{
  "event": "message",
  "message": "Hello, I'm interested in this car",
  "sender": "628123456789@s.whatsapp.net",
  "chat": "628123456789-123456789@g.us",
  "time": "2025-10-26T10:30:00Z"
}
```

### Webhook Processing Flow

1. **Receive Message**: WhatsApp Web API sends POST to `/webhook/whatsapp`
2. **Parse Payload**: Extract sender, message, and metadata
3. **Find Tenant**: Identify tenant by phone number or device
4. **Process with LLM**: Use function calling for intelligent responses
5. **Send Response**: Reply via WhatsApp Web API
6. **Mark as Read**: Automatically mark original message as read (v1.1.0)

## Admin Panel Integration

### WhatsApp Management Interface

The admin panel provides WhatsApp management features:

- **Connection Status**: View pairing and connection status
- **QR Code Generation**: Generate QR codes for device pairing
- **Test Messaging**: Send test messages to verify functionality
- **Activity Logs**: View recent WhatsApp conversations
- **Read Receipt Testing**: Test read receipt functionality

### API Endpoints for Admin

```typescript
// Get status
GET /api/admin/whatsapp/status

// Generate QR code
GET /api/admin/whatsapp/qr?format=json|image

// Send test message
POST /api/admin/whatsapp/test
{
  "phone": "628123456789",
  "message": "Test message"
}

// Get activity logs
GET /api/admin/whatsapp/logs?limit=50

// Test read receipts
POST /api/admin/whatsapp/mark-read
{
  "phone": "628123456789",
  "messageIds": ["msg_123"]
}
```

## Testing

### 1. Run Test Script

```bash
bun test-read-receipt.ts
```

This tests:
- Health check functionality
- Version detection
- QR code generation (JSON & image)
- Read receipt functionality
- Swagger documentation access

### 2. Manual Testing

```bash
# Check health
curl http://localhost:8080/health

# Generate QR code
curl http://localhost:8080/pair

# Send test message
curl -X POST http://localhost:8080/send \
  -H "Content-Type: application/json" \
  -d '{"number":"628123456789","message":"Test message"}'

# Mark as read
curl -X POST http://localhost:8080/read \
  -H "Content-Type: application/json" \
  -d '{"number":"628123456789","message_ids":["msg_123"]}'
```

## Troubleshooting

### Common Issues

1. **WhatsApp API Not Starting**
   - Check `DATABASE_URL` is configured
   - Verify PostgreSQL is accessible
   - Check port 8080 is available

2. **QR Code Not Generating**
   - Ensure WhatsApp Web API is running
   - Check `/health` endpoint first
   - Verify no existing session is active

3. **Messages Not Sending**
   - Verify device is paired successfully
   - Check phone number format (no '+' prefix)
   - Ensure message length < 4096 characters

4. **Read Receipts Not Working**
   - Ensure using v1.1.0 binary
   - Check `/read` endpoint exists
   - Verify message IDs are correct

### Debug Commands

```bash
# Check WhatsApp API logs
docker logs <container_id> | grep whatsapp

# Test API connectivity
curl http://localhost:8080/health

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# View webhook logs
grep "webhook" /app/logs/app.log
```

## Migration from Fonnte

### Key Differences

| Feature | Fonnte | WhatsApp Web API v1.1.0 |
|---------|---------|------------------------|
| Authentication | API Key | Direct WhatsApp Web |
| Pairing | Not required | QR Code pairing |
| Read Receipts | Not supported | ✅ Supported |
| QR Images | Not supported | ✅ Supported |
| Webhook Format | Custom | Standard format |
| Database | External | Built-in PostgreSQL |

### Migration Steps

1. **Update Environment Variables**
   ```bash
   # Remove Fonnte
   # FONNTE_API_KEY="..."
   
   # Add WhatsApp Web API
   WHATSAPP_API_URL="http://localhost:8080/send"
   WA_WEBHOOK_URL="https://your-domain.com/webhook/whatsapp"
   ```

2. **Update Webhook Endpoints**
   ```bash
   # Old: /webhook/fonnte
   # New: /webhook/whatsapp
   ```

3. **Pair Device**
   ```bash
   # Generate QR code
   curl http://localhost:8080/pair
   
   # Scan with WhatsApp
   # Settings > Linked Devices > Link a device
   ```

4. **Test Integration**
   ```bash
   # Send test message
   curl -X POST http://localhost:8080/send \
     -H "Content-Type: application/json" \
     -d '{"number":"628123456789","message":"Test migration"}'
   ```

## Security Considerations

### 🔐 Data Protection

- **Session Storage**: WhatsApp sessions stored securely in PostgreSQL
- **SSL/TLS**: Automatic SSL configuration for database connections
- **Environment Variables**: Sensitive data via environment variables only
- **Webhook Security**: Validate webhook requests at your endpoint

### 🛡️ Best Practices

1. **Database Security**
   ```bash
   # Use SSL connections
   DATABASE_URL="postgres://user:pass@host:5432/db?sslmode=require"
   
   # Limit database user permissions
   GRANT SELECT, INSERT, UPDATE ON whatsapp_sessions TO whatsapp_user;
   ```

2. **Webhook Security**
   ```typescript
   // Validate webhook requests
   app.post('/webhook/whatsapp', (req, res) => {
     const signature = req.headers['x-whatsapp-signature'];
     // Verify signature logic here
   });
   ```

3. **Rate Limiting**
   ```typescript
   // Implement rate limiting for API endpoints
   app.use('/api/admin/whatsapp', rateLimit({
     windowMs: 60000, // 1 minute
     max: 10 // 10 requests per minute
   }));
   ```

## Performance Optimization

### 📊 Monitoring

Monitor these metrics:

- **Message Response Time**: Average time to send/receive messages
- **QR Code Generation Time**: Time to generate pairing QR codes
- **Database Connection Pool**: Active connections and pool utilization
- **Webhook Processing Time**: Time to process incoming messages

### ⚡ Optimization Tips

1. **Database Connection Pooling**
   ```bash
   # Configure connection pool
   DATABASE_URL="postgres://user:pass@host:5432/db?pool_min=5&pool_max=20"
   ```

2. **Caching**
   ```typescript
   // Cache QR codes for short periods
   const qrCache = new Map<string, { qr: string; expires: number }>();
   ```

3. **Batch Processing**
   ```typescript
   // Process multiple messages in batches
   const results = await Promise.allSettled(
     messages.map(msg => whatsapp.sendMessage(msg))
   );
   ```

## Future Enhancements

### 🚀 Planned Features

- **Media Message Support**: Send images, videos, documents
- **Group Message Support**: Send messages to WhatsApp groups
- **Message Templates**: Pre-defined message templates
- **Analytics Dashboard**: Detailed message analytics
- **Multi-Device Support**: Manage multiple WhatsApp devices

### 🔮 Roadmap

1. **v1.2.0**: Media message support
2. **v1.3.0**: Group messaging capabilities
3. **v1.4.0**: Advanced analytics
4. **v2.0.0**: Multi-device management

## Support

### 📚 Documentation

- **API Documentation**: `/swagger` endpoint
- **OpenAPI Spec**: `/swagger.yaml`
- **GitHub Repository**: https://github.com/rizrmd/whatsapp-web-api

### 🆘 Troubleshooting

1. **Check Logs**: Review application and WhatsApp API logs
2. **Verify Configuration**: Ensure all environment variables are set
3. **Test Connectivity**: Use health check endpoints
4. **Review Documentation**: Check Swagger API documentation

### 📞 Contact

For issues specific to AutoLeads integration:
- Create GitHub issue in AutoLeads repository
- Check existing issues and documentation
- Provide detailed error logs and configuration

---

**Last Updated**: October 26, 2025
**Version**: WhatsApp Web API v1.1.0
**AutoLeads Version**: 1.0.0