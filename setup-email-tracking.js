#!/usr/bin/env node

/**
 * FlowMail Email Tracking Setup Script
 * 
 * This script helps set up email open tracking with Resend webhooks.
 * Run with: node setup-email-tracking.js
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('\n🚀 FlowMail Email Tracking Setup');
  console.log('=====================================\n');

  console.log('This script will help you set up email open tracking with Resend webhooks.\n');

  // Check if running in development or production
  const isDev = process.env.NODE_ENV !== 'production';
  const baseUrl = isDev ? 'http://localhost:3000' : process.env.NEXTAUTH_URL;

  if (!baseUrl) {
    console.error('❌ Error: NEXTAUTH_URL environment variable is not set');
    process.exit(1);
  }

  console.log(`📍 Detected environment: ${isDev ? 'Development' : 'Production'}`);
  console.log(`🌐 Base URL: ${baseUrl}\n`);

  // Step 1: Test webhook endpoint
  console.log('Step 1: Testing webhook endpoint...');
  try {
    const testResponse = await fetch(`${baseUrl}/api/test-resend-webhook`, {
      method: 'POST'
    });
    const testResult = await testResponse.json();
    
    if (testResult.success) {
      console.log('✅ Webhook endpoint is working correctly\n');
    } else {
      console.log('⚠️ Webhook endpoint test failed:', testResult.error);
      console.log('Please check your application logs\n');
    }
  } catch (error) {
    console.log('❌ Could not test webhook endpoint:', error.message);
    console.log('Make sure your application is running\n');
  }

  // Step 2: Database setup
  console.log('Step 2: Database Schema Setup');
  console.log('Please run the following SQL in your Supabase SQL Editor:');
  console.log('File: fix-email-tracking-schema.sql\n');

  const continueSetup = await question('Have you run the database schema update? (y/n): ');
  if (continueSetup.toLowerCase() !== 'y') {
    console.log('Please run the database schema update first, then restart this script.');
    process.exit(0);
  }

  // Step 3: Resend webhook configuration
  console.log('\nStep 3: Resend Webhook Configuration');
  console.log('=====================================');
  console.log('1. Go to https://resend.com/dashboard');
  console.log('2. Navigate to "Webhooks" in the sidebar');
  console.log('3. Click "Add Webhook"');
  console.log('4. Configure the webhook:');
  console.log(`   - Endpoint URL: ${baseUrl}/api/webhooks/resend`);
  console.log('   - Events: email.sent, email.delivered, email.opened, email.clicked, email.bounced, email.complained');
  console.log('   - Status: Active');
  console.log('5. Save the webhook\n');

  const webhookConfigured = await question('Have you configured the Resend webhook? (y/n): ');
  if (webhookConfigured.toLowerCase() !== 'y') {
    console.log('Please configure the Resend webhook first.');
    process.exit(0);
  }

  // Step 4: Test the complete setup
  console.log('\nStep 4: Testing Complete Setup');
  console.log('===============================');
  console.log('To test email open tracking:');
  console.log('1. Send a test campaign from your FlowMail dashboard');
  console.log('2. Open the email in your inbox');
  console.log('3. Check the analytics dashboard for updated open rates');
  console.log('4. Monitor application logs for webhook events\n');

  // Step 5: Verification checklist
  console.log('✅ Setup Complete! Verification Checklist:');
  console.log('==========================================');
  console.log('□ Database schema updated');
  console.log('□ Resend webhook configured');
  console.log('□ RESEND_API_KEY environment variable set');
  console.log('□ Application deployed and accessible');
  console.log('□ Test email sent and opened');
  console.log('□ Open rates updating in dashboard\n');

  console.log('🎉 Email open tracking should now be working!');
  console.log('If you encounter issues, check the troubleshooting guide in RESEND-WEBHOOK-SETUP-COMPLETE.md\n');

  rl.close();
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

main().catch(console.error);