import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

export async function GET() {
  try {
    console.log('=== DEBUG USER TOKEN ===')

    // Get user authentication
    const headersList = await headers()
    let verifiedUserId
    
    try {
      const userToken = await whopSdk.verifyUserToken(headersList)
      verifiedUserId = userToken.userId
      console.log('✅ User authenticated via Whop SDK:', verifiedUserId)
      
      return Response.json({
        success: true,
        user_token: userToken,
        user_id: verifiedUserId,
        token_keys: Object.keys(userToken || {}),
        analysis: {
          has_company_id: !!userToken?.companyId,
          has_company_object: !!userToken?.company,
          has_companies_array: !!(userToken?.companies && userToken.companies.length > 0),
          has_memberships: !!(userToken?.memberships && userToken.memberships.length > 0),
          token_structure: userToken
        },
        recommendations: [
          'Check the token structure above',
          'Look for company information in the token',
          'Use the correct field to get the user\'s company ID'
        ],
        timestamp: new Date().toISOString()
      })
      
    } catch (authError) {
      return Response.json({
        success: false,
        error: 'Authentication failed',
        details: authError.message,
        code: 'AUTH_FAILED'
      }, { status: 401 })
    }

  } catch (error) {
    console.error('Error in debug-user-token:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
