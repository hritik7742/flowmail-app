import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, memberId } = await request.json()
    
    if (!userId || !memberId) {
      return Response.json({ success: false, error: 'User ID and Member ID required' }, { status: 400 })
    }

    console.log('=== DELETING MEMBER ===')
    console.log('User ID:', userId)
    console.log('Member ID:', memberId)

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('whop_user_id', userId)
      .single()

    if (userError || !user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Delete the specific member
    const { error: deleteError, count } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('user_id', user.id)
      .eq('id', memberId)

    if (deleteError) {
      console.error('Error deleting member:', deleteError)
      return Response.json({
        success: false,
        error: 'Failed to delete member',
        details: deleteError.message
      }, { status: 500 })
    }

    if (count === 0) {
      return Response.json({
        success: false,
        error: 'Member not found or already deleted'
      }, { status: 404 })
    }

    console.log('✅ Member deleted successfully')

    return Response.json({
      success: true,
      message: 'Member deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting member:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}