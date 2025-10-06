import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      return Response.json({ success: true, subscribers: [] })
    }

    // Get subscribers for this user
    const { data: subscribers, error } = await supabaseAdmin
      .from('subscribers')
      .select('*')
      .eq('user_id', user.id)
      .order('synced_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscribers:', error)
      return Response.json({ success: false, error: 'Failed to fetch subscribers' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      subscribers: subscribers || []
    })

  } catch (error) {
    console.error('Error in get-subscribers:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}