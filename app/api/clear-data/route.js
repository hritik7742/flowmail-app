import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    console.log('=== CLEAR DATA API CALLED ===')
    const { userId, confirmClear } = await request.json()
    console.log('Received data:', { userId, confirmClear })
    
    if (!userId) {
      console.log('Error: User ID required')
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    if (!confirmClear) {
      console.log('Error: Confirmation required')
      return Response.json({ success: false, error: 'Confirmation required' }, { status: 400 })
    }

    console.log('=== CLEARING ALL DATA FOR USER ===')
    console.log('User ID:', userId)

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single()

    if (userError) {
      console.log('Database error finding user:', userError)
      return Response.json({ success: false, error: 'Database error: ' + userError.message }, { status: 500 })
    }

    if (!user) {
      console.log('User not found for whop_user_id:', userId)
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    console.log('Found user with ID:', user.id)

    let deletedCounts = {
      subscribers: 0,
      campaigns: 0
    }

    // Delete all subscribers for this user
    console.log('Deleting subscribers for user ID:', user.id)
    const { error: subscribersError, count: subscribersCount } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('user_id', user.id)

    if (subscribersError) {
      console.log('Error deleting subscribers:', subscribersError)
      return Response.json({ success: false, error: 'Failed to delete subscribers: ' + subscribersError.message }, { status: 500 })
    } else {
      deletedCounts.subscribers = subscribersCount || 0
      console.log('Deleted subscribers:', deletedCounts.subscribers)
    }

    // Delete all campaigns for this user
    console.log('Deleting campaigns for user ID:', user.id)
    const { error: campaignsError, count: campaignsCount } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('user_id', user.id)

    if (campaignsError) {
      console.log('Error deleting campaigns:', campaignsError)
      return Response.json({ success: false, error: 'Failed to delete campaigns: ' + campaignsError.message }, { status: 500 })
    } else {
      deletedCounts.campaigns = campaignsCount || 0
      console.log('Deleted campaigns:', deletedCounts.campaigns)
    }

    console.log('✅ Data cleared successfully:', deletedCounts)

    return Response.json({
      success: true,
      message: `Successfully cleared all data! Deleted ${deletedCounts.subscribers} subscribers and ${deletedCounts.campaigns} campaigns.`,
      deletedCounts
    })

  } catch (error) {
    console.error('Error clearing data:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}