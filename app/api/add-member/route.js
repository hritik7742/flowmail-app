import { supabaseAdmin } from '@/lib/supabase'

// Simple in-memory cache to prevent duplicate requests
const recentRequests = new Map()
const REQUEST_COOLDOWN = 2000 // 2 seconds

export async function POST(request) {
  try {
    const requestBody = await request.json()
    console.log('API received request body:', requestBody)
    
    const { userId, name, email, tier } = requestBody

    console.log('Extracted values:', { userId, name, email, tier })

    if (!userId || !name || !email) {
      console.log('Missing parameters check:', { 
        hasUserId: !!userId, 
        hasName: !!name, 
        hasEmail: !!email 
      })
      return Response.json({ error: 'Missing required parameters (userId, name, email)' }, { status: 400 })
    }

    // Check for recent duplicate requests
    const requestKey = `${userId}-${email.toLowerCase()}`
    const now = Date.now()
    const lastRequest = recentRequests.get(requestKey)
    
    if (lastRequest && (now - lastRequest) < REQUEST_COOLDOWN) {
      console.log('⚠️ Duplicate request detected, ignoring:', requestKey)
      return Response.json({
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
      return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }

    console.log('Adding new member:', { name, email, tier })

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

    const userUuid = user.id

    // Use upsert to handle duplicates gracefully
    const { data: newSubscriber, error: insertError } = await supabaseAdmin
      .from('subscribers')
      .upsert({
        user_id: userUuid,
        whop_member_id: null, // Manual entries don't have whop member ID
        name: name.trim(),
        email: email.toLowerCase().trim(),
        tier: tier || 'basic',
        status: 'active',
        synced_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,email',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (insertError) {
      // Handle specific duplicate key error
      if (insertError.code === '23505') {
        return Response.json({
          error: 'Subscriber already exists',
          details: `${name} (${email}) is already in your subscriber list`
        }, { status: 400 })
      }
      
      console.error('Error inserting subscriber:', insertError)
      return Response.json({
        error: 'Failed to add subscriber',
        details: insertError.message
      }, { status: 500 })
    }

    console.log('✅ Successfully added new subscriber:', newSubscriber.id)

    return Response.json({
      success: true,
      message: `Successfully added ${name} to your subscriber list!`,
      subscriber: {
        id: newSubscriber.id,
        name: newSubscriber.name,
        email: newSubscriber.email,
        tier: newSubscriber.tier
      }
    })

  } catch (error) {
    console.error('Error adding member:', error)
    return Response.json({
      error: 'Failed to add member',
      details: error.message
    }, { status: 500 })
  }
}