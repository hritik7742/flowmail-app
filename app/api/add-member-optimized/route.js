import { supabaseAdmin } from '@/lib/supabase'
import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

// Simple in-memory cache to prevent duplicate requests
const recentRequests = new Map()
const REQUEST_COOLDOWN = 2000 // 2 seconds

export async function POST(request) {
  try {
    const requestBody = await request.json()
    console.log('=== OPTIMIZED ADD MEMBER - USER ISOLATED ===')
    console.log('API received request body:', requestBody)
    
    const { userId, name, email, tier } = requestBody

    console.log('Extracted values:', { userId, name, email, tier })

    if (!userId || !name || !email) {
      console.log('Missing parameters check:', { 
        hasUserId: !!userId, 
        hasName: !!name, 
        hasEmail: !!email 
      })
      return Response.json({ 
        success: false,
        error: 'Missing required parameters (userId, name, email)' 
      }, { status: 400 })
    }

    // CRITICAL: Verify user authentication using Whop's official method
    // This ensures we only add subscribers for the authenticated user
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

    // Check for recent duplicate requests
    const requestKey = `${verifiedUserId}-${email.toLowerCase()}`
    const now = Date.now()
    const lastRequest = recentRequests.get(requestKey)
    
    if (lastRequest && (now - lastRequest) < REQUEST_COOLDOWN) {
      console.log('⚠️ Duplicate request detected, ignoring:', requestKey)
      return Response.json({
        success: false,
        error: 'Duplicate request',
        details: 'Please wait before submitting again'
      }, { status: 429 })
    }
    
    // Record this request
    recentRequests.set(requestKey, now)
    
    // Clean up old entries (keep only last 100)
    if (recentRequests.size > 100) {
      const entries = Array.from(recentRequests.entries())
      entries.sort((a, b) => b[1] - a[1])
      recentRequests.clear()
      entries.slice(0, 50).forEach(([key, time]) => {
        recentRequests.set(key, time)
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return Response.json({ 
        success: false,
        error: 'Invalid email format' 
      }, { status: 400 })
    }

    console.log('Adding new member:', { name, email, tier })

    // Get user from database using verified user ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, whop_user_id, display_name')
      .eq('whop_user_id', verifiedUserId) // Use verified user ID for security
      .single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return Response.json({
        success: false,
        error: 'User not found',
        details: 'Please make sure you are logged in properly'
      }, { status: 400 })
    }

    console.log('✅ User found:', user.id)

    // Check if subscriber already exists for this user
    const { data: existingSubscriber } = await supabaseAdmin
      .from('subscribers')
      .select('id, name, email, source')
      .eq('user_id', user.id)
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingSubscriber) {
      return Response.json({
        success: false,
        error: 'Subscriber already exists',
        details: `${name} (${email}) is already in your subscriber list`,
        existing_subscriber: {
          name: existingSubscriber.name,
          email: existingSubscriber.email,
          source: existingSubscriber.source
        }
      }, { status: 400 })
    }

    // Insert new subscriber with proper user isolation
    const { data: newSubscriber, error: insertError } = await supabaseAdmin
      .from('subscribers')
      .insert({
        user_id: user.id, // CRITICAL: This ensures user isolation
        whop_member_id: null, // Manual entries don't have whop member ID
        name: name.trim(),
        email: email.toLowerCase().trim(),
        tier: tier || 'basic',
        status: 'active',
        source: 'manual_add',
        synced_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting subscriber:', insertError)
      return Response.json({
        success: false,
        error: 'Failed to add subscriber',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('✅ Successfully added new subscriber:', newSubscriber.id)

    // Get updated subscriber count for this user
    const { count: totalSubscribers } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: activeSubscribers } = await supabaseAdmin
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    return Response.json({
      success: true,
      message: `Successfully added ${name} to your subscriber list!`,
      subscriber: {
        id: newSubscriber.id,
        name: newSubscriber.name,
        email: newSubscriber.email,
        tier: newSubscriber.tier,
        status: newSubscriber.status,
        source: newSubscriber.source
      },
      user: {
        id: user.id,
        whop_user_id: user.whop_user_id,
        display_name: user.display_name
      },
      stats: {
        total_subscribers: totalSubscribers || 0,
        active_subscribers: activeSubscribers || 0
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error adding member:', error)
    return Response.json({
      success: false,
      error: 'Failed to add member',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
