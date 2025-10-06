import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log('=== RESEND WEBHOOK RECEIVED ===')
    console.log('Event type:', type)
    console.log('Event data:', JSON.stringify(data, null, 2))

    // Handle different webhook events
    switch (type) {
      case 'email.sent':
        await handleEmailSent(data)
        break
      case 'email.delivered':
        await handleEmailDelivered(data)
        break

      case 'email.clicked':
        await handleEmailClicked(data)
        break
      case 'email.bounced':
        await handleEmailBounced(data)
        break
      case 'email.complained':
        await handleEmailComplained(data)
        break
      default:
        console.log('Unhandled webhook event type:', type)
    }

    return NextResponse.json({ success: true, message: `Processed ${type} event` })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({
      success: false,
      error: 'Webhook processing failed',
      details: error.message
    }, { status: 500 })
  }
}

async function handleEmailSent(data) {
  try {
    const { email_id, to, subject, created_at, tags } = data

    console.log('Processing email.sent event for:', email_id)

    // Extract campaign info from tags if available
    const campaignId = tags?.campaign_id || null

    // Record the sent event
    const { error } = await supabaseAdmin
      .from('email_events')
      .insert({
        campaign_id: campaignId || null,
        event_type: 'sent',
        email_id,
        recipient_email: Array.isArray(to) ? to[0] : to,
        subject,
        metadata: { tags },
        created_at: created_at ? new Date(created_at).toISOString() : new Date().toISOString()
      })

    if (error) {
      console.error('Database error recording sent event:', error)
    } else {
      console.log('✅ Email sent event recorded:', email_id)
    }
  } catch (error) {
    console.error('Error handling email sent:', error)
  }
}

async function handleEmailDelivered(data) {
  try {
    const { email_id, to, created_at, tags } = data

    console.log('Processing email.delivered event for:', email_id)

    // Extract campaign info from tags if available
    const campaignId = tags?.campaign_id || null

    const { error } = await supabaseAdmin
      .from('email_events')
      .insert({
        campaign_id: campaignId || null,
        event_type: 'delivered',
        email_id,
        recipient_email: Array.isArray(to) ? to[0] : to,
        metadata: { tags },
        created_at: created_at ? new Date(created_at).toISOString() : new Date().toISOString()
      })

    if (error) {
      console.error('Database error recording delivered event:', error)
    } else {
      console.log('✅ Email delivered event recorded:', email_id)
    }
  } catch (error) {
    console.error('Error handling email delivered:', error)
  }
}



async function handleEmailClicked(data) {
  try {
    const { email_id, to, link, created_at, tags } = data

    console.log('🖱️ Processing email.clicked event for:', email_id)
    console.log('Link clicked:', link)

    // Extract campaign info from tags if available
    const campaignId = tags?.campaign_id || null

    const { error } = await supabaseAdmin
      .from('email_events')
      .insert({
        campaign_id: campaignId || null,
        event_type: 'click',
        email_id,
        recipient_email: Array.isArray(to) ? to[0] : to,
        metadata: { link, tags, user_agent: data.user_agent, ip: data.ip },
        created_at: created_at ? new Date(created_at).toISOString() : new Date().toISOString()
      })

    if (error) {
      console.error('Database error recording click event:', error)
    } else {
      console.log('✅ Email clicked event recorded:', email_id)

      // Update campaign click count if we have a campaign ID
      if (campaignId) {
        const { data: clickCount } = await supabaseAdmin
          .from('email_events')
          .select('id', { count: 'exact' })
          .eq('campaign_id', campaignId)
          .eq('event_type', 'clicked')

        const { error: updateError } = await supabaseAdmin
          .from('campaigns')
          .update({ click_count: clickCount?.length || 0 })
          .eq('id', campaignId)

        if (!updateError) {
          console.log('✅ Campaign click count updated:', campaignId)
        }
      }
    }
  } catch (error) {
    console.error('Error handling email clicked:', error)
  }
}

async function handleEmailBounced(data) {
  try {
    const { email_id, to, created_at, tags } = data

    console.log('⚠️ Processing email.bounced event for:', email_id)

    // Extract campaign info from tags if available
    const campaignId = tags?.campaign_id || null

    const { error } = await supabaseAdmin
      .from('email_events')
      .insert({
        campaign_id: campaignId || null,
        event_type: 'bounced',
        email_id,
        recipient_email: Array.isArray(to) ? to[0] : to,
        metadata: { tags, bounce_reason: data.reason },
        created_at: created_at ? new Date(created_at).toISOString() : new Date().toISOString()
      })

    if (error) {
      console.error('Database error recording bounce event:', error)
    } else {
      console.log('✅ Email bounced event recorded:', email_id)
    }
  } catch (error) {
    console.error('Error handling email bounced:', error)
  }
}

async function handleEmailComplained(data) {
  try {
    const { email_id, to, created_at, tags } = data

    console.log('🚨 Processing email.complained event for:', email_id)

    // Extract campaign info from tags if available
    const campaignId = tags?.campaign_id || null

    const { error } = await supabaseAdmin
      .from('email_events')
      .insert({
        campaign_id: campaignId || null,
        event_type: 'complained',
        email_id,
        recipient_email: Array.isArray(to) ? to[0] : to,
        metadata: { tags },
        created_at: created_at ? new Date(created_at).toISOString() : new Date().toISOString()
      })

    if (error) {
      console.error('Database error recording complaint event:', error)
    } else {
      console.log('✅ Email complained event recorded:', email_id)
    }
  } catch (error) {
    console.error('Error handling email complained:', error)
  }
}