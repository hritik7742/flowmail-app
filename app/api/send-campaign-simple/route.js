import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/resend'

// In-memory progress tracking
const campaignProgress = new Map()

export async function POST(request) {
  try {
    const { userId, campaignId, action } = await request.json()
    
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

    // Handle different actions
    if (action === 'status') {
      // Check in-memory progress first
      const memoryProgress = campaignProgress.get(campaignId)
      
      if (memoryProgress) {
        return Response.json({
          success: true,
          progress: memoryProgress
        })
      }
      
      // Fallback to database status
      const isCompleted = campaign.status === 'sent'
      const isSending = campaign.status === 'sending'
      const isFailed = campaign.status === 'failed'
      
      return Response.json({
        success: true,
        progress: {
          status: isCompleted ? 'completed' : isFailed ? 'failed' : isSending ? 'sending' : campaign.status,
          current: campaign.total_recipients || 0,
          total: campaign.total_recipients || 0,
          sent: campaign.total_recipients || 0,
          failed: 0,
          percentage: isCompleted ? 100 : isSending ? 50 : 0
        }
      })
    }

    if (action === 'start') {
      // Start sending the campaign
      
      // Get subscribers
      const { data: subscribers } = await supabaseAdmin
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (!subscribers || subscribers.length === 0) {
        return Response.json({ 
          success: false, 
          error: 'No active subscribers found. Please sync members first.' 
        }, { status: 400 })
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

      // Update campaign status to sending
      await supabaseAdmin
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', campaign.id)

      // Initialize progress tracking
      campaignProgress.set(campaignId, {
        status: 'sending',
        current: 0,
        total: subscribers.length,
        sent: 0,
        failed: 0,
        percentage: 0
      })

      // Send emails in the background (simplified version)
      sendCampaignEmails(campaign, subscribers, user, campaignId)

      return Response.json({
        success: true,
        message: 'Campaign sending started',
        progress: {
          status: 'sending',
          current: 0,
          total: subscribers.length,
          sent: 0,
          failed: 0,
          percentage: 0
        }
      })
    }

    return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in send-campaign-simple:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

// Background function to send emails
async function sendCampaignEmails(campaign, subscribers, user, campaignId) {
  let sentCount = 0
  let failedCount = 0

  console.log(`=== SENDING CAMPAIGN: ${campaign.name} ===`)
  console.log(`Sending to ${subscribers.length} subscribers`)

  try {
    // Send emails to all subscribers
    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i]
      
      try {
        // Replace merge tags
        let personalizedContent = campaign.html_content
          .replace(/\{\{name\}\}/g, subscriber.name || 'Member')
          .replace(/\{\{email\}\}/g, subscriber.email)
          .replace(/\{\{tier\}\}/g, subscriber.tier || 'Basic')

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
          campaignId: campaign.id,
          subscriberId: subscriber.id
        })

        if (result.success) {
          sentCount++
          console.log(`✅ Sent ${i + 1}/${subscribers.length} to ${subscriber.email}`)
        } else {
          failedCount++
          console.error(`❌ Failed ${i + 1}/${subscribers.length} to ${subscriber.email}:`, result.error)
        }

        // Update in-memory progress
        const currentProgress = Math.round(((i + 1) / subscribers.length) * 100)
        campaignProgress.set(campaignId, {
          status: 'sending',
          current: i + 1,
          total: subscribers.length,
          sent: sentCount,
          failed: failedCount,
          percentage: currentProgress
        })

        // Rate limiting - wait between emails
        await new Promise(resolve => setTimeout(resolve, 600))

      } catch (error) {
        failedCount++
        console.error(`❌ Error sending to ${subscriber.email}:`, error)
      }
    }

    // Update campaign when complete
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

    // Mark as completed in memory
    campaignProgress.set(campaignId, {
      status: 'completed',
      current: subscribers.length,
      total: subscribers.length,
      sent: sentCount,
      failed: failedCount,
      percentage: 100
    })

    console.log(`=== CAMPAIGN COMPLETE ===`)
    console.log(`Sent: ${sentCount}, Failed: ${failedCount}`)

    // Clean up progress after 5 minutes
    setTimeout(() => {
      campaignProgress.delete(campaignId)
    }, 5 * 60 * 1000)

  } catch (error) {
    console.error('Error in background email sending:', error)
    
    // Mark campaign as failed
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'failed' })
      .eq('id', campaign.id)

    // Mark as failed in memory
    campaignProgress.set(campaignId, {
      status: 'failed',
      current: sentCount + failedCount,
      total: subscribers.length,
      sent: sentCount,
      failed: failedCount,
      percentage: 100,
      error: error.message
    })

    // Clean up progress after 5 minutes
    setTimeout(() => {
      campaignProgress.delete(campaignId)
    }, 5 * 60 * 1000)
  }
}