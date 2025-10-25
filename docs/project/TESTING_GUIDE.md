# Function Calling Testing Guide

## Quick Test Cases for AutoLeads WhatsApp Bot

### 1. Search Cars (search_cars tool)

#### Test 1.1: Search by Brand
```
Customer: "Ada mobil Toyota?"
Expected Tool: search_cars { brand: "Toyota" }
Expected Response: List of Toyota cars with details
```

#### Test 1.2: Search by Transmission
```
Customer: "Cari mobil matic"
Expected Tool: search_cars { transmission: "Matic" }
Expected Response: List of automatic cars
```

#### Test 1.3: Search by Price Range
```
Customer: "Mobil dibawah 100 juta"
Expected Tool: search_cars { maxPrice: 100000000 }
Expected Response: Cars under 100 million
```

#### Test 1.4: Combined Filters
```
Customer: "Ada Avanza matic hitam tahun 2020?"
Expected Tool: search_cars {
  brand: "Toyota",
  model: "Avanza",
  transmission: "Matic",
  color: "Hitam",
  year: 2020
}
Expected Response: Matching cars or "No cars found"
```

### 2. Car Details (get_car_details tool)

#### Test 2.1: Get Details by Code
```
Customer: "Info lengkap mobil A01"
Expected Tool: get_car_details { displayCode: "A01" }
Expected Response: Full specs, features, condition notes
```

#### Test 2.2: Invalid Code
```
Customer: "Detail mobil INVALID123"
Expected Tool: get_car_details { displayCode: "INVALID123" }
Expected Response: "Car with code INVALID123 not found"
```

### 3. Send Photos (send_car_photos tool)

#### Test 3.1: Request Photos
```
Customer: "Kirim foto mobil A01"
Expected Tool: send_car_photos { displayCode: "A01", maxPhotos: 3 }
Expected Behavior:
  - 3 photos sent via WhatsApp
  - Each with caption
  - Tool result confirms photos sent
  - LLM responds: "Sudah saya kirimkan 3 foto mobil..."
```

#### Test 3.2: Multiple Photos
```
Customer: "Mau lihat semua foto A01"
Expected Tool: send_car_photos { displayCode: "A01", maxPhotos: 5 }
Expected Behavior: Up to 5 photos sent
```

#### Test 3.3: No Photos Available
```
Customer: "Foto mobil A99" (assuming A99 has no photos)
Expected Tool: send_car_photos { displayCode: "A99" }
Expected Response: "No photos available for car A99"
```

### 4. Location Info (send_location_info tool)

#### Test 4.1: Ask for Location
```
Customer: "Dimana lokasi showroom?"
Expected Tool: send_location_info {}
Expected Response:
  - Full address
  - WhatsApp & phone numbers
  - Business hours
  - Google Maps link (if available)
```

#### Test 4.2: Ask for Opening Hours
```
Customer: "Jam buka kapan?"
Expected Tool: send_location_info {}
Expected Response: Business hours included
```

### 5. Price Quote (get_price_quote tool)

#### Test 5.1: Ask for Price
```
Customer: "Berapa harga mobil A01?"
Expected Tool: get_price_quote { displayCode: "A01" }
Expected Response:
  - Cash price
  - DP options (20%, 30%, 40%)
  - Sample installment calculation
  - Tenor options
  - Notes about negotiation
```

#### Test 5.2: Ask about Credit
```
Customer: "Mobil A01 bisa kredit?"
Expected Tool: get_price_quote { displayCode: "A01" }
Expected Response: Credit options with calculations
```

### 6. Financing Calculator (get_financing_info tool)

#### Test 6.1: Custom Calculation
```
Customer: "Mobil 200 juta, DP 40 juta, cicilan 3 tahun berapa?"
Expected Tool: get_financing_info {
  carPrice: 200000000,
  downPayment: 40000000,
  tenure: 3
}
Expected Response: Detailed financing breakdown
```

#### Test 6.2: Percentage DP
```
Customer: "Kalau DP 30% untuk mobil 150 juta, cicilan 5 tahun"
Expected Tool: get_financing_info {
  carPrice: 150000000,
  downPaymentPercent: 30,
  tenure: 5
}
Expected Response: Monthly payment calculation
```

### 7. Schedule Test Drive (schedule_test_drive tool)

#### Test 7.1: Book Test Drive
```
Customer: "Mau test drive mobil A01 besok pagi"
Expected Tool: schedule_test_drive {
  displayCode: "A01",
  preferredDate: "2025-10-26",
  preferredTime: "morning"
}
Expected Behavior:
  - Task created in database
  - Confirmation response to customer
  - Sales team notified
```

