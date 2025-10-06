import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, campaignIds } = await request.json()
    
    if (!userId || !campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return Response.json({ success: false, error: 'Missing required fields or invalid campaign IDs' }, { status: 400 })
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

    // Get campaigns to verify they belong to the user and check their status
    const { data: campaigns } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, status')
      .eq('user_id', user.id)
      .in('id', campaignIds)

    if (!campaigns || campaigns.length === 0) {
      return Response.json({ success: false, error: 'No campaigns found' }, { status: 404 })
    }

    // Check if any campaigns are currently sending
    const sendingCampaigns = campaigns.filter(c => c.status === 'sending')
    if (sendingCampaigns.length > 0) {
      return Response.json({ 
        success: false, 
        error: `Cannot delete campaigns that are currently sending: ${sendingCampaigns.map(c => c.name).join(', ')}` 
      }, { status: 400 })
    }

    // Delete campaigns
    const { error: deleteError } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('user_id', user.id)
      .in('id', campaignIds)

    if (deleteError) {
      console.error('Error deleting campaigns:', deleteError)
      return Response.json({ success: false, error: 'Failed to delete campaigns' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: `Successfully deleted ${campaigns.length} campaign(s)`,
      deletedCount: campaigns.length,
      deletedCampaigns: campaigns.map(c => ({ id: c.id, name: c.name }))
    })

  } catch (error) {
    console.error('Error in delete-campaigns:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}