import { whopSdk } from '@/lib/whop-sdk'

export async function POST(request) {
  try {
    const { userId, experienceId, planType } = await request.json()

    if (!userId || !experienceId || !planType) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Check if plan IDs are properly configured
    const planIds = {
      starter: process.env.WHOP_STARTER_PLAN_ID,
      growth: process.env.WHOP_GROWTH_PLAN_ID,
      pro: process.env.WHOP_PRO_PLAN_ID
    }

    const planId = planIds[planType]
    
    // Check if plan ID is still a placeholder
    if (!planId || planId.includes('your_') || planId.includes('_here')) {
      return Response.json({ 
        error: 'Plan IDs not configured properly',
        details: 'You need to set up actual plan IDs from your Whop dashboard',
        currentPlanId: planId,
        setupInstructions: {
          step1: 'Go to https://whop.com/dashboard/developer',
          step2: 'Select your FlowMail app',
          step3: 'Go to Access Passes tab',
          step4: 'Create pricing plans and copy their IDs',
          step5: 'Update your .env.development file with real plan IDs'
        }
      }, { status: 400 })
    }

    if (!planId) {
      return Response.json({ error: 'Invalid plan type or plan ID not set' }, { status: 400 })
    }

    console.log('Creating subscription checkout for plan:', planType, 'Plan ID:', planId)

    try {
      // Create subscription checkout session using Whop SDK
      const checkoutSession = await whopSdk.payments.createCheckoutSession({
        planId: planId,
        metadata: {
          planType: planType,
          experienceId: experienceId,
          upgradeType: 'subscription'
        }
      })

      if (!checkoutSession) {
        console.error('Failed to create checkout session - no session returned')
        return Response.json({ 
          error: 'Failed to create checkout session',
          details: 'No checkout session returned from Whop API'
        }, { status: 500 })
      }

      console.log('✅ Subscription checkout session created successfully:', checkoutSession.id)
      return Response.json(checkoutSession)

    } catch (whopError) {
      console.error('Whop API error:', whopError)
      
      // Check if it's a plan ID issue
      if (whopError.message?.includes('plan') || whopError.message?.includes('not found')) {
        return Response.json({
          error: 'Invalid plan ID',
          details: `Plan ID "${planId}" not found in your Whop dashboard`,
          suggestion: 'Please verify the plan ID exists and is active in your Whop dashboard',
          whopError: whopError.message
        }, { status: 400 })
      }
      
      throw whopError // Re-throw if it's not a plan ID issue
    }

  } catch (error) {
    console.error('Error creating subscription checkout:', error)
    return Response.json({ 
      error: 'Failed to create subscription checkout',
      details: error.message,
      type: error.constructor.name
    }, { status: 500 })
  }
}