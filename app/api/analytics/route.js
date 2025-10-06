import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    console.log('=== FETCHING ANALYTICS DATA ===')
    console.log('User ID:', userId)

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get campaign analytics
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        id,
        name,
        subject,
        status,
        total_recipients,
        sent_at,
        created_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError)
      return Response.json({ success: false, error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    // Calculate overall stats
    const totalCampaigns = campaigns?.length || 0
    const sentCampaigns = campaigns?.filter(c => c.status === 'sent') || []
    const totalEmailsSent = sentCampaigns.reduce((sum, c) => sum + (c.total_recipients || 0), 0)
    
    // Simple campaign analytics without open tracking
    const campaignAnalytics = sentCampaigns.map(campaign => ({
      ...campaign
    }))

    // Debug logging
    console.log('Analytics summary:')
    console.log('- Total campaigns:', totalCampaigns)
    console.log('- Sent campaigns:', sentCampaigns.length)
    console.log('- Total emails sent:', totalEmailsSent)

    return Response.json({
      success: true,
      analytics: {
        overview: {
          total_campaigns: totalCampaigns,
          sent_campaigns: sentCampaigns.length,
          total_emails_sent: totalEmailsSent
        },
        campaigns: campaignAnalytics
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}