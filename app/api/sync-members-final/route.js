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

    console.log('=== FINAL SYNC MEMBERS - CORRECT WHOP API USAGE ===')
    console.log('User ID:', userId)
    console.log('Experience ID:', experienceId)

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

    // CRITICAL: Get the company ID from the authenticated user, not environment variables
    // This ensures each user syncs from THEIR company, not a fixed company
    let companyId
    
    try {
      // Get the user's company information from Whop
      const userInfo = await whopSdk.users.getCurrentUser()
      console.log('User info from Whop:', JSON.stringify(userInfo, null, 2))
      
      // Extract company ID from user info
      if (userInfo?.company?.id) {
        companyId = userInfo.company.id
        console.log('✅ Using user\'s company ID:', companyId)
      } else if (userInfo?.companies && userInfo.companies.length > 0) {
        // If user has multiple companies, use the first one
        companyId = userInfo.companies[0].id
        console.log('✅ Using user\'s first company ID:', companyId)
      } else {
        // Fallback: try to get company from user's memberships
        const memberships = await whopSdk.users.getMemberships()
        if (memberships && memberships.length > 0) {
          companyId = memberships[0].companyId
          console.log('✅ Using company ID from user\'s membership:', companyId)
        }
      }
    } catch (userError) {
      console.error('Error getting user company info:', userError)
      return Response.json({
        success: false,
        error: 'Failed to get user company information',
        details: userError.message,
        code: 'COMPANY_INFO_ERROR'
      }, { status: 500 })
    }

    if (!companyId) {
      return Response.json({
        success: false,
        error: 'Could not determine user\'s company ID. Make sure you are accessing this from within a Whop community.',
        code: 'NO_COMPANY_ID'
      }, { status: 400 })
    }

    console.log('🎯 Final Company ID for sync:', companyId)

    // FIXED: Use the correct Whop SDK method for getting memberships
    let realMembers = []

    try {
      console.log('=== Using CORRECT Whop SDK Method ===')
      
      // According to Whop docs, use the correct method
      const result = await whopSdk.companies.listMemberships({
        companyId: companyId,
        filters: {
          membershipStatus: "active"
        },
        first: 100
      })

      console.log('Whop SDK Response:', JSON.stringify(result, null, 2))

      // Process the response - check different possible structures
      let memberships = []
      
      if (result?.memberships?.nodes) {
        memberships = result.memberships.nodes
        console.log('Found memberships in nodes structure')
      } else if (result?.memberships?.edges) {
        memberships = result.memberships.edges.map(edge => edge.node)
        console.log('Found memberships in edges structure')
      } else if (result?.data) {
        memberships = result.data
        console.log('Found memberships in data structure')
      } else if (Array.isArray(result)) {
        memberships = result
        console.log('Found memberships as direct array')
      } else {
        console.log('No memberships found in response')
        console.log('Response keys:', Object.keys(result || {}))
      }

      console.log(`Found ${memberships.length} total memberships`)

      // Filter and process valid memberships
      const validMemberships = memberships.filter(membership => {
        const member = membership.member || membership.user
        return member && member.email && (member.name || member.username) && membership.id
      })

      realMembers = validMemberships.map(membership => {
        const member = membership.member || membership.user
        return {
          whop_member_id: membership.id,
          email: member.email.toLowerCase().trim(),
          name: member.name || member.username || 'Unknown',
          tier: membership.accessPass?.title || membership.plan?.name || membership.tier || 'Member',
          status: membership.status === 'completed' || membership.status === 'active' ? 'active' : 'inactive',
        }
      })
      
      console.log(`✅ Found ${realMembers.length} valid members from Whop SDK`)
      
      if (realMembers.length > 0) {
        console.log('Sample member data:', realMembers[0])
      }

    } catch (sdkError) {
      console.error('❌ Whop SDK Error:', sdkError)
      
      // Fallback: Try alternative SDK methods
      try {
        console.log('=== Fallback: Trying alternative SDK method ===')
        
        // Try without filters
        const result2 = await whopSdk.companies.listMemberships({
          companyId: companyId,
          first: 100
        })
        
        console.log('Fallback SDK Response:', JSON.stringify(result2, null, 2))
        
        // Process fallback response
        let memberships = []
        if (result2?.memberships?.nodes) {
          memberships = result2.memberships.nodes
        } else if (result2?.memberships?.edges) {
          memberships = result2.memberships.edges.map(edge => edge.node)
        } else if (result2?.data) {
          memberships = result2.data
        } else if (Array.isArray(result2)) {
          memberships = result2
        }

        const validMemberships = memberships.filter(membership => {
          const member = membership.member || membership.user
          return member && member.email && (member.name || member.username) && membership.id
        })

        realMembers = validMemberships.map(membership => {
          const member = membership.member || membership.user
          return {
            whop_member_id: membership.id,
            email: member.email.toLowerCase().trim(),
            name: member.name || member.username || 'Unknown',
            tier: membership.accessPass?.title || membership.plan?.name || membership.tier || 'Member',
            status: membership.status === 'completed' || membership.status === 'active' ? 'active' : 'inactive',
          }
        })
        
        console.log(`✅ Found ${realMembers.length} valid members via fallback SDK method`)
        
      } catch (fallbackError) {
        console.error('❌ Fallback SDK Error:', fallbackError)
        
        return Response.json({
          success: false,
          error: 'Failed to fetch members from Whop API',
          details: fallbackError.message,
          suggestions: [
            'Check your Whop app permissions',
            'Verify your Company ID is correct',
            'Make sure you have active members in your community',
            'Try refreshing the page and syncing again'
          ]
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

    // Sync new members to database with perfect user isolation
    let syncedCount = 0
    const syncErrors = []
    const currentTime = new Date().toISOString()

    console.log(`📥 Syncing ${realMembers.length} members to database for user ${user.id}...`)

    for (const member of realMembers) {
      try {
        // Insert new subscriber with perfect user isolation
        const { error } = await supabaseAdmin
          .from('subscribers')
          .insert({
            user_id: user.id, // CRITICAL: This ensures perfect user isolation
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

    console.log(`✅ Successfully synced ${syncedCount}/${realMembers.length} members for user ${user.id}`)

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
      user_whop_id: user.whop_user_id,
      sync_errors: syncErrors.length > 0 ? syncErrors : undefined,
      timestamp: currentTime
    })

  } catch (error) {
    console.error('=== FINAL SYNC MEMBERS CRITICAL ERROR ===', error)
    return Response.json({
      success: false,
      error: 'Critical error in sync process',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
