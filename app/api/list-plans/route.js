import { whopSdk } from '@/lib/whop-sdk'

export async function GET() {
  try {
    console.log('Fetching plans from Whop...')
    
    // Try to list plans using the Whop SDK
    const plans = await whopSdk.plans.list({
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    })

    return Response.json({
      success: true,
      plans: plans.data || [],
      count: plans.data?.length || 0,
      message: 'Plans fetched successfully'
    })

  } catch (error) {
    console.error('Error fetching plans:', error)
    
    return Response.json({
      success: false,
      error: 'Failed to fetch plans',
      details: error.message,
      suggestion: 'You need to create plans in your Whop dashboard first',
      dashboardUrl: 'https://whop.com/dashboard/developer'
    }, { status: 500 })
  }
}