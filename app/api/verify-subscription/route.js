import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'Missing userId' }, { status: 400 })
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

    // Check subscription status
    const today = new Date().toISOString().split('T')[0]
    let subscriptionStatus = 'free'
    let planLimits = {
      daily: 10,
      monthly: 300,
      plan: 'free'
    }

    // Determine actual plan based on subscription status
    if (user.subscription_status === 'active' && user.plan !== 'free') {
      subscriptionStatus = 'paid'
      if (user.plan === 'growth') {
        planLimits = {
          daily: 167,
          monthly: 5000,
          plan: 'growth'
        }
      } else if (user.plan === 'pro') {
        planLimits = {
          daily: 334,
          monthly: 10000,
          plan: 'pro'
        }
      }
    } else if (user.subscription_status === 'cancelled' || user.subscription_status === 'expired') {
      // User had a paid plan but subscription is cancelled/expired
      // They should still have access until the end of their billing period
      const subscriptionEndDate = user.subscription_end_date
      if (subscriptionEndDate && new Date(subscriptionEndDate) > new Date()) {
        // Still within billing period
        subscriptionStatus = 'paid'
        if (user.plan === 'growth') {
          planLimits = {
            daily: 167,
            monthly: 5000,
            plan: 'growth'
          }
        } else if (user.plan === 'pro') {
          planLimits = {
            daily: 334,
            monthly: 10000,
            plan: 'pro'
          }
        }
      } else {
        // Subscription expired, back to free
        subscriptionStatus = 'free'
        // Update user plan to free
        await supabaseAdmin
          .from('users')
          .update({ 
            plan: 'free',
            subscription_status: 'expired'
          })
          .eq('id', user.id)
      }
    }

    // Check if user is within limits
    const emailsSentToday = user.emails_sent_today || 0
    const emailsSentThisMonth = user.emails_sent_this_month || 0
    
    const withinDailyLimit = emailsSentToday < planLimits.daily
    const withinMonthlyLimit = emailsSentThisMonth < planLimits.monthly

    return Response.json({
      success: true,
      data: {
        userId: user.whop_user_id,
        subscriptionStatus,
        plan: planLimits.plan,
        limits: planLimits,
        usage: {
          daily: emailsSentToday,
          monthly: emailsSentThisMonth,
          dailyRemaining: Math.max(0, planLimits.daily - emailsSentToday),
          monthlyRemaining: Math.max(0, planLimits.monthly - emailsSentThisMonth)
        },
        withinLimits: {
          daily: withinDailyLimit,
          monthly: withinMonthlyLimit
        },
        subscriptionDetails: {
          status: user.subscription_status,
          plan: user.plan,
          subscriptionId: user.subscription_id,
          planUpdatedAt: user.plan_updated_at,
          subscriptionEndDate: user.subscription_end_date
        }
      }
    })

  } catch (error) {
    console.error('Error verifying subscription:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
