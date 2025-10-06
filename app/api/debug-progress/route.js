import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, campaignId } = await request.json()
    
    if (!userId || !campaignId) {
      return Response.json({ 
        success: false, 
        error: 'User ID and Campaign ID required' 
      }, { status: 400 })
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Get campaign details
    const { data: campaign } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status, total_recipients')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return Response.json({ 
        success: false, 
        error: 'Campaign not found' 
      }, { status: 404 })
    }

    // Get subscribers count
    const { data: subscribers } = await supabaseAdmin
      .from('subscribers')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')

    const subscribersCount = subscribers?.length || 0

    return Response.json({
      success: true,
      debug: {
        campaign_name: campaign.name,
        campaign_status: campaign.status,
        campaign_recipients: campaign.total_recipients,
        subscribers_count: subscribersCount,
        ready_to_send: subscribersCount > 0 && campaign.status === 'draft'
      }
    })

  } catch (error) {
    console.error('Error in debug-progress:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}