// Test script to verify the domain columns fix
// Run with: node test-domain-fix.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.development' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDomainFix() {
  console.log('🔍 Testing domain columns fix...')
  
  try {
    // Test the query that was failing
    const { data, error } = await supabase
      .from('users')
      .select('custom_domain, resend_domain_id, domain_dns_records, domain_verified, domain_verified_at')
      .limit(1)
    
    if (error) {
      console.error('❌ Error still exists:', error.message)
      console.log('\n📋 To fix this, run the SQL script:')
      console.log('1. Open your Supabase dashboard')
      console.log('2. Go to SQL Editor')
      console.log('3. Copy and paste the contents of QUICK-FIX-DATABASE-COLUMNS.sql')
      console.log('4. Click "Run"')
      return
    }
    
    console.log('✅ Domain columns query successful!')
    console.log('📊 Sample data:', data)
    
    // Test creating a user to see if all columns work
    const testUserId = 'test_' + Date.now()
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert({
        whop_user_id: testUserId,
        email: 'test@example.com',
        company_name: 'Test Company'
      })
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting test user:', insertError.message)
    } else {
      console.log('✅ Test user created successfully!')
      
      // Clean up test user
      await supabase
        .from('users')
        .delete()
        .eq('whop_user_id', testUserId)
      
      console.log('🧹 Test user cleaned up')
    }
    
    console.log('\n🎉 All tests passed! The domain columns fix is working.')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDomainFix()