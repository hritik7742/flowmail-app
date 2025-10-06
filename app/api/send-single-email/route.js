import { sendEmail } from '@/lib/resend'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, campaignId, subscriber } = await request.json()
    
    if (!userId || !campaignId || !subscriber) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Get campaign details (you might want to pass this in the request to avoid repeated DB calls)
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Replace merge tags
    let personalizedContent = campaign.html_content
      .replace(/\{\{name\}\}/g, subscriber.name || 'Member')
      .replace(/\{\{email\}\}/g, subscriber.email)
      .replace(/\{\{tier\}\}/g, subscriber.tier || 'Basic')

    // Send email
    const result = await sendEmail({
      to: subscriber.email,
      subject: campaign.subject,
      html: personalizedContent,
      from: `FlowMail <noreply@flowmail.rovelin.com>`,
      campaignId: campaign.id,
      subscriberId: subscriber.id
    })

    return Response.json({ 
      success: result.success,
      error: result.error,
      emailId: result.data?.id
    })

  } catch (error) {
    console.error('Error sending single email:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}