import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return Response.json({ error: 'Missing required parameter (userId)' }, { status: 400 })
    }

    console.log('Getting sender name for user:', userId)

    // Find the user's data from the whop_user_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('sender_name, sender_email_configured')
      .eq('whop_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return Response.json({
        error: 'User not found',
        details: 'Please make sure you are logged in properly'
      }, { status: 400 })
    }

    const senderName = user.sender_name || 'noreply'
    const senderEmail = `${senderName}@flowmail.rovelin.com`

    return Response.json({
      success: true,
      senderName: senderName,
      senderEmail: senderEmail,
      isConfigured: user.sender_email_configured || false
    })

  } catch (error) {
    console.error('Error getting sender name:', error)
    return Response.json({
      error: 'Failed to get sender name',
      details: error.message
    }, { status: 500 })
  }
}