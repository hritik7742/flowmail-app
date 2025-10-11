import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

export async function GET() {
  try {
    console.log('=== TEST USER COMPANY ID ===')

    // Get user authentication
    const headersList = await headers()
    let verifiedUserId
    
    try {
      const userToken = await whopSdk.verifyUserToken(headersList)
      verifiedUserId = userToken.userId
      console.log('✅ User authenticated via Whop SDK:', verifiedUserId)
    } catch (authError) {
      return Response.json({
        success: false,
        error: 'Authentication failed',
        details: authError.message,
        code: 'AUTH_FAILED'
      }, { status: 401 })
    }

    // Get user's company information using correct Whop SDK methods
    let userToken = null
    let companyId = null
    
    try {
      // Method 1: Get user token info (this should contain company context)
      userToken = await whopSdk.verifyUserToken(headersList)
      console.log('User token info:', JSON.stringify(userToken, null, 2))
      
      // Extract company ID from user token
      if (userToken?.companyId) {
        companyId = userToken.companyId
        console.log('✅ Found company ID in userToken.companyId:', companyId)
      } else if (userToken?.company?.id) {
        companyId = userToken.company.id
        console.log('✅ Found company ID in userToken.company.id:', companyId)
      }
    } catch (userError) {
      console.error('Error getting user token info:', userError)
    }

    // Method 3: Try to get company from environment (fallback)
    const envCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    console.log('Environment Company ID:', envCompanyId)

    return Response.json({
      success: true,
      user: {
        id: verifiedUserId,
        token_info: userToken
      },
      company: {
        from_user_token: userToken?.companyId || userToken?.company?.id || null,
        from_environment: envCompanyId,
        final_company_id: companyId
      },
      analysis: {
        user_token_has_company: !!(userToken?.companyId || userToken?.company?.id),
        company_id_determined: !!companyId,
        using_environment_fallback: !companyId && !!envCompanyId,
        token_structure: Object.keys(userToken || {})
      },
      recommendations: companyId ? [
        '✅ Company ID successfully determined from user token',
        'Each user will sync from their own company',
        'User isolation is working correctly'
      ] : [
        '❌ Could not determine user\'s company ID from token',
        'This means all users will sync from the same company',
        'Check if the app is properly installed in the Whop community',
        'Verify the user token contains company information'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in test-user-company:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
