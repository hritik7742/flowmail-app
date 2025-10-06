import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, planType } = await request.json()
    
    if (!userId || !planType) {
      return Response.json({ success: false, error: 'Missing userId or planType' }, { status: 400 })
    }

    // Only allow in development mode
    if (process.env.NODE_ENV === 'production') {
      return Response.json({ success: false, error: 'Test mode only available in development' }, { status: 403 })
    }

    // Get user from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('whop_user_id', userId)
      .single()

    if (error || !user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Update user plan (TEST MODE ONLY)
    const updateData = planType === 'free' ? {
      plan: 'free',
      subscription_status: 'free',
      subscription_id: null,
      plan_updated_at: new Date().toISOString(),
      subscription_end_date: null
    } : {
      plan: planType,
      subscription_status: 'active',
      subscription_id: `test_${planType}_${Date.now()}`,
      plan_updated_at: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    }

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user plan:', updateError)
      return Response.json({ success: false, error: 'Failed to update user plan' }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: `✅ TEST MODE: ${planType === 'free' ? 'Reset to' : 'Upgraded to'} ${planType} plan (Development Only)`,
      data: {
        userId: user.whop_user_id,
        newPlan: planType,
        subscriptionStatus: planType === 'free' ? 'free' : 'active',
        testMode: true,
        warning: 'This is a test upgrade. No real payment was processed.'
      }
    })

  } catch (error) {
    console.error('Error in test upgrade:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
