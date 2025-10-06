import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, senderName, senderEmail } = await request.json()

    if (!userId) {
      return Response.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Find the user's UUID from the whop_user_id
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

    // Update user's sender information
    const updateData = {}
    if (senderName) updateData.company_name = senderName
    if (senderEmail) updateData.email = senderEmail

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating sender info:', updateError)
      return Response.json({
        error: 'Failed to update sender information',
        details: updateError.message
      }, { status: 500 })
    }

    return Response.json({
      success: true,
      message: 'Sender information updated successfully'
    })

  } catch (error) {
    console.error('Error updating sender info:', error)
    return Response.json({
      error: 'Failed to update sender information',
      details: error.message
    }, { status: 500 })
  }
}