#### Test 7.2: Book with Full Details
```
Customer: "Saya Budi, mau test drive A01 tanggal 1 November jam 2 siang"
Expected Tool: schedule_test_drive {
  displayCode: "A01",
  preferredDate: "2025-11-01",
  preferredTime: "14:00",
  customerName: "Budi"
}
Expected Behavior: Task created with all details
```

### 8. Trade-In (check_trade_in tool)

#### Test 8.1: General Trade-In Question
```
Customer: "Terima tukar tambah?"
Expected Tool: check_trade_in {}
Expected Response: Trade-in process explanation
```

#### Test 8.2: Specific Car Trade-In
```
Customer: "Mau tukar tambah Avanza 2015"
Expected Tool: check_trade_in {
  currentCarBrand: "Toyota",
  currentCarModel: "Avanza",
  currentCarYear: 2015
}
Expected Response: Trade-in info specific to their car
```

### 9. Multi-Step Conversations

#### Test 9.1: Search → Photos → Price
```
1. Customer: "Ada Honda Jazz putih?"
   Expected: search_cars { brand: "Honda", model: "Jazz", color: "Putih" }

2. Customer: "Kirim foto yang pertama"
   Expected: send_car_photos { displayCode: "A01" } (first from search)

3. Customer: "Berapa harganya?"
   Expected: get_price_quote { displayCode: "A01" } (last discussed car)
```

#### Test 9.2: Location + Search
```
Customer: "Dimana lokasi? Ada mobil matic dibawah 150 juta?"
Expected Tools (parallel):
  - send_location_info {}
  - search_cars { transmission: "Matic", maxPrice: 150000000 }
Expected Response: Location info + car list in one message
```

### 10. Edge Cases

#### Test 10.1: Unclear Request
```
Customer: "Bagus"
Expected: No tools called, LLM asks clarifying question
```

#### Test 10.2: Too Many Requests
```
Customer: "Cari Avanza, kirim foto, kasih harga, lokasi, test drive besok"
Expected: Multiple tools called in sequence/parallel
```

#### Test 10.3: Non-Existent Car
```
Customer: "Mau test drive Ferrari"
Expected: search_cars finds nothing, LLM responds politely
```

#### Test 10.4: Rapid Messages
```
Customer sends 5 messages in 2 seconds
Expected: All processed independently, no crashes
```

### 11. Error Scenarios

#### Test 11.1: Database Down
```
Simulate: Kill database connection
Expected: Fallback to RAG engine, generic error message
```

#### Test 11.2: WhatsApp API Down
```
Simulate: WhatsApp API returns 500
Expected: Photos fail gracefully, text response still works
```

#### Test 11.3: LLM Timeout
```
Simulate: ZAI API slow response
Expected: Timeout after 30s, fallback message
```

## Testing Tools

### 1. cURL Test
```bash
curl -X POST http://localhost:3000/webhook/fonnte \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "628123456789",
    "message": "Ada mobil matic dibawah 100 juta?"
  }'
```

### 2. Postman Collection
Create a collection with these endpoints:
- POST /webhook/fonnte - Main webhook
- GET /api/messages - View conversation history
- GET /api/tasks - Check created tasks

### 3. WhatsApp Simulator
Use actual WhatsApp for end-to-end testing:
1. Send test messages to bot number
2. Verify responses
3. Check photos received
4. Confirm appointment emails

## Success Criteria

✅ **Basic Functionality**
- All 8 tools execute without errors
- Photos send successfully
- Tasks created correctly
- Database saves all messages

✅ **Error Handling**
- Graceful degradation on failures
- No stack traces to customers
- Fallback to RAG engine works

✅ **Performance**
- Responses within 5 seconds (no tools)
- Responses within 10 seconds (with tools)
- No memory leaks over 100 messages
- Database queries optimized

✅ **User Experience**
- Natural language responses
- Context maintained across messages
- Photos load correctly
- Location info accurate

✅ **Logging & Monitoring**
- All tool calls logged
- Errors captured with context
- Performance metrics tracked
- Analytics data collected

## Bug Report Template

```markdown
**Issue**: [Brief description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. Customer sent: "..."
2. Expected: [tool/response]
3. Actual: [what happened]

**Logs**:
```
[Paste relevant logs]
```

**Database State**: [If relevant]
**Environment**: Production / Staging / Local
**Timestamp**: 2025-10-25 14:30:00
**Request ID**: req_abc123
```

## Performance Benchmarks

Target metrics:
- **P50 Response Time**: < 3s
- **P95 Response Time**: < 8s
- **P99 Response Time**: < 15s
- **Error Rate**: < 1%
- **Photo Success Rate**: > 95%
- **Task Creation Success**: > 99%

Monitor these in production!

## Contact for Issues

- **During Testing**: Development Team
- **Production Issues**: On-call engineer
- **Business Logic**: Product Owner
- **Customer Experience**: Customer Service Manager
