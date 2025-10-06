#!/usr/bin/env node

/**
 * Setup HTTPS Tunnel for Resend Webhooks
 * 
 * This script helps you set up ngrok for local development
 * Run with: node setup-tunnel.js
 */

const { spawn } = require('child_process');
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
  console.log('\n🔒 HTTPS Tunnel Setup for Resend Webhooks');
  console.log('==========================================\n');

  console.log('Resend requires HTTPS endpoints for webhooks.');
  console.log('We need to create a secure tunnel to your localhost.\n');

  // Check if ngrok is installed
  console.log('Checking if ngrok is installed...');
  
  try {
    const { execSync } = require('child_process');
    execSync('ngrok version', { stdio: 'ignore' });
    console.log('✅ ngrok is installed\n');
    
    const startTunnel = await question('Start ngrok tunnel now? (y/n): ');
    if (startTunnel.toLowerCase() === 'y') {
      console.log('\n🚀 Starting ngrok tunnel...');
      console.log('Keep this terminal open while testing webhooks!\n');
      
      // Start ngrok
      const ngrok = spawn('ngrok', ['http', '3000'], { stdio: 'inherit' });
      
      ngrok.on('close', (code) => {
        console.log(`\nngrok tunnel closed with code ${code}`);
      });
      
      // Keep the process running
      process.on('SIGINT', () => {
        console.log('\n👋 Closing tunnel...');
        ngrok.kill();
        process.exit();
      });
      
    } else {
      console.log('\nTo start the tunnel manually, run:');
      console.log('  ngrok http 3000\n');
    }
    
  } catch (error) {
    console.log('❌ ngrok is not installed\n');
    console.log('📥 Installation options:');
    console.log('1. Download from: https://ngrok.com/download');
    console.log('2. Or install via npm: npm install -g ngrok');
    console.log('3. Or install via brew: brew install ngrok\n');
    
    const install = await question('Install ngrok via npm now? (y/n): ');
    if (install.toLowerCase() === 'y') {
      console.log('\n📦 Installing ngrok...');
      const { execSync } = require('child_process');
      try {
        execSync('npm install -g ngrok', { stdio: 'inherit' });
        console.log('\n✅ ngrok installed successfully!');
        console.log('Run this script again to start the tunnel.');
      } catch (error) {
        console.log('\n❌ Installation failed. Please install manually from https://ngrok.com');
      }
    }
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Make sure your app is running: npm run dev');
  console.log('2. Start ngrok tunnel: ngrok http 3000');
  console.log('3. Copy the HTTPS URL (like https://abc123.ngrok.io)');
  console.log('4. Use this URL in Resend webhook setup');
  console.log('5. Full URL: https://your-url.ngrok.io/api/webhooks/resend\n');

  rl.close();
}

main().catch(console.error);