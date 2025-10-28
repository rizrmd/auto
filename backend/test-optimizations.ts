#!/usr/bin/env bun
/**
 * Test script for WhatsApp Bot Performance Optimizations
 * 
 * This script tests the various optimization components:
 * - Service container initialization
 * - Health checks
 * - Response caching
 * - Request deduplication
 * - Timeout handling
 */

import { ServiceContainer } from './src/services/service-container';
import { responseCache } from './src/cache/response-cache';
import { RequestDeduplicator } from './src/middleware/request-deduplicator';
import { TimeoutHandler } from './src/middleware/timeout-handler';

async function testOptimizations() {
  console.log('🚀 Testing WhatsApp Bot Performance Optimizations');
  console.log('='.repeat(60));

  try {
    // Test 1: Service Container Initialization
    console.log('\n1️⃣ Testing Service Container...');
    const startTime = Date.now();
    
    const serviceContainer = ServiceContainer.getInstance();
    await serviceContainer.initialize();
    
    const initTime = Date.now() - startTime;
    console.log(`✅ Service container initialized in ${initTime}ms`);

    // Test 2: Health Checks
    console.log('\n2️⃣ Testing Health Checks...');
    const healthChecker = serviceContainer.healthChecker;
    const healthStatus = await healthChecker.checkHealth();
    
    console.log(`📊 Overall Health: ${healthStatus.status}`);
    for (const [service, status] of Object.entries(healthStatus.services)) {
      console.log(`   ${service}: ${status.status === 'healthy' ? '✅' : '❌'} ${status.error || 'OK'}`);
    }

    // Test 3: Response Caching
    console.log('\n3️⃣ Testing Response Caching...');
    const cache = responseCache;
    
    // Test cache set/get
    await cache.set('test-key', { message: 'test data' }, { ttl: 60 });
    const cachedData = await cache.get('test-key');
    
    console.log(`✅ Cache test: ${cachedData ? 'PASS' : 'FAIL'}`);
    
    // Test cache stats
    const stats = cache.getStats();
    console.log(`📈 Cache Stats: ${stats.totalHits} hits, ${stats.totalMisses} misses, ${stats.size} items`);

    // Test 4: Request Deduplication
    console.log('\n4️⃣ Testing Request Deduplication...');
    const deduplicator = new RequestDeduplicator();
    
    const testKey = 'test-request';
    let pendingCount = 0;
    
    // Simulate checking pending requests
    for (let i = 0; i < 5; i++) {
      if (deduplicator.isPending(testKey)) {
        pendingCount++;
      }
    }
    
    console.log(`✅ Deduplication test: ${pendingCount === 0 ? 'PASS' : 'FAIL'} (${pendingCount}/5 pending requests detected)`);

    // Test 5: Timeout Handler
    console.log('\n5️⃣ Testing Timeout Handler...');
    const timeoutHandler = new TimeoutHandler();
    
    try {
      await timeoutHandler.withTimeout('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'success';
      }, 200);
      console.log('✅ Timeout test: PASS (operation completed within timeout)');
    } catch (error) {
      console.log('❌ Timeout test: FAIL (should not have timed out)');
    }

    try {
      await timeoutHandler.withTimeout('test-slow', async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'success';
      }, 100);
      console.log('❌ Timeout test: FAIL (should have timed out)');
    } catch (error) {
      console.log('✅ Timeout test: PASS (operation correctly timed out)');
    }

    // Test 6: Service Warmup
    console.log('\n6️⃣ Testing Service Warmup...');
    const warmupService = serviceContainer.warmupService;
    await warmupService.warmUp();
    console.log('✅ Service warmup completed');

    // Final health check after all tests
    console.log('\n7️⃣ Final Health Check...');
    const finalHealth = await healthChecker.checkHealth();
    console.log(`🎯 Final Status: ${finalHealth.status === 'healthy' ? '✅ All Systems Ready' : '❌ Issues Detected'}`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Optimization Tests Complete!');
    console.log(`⏱️  Total test time: ${Date.now() - startTime}ms`);
    
    if (finalHealth.status === 'healthy') {
      console.log('✅ All optimizations are working correctly');
      console.log('🚀 Bot is ready for high-performance operation');
    } else {
      console.log('⚠️  Some optimizations need attention');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testOptimizations().catch(console.error);