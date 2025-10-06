import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return Response.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, whop_user_id, plan, emails_sent_today, last_email_reset_date')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Reset daily count if needed (new day)
    const today = new Date().toISOString().split('T')[0]
    if (user.last_email_reset_date !== today) {
      await supabaseAdmin
        .from('users')
        .update({ 
          emails_sent_today: 0, 
          last_email_reset_date: today 
        })
        .eq('id', user.id)
      
      user.emails_sent_today = 0
    }

    // Get daily limit based on plan
    const dailyLimits = {
      free: 10,
      starter: 100, // ~3000/month ÷ 30 days
      growth: 167, // ~5000/month ÷ 30 days
      pro: 334     // ~10000/month ÷ 30 days
    }

    const dailyLimit = dailyLimits[user.plan] || 10
    const remainingEmails = Math.max(0, dailyLimit - user.emails_sent_today)

    return Response.json({
      success: true,
      data: {
        plan: user.plan,
        emailsSentToday: user.emails_sent_today,
        dailyLimit,
        remainingEmails,
        canSendEmails: remainingEmails > 0,
        resetDate: today
      }
    })

  } catch (error) {
    console.error('Error checking email limits:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId, emailCount = 1 } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, whop_user_id, plan, emails_sent_today, last_email_reset_date')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Reset daily count if needed (new day)
    const today = new Date().toISOString().split('T')[0]
    let currentEmailsSent = user.emails_sent_today

    if (user.last_email_reset_date !== today) {
      await supabaseAdmin
        .from('users')
        .update({ 
          emails_sent_today: 0, 
          last_email_reset_date: today 
        })
        .eq('id', user.id)
      
      currentEmailsSent = 0
    }

    // Get daily limit based on plan
    const dailyLimits = {
      free: 10,
      starter: 100, // ~3000/month ÷ 30 days
      growth: 167, // ~5000/month ÷ 30 days
      pro: 334     // ~10000/month ÷ 30 days
    }

    const dailyLimit = dailyLimits[user.plan] || 10
    const remainingEmails = Math.max(0, dailyLimit - currentEmailsSent)

    // Check if user can send the requested number of emails
    if (emailCount > remainingEmails) {
      return Response.json({
        success: false,
        error: 'Daily email limit exceeded',
        data: {
          plan: user.plan,
          emailsSentToday: currentEmailsSent,
          dailyLimit,
          remainingEmails,
          requestedEmails: emailCount,
          canSendEmails: false
        }
      }, { status: 400 })
    }

    // Increment email count
    const newEmailsSent = currentEmailsSent + emailCount
    await supabaseAdmin
      .from('users')
      .update({ emails_sent_today: newEmailsSent })
      .eq('id', user.id)

    return Response.json({
      success: true,
      data: {
        plan: user.plan,
        emailsSentToday: newEmailsSent,
        dailyLimit,
        remainingEmails: dailyLimit - newEmailsSent,
        canSendEmails: (dailyLimit - newEmailsSent) > 0
      }
    })

  } catch (error) {
    console.error('Error updating email limits:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
