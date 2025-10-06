// Test script to verify the fixes
const testAddMember = async () => {
  const testData = {
    userId: 'user_tsGwt34auiT2C',
    name: 'Test User',
    email: 'test@example.com',
    tier: 'basic'
  }

  console.log('Testing add-member API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/add-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })
    
    const result = await response.json()
    console.log('Response:', result)
    
    if (response.status === 200) {
      console.log('✅ First request successful')
      
      // Test duplicate request
      console.log('Testing duplicate request...')
      const response2 = await fetch('http://localhost:3000/api/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      })
      
      const result2 = await response2.json()
      console.log('Duplicate response:', result2)
      
      if (response2.status === 400 && result2.error.includes('already exists')) {
        console.log('✅ Duplicate handling working correctly')
      } else if (response2.status === 429) {
        console.log('✅ Rate limiting working correctly')
      } else {
        console.log('❌ Unexpected duplicate response')
      }
    } else {
      console.log('❌ First request failed:', result)
    }
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

const testCreateCampaign = async () => {
  const testData = {
    userId: 'user_tsGwt34auiT2C',
    name: 'Test Campaign',
    subject: 'Test Subject',
    html_content: '<p>Test content</p>',
    segment: 'all'
  }

  console.log('Testing create-campaign API...')
  
  try {
    const response = await fetch('http://localhost:3000/api/create-campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    })
    
    const result = await response.json()
    console.log('Campaign response:', result)
    
    if (response.status === 200) {
      console.log('✅ Create campaign working correctly')
    } else {
      console.log('❌ Create campaign failed:', result)
    }
  } catch (error) {
    console.error('❌ Campaign test error:', error)
  }
}

// Run tests
console.log('🧪 Starting API tests...')
testAddMember().then(() => {
  console.log('---')
  return testCreateCampaign()
}).then(() => {
  console.log('🏁 Tests completed')
})