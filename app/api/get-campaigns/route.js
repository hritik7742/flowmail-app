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
      return Response.json({ success: true, campaigns: [] })
    }

    // Get campaigns for this user
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('id, name, subject, status, total_recipients, sent_at, created_at, html_content, preview_text, user_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching campaigns:', error)
      return Response.json({ success: false, error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      campaigns: campaigns || []
    })

  } catch (error) {
    console.error('Error in get-campaigns:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}