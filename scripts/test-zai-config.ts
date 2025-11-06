#!/usr/bin/env bun
/**
 * Test ZAI API Configuration
 * Validates that ZAI API key is working correctly
 */

import { ZaiClient } from './backend/src/llm/zai';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

console.log('🧪 Testing ZAI API Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log(`  ZAI_API_KEY: ${process.env.ZAI_API_KEY ? '✅ Set' : '❌ Missing'} ${process.env.ZAI_API_KEY?.substring(0, 15)}...`);
console.log(`  ZAI_API_URL: ${process.env.ZAI_API_URL || 'Not set'}`);
console.log(`  ZAI_MODEL: ${process.env.ZAI_MODEL || 'Not set'}\n`);

try {
  console.log('🚀 Initializing ZAI Client...');
  const zaiClient = new ZaiClient();
  console.log('✅ ZAI Client initialized successfully\n');

  console.log('📊 ZAI Client Configuration:');
  const config = zaiClient.getConfig();
  console.log(`  Model: ${config.model}`);
  console.log(`  Temperature: ${config.temperature}`);
  console.log(`  Max Tokens: ${config.maxTokens}`);
  console.log(`  Has API Key: ${config.hasApiKey}\n`);

  console.log('🔍 Testing API connectivity...');
  const healthCheck = await zaiClient.healthCheck();
  console.log(`  Health Check: ${healthCheck ? '✅ Healthy' : '❌ Unhealthy'}\n`);

  if (healthCheck) {
    console.log('💬 Testing simple generation...');
    const testResponse = await zaiClient.generateResponse('Hello! Please respond with a simple greeting.');
    console.log(`  ✅ Response: "${testResponse}"\n`);
  }

} catch (error) {
  console.error('❌ ZAI API Test Failed:', error.message);
  console.error('\n🔧 Troubleshooting:');
  console.error('1. Check if ZAI_API_KEY is correctly set in .env file');
  console.error('2. Verify the API key is valid and active');
  console.error('3. Check internet connection');
  console.error('4. Verify ZAI API service is accessible');
  process.exit(1);
}

console.log('✅ ZAI API Configuration Test Completed Successfully!');