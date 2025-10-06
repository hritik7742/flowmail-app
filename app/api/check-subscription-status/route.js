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

    // Determine current plan and limits
    const today = new Date().toISOString().split('T')[0]
    let currentPlan = 'free'
    let dailyLimit = 10
    let monthlyLimit = 300
    let subscriptionStatus = 'free'

    if (user.plan === 'growth' && user.subscription_status === 'active') {
      currentPlan = 'growth'
      dailyLimit = 167
      monthlyLimit = 5000
      subscriptionStatus = 'active'
    } else if (user.plan === 'pro' && user.subscription_status === 'active') {
      currentPlan = 'pro'
      dailyLimit = 334
      monthlyLimit = 10000
      subscriptionStatus = 'active'
    } else if (user.subscription_status === 'cancelled' || user.subscription_status === 'expired') {
      // Check if subscription is still within billing period
      if (user.subscription_end_date && new Date(user.subscription_end_date) > new Date()) {
        // Still within billing period
        if (user.plan === 'growth') {
          currentPlan = 'growth'
          dailyLimit = 167
          monthlyLimit = 5000
          subscriptionStatus = 'cancelled'
        } else if (user.plan === 'pro') {
          currentPlan = 'pro'
          dailyLimit = 334
          monthlyLimit = 10000
          subscriptionStatus = 'cancelled'
        }
      } else {
        // Subscription expired, revert to free
        currentPlan = 'free'
        dailyLimit = 10
        monthlyLimit = 300
        subscriptionStatus = 'expired'
        
        // Update user to free plan
        await supabaseAdmin
          .from('users')
          .update({ 
            plan: 'free',
            subscription_status: 'expired'
          })
          .eq('id', user.id)
      }
    }

    // Get current usage
    const emailsSentToday = user.emails_sent_today || 0
    const emailsSentThisMonth = user.emails_sent_this_month || 0

    // Check if within limits
    const withinDailyLimit = emailsSentToday < dailyLimit
    const withinMonthlyLimit = emailsSentThisMonth < monthlyLimit

    return Response.json({
      success: true,
      data: {
        userId: user.whop_user_id,
        currentPlan,
        subscriptionStatus,
        limits: {
          daily: dailyLimit,
          monthly: monthlyLimit
        },
        usage: {
          daily: emailsSentToday,
          monthly: emailsSentThisMonth,
          dailyRemaining: Math.max(0, dailyLimit - emailsSentToday),
          monthlyRemaining: Math.max(0, monthlyLimit - emailsSentThisMonth)
        },
        withinLimits: {
          daily: withinDailyLimit,
          monthly: withinMonthlyLimit
        },
        canSendEmails: withinDailyLimit && withinMonthlyLimit,
        subscriptionDetails: {
          plan: user.plan,
          status: user.subscription_status,
          subscriptionId: user.subscription_id,
          planUpdatedAt: user.plan_updated_at,
          subscriptionEndDate: user.subscription_end_date
        }
      }
    })

  } catch (error) {
    console.error('Error checking subscription status:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
