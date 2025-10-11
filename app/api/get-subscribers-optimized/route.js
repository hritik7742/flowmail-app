import { supabaseAdmin } from '@/lib/supabase'
import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

export async function POST(request) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    console.log('=== OPTIMIZED GET SUBSCRIBERS - USER ISOLATED ===')
    console.log('Requested User ID:', userId)

    // CRITICAL: Verify user authentication using Whop's official method
    // This ensures we only return subscribers for the authenticated user
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
      .select('id, whop_user_id, display_name, plan')
      .eq('whop_user_id', verifiedUserId) // Use verified user ID for security
      .single()

    if (userError || !user) {
      console.log('User not found in database, returning empty list')
      return Response.json({ 
        success: true, 
        subscribers: [],
        user: null,
        message: 'User not found in database'
      })
    }

    console.log('✅ User found:', user.id)

    // Get subscribers for this specific user only (proper isolation)
    const { data: subscribers, error } = await supabaseAdmin
      .from('subscribers')
      .select(`
        id,
        whop_member_id,
        email,
        name,
        tier,
        status,
        source,
        synced_at,
        created_at
      `)
      .eq('user_id', user.id) // CRITICAL: This ensures user isolation
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching subscribers:', error)
      return Response.json({ 
        success: false, 
        error: 'Failed to fetch subscribers',
        details: error.message
      }, { status: 500 })
    }

    // Separate subscribers by source for better organization
    const whopSubscribers = subscribers?.filter(sub => sub.source === 'whop_sync') || []
    const manualSubscribers = subscribers?.filter(sub => sub.source !== 'whop_sync') || []
    const activeSubscribers = subscribers?.filter(sub => sub.status === 'active') || []
    const inactiveSubscribers = subscribers?.filter(sub => sub.status === 'inactive') || []

    console.log(`✅ Found ${subscribers?.length || 0} total subscribers for user ${user.id}`)
    console.log(`   - Whop synced: ${whopSubscribers.length}`)
    console.log(`   - Manual added: ${manualSubscribers.length}`)
    console.log(`   - Active: ${activeSubscribers.length}`)
    console.log(`   - Inactive: ${inactiveSubscribers.length}`)

    return Response.json({ 
      success: true, 
      subscribers: subscribers || [],
      user: {
        id: user.id,
        whop_user_id: user.whop_user_id,
        display_name: user.display_name,
        plan: user.plan
      },
      stats: {
        total: subscribers?.length || 0,
        active: activeSubscribers.length,
        inactive: inactiveSubscribers.length,
        whop_synced: whopSubscribers.length,
        manual_added: manualSubscribers.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in optimized get-subscribers:', error)
    return Response.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
