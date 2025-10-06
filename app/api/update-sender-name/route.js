import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, senderName } = await request.json()

    if (!userId || !senderName) {
      return Response.json({ error: 'Missing required parameters (userId, senderName)' }, { status: 400 })
    }

    // Validate sender name (only alphanumeric and basic characters)
    const senderNameRegex = /^[a-zA-Z0-9._-]+$/
    if (!senderNameRegex.test(senderName)) {
      return Response.json({ 
        error: 'Invalid sender name. Only letters, numbers, dots, underscores, and hyphens are allowed.' 
      }, { status: 400 })
    }

    if (senderName.length < 2 || senderName.length > 30) {
      return Response.json({ 
        error: 'Sender name must be between 2 and 30 characters long.' 
      }, { status: 400 })
    }

    console.log('Updating sender name for user:', userId, 'to:', senderName)

    // First, find the user's UUID from the whop_user_id
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return Response.json({
        error: 'User not found',
        details: 'Please make sure you are logged in properly'
      }, { status: 400 })
    }

    // Update the sender name
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        sender_name: senderName.toLowerCase(),
        sender_email_configured: true
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating sender name:', updateError)
      return Response.json({
        error: 'Failed to update sender name',
        details: updateError.message
      }, { status: 500 })
    }

    console.log('✅ Successfully updated sender name')

    return Response.json({
      success: true,
      message: `Sender name updated successfully! Your emails will now be sent from ${senderName}@flowmail.rovelin.com`,
      senderEmail: `${senderName}@flowmail.rovelin.com`
    })

  } catch (error) {
    console.error('Error updating sender name:', error)
    return Response.json({
      error: 'Failed to update sender name',
      details: error.message
    }, { status: 500 })
  }
}