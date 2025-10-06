import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail } from '@/lib/resend'

export async function POST(request) {
  try {
    const { userId, campaignId, testEmail } = await request.json()
    
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

    // Check daily limits for test emails (same as regular campaigns)
    const today = new Date().toISOString().split('T')[0]
    let currentEmailsSent = user.emails_sent_today || 0
    
    if (user.plan === 'free') {
      // For free plan, check daily limits
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
      
      if (remainingEmails <= 0) {
        return Response.json({ 
          success: false, 
          error: 'Daily email limit exceeded',
          limitExceeded: true,
          data: {
            plan: user.plan,
            emailsSentToday: currentEmailsSent,
            dailyLimit,
            remainingEmails: 0,
            requestedEmails: 1
          }
        }, { status: 400 })
      }
    }

    // Use test email or user's email
    const emailToSend = testEmail || 'test@example.com'

    // Replace merge tags with test data
    let personalizedContent = campaign.html_content
      .replace(/\{\{name\}\}/g, 'Test User')
      .replace(/\{\{email\}\}/g, emailToSend)
      .replace(/\{\{tier\}\}/g, 'VIP')

    // Add test notice at the top
    personalizedContent = `
      <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 8px; text-align: center;">
        <strong style="color: #92400e;">🧪 TEST EMAIL</strong><br>
        <span style="color: #92400e; font-size: 14px;">This is a test email from FlowMail. Campaign: ${campaign.name}</span>
      </div>
      ${personalizedContent}
    `

    // Send test email
    console.log('Sending test email with Resend...')
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
    const replyToEmail = user.reply_to_email || user.email
    
    console.log('Using domain settings for test email:')
    console.log('- Display Name:', displayName)
    console.log('- Username:', username)
    console.log('- Unique Code:', uniqueCode)
    console.log('- Sender Email:', senderEmail)
    console.log('- From Email:', fromEmail)
    
    const result = await sendEmail({
      to: emailToSend,
      subject: `[TEST] ${campaign.subject}`,
      html: personalizedContent,
      from: fromEmail,
      reply_to: replyToEmail
    })

    console.log('Send email result:', result)

    if (result.success) {
      // Update email count for daily limit tracking
      await supabaseAdmin
        .from('users')
        .update({ 
          emails_sent_today: currentEmailsSent + 1,
          last_email_reset_date: today
        })
        .eq('id', user.id)

      return Response.json({ 
        success: true, 
        message: `Test email sent successfully to ${emailToSend}! Check your inbox (including spam folder).`,
        emailId: result.data?.id
      })
    } else {
      console.error('Failed to send email:', result.error)
      return Response.json({ 
        success: false, 
        error: 'Failed to send test email: ' + result.error 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error sending test campaign:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}