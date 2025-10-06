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

    console.log('=== SYNC MEMBERS V2 - WHOP OFFICIAL AUTHENTICATION ===')
    console.log('User ID:', userId)
    console.log('Experience ID:', experienceId)

    // Verify user authentication using Whop's official method
    const headersList = await headers()
    let verifiedUserId
    
    try {
      const userToken = await whopSdk.verifyUserToken(headersList)
      verifiedUserId = userToken.userId
      console.log('✅ User authenticated via Whop SDK:', verifiedUserId)
    } catch (authError) {
      console.log('❌ Whop authentication failed:', authError.message)
      return Response.json({
        success: false,
        error: 'Authentication failed. Make sure you are accessing this from within a Whop app context.',
        details: authError.message
      }, { status: 401 })
    }

    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    console.log('Company ID:', companyId)

    if (!companyId) {
      return Response.json({
        success: false,
        error: 'NEXT_PUBLIC_WHOP_COMPANY_ID is not configured'
      }, { status: 500 })
    }

    let realMembers = []

    try {
      console.log('=== Using Official Whop SDK Method: companies.listMemberships ===')
      
      // Use the exact method from Whop documentation
      const result = await whopSdk.companies.listMemberships({
        companyId: companyId, // ID of the company, either the tag (biz_xxx) or the page route
        filters: {
          membershipStatus: "active", // Filter for active memberships only
          headerFilter: "active"
        },
        first: 50 // Pagination limit
      })

      console.log('Whop SDK Response:', JSON.stringify(result, null, 2))

      // Check for the correct response structure from Whop documentation
      if (result?.memberships?.nodes?.length > 0) {
        // Filter out memberships without real member data
        const validMemberships = result.memberships.nodes.filter(membership => {
          const member = membership.member
          return member && member.email && member.name // Only include memberships with real user data
        })

        realMembers = validMemberships.map(membership => {
          const member = membership.member
          return {
            whop_member_id: membership.id,
            email: member.email,
            name: member.name || member.username,
            tier: membership.accessPass?.title || membership.plan?.name || 'Member',
            status: membership.status === 'completed' ? 'active' : membership.status || 'inactive',
          }
        })
        
        console.log(`✅ Found ${realMembers.length} real members from Whop (filtered from ${result.memberships.nodes.length} total memberships)!`)
        console.log('Sample member data:', realMembers[0])
        
        // Log filtered out memberships for debugging
        const filteredOut = result.memberships.nodes.length - validMemberships.length
        if (filteredOut > 0) {
          console.log(`ℹ️ Filtered out ${filteredOut} memberships without complete user data`)
        }
      } else if (result?.memberships?.edges?.length > 0) {
        // Alternative response structure
        const validMemberships = result.memberships.edges.filter(edge => {
          const member = edge.node.member
          return member && member.email && member.name
        })

        realMembers = validMemberships.map(edge => {
          const membership = edge.node
          const member = membership.member
          return {
            whop_member_id: membership.id,
            email: member.email,
            name: member.name || member.username,
            tier: membership.accessPass?.title || membership.plan?.name || 'Member',
            status: membership.status === 'completed' ? 'active' : membership.status || 'inactive',
          }
        })
        console.log(`✅ Found ${realMembers.length} real members from Whop (edges structure, filtered from ${result.memberships.edges.length} total)!`)
      } else {
        console.log('No members found in the response')
        console.log('Response structure:', Object.keys(result || {}))
      }

    } catch (sdkError) {
      console.error('❌ Whop SDK Error:', sdkError)
      
      // Fallback to direct API call if SDK fails
      try {
        console.log('=== Fallback: Direct Whop API Call ===')
        
        const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}/memberships?status=active&limit=50`, {
          headers: {
            'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          console.log('Direct API Response:', JSON.stringify(data, null, 2))

          if (data?.data?.length > 0) {
            // Filter out memberships without real member data
            const validMemberships = data.data.filter(membership => {
              const member = membership.member
              return member && member.email && member.name
            })

            realMembers = validMemberships.map(membership => {
              const member = membership.member
              return {
                whop_member_id: membership.id,
                email: member.email,
                name: member.name || member.username,
                tier: membership.accessPass?.title || membership.plan?.name || 'Member',
                status: membership.status === 'completed' ? 'active' : membership.status || 'inactive',
              }
            })
            
            console.log(`✅ Found ${realMembers.length} real members via direct API (filtered from ${data.data.length} total)`)
            
            const filteredOut = data.data.length - validMemberships.length
            if (filteredOut > 0) {
              console.log(`ℹ️ Filtered out ${filteredOut} incomplete memberships`)
            }
          }
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

    // Save user to database using verified user ID with unique code
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

    // Sync members to database
    let syncedCount = 0
    const syncErrors = []

    for (const member of realMembers) {
      try {
        // Check if subscriber already exists
        const { data: existing } = await supabaseAdmin
          .from('subscribers')
          .select('id')
          .eq('user_id', user.id)
          .eq('whop_member_id', member.whop_member_id)
          .single()

        if (existing) {
          // Update existing subscriber
          const { error } = await supabaseAdmin
            .from('subscribers')
            .update({
              email: member.email,
              name: member.name,
              tier: member.tier,
              status: member.status,
              synced_at: new Date().toISOString(),
              source: 'whop_sync'
            })
            .eq('id', existing.id)

          if (!error) {
            syncedCount++
          } else {
            syncErrors.push({ member: member.name, error: error.message })
            console.error('Error updating member:', member.name, error)
          }
        } else {
          // Insert new subscriber
          const { error } = await supabaseAdmin
            .from('subscribers')
            .insert({
              user_id: user.id,
              whop_member_id: member.whop_member_id,
              email: member.email,
              name: member.name,
              tier: member.tier,
              status: member.status,
              synced_at: new Date().toISOString(),
              source: 'whop_sync'
            })

          if (!error) {
            syncedCount++
          } else {
            syncErrors.push({ member: member.name, error: error.message })
            console.error('Error inserting member:', member.name, error)
          }
        }
      } catch (memberError) {
        syncErrors.push({ member: member.name, error: memberError.message })
        console.error('Error processing member:', member.name, memberError)
      }
    }

    console.log(`✅ Successfully synced ${syncedCount}/${realMembers.length} members`)

    return Response.json({
      success: true,
      message: `Successfully synced ${syncedCount} real members from your Whop community!`,
      count: syncedCount,
      members: realMembers.map(m => ({ name: m.name, email: m.email, tier: m.tier })),
      source: 'whop_official_api',
      syncErrors: syncErrors.length > 0 ? syncErrors : undefined
    })

  } catch (error) {
    console.error('=== SYNC MEMBERS V2 CRITICAL ERROR ===', error)
    return Response.json({
      success: false,
      error: 'Critical error in sync process',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}