# Chrome DevTools MCP Integration

Auto project telah diintegrasikan dengan [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) untuk debugging, monitoring, dan analisis performa yang powerful.

## 🚀 Setup

### 1. Start Chrome with Remote Debugging

```bash
# Start Chrome dengan remote debugging
bun run devtools:start
```

### 2. Verifikasi Koneksi

Chrome akan otomatis start dengan:
- **Remote debugging port**: `9222`
- **DevTools URL**: `chrome-devtools://devtools/bundled/js_app.html?experiments=true&v8only=true&ws=localhost:9222`
- **WebSocket endpoint**: `ws://localhost:9222/devtools/browser`

### 3. Cleanup

```bash
# Stop Chrome dan cleanup
bun run devtools:cleanup
```

## 🛠️ Penggunaan dengan Claude

Setelah Chrome berjalan dengan remote debugging, Anda bisa memberikan perintah langsung ke Claude:

### Performance Analysis
```
Check the performance of https://auto.lumiku.com
Analyze the load time for the admin dashboard
Check the Core Web Vitals for https://primamobil.id
```

### Network Analysis
```
Analyze network requests when loading WhatsApp page
Check API response times for car listings
Monitor WebSocket connections for real-time updates
```

### Debugging
```
Debug JavaScript errors on the car detail page
Check console errors during WhatsApp QR scanning
Analyze memory usage on the admin dashboard
```

### Screenshots & UI Testing
```
Take a screenshot of the admin dashboard
Capture the WhatsApp QR code page
Check responsive design on mobile viewport
```

### Element Inspection
```
Find the submit button CSS selector
Check accessibility of the car catalog
Inspect the WhatsApp connection status element
```

## 📋 Konfigurasi MCP

Konfigurasi MCP ada di file `.mcp.json`:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

Permissions telah dikonfigurasi di `.claude/settings.local.json`.

## 🎯 Use Cases untuk Auto Project

### 1. WhatsApp Integration Testing
```bash
# Analyze WhatsApp QR loading performance
bun run devtools:start
# Lalu minta Claude: "Check WhatsApp QR code loading performance"
```

### 2. Admin Dashboard Performance
```bash
# Test admin dashboard dengan data besar
bun run devtools:start
# Lalu minta Claude: "Analyze admin dashboard performance with 1000+ cars"
```

### 3. Mobile Responsiveness
```bash
# Test mobile view
bun run devtools:start
# Lalu minta Claude: "Test mobile responsiveness for all pages"
```

### 4. API Debugging
```bash
# Monitor API calls
bun run devtools:start
# Lalu minta Claude: "Monitor API calls during car search"
```

### 5. Memory Leak Detection
```bash
# Cek memory leaks
bun run devtools:start
# Lalu minta Claude: "Check for memory leaks in the car catalog"
```

## 🔧 Advanced Usage

### Custom Chrome Configuration
Environment variables untuk custom setup:

```bash
export AUTO_URL="https://staging.auto.lumiku.com"
export PRIMA_URL="https://staging.primamobil.id"
bun run devtools:start
```

### Headless Mode
Untuk automated testing tanpa UI:

```bash
npx -y chrome-devtools-mcp@latest --headless
```

### Connection to Existing Chrome
Jika Chrome sudah berjalan dengan remote debugging:

```bash
npx -y chrome-devtools-mcp@latest --browser-url=http://localhost:9222
```

## 🐛 Troubleshooting

### Chrome Tidak Start
```bash
# Check if Chrome is installed
which google-chrome || which chrome || which chromium-browser

# Manual start
google-chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug
```

### Port Conflict
```bash
# Check port usage
lsof -i :9222

# Kill processes on port
lsof -ti:9222 | xargs kill -9
```

### MCP Server Error
```bash
# Restart MCP server
bun run devtools:cleanup
bun run devtools:start

# Check MCP configuration
cat .mcp.json
```

## 📊 Monitoring Dashboard

Integration ini memungkinkan monitoring real-time:

- **Performance metrics**: Load time, TTI, FCP, LCP
- **Network analysis**: API calls, response times, errors
- **Memory usage**: Heap size, garbage collection
- **Console errors**: JavaScript errors, warnings
- **Accessibility**: ARIA labels, color contrast, keyboard navigation

## 🔒 Security

- Remote debugging hanya berjalan di localhost
- Temporary user data profile untuk isolasi
- Tidak ada extensions yang di-load
- Web security disabled hanya untuk development

## 📝 Examples

### Performance Audit
```
Perform full performance audit for https://auto.lumiku.com/admin/cars
Check Core Web Vitals scores
Analyze bundle sizes and loading strategies
```

### WhatsApp Debugging
```
Debug WhatsApp QR code generation
Monitor WebSocket connections for real-time messages
Check API response times for WhatsApp endpoints
```

### UI Automation Testing
```
Test complete car listing workflow
Validate form submissions
Check responsive design on different screen sizes
```

---

**Note**: Chrome DevTools MCP hanya untuk development environment. Jangan gunakan di production!