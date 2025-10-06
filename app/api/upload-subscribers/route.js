import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { userId, subscribers } = await request.json()

    if (!userId || !subscribers || !Array.isArray(subscribers)) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    console.log(`Processing ${subscribers.length} subscribers for user ${userId}`)

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

    const results = {
      success: 0,
      errors: 0,
      duplicates: 0,
      details: []
    }

    for (const subscriber of subscribers) {
      try {
        // Validate required fields
        if (!subscriber.email || !subscriber.name) {
          results.errors++
          results.details.push({
            email: subscriber.email || 'missing',
            error: 'Missing required fields (name or email)'
          })
          continue
        }

        // Check if subscriber already exists
        const { data: existing } = await supabaseAdmin
          .from('subscribers')
          .select('id')
          .eq('user_id', userUuid)
          .eq('email', subscriber.email.toLowerCase())
          .single()

        if (existing) {
          results.duplicates++
          results.details.push({
            email: subscriber.email,
            status: 'duplicate'
          })
          continue
        }

        // Insert new subscriber (without source column for now)
        const { error: insertError } = await supabaseAdmin
          .from('subscribers')
          .insert({
            user_id: userUuid,
            whop_member_id: null, // Manual entries don't have whop member ID
            name: subscriber.name.trim(),
            email: subscriber.email.toLowerCase().trim(),
            tier: subscriber.tier || 'basic',
            status: 'active',
            synced_at: new Date().toISOString()
          })

        if (insertError) {
          results.errors++
          results.details.push({
            email: subscriber.email,
            error: insertError.message
          })
        } else {
          results.success++
          results.details.push({
            email: subscriber.email,
            status: 'added'
          })
        }

      } catch (error) {
        results.errors++
        results.details.push({
          email: subscriber.email || 'unknown',
          error: error.message
        })
      }
    }

    console.log('Upload results:', results)

    return Response.json({
      success: true,
      message: `Upload completed: ${results.success} added, ${results.duplicates} duplicates, ${results.errors} errors`,
      results
    })

  } catch (error) {
    console.error('Error uploading subscribers:', error)
    return Response.json({
      error: 'Failed to upload subscribers',
      details: error.message
    }, { status: 500 })
  }
}