export async function GET() {
  try {
    console.log('=== DETAILED WHOP API DEBUG ===')
    
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    const apiKey = process.env.WHOP_API_KEY
    
    console.log('Company ID:', companyId)
    console.log('API Key exists:', !!apiKey)
    
    if (!companyId || !apiKey) {
      return Response.json({
        success: false,
        error: 'Missing environment variables',
        companyId: !!companyId,
        apiKey: !!apiKey
      })
    }
    
    // Test 1: Basic company info
    console.log('Test 1: Basic company info...')
    let companyResult = null
    try {
      const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      companyResult = {
        status: response.status,
        success: response.ok,
        data: response.ok ? {
          id: data.id,
          name: data.name,
          status: data.status
        } : data
      }
    } catch (error) {
      companyResult = { status: 'error', success: false, error: error.message }
    }
    
    // Test 2: Memberships endpoint
    console.log('Test 2: Memberships endpoint...')
    let membershipsResult = null
    try {
      const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}/memberships?limit=5`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      membershipsResult = {
        status: response.status,
        success: response.ok,
        data: response.ok ? {
          count: data.data?.length || 0,
          hasData: !!data.data,
          structure: Object.keys(data || {})
        } : data
      }
    } catch (error) {
      membershipsResult = { status: 'error', success: false, error: error.message }
    }
    
    // Test 3: Different API endpoints
    console.log('Test 3: Testing different endpoints...')
    const endpoints = [
      `/api/v2/companies/${companyId}/memberships`,
      `/api/v2/companies/${companyId}/memberships?status=active`,
      `/api/v2/companies/${companyId}/memberships?limit=10`,
      `/api/v2/companies/${companyId}/memberships?status=active&limit=10`
    ]
    
    const endpointResults = []
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`https://api.whop.com${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        })
        
        const data = await response.json()
        endpointResults.push({
          endpoint,
          status: response.status,
          success: response.ok,
          data: response.ok ? `Found ${data.data?.length || 0} memberships` : data
        })
      } catch (error) {
        endpointResults.push({
          endpoint,
          status: 'error',
          success: false,
          error: error.message
        })
      }
    }
    
    // Test 4: Check if it's a rate limiting issue
    console.log('Test 4: Rate limiting test...')
    let rateLimitResult = null
    try {
      const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}/memberships`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'FlowMail-App/1.0'
        }
      })
      
      rateLimitResult = {
        status: response.status,
        headers: {
          'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
          'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
          'x-ratelimit-reset': response.headers.get('x-ratelimit-reset')
        }
      }
    } catch (error) {
      rateLimitResult = { status: 'error', error: error.message }
    }
    
    // Analysis
    const analysis = {
      companyResult,
      membershipsResult,
      endpointResults,
      rateLimitResult,
      recommendations: []
    }
    
    // Generate recommendations
    if (companyResult.success && !membershipsResult.success) {
      if (membershipsResult.status === 403) {
        analysis.recommendations.push('❌ 403 on memberships but 200 on company - this is a permissions issue')
        analysis.recommendations.push('🔧 Even though you have member:basic:export, try these:')
        analysis.recommendations.push('   - Check if your API key has the latest permissions')
        analysis.recommendations.push('   - Try regenerating your API key')
        analysis.recommendations.push('   - Contact Whop support about member:basic:export permission')
      }
    }
    
    if (rateLimitResult.status === 429) {
      analysis.recommendations.push('❌ Rate limited - wait and try again')
    }
    
    if (membershipsResult.success) {
      analysis.recommendations.push('✅ Memberships API is working! The issue might be in your app code')
    }
    
    return Response.json({
      success: membershipsResult.success,
      analysis,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Debug failed',
      details: error.message
    })
  }
}
