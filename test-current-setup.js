#!/usr/bin/env node

/**
 * Test Current FlowMail Setup
 * 
 * This script tests your current setup before adding webhooks
 * Run with: node test-current-setup.js
 */

const https = require('https');
const http = require('http');

async function testSetup() {
  console.log('\n🧪 Testing Current FlowMail Setup');
  console.log('==================================\n');

  const baseUrl = 'http://localhost:3000'; // Change if different
  const tests = [];

  // Test 1: Check if app is running
  console.log('1. Testing if app is running...');
  try {
    const response = await fetch(`${baseUrl}/api/verify-tracking-setup`);
    if (response.ok) {
      console.log('✅ App is running');
      const data = await response.json();
      console.log(`   Status: ${data.status}`);
      
      if (data.issues && data.issues.length > 0) {
        console.log('⚠️  Issues found:');
        data.issues.forEach(issue => console.log(`   - ${issue}`));
      }
    } else {
      console.log('❌ App responded with error:', response.status);
    }
  } catch (error) {
    console.log('❌ App is not running or not accessible');
    console.log('   Make sure to run: npm run dev');
    return;
  }

  // Test 2: Check environment variables
  console.log('\n2. Checking environment variables...');
  try {
    const response = await fetch(`${baseUrl}/api/test-resend`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Resend API key is configured');
    } else {
      console.log('❌ Resend API key issue:', data.error);
    }
  } catch (error) {
    console.log('⚠️  Could not test Resend API key');
  }

  // Test 3: Check database connection
  console.log('\n3. Testing database connection...');
  try {
    const response = await fetch(`${baseUrl}/api/get-subscribers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test' })
    });
    
    if (response.ok) {
      console.log('✅ Database connection working');
    } else {
      console.log('⚠️  Database connection issue');
    }
  } catch (error) {
    console.log('❌ Database connection failed');
  }

  // Test 4: Check webhook endpoint
  console.log('\n4. Testing webhook endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/webhooks/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email.opened',
        data: {
          email_id: 'test_123',
          to: ['test@example.com'],
          created_at: new Date().toISOString()
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ Webhook endpoint is working');
    } else {
      console.log('❌ Webhook endpoint error:', response.status);
    }
  } catch (error) {
    console.log('❌ Webhook endpoint failed:', error.message);
  }

  // Summary
  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('1. If all tests pass ✅, you can proceed to set up Resend webhook');
  console.log('2. If any tests fail ❌, fix those issues first');
  console.log('3. Follow the guide in RESEND-BEGINNER-SETUP.md');
  console.log('4. Use WEBHOOK-SETUP-CHECKLIST.md for step-by-step instructions');
  
  console.log('\n🔗 Helpful URLs:');
  console.log(`   - Verify Setup: ${baseUrl}/api/verify-tracking-setup`);
  console.log(`   - Test Webhook: ${baseUrl}/api/test-resend-webhook`);
  console.log('   - Resend Dashboard: https://resend.com/dashboard');
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testSetup().catch(console.error);