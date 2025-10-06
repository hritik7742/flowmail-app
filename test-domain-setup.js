// Test script for domain setup
const testDomainSetup = async () => {
  try {
    console.log('🧪 Testing domain setup...')
    
    // Test 1: Setup domain columns
    console.log('1. Setting up domain columns...')
    const setupResponse = await fetch('http://localhost:3000/api/setup-domain-columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const setupResult = await setupResponse.json()
    console.log('Setup result:', setupResult)
    
    // Test 2: Test domain registration (with dummy data)
    console.log('2. Testing domain registration...')
    const registerResponse = await fetch('http://localhost:3000/api/register-custom-domain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whopUserId: 'test-user-123',
        customDomain: 'example.com'
      })
    })
    const registerResult = await registerResponse.json()
    console.log('Register result:', registerResult)
    
    // Test 3: Test domain settings retrieval
    console.log('3. Testing domain settings retrieval...')
    const settingsResponse = await fetch('http://localhost:3000/api/get-domain-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whopUserId: 'test-user-123'
      })
    })
    const settingsResult = await settingsResponse.json()
    console.log('Settings result:', settingsResult)
    
    console.log('✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run if this file is executed directly
if (typeof window === 'undefined') {
  testDomainSetup()
}

module.exports = { testDomainSetup }