import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

export async function GET() {
  try {
    console.log('=== TESTING WHOP AUTHENTICATION ===')
    
    // Test environment variables
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    const apiKey = process.env.WHOP_API_KEY
    const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID
    
    console.log('Environment check:')
    console.log('- Company ID:', companyId ? 'Set' : 'Missing')
    console.log('- API Key:', apiKey ? 'Set' : 'Missing')
    console.log('- App ID:', appId ? 'Set' : 'Missing')
    
    if (!companyId || !apiKey || !appId) {
      return Response.json({
        success: false,
        error: 'Missing required environment variables',
        details: {
          companyId: companyId ? 'Set' : 'Missing',
          apiKey: apiKey ? 'Set' : 'Missing',
          appId: appId ? 'Set' : 'Missing'
        }
      }, { status: 500 })
    }

    // Test Whop authentication
    const headersList = await headers()
    let authResult = null
    
    try {
      const userToken = await whopSdk.verifyUserToken(headersList)
      authResult = {
        success: true,
        userId: userToken.userId,
        message: 'Authentication successful'
      }
      console.log('✅ Whop authentication successful:', userToken.userId)
    } catch (authError) {
      authResult = {
        success: false,
        error: authError.message,
        message: 'Authentication failed - this is expected if not accessed from within Whop app context'
      }
      console.log('❌ Whop authentication failed:', authError.message)
    }

    // Test API connection
    let apiResult = null
    
    try {
      const response = await fetch(`https://api.whop.com/api/v5/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        apiResult = {
          success: true,
          companyName: data.name || 'Unknown',
          message: 'API connection successful'
        }
        console.log('✅ Whop API connection successful')
      } else {
        const errorText = await response.text()
        apiResult = {
          success: false,
          status: response.status,
          error: errorText,
          message: 'API connection failed'
        }
        console.log('❌ Whop API connection failed:', response.status, errorText)
      }
    } catch (apiError) {
      apiResult = {
        success: false,
        error: apiError.message,
        message: 'API connection error'
      }
      console.log('❌ Whop API error:', apiError.message)
    }

    return Response.json({
      success: true,
      message: 'Whop integration test completed',
      results: {
        environment: {
          companyId: companyId ? 'Set' : 'Missing',
          apiKey: apiKey ? 'Set' : 'Missing',
          appId: appId ? 'Set' : 'Missing'
        },
        authentication: authResult,
        apiConnection: apiResult
      },
      recommendations: [
        authResult.success ? '✅ Authentication working' : '⚠️ Authentication only works within Whop app context',
        apiResult.success ? '✅ API connection working' : '❌ Check your API key and company ID',
        'Make sure to test sync members from within your Whop app'
      ]
    })

  } catch (error) {
    console.error('Test error:', error)
    return Response.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}