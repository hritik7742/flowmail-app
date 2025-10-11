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

    // Get user's company information
    let userInfo = null
    let companyId = null
    let memberships = null
    
    try {
      // Method 1: Get current user info
      userInfo = await whopSdk.users.getCurrentUser()
      console.log('User info from Whop:', JSON.stringify(userInfo, null, 2))
      
      // Extract company ID from user info
      if (userInfo?.company?.id) {
        companyId = userInfo.company.id
        console.log('✅ Found company ID in user.company.id:', companyId)
      } else if (userInfo?.companies && userInfo.companies.length > 0) {
        companyId = userInfo.companies[0].id
        console.log('✅ Found company ID in user.companies[0].id:', companyId)
      }
    } catch (userError) {
      console.error('Error getting user info:', userError)
    }

    // Method 2: Get user's memberships
    try {
      memberships = await whopSdk.users.getMemberships()
      console.log('User memberships:', JSON.stringify(memberships, null, 2))
      
      if (!companyId && memberships && memberships.length > 0) {
        companyId = memberships[0].companyId
        console.log('✅ Found company ID from memberships:', companyId)
      }
    } catch (membershipError) {
      console.error('Error getting memberships:', membershipError)
    }

    // Method 3: Try to get company from environment (fallback)
    const envCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    console.log('Environment Company ID:', envCompanyId)

    return Response.json({
      success: true,
      user: {
        id: verifiedUserId,
        info: userInfo,
        memberships: memberships
      },
      company: {
        from_user_info: userInfo?.company?.id || null,
        from_companies_array: userInfo?.companies?.[0]?.id || null,
        from_memberships: memberships?.[0]?.companyId || null,
        from_environment: envCompanyId,
        final_company_id: companyId
      },
      analysis: {
        user_has_company_info: !!userInfo?.company,
        user_has_companies_array: !!(userInfo?.companies && userInfo.companies.length > 0),
        user_has_memberships: !!(memberships && memberships.length > 0),
        company_id_determined: !!companyId,
        using_environment_fallback: !companyId && !!envCompanyId
      },
      recommendations: companyId ? [
        '✅ Company ID successfully determined from user data',
        'Each user will sync from their own company',
        'User isolation is working correctly'
      ] : [
        '❌ Could not determine user\'s company ID',
        'This means all users will sync from the same company',
        'Check Whop SDK methods and user permissions'
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
