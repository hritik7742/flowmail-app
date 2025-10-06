import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, campaignId, name, subject, preview_text, html_content } = await request.json()
    
    if (!userId || !campaignId || !name || !subject || !html_content) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Check if campaign exists and belongs to user
    const { data: existingCampaign } = await supabaseAdmin
      .from('campaigns')
      .select('id, status')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!existingCampaign) {
      return Response.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Don't allow editing sent campaigns
    if (existingCampaign.status === 'sent') {
      return Response.json({ success: false, error: 'Cannot edit campaigns that have already been sent' }, { status: 400 })
    }

    // Update campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .update({
        name,
        subject,
        preview_text,
        html_content,
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (campaignError) {
      console.error('Error updating campaign:', campaignError)
      return Response.json({ success: false, error: 'Failed to update campaign' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Campaign updated successfully',
      campaign
    })

  } catch (error) {
    console.error('Error in update-campaign:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}