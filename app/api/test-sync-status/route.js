import { supabaseAdmin } from '@/lib/supabase'
import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    console.log('=== TEST SYNC STATUS ===')
    console.log('Requested User ID:', userId)

    // CRITICAL: Verify user authentication using Whop's official method
    const headersList = await headers()
    let verifiedUserId
    
    try {
      const userToken = await whopSdk.verifyUserToken(headersList)
      verifiedUserId = userToken.userId
      console.log('✅ User authenticated via Whop SDK:', verifiedUserId)
      
      if (verifiedUserId !== userId) {
        return Response.json({
          success: false,
          error: 'Authentication mismatch',
          code: 'USER_ID_MISMATCH'
        }, { status: 403 })
      }
    } catch (authError) {
      return Response.json({
        success: false,
        error: 'Authentication failed',
        details: authError.message,
        code: 'AUTH_FAILED'
      }, { status: 401 })
    }

    // Get user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, whop_user_id, display_name, unique_code')
      .eq('whop_user_id', verifiedUserId)
      .single()

    if (userError || !user) {
      return Response.json({ 
        success: false, 
        error: 'User not found in database'
      }, { status: 404 })
    }

    console.log('✅ User found:', user.id, 'Whop ID:', user.whop_user_id)

    // Get ALL subscribers in database (for debugging)
    const { data: allSubscribers, error: allError } = await supabaseAdmin
      .from('subscribers')
      .select('id, user_id, email, name, source, status, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch subscribers'
      }, { status: 500 })
    }

    // Get subscribers for this specific user
    const userSubscribers = allSubscribers?.filter(sub => sub.user_id === user.id) || []
    const otherSubscribers = allSubscribers?.filter(sub => sub.user_id !== user.id) || []

    console.log(`Total subscribers in database: ${allSubscribers?.length || 0}`)
    console.log(`Subscribers for user ${user.id}: ${userSubscribers.length}`)
    console.log(`Subscribers for other users: ${otherSubscribers.length}`)

    // Analyze the data
    const analysis = {
      user: {
        id: user.id,
        whop_user_id: user.whop_user_id,
        display_name: user.display_name,
        unique_code: user.unique_code
      },
      database_stats: {
        total_subscribers: allSubscribers?.length || 0,
        user_subscribers: userSubscribers.length,
        other_users_subscribers: otherSubscribers.length
      },
      user_subscribers: userSubscribers.map(sub => ({
        id: sub.id,
        email: sub.email,
        name: sub.name,
        source: sub.source,
        status: sub.status,
        created_at: sub.created_at
      })),
      other_subscribers: otherSubscribers.map(sub => ({
        id: sub.id,
        user_id: sub.user_id,
        email: sub.email,
        name: sub.name,
        source: sub.source,
        status: sub.status,
        created_at: sub.created_at
      })),
      issues: []
    }

    // Check for issues
    if (otherSubscribers.length > 0) {
      analysis.issues.push('❌ Found subscribers that don\'t belong to this user')
    }
    
    if (userSubscribers.length === 0) {
      analysis.issues.push('⚠️ No subscribers found for this user')
    }

    if (analysis.issues.length === 0) {
      analysis.issues.push('✅ User isolation is working correctly')
    }

    return Response.json({
      success: true,
      message: 'Sync status analysis complete',
      analysis,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in test-sync-status:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
