#!/usr/bin/env bun

/**
 * Test script for WhatsApp read receipt functionality
 */

import { WhatsAppClient } from './backend/src/whatsapp/whatsapp-client';

async function testReadReceipt() {
  console.log('🧪 Testing WhatsApp Read Receipt Functionality');
  console.log('='.repeat(50));

  const whatsapp = new WhatsAppClient();
  
  // Test 1: Check if WhatsApp client is configured
  console.log('\n1. Checking WhatsApp client configuration...');
  if (whatsapp.isConfigured()) {
    console.log('✅ WhatsApp client is configured');
  } else {
    console.log('❌ WhatsApp client is not configured');
    return;
  }

  // Test 2: Health check
  console.log('\n2. Performing health check...');
  try {
    const isHealthy = await whatsapp.healthCheck();
    if (isHealthy) {
      console.log('✅ WhatsApp API is healthy');
    } else {
      console.log('❌ WhatsApp API health check failed');
    }
  } catch (error) {
    console.log('❌ Health check error:', error);
  }

  // Test 3: Test read receipt functionality
  console.log('\n3. Testing read receipt functionality...');
  const testPhone = '6281234567890'; // Test phone number
  const testMessageIds = ['test_msg_123', 'test_msg_456'];
  
  try {
    const readResult = await whatsapp.markAsRead(testPhone, testMessageIds);
    if (readResult.success) {
      console.log('✅ Read receipt sent successfully');
      console.log(`   Message: ${readResult.message}`);
    } else {
      console.log('❌ Read receipt failed');
      console.log(`   Error: ${readResult.error}`);
    }
  } catch (error) {
    console.log('❌ Read receipt error:', error);
  }

  // Test 4: Test read receipt without message IDs
  console.log('\n4. Testing read receipt without specific message IDs...');
  try {
    const readResult = await whatsapp.markAsRead(testPhone);
    if (readResult.success) {
      console.log('✅ Read receipt (all messages) sent successfully');
      console.log(`   Message: ${readResult.message}`);
    } else {
      console.log('❌ Read receipt (all messages) failed');
      console.log(`   Error: ${readResult.error}`);
    }
  } catch (error) {
    console.log('❌ Read receipt (all messages) error:', error);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 Read receipt test completed');
}

// Run the test
testReadReceipt().catch(console.error);