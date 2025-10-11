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

    if (!experienceId) {
      return Response.json({ success: false, error: 'Experience ID required' }, { status: 400 })
    }

    console.log('=== DYNAMIC SYNC MEMBERS - EACH USER FROM THEIR COMPANY ===')
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
      .eq('whop_user_id', verifiedUserId)
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

    // CRITICAL: Get company ID from experience using whopSdk.experiences.getExperience()
    // This is how other apps do it - much more reliable than URL params
    let companyId = null
    
    try {
      console.log('=== Getting company ID from experience ===')
      
      // Ensure experienceId has the correct format with exp_ prefix
      const formattedExperienceId = experienceId.startsWith('exp_') ? experienceId : `exp_${experienceId}`
      console.log('Original experienceId:', experienceId)
      console.log('Formatted experienceId:', formattedExperienceId)
      
      const experience = await whopSdk.experiences.getExperience({
        experienceId: formattedExperienceId
      })
      
      console.log('Experience data:', JSON.stringify(experience, null, 2))
      
      // Log the exact company object and ID details
      console.log('Company object:', experience.company)
      console.log('Company ID type:', typeof experience.company?.id)
      console.log('Company ID value:', experience.company?.id)
      
      if (experience?.company?.id) {
        // Ensure companyId is a string
        companyId = String(experience.company.id)
        console.log('✅ Found company ID from experience:', companyId)
        console.log('Company title:', experience.company.title)
        console.log('Company route:', experience.company.route)
      } else {
        console.error('❌ No company ID found in experience data')
        return Response.json({
          success: false,
          error: 'Could not get company ID from experience. Make sure the experience ID is correct.',
          code: 'NO_COMPANY_ID_FROM_EXPERIENCE'
        }, { status: 400 })
      }
      
    } catch (experienceError) {
      console.error('❌ Error getting experience:', experienceError)
      return Response.json({
        success: false,
        error: 'Failed to get experience data from Whop API',
        details: experienceError.message,
        code: 'EXPERIENCE_ERROR'
      }, { status: 500 })
    }

    console.log('🎯 Final Company ID for sync:', companyId)

    // CRITICAL: Use the withCompany function to set the company context dynamically
    let realMembers = []

    try {
      console.log('=== Using listMemberships() with direct companyId parameter ===')
      
      // Pass companyId directly to listMemberships() - this is the correct way
      const result = await whopSdk.companies.listMemberships({
        companyId: companyId,  // Pass it directly here
        filters: {
          membershipStatus: "active"
        },
        first: 100
      })

      console.log('Whop SDK Response with dynamic company:', JSON.stringify(result, null, 2))

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
      
      console.log(`✅ Found ${realMembers.length} valid members from Whop SDK with direct companyId parameter`)
      
      if (realMembers.length > 0) {
        console.log('Sample member data:', realMembers[0])
      }

    } catch (sdkError) {
      console.error('❌ Whop SDK Error with direct companyId:', sdkError)
      
      return Response.json({
        success: false,
        error: 'Failed to fetch members from Whop API with direct companyId parameter',
        details: sdkError.message,
        suggestions: [
          'Check your Whop app permissions',
          'Verify the company ID is correct',
          'Make sure you have active members in your community',
          'Try refreshing the page and syncing again'
        ]
      }, { status: 500 })
    }

    // If no real members found, return helpful error
    if (realMembers.length === 0) {
      return Response.json({
        success: false,
        error: 'No active members found in your Whop community',
        suggestions: [
          'Make sure your Whop community has active paying members',
          'Check that members have completed their purchases',
          'Verify your company ID is correct',
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
      source: 'whop_direct_company_id',
      user_id: user.id,
      user_whop_id: user.whop_user_id,
      company_id_used: companyId,
      sync_errors: syncErrors.length > 0 ? syncErrors : undefined,
      timestamp: currentTime
    })

  } catch (error) {
    console.error('=== DYNAMIC SYNC MEMBERS CRITICAL ERROR ===', error)
    return Response.json({
      success: false,
      error: 'Critical error in sync process',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
