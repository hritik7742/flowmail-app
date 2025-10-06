import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/resend'

export async function POST(request) {
  try {
    const { userId, campaignId } = await request.json()
    
    if (!userId || !campaignId) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Get user from database with domain settings
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*, display_name, username, unique_code, reply_to_email, custom_domain, domain_verified')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get campaign details
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Get subscribers
    const { data: subscribers } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active') // Only send to active subscribers

    if (!subscribers || subscribers.length === 0) {
      return Response.json({ success: false, error: 'No active subscribers found. Please sync members first.' }, { status: 400 })
    }

    // Check limits based on plan type
    const today = new Date().toISOString().split('T')[0]
    let currentEmailsSent = user.emails_sent_today || 0
    
    if (user.plan === 'free') {
      // For free plan, check daily limits only
      const dailyLimit = 10
      
      // Reset daily count if needed (new day)
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

      const remainingEmails = Math.max(0, dailyLimit - currentEmailsSent)
      
      if (subscribers.length > remainingEmails) {
        return Response.json({ 
          success: false, 
          error: 'Daily email limit exceeded',
          limitExceeded: true,
          data: {
            plan: user.plan,
            emailsSentToday: currentEmailsSent,
            dailyLimit,
            remainingEmails,
            requestedEmails: subscribers.length
          }
        }, { status: 400 })
      }
    } else {
      // For paid plans (starter/growth/pro), check monthly limits
      const monthlyLimits = {
        starter: 3000,
        growth: 5000,
        pro: 10000
      }

      const monthlyLimit = monthlyLimits[user.plan] || 5000
      const remainingEmails = Math.max(0, monthlyLimit - (user.emails_sent_this_month || 0))
      
      if (subscribers.length > remainingEmails) {
        return Response.json({ 
          success: false, 
          error: `Monthly email limit exceeded. You can send ${remainingEmails} more emails this month. Your limit will reset on your next billing cycle.`,
          monthlyLimitExceeded: true,
          data: {
            plan: user.plan,
            emailsSentThisMonth: user.emails_sent_this_month || 0,
            monthlyLimit,
            remainingEmails,
            requestedEmails: subscribers.length
          }
        }, { status: 400 })
      }
    }

    let sentCount = 0
    let failedCount = 0
    const sendResults = []

    console.log(`=== SENDING CAMPAIGN TO ${subscribers.length} SUBSCRIBERS ===`)
    console.log('Campaign:', campaign.name)
    console.log('Subject:', campaign.subject)
    console.log('Subscribers:', subscribers.map(s => ({ name: s.name, email: s.email })))

    // Update campaign status to sending
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign.id)

    // Send emails to all subscribers with detailed logging
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i]
      console.log(`\n--- Sending email ${i + 1}/${subscribers.length} ---`)
      console.log('To:', subscriber.email)
      console.log('Name:', subscriber.name)
      
      try {
        // Replace merge tags
        let personalizedContent = campaign.html_content
          .replace(/\{\{name\}\}/g, subscriber.name || 'Member')
          .replace(/\{\{email\}\}/g, subscriber.email)
          .replace(/\{\{tier\}\}/g, subscriber.tier || 'Basic')

        console.log('Calling sendEmail function...')
        // Create professional sender email using domain settings
        const displayName = user.display_name || user.company_name || 'FlowMail User'
        const username = user.username || 'user'
        const uniqueCode = user.unique_code || 'default'
        
        // Generate the sender email based on domain settings
        let senderEmail
        if (user.custom_domain && user.domain_verified) {
          senderEmail = `${username}@${user.custom_domain}`
        } else {
          senderEmail = `${username}.${uniqueCode}@flowmail.rovelin.com`
        }
        
        const fromEmail = `${displayName} <${senderEmail}>`
        
        console.log('Using domain settings for email:')
        console.log('- Display Name:', displayName)
        console.log('- Username:', username)
        console.log('- Unique Code:', uniqueCode)
        console.log('- Sender Email:', senderEmail)
        console.log('- From Email:', fromEmail)
        
        const result = await sendEmail({
          to: subscriber.email,
          subject: campaign.subject,
          html: personalizedContent,
          from: fromEmail,
          campaignId: campaign.id, // Add campaign ID for tracking
          subscriberId: subscriber.id // Add subscriber ID for tracking
        })

        console.log('Send result:', result)

        if (result.success) {
          sentCount++
          sendResults.push({ email: subscriber.email, status: 'sent', id: result.data?.id })
          console.log('✅ Email sent successfully')
        } else {
          failedCount++
          sendResults.push({ email: subscriber.email, status: 'failed', error: result.error })
          console.error('❌ Failed to send:', result.error)
        }

        // Add delay to respect Resend rate limits (2 requests per second on free plan)
        // Wait 600ms between emails to be safe (allows ~1.6 emails per second)
        await new Promise(resolve => setTimeout(resolve, 600))

      } catch (error) {
        failedCount++
        sendResults.push({ email: subscriber.email, status: 'error', error: error.message })
        console.error('❌ Error sending to', subscriber.email, ':', error)
      }
    }

    console.log(`\n=== CAMPAIGN SEND COMPLETE ===`)
    console.log('Total sent:', sentCount)
    console.log('Total failed:', failedCount)
    console.log('Send results:', sendResults)

    // Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: sentCount,
      })
      .eq('id', campaign.id)

    // Update user's email count based on plan type
    const today = new Date().toISOString().split('T')[0]
    
    if (user.plan === 'free') {
      // For free plan, update daily count only
      // Get current count (may have been reset to 0 if it's a new day)
      const { data: currentUser } = await supabaseAdmin
        .from('users')
        .select('emails_sent_today, last_email_reset_date')
        .eq('id', user.id)
        .single()
      
      let currentEmailsSent = currentUser?.emails_sent_today || 0
      
      // If it's a new day, the count should be 0
      if (currentUser?.last_email_reset_date !== today) {
        currentEmailsSent = 0
      }
      
      await supabaseAdmin
        .from('users')
        .update({
          emails_sent_today: currentEmailsSent + sentCount,
          last_email_reset_date: today
        })
        .eq('id', user.id)
    } else {
      // For paid plans, update monthly count only
      await supabaseAdmin
        .from('users')
        .update({
          emails_sent_this_month: (user.emails_sent_this_month || 0) + sentCount
        })
        .eq('id', user.id)
    }

    return Response.json({ 
      success: sentCount > 0, 
      message: sentCount > 0 
        ? `Campaign sent successfully! ${sentCount} emails sent${failedCount > 0 ? `, ${failedCount} failed` : ''}.`
        : `Campaign failed! No emails were sent. ${failedCount} failed attempts.`,
      sent: sentCount,
      failed: failedCount,
      totalSubscribers: subscribers.length,
      results: sendResults,
      debug: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        userPlan: user.plan,
        emailsThisMonth: user.emails_sent_this_month,
        hasResendKey: !!process.env.RESEND_API_KEY
      }
    })

  } catch (error) {
    console.error('Error sending campaign:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}