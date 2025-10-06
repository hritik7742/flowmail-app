import { supabaseAdmin } from '@/lib/supabase'

// In-memory storage for campaign progress (in production, use Redis or database)
const campaignProgress = new Map()

export async function POST(request) {
  try {
    const { userId, campaignId } = await request.json()
    
    if (!userId || !campaignId) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Generate a unique progress key
    const progressKey = `${userId}-${campaignId}-${Date.now()}`
    
    // Initialize progress
    campaignProgress.set(progressKey, {
      status: 'starting',
      current: 0,
      total: 0,
      sent: 0,
      failed: 0,
      startTime: new Date().toISOString()
    })

    // Start the campaign sending process
    sendCampaignWithProgress(userId, campaignId, progressKey)

    return Response.json({ 
      success: true, 
      progressKey,
      message: 'Campaign sending started'
    })

  } catch (error) {
    console.error('Error starting campaign progress:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url)
    const progressKey = url.searchParams.get('key')
    
    if (!progressKey) {
      return Response.json({ success: false, error: 'Missing progress key' }, { status: 400 })
    }

    const progress = campaignProgress.get(progressKey)
    
    if (!progress) {
      return Response.json({ success: false, error: 'Progress not found' }, { status: 404 })
    }

    return Response.json({ 
      success: true, 
      progress 
    })

  } catch (error) {
    console.error('Error getting campaign progress:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

async function sendCampaignWithProgress(userId, campaignId, progressKey) {
  try {
    // Get user and campaign data
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('whop_user_id', userId)
      .single()

    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    const { data: subscribers } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (!subscribers || subscribers.length === 0) {
      campaignProgress.set(progressKey, {
        status: 'failed',
        error: 'No active subscribers found',
        current: 0,
        total: 0,
        sent: 0,
        failed: 0
      })
      return
    }

    // Update progress with total count
    campaignProgress.set(progressKey, {
      status: 'sending',
      current: 0,
      total: subscribers.length,
      sent: 0,
      failed: 0
    })

    // Send emails with progress updates
    let sent = 0
    let failed = 0

    for (let i = 0; i < subscribers.length; i++) {
      const subscriber = subscribers[i]
      
      try {
        // Call the actual send-campaign API
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-single-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            campaignId,
            subscriber
          })
        })

        const result = await response.json()
        
        if (response.ok && result.success) {
          sent++
          console.log(`✅ Email sent to ${subscriber.email} (${i + 1}/${subscribers.length})`)
        } else {
          failed++
          console.log(`❌ Failed to send email to ${subscriber.email}: ${result.error}`)
        }
      } catch (error) {
        failed++
        console.log(`❌ Error sending email to ${subscriber.email}:`, error.message)
      }

      // Update progress with more detailed info
      const currentProgress = {
        status: 'sending',
        current: i + 1,
        total: subscribers.length,
        sent,
        failed,
        currentEmail: subscriber.email,
        percentage: Math.round(((i + 1) / subscribers.length) * 100)
      }
      
      campaignProgress.set(progressKey, currentProgress)
      console.log(`Progress: ${currentProgress.current}/${currentProgress.total} (${currentProgress.percentage}%) - Sent: ${sent}, Failed: ${failed}`)

      // Small delay to prevent rate limiting and allow UI updates
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // Mark as completed
    campaignProgress.set(progressKey, {
      status: 'completed',
      current: subscribers.length,
      total: subscribers.length,
      sent,
      failed,
      completedAt: new Date().toISOString()
    })

    // Update campaign status
    await supabaseAdmin
      .from('campaigns')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        total_recipients: sent
      })
      .eq('id', campaignId)

    // Clean up progress after 5 minutes
    setTimeout(() => {
      campaignProgress.delete(progressKey)
    }, 5 * 60 * 1000)

  } catch (error) {
    console.error('Error in sendCampaignWithProgress:', error)
    campaignProgress.set(progressKey, {
      status: 'failed',
      error: error.message,
      current: 0,
      total: 0,
      sent: 0,
      failed: 0
    })
  }
}