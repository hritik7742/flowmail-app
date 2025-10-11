import { supabaseAdmin } from '@/lib/supabase'
import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    console.log('=== CLEANUP SUBSCRIBERS - FIX USER ISOLATION ===')
    console.log('Requested User ID:', userId)

    // CRITICAL: Verify user authentication using Whop's official method
    const headersList = await headers()
    let verifiedUserId
    
    try {
      const userToken = await whopSdk.verifyUserToken(headersList)
      verifiedUserId = userToken.userId
      console.log('✅ User authenticated via Whop SDK:', verifiedUserId)
      
      // Double-check: ensure the userId from request matches the verified user
      if (verifiedUserId !== userId) {
        console.error('❌ User ID mismatch:', { requested: userId, verified: verifiedUserId })
        return Response.json({
          success: false,
          error: 'Authentication mismatch. User ID does not match verified user.',
          code: 'USER_ID_MISMATCH'
        }, { status: 403 })
      }
    } catch (authError) {
      console.log('❌ Whop authentication failed:', authError.message)
      return Response.json({
        success: false,
        error: 'Authentication failed. Make sure you are accessing this from within a Whop app context.',
        details: authError.message,
        code: 'AUTH_FAILED'
      }, { status: 401 })
    }

    // Get user from database using verified user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, whop_user_id, display_name')
      .eq('whop_user_id', verifiedUserId)
      .single()

    if (userError || !user) {
      return Response.json({ 
        success: false, 
        error: 'User not found in database'
      }, { status: 404 })
    }

    console.log('✅ User found:', user.id, 'Whop ID:', user.whop_user_id)

    // Check for subscribers that don't belong to this user
    const { data: allSubscribers, error: allError } = await supabaseAdmin
      .from('subscribers')
      .select('id, user_id, email, name, source')
      .neq('user_id', user.id)

    if (allError) {
      console.error('Error fetching all subscribers:', allError)
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch subscribers for cleanup'
      }, { status: 500 })
    }

    console.log(`Found ${allSubscribers?.length || 0} subscribers that don't belong to user ${user.id}`)

    // Get subscribers that DO belong to this user
    const { data: userSubscribers, error: userSubError } = await supabaseAdmin
      .from('subscribers')
      .select('id, user_id, email, name, source')
      .eq('user_id', user.id)

    if (userSubError) {
      console.error('Error fetching user subscribers:', userSubError)
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch user subscribers'
      }, { status: 500 })
    }

    console.log(`Found ${userSubscribers?.length || 0} subscribers that belong to user ${user.id}`)

    // Show what we found
    const cleanupInfo = {
      user_id: user.id,
      user_whop_id: user.whop_user_id,
      user_subscribers: userSubscribers?.length || 0,
      other_subscribers: allSubscribers?.length || 0,
      user_subscriber_details: userSubscribers?.map(sub => ({
        id: sub.id,
        email: sub.email,
        name: sub.name,
        source: sub.source
      })) || [],
      other_subscriber_details: allSubscribers?.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        email: sub.email,
        name: sub.name,
        source: sub.source
      })) || []
    }

    return Response.json({
      success: true,
      message: 'Subscriber cleanup analysis complete',
      analysis: cleanupInfo,
      recommendations: allSubscribers?.length > 0 ? [
        'Found subscribers that don\'t belong to this user',
        'This indicates a data isolation issue',
        'Consider running a full database cleanup',
        'Make sure sync operations only affect the authenticated user'
      ] : [
        '✅ All subscribers belong to the authenticated user',
        'User isolation is working correctly'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in cleanup-subscribers:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
