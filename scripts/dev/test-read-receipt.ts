#!/usr/bin/env bun
/**
 * Test WhatsApp Web API v1.1.0 Features
 * Tests QR generation, health check, and read receipts
 */

import { WhatsAppClient } from './backend/src/whatsapp/whatsapp-client';

async function testWhatsAppAPI() {
  console.log('🧪 Testing WhatsApp Web API v1.1.0 Features');
  console.log('='.repeat(50));

  const whatsapp = new WhatsAppClient();

  // Test 1: Health Check
  console.log('\n1️⃣ Testing Health Check...');
  try {
    const health = await whatsapp.healthCheck();
    console.log('Health Result:', health);
  } catch (error) {
    console.error('Health Check Failed:', error);
  }

  // Test 2: Version Detection
  console.log('\n2️⃣ Testing Version Detection...');
  try {
    const version = await whatsapp.getVersion();
    console.log('Version Info:', version);
  } catch (error) {
    console.error('Version Detection Failed:', error);
  }

  // Test 3: QR Code Generation (JSON)
  console.log('\n3️⃣ Testing QR Code Generation (JSON)...');
  try {
    const qrJson = await whatsapp.generateQR('json');
    console.log('QR JSON Result:', qrJson);
  } catch (error) {
    console.error('QR JSON Generation Failed:', error);
  }

  // Test 4: QR Code Generation (Image)
  console.log('\n4️⃣ Testing QR Code Generation (Image)...');
  try {
    const qrImage = await whatsapp.generateQR('image');
    console.log('QR Image Result:', {
      success: qrImage.success,
      hasImageUrl: !!qrImage.data?.qr_image_url,
      imageUrlLength: qrImage.data?.qr_image_url?.length || 0
    });
  } catch (error) {
    console.error('QR Image Generation Failed:', error);
  }

  // Test 5: Read Receipts (with test number)
  console.log('\n5️⃣ Testing Read Receipts...');
  try {
    const readResult = await whatsapp.markAsRead('628123456789', ['test-message-id']);
    console.log('Read Receipt Result:', readResult);
  } catch (error) {
    console.error('Read Receipt Test Failed:', error);
  }

  // Test 6: Swagger URL
  console.log('\n6️⃣ Getting Swagger Documentation URL...');
  try {
    const swaggerUrl = whatsapp.getSwaggerUrl();
    console.log('Swagger URL:', swaggerUrl);
  } catch (error) {
    console.error('Swagger URL Failed:', error);
  }

  console.log('\n✅ WhatsApp Web API v1.1.0 Test Complete!');
  console.log('='.repeat(50));
}

// Run tests
if (import.meta.main) {
  testWhatsAppAPI().catch(console.error);
}