// Test script for optimized APIs
// This script tests the new optimized APIs to ensure they work correctly

const testOptimizedAPIs = async () => {
  console.log('🧪 Testing Optimized APIs...')
  
  // Test data
  const testUserId = 'test_user_123'
  const testExperienceId = 'test_experience_456'
  
  // Test 1: Get Subscribers Optimized
  console.log('\n1. Testing get-subscribers-optimized...')
  try {
    const response = await fetch('/api/get-subscribers-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: testUserId }),
    })
    
    const result = await response.json()
    console.log('✅ Get subscribers result:', result)
    
    if (result.success) {
      console.log(`   - Found ${result.subscribers?.length || 0} subscribers`)
      console.log(`   - User stats:`, result.stats)
    } else {
      console.log(`   - Error: ${result.error}`)
      console.log(`   - Code: ${result.code}`)
    }
  } catch (error) {
    console.error('❌ Get subscribers error:', error)
  }
  
  // Test 2: Add Member Optimized
  console.log('\n2. Testing add-member-optimized...')
  try {
    const response = await fetch('/api/add-member-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        name: 'Test User',
        email: 'test@example.com',
        tier: 'basic'
      }),
    })
    
    const result = await response.json()
    console.log('✅ Add member result:', result)
    
    if (result.success) {
      console.log(`   - Added subscriber: ${result.subscriber?.name}`)
      console.log(`   - User stats:`, result.stats)
    } else {
      console.log(`   - Error: ${result.error}`)
      console.log(`   - Code: ${result.code}`)
    }
  } catch (error) {
    console.error('❌ Add member error:', error)
  }
  
  // Test 3: Sync Members Optimized
  console.log('\n3. Testing sync-members-optimized...')
  try {
    const response = await fetch('/api/sync-members-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUserId,
        experienceId: testExperienceId
      }),
    })
    
    const result = await response.json()
    console.log('✅ Sync members result:', result)
    
    if (result.success) {
      console.log(`   - Synced ${result.count} members`)
      console.log(`   - Source: ${result.source}`)
      console.log(`   - User ID: ${result.user_id}`)
    } else {
      console.log(`   - Error: ${result.error}`)
      console.log(`   - Code: ${result.code}`)
    }
  } catch (error) {
    console.error('❌ Sync members error:', error)
  }
  
  console.log('\n🎉 API testing completed!')
}

// Run tests if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  testOptimizedAPIs()
} else {
  // Node.js environment
  module.exports = { testOptimizedAPIs }
}
