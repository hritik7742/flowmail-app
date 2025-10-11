import { whopSdk } from '@/lib/whop-sdk'

export async function GET() {
  try {
    console.log('=== WHOP API DIAGNOSTIC TOOL ===')
    
    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_WHOP_APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID ? '✅ Set' : '❌ Missing',
      WHOP_API_KEY: process.env.WHOP_API_KEY ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_WHOP_AGENT_USER_ID: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID ? '✅ Set' : '❌ Missing'
    }
    
    console.log('Environment Variables Check:', envCheck)
    
    // Test API key with direct API call
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    const apiKey = process.env.WHOP_API_KEY
    
    if (!companyId || !apiKey) {
      return Response.json({
        success: false,
        error: 'Missing required environment variables',
        envCheck,
        suggestions: [
          'Set NEXT_PUBLIC_WHOP_COMPANY_ID in your environment variables',
          'Set WHOP_API_KEY in your environment variables'
        ]
      })
    }
    
    // Test 1: Direct API call to check API key
    console.log('Testing direct API call...')
    let directApiResult = null
    try {
      const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      directApiResult = {
        status: response.status,
        success: response.ok,
        data: response.ok ? 'Company data retrieved successfully' : data
      }
      
      console.log('Direct API Result:', directApiResult)
    } catch (error) {
      directApiResult = {
        status: 'error',
        success: false,
        error: error.message
      }
    }
    
    // Test 2: Test memberships endpoint
    console.log('Testing memberships endpoint...')
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
        data: response.ok ? `Found ${data.data?.length || 0} memberships` : data
      }
      
      console.log('Memberships API Result:', membershipsResult)
    } catch (error) {
      membershipsResult = {
        status: 'error',
        success: false,
        error: error.message
      }
    }
    
    // Test 3: Test Whop SDK
    console.log('Testing Whop SDK...')
    let sdkResult = null
    try {
      const result = await whopSdk.companies.getCompany({ companyId })
      sdkResult = {
        success: true,
        data: 'SDK working correctly'
      }
    } catch (error) {
      sdkResult = {
        success: false,
        error: error.message
      }
    }
    
    // Analyze results and provide recommendations
    const analysis = {
      envCheck,
      directApiResult,
      membershipsResult,
      sdkResult,
      recommendations: []
    }
    
    // Generate recommendations based on results
    if (!directApiResult.success) {
      if (directApiResult.status === 403) {
        analysis.recommendations.push('❌ API Key lacks permissions - Check your Whop app permissions')
        analysis.recommendations.push('🔧 Go to Whop dashboard → Your App → Settings → Permissions')
        analysis.recommendations.push('✅ Enable: Read Companies, Read Memberships, Read Users')
      } else if (directApiResult.status === 401) {
        analysis.recommendations.push('❌ API Key is invalid or expired')
        analysis.recommendations.push('🔧 Generate a new API key in Whop dashboard')
      } else if (directApiResult.status === 404) {
        analysis.recommendations.push('❌ Company ID is incorrect')
        analysis.recommendations.push('🔧 Check your NEXT_PUBLIC_WHOP_COMPANY_ID')
      }
    }
    
    if (!membershipsResult.success) {
      if (membershipsResult.status === 403) {
        analysis.recommendations.push('❌ API Key lacks membership read permissions')
        analysis.recommendations.push('🔧 Enable "Read Memberships" permission in your Whop app')
      }
    }
    
    if (directApiResult.success && membershipsResult.success) {
      analysis.recommendations.push('✅ All API tests passed! Your configuration is correct.')
    }
    
    return Response.json({
      success: directApiResult.success && membershipsResult.success,
      analysis,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Diagnostic error:', error)
    return Response.json({
      success: false,
      error: 'Diagnostic failed',
      details: error.message
    }, { status: 500 })
  }
}
