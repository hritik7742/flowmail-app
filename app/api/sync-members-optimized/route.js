import { supabaseAdmin } from '@/lib/supabase'
import { whopSdk } from '@/lib/whop-sdk'
import { headers } from 'next/headers'

// Generate a unique code for the user with collision detection
async function generateUniqueCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Check if this code already exists in database
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('unique_code', result)
      .single()
    
    // If no existing user has this code, it's unique!
    if (!existingUser) {
      console.log(`✅ Generated unique code: ${result} (attempt ${attempts + 1})`)
      return result
    }
    
    attempts++
    console.log(`⚠️ Code collision detected: ${result}, retrying... (attempt ${attempts})`)
  }
  
  // Fallback: use timestamp + random for guaranteed uniqueness
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  const fallbackCode = (timestamp + random).substring(0, 8)
  console.log(`🔄 Using fallback unique code: ${fallbackCode}`)
  return fallbackCode
}

export async function POST(request) {
  try {
    const { userId, experienceId } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'User ID required' }, { status: 400 })
    }

    console.log('=== OPTIMIZED SYNC MEMBERS - USER ISOLATED ===')
    console.log('User ID:', userId)
    console.log('Experience ID:', experienceId)

    // CRITICAL: Verify user authentication using Whop's official method
    // This ensures we only sync members for the authenticated user
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

    // Get the company ID from environment
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    console.log('Company ID:', companyId)

    if (!companyId) {
      return Response.json({
        success: false,
        error: 'NEXT_PUBLIC_WHOP_COMPANY_ID is not configured',
        code: 'MISSING_COMPANY_ID'
      }, { status: 500 })
    }

    // Ensure user exists in our database with proper isolation
    let user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('whop_user_id', verifiedUserId) // Use verified user ID for security
      .single()

    if (existingUser) {
      user = existingUser
      
      // Ensure existing user has a unique code
      if (!user.unique_code) {
        const uniqueCode = await generateUniqueCode()
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({ 
            unique_code: uniqueCode,
            username: user.username || 'user',
            display_name: user.display_name || 'FlowMail User'
          })
          .eq('whop_user_id', verifiedUserId)
          .select()
          .single()
        
        if (updateError) {
          console.error('Error updating user with unique code:', updateError)
          return Response.json({ success: false, error: 'Failed to update user' }, { status: 500 })
        }
        user = updatedUser
      }
    } else {
      // Create new user with unique code
      const uniqueCode = await generateUniqueCode()
      const { data: newUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          whop_user_id: verifiedUserId,
          email: 'user@example.com',
          company_name: 'FlowMail User',
          plan: 'free',
          emails_sent_this_month: 0,
          unique_code: uniqueCode,
          username: 'user',
          display_name: 'FlowMail User',
          reply_to_email: 'user@example.com'
        })
        .select()
        .single()

      if (userError) {
        console.error('Error creating user:', userError)
        return Response.json({ success: false, error: 'Failed to create user' }, { status: 500 })
      }
      user = newUser
    }

    console.log('✅ User verified and ready:', user.id)

    // Fetch members from Whop API for THIS SPECIFIC USER'S COMMUNITY
    let realMembers = []

    try {
      console.log('=== Fetching members from Whop API ===')
      
      // Use Whop SDK to get memberships for the company
      const result = await whopSdk.companies.listMemberships({
        companyId: companyId,
        filters: {
          membershipStatus: "active",
          headerFilter: "active"
        },
        first: 100 // Increased limit for better coverage
      })

      console.log('Whop SDK Response structure:', Object.keys(result || {}))

      // Process the response based on structure
      let memberships = []
      if (result?.memberships?.nodes?.length > 0) {
        memberships = result.memberships.nodes
      } else if (result?.memberships?.edges?.length > 0) {
        memberships = result.memberships.edges.map(edge => edge.node)
      } else if (result?.data?.length > 0) {
        memberships = result.data
      }

      console.log(`Found ${memberships.length} total memberships`)

      // Filter and process valid memberships
      const validMemberships = memberships.filter(membership => {
        const member = membership.member
        return member && member.email && member.name && member.id
      })

      realMembers = validMemberships.map(membership => {
        const member = membership.member
        return {
          whop_member_id: membership.id,
          email: member.email.toLowerCase().trim(),
          name: member.name || member.username || 'Unknown',
          tier: membership.accessPass?.title || membership.plan?.name || 'Member',
          status: membership.status === 'completed' ? 'active' : 'inactive',
        }
      })
      
      console.log(`✅ Found ${realMembers.length} valid members from Whop API`)
      
      if (realMembers.length > 0) {
        console.log('Sample member data:', realMembers[0])
      }

    } catch (sdkError) {
      console.error('❌ Whop SDK Error:', sdkError)
      
      // Fallback to direct API call
      try {
        console.log('=== Fallback: Direct Whop API Call ===')
        
        const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}/memberships?status=active&limit=100`, {
          headers: {
            'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Direct API Response structure:', Object.keys(data || {}))

          const memberships = data?.data || []
          const validMemberships = memberships.filter(membership => {
            const member = membership.member
            return member && member.email && member.name && member.id
          })

          realMembers = validMemberships.map(membership => {
            const member = membership.member
            return {
              whop_member_id: membership.id,
              email: member.email.toLowerCase().trim(),
              name: member.name || member.username || 'Unknown',
              tier: membership.accessPass?.title || membership.plan?.name || 'Member',
              status: membership.status === 'completed' ? 'active' : 'inactive',
            }
          })
          
          console.log(`✅ Found ${realMembers.length} valid members via direct API`)
        } else {
          const errorText = await response.text()
          console.error('Direct API Error:', response.status, errorText)
          
          return Response.json({
            success: false,
            error: `Whop API Error: ${response.status}`,
            details: errorText,
            suggestions: [
              'Check your WHOP_API_KEY permissions',
              'Verify your NEXT_PUBLIC_WHOP_COMPANY_ID is correct',
              'Ensure your Whop app has membership read permissions',
              'Make sure you have active members in your community'
            ]
          }, { status: 400 })
        }

      } catch (apiError) {
        console.error('❌ Direct API Error:', apiError)
        
        return Response.json({
          success: false,
          error: 'Failed to connect to Whop API',
          details: apiError.message,
          debug: {
            sdkError: sdkError.message,
            apiError: apiError.message,
            companyId,
            hasApiKey: !!process.env.WHOP_API_KEY
          }
        }, { status: 500 })
      }
    }

    // If no real members found, return helpful error
    if (realMembers.length === 0) {
      return Response.json({
        success: false,
        error: 'No active members found in your Whop community',
        suggestions: [
          'Make sure your Whop community has active paying members',
          'Check that members have completed their purchases',
          'Verify your company ID is correct in the environment variables',
          'Ensure your API key has the correct permissions'
        ],
        debug: {
          companyId,
          verifiedUserId,
          experienceId
        }
      }, { status: 404 })
    }

    // CRITICAL: Clear existing Whop-synced subscribers for this user first
    // This ensures we don't have stale data and maintain proper isolation
    console.log('🧹 Clearing existing Whop-synced subscribers for user:', user.id)
    const { error: deleteError } = await supabaseAdmin
      .from('subscribers')
      .delete()
      .eq('user_id', user.id)
      .eq('source', 'whop_sync')

    if (deleteError) {
      console.error('Error clearing existing subscribers:', deleteError)
      return Response.json({ 
        success: false, 
        error: 'Failed to clear existing subscribers' 
      }, { status: 500 })
    }

    // Sync new members to database with proper user isolation
    let syncedCount = 0
    const syncErrors = []
    const currentTime = new Date().toISOString()

    console.log(`📥 Syncing ${realMembers.length} members to database...`)

    for (const member of realMembers) {
      try {
        // Insert new subscriber with proper user isolation
        const { error } = await supabaseAdmin
          .from('subscribers')
          .insert({
            user_id: user.id, // CRITICAL: This ensures user isolation
            whop_member_id: member.whop_member_id,
            email: member.email,
            name: member.name,
            tier: member.tier,
            status: member.status,
            synced_at: currentTime,
            source: 'whop_sync',
            created_at: currentTime
          })

        if (!error) {
          syncedCount++
        } else {
          syncErrors.push({ member: member.name, error: error.message })
          console.error('Error inserting member:', member.name, error)
        }
      } catch (memberError) {
        syncErrors.push({ member: member.name, error: memberError.message })
        console.error('Error processing member:', member.name, memberError)
      }
    }

    console.log(`✅ Successfully synced ${syncedCount}/${realMembers.length} members`)

    // Update user's last sync time
    await supabaseAdmin
      .from('users')
      .update({ updated_at: currentTime })
      .eq('id', user.id)

    return Response.json({
      success: true,
      message: `Successfully synced ${syncedCount} members from your Whop community!`,
      count: syncedCount,
      total_found: realMembers.length,
      members: realMembers.map(m => ({ 
        name: m.name, 
        email: m.email, 
        tier: m.tier,
        status: m.status 
      })),
      source: 'whop_official_api',
      user_id: user.id,
      sync_errors: syncErrors.length > 0 ? syncErrors : undefined,
      timestamp: currentTime
    })

  } catch (error) {
    console.error('=== OPTIMIZED SYNC MEMBERS CRITICAL ERROR ===', error)
    return Response.json({
      success: false,
      error: 'Critical error in sync process',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
