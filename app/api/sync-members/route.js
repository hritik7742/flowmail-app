import { supabaseAdmin } from '@/lib/supabase'
import { whopSdk } from '@/lib/whop-sdk'

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

    console.log('=== SYNC MEMBERS V1 - FALLBACK WITH TEST DATA ===')
    console.log('User ID:', userId)
    console.log('Experience ID:', experienceId)

    // First, ensure user exists in our database with unique code
    let user
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('whop_user_id', userId)
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
          .eq('whop_user_id', userId)
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
          whop_user_id: userId,
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

    let syncedCount = 0
    let realMembers = []

    // Try to get real members first
    try {
      console.log('Attempting to get real members from Whop...')

      const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
      console.log('Using company ID:', companyId)

      if (companyId) {
        // Try the correct Whop API method
        const result = await whopSdk.companies.listMemberships({
          companyId: companyId,
          filters: {
            membershipStatus: "active"
          },
          pagination: {
            first: 10
          }
        })

        if (result?.memberships?.nodes?.length > 0) {
          // Filter out memberships without real member data
          const validMemberships = result.memberships.nodes.filter(membership => {
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

          console.log(`Found ${realMembers.length} real members (filtered from ${result.memberships.nodes.length} total)!`)

          const filteredOut = result.memberships.nodes.length - validMemberships.length
          if (filteredOut > 0) {
            console.log(`Filtered out ${filteredOut} incomplete memberships`)
          }
        }
      }

    } catch (whopError) {
      console.error('Whop API error:', whopError.message)
    }

    // If no real members found, create realistic test data for development
    if (realMembers.length === 0) {
      console.log('No real members found, creating test data for development...')

      realMembers = [
        {
          whop_member_id: `test_${Date.now()}_1`,
          email: 'john.doe@gmail.com',
          name: 'John Doe',
          tier: 'Premium',
          status: 'active'
        },
        {
          whop_member_id: `test_${Date.now()}_2`,
          email: 'jane.smith@gmail.com',
          name: 'Jane Smith',
          tier: 'Basic',
          status: 'active'
        },
        {
          whop_member_id: `test_${Date.now()}_3`,
          email: 'mike.wilson@gmail.com',
          name: 'Mike Wilson',
          tier: 'VIP',
          status: 'active'
        },
        {
          whop_member_id: `test_${Date.now()}_4`,
          email: 'sarah.johnson@gmail.com',
          name: 'Sarah Johnson',
          tier: 'Pro',
          status: 'active'
        },
        {
          whop_member_id: `test_${Date.now()}_5`,
          email: 'alex.brown@gmail.com',
          name: 'Alex Brown',
          tier: 'Basic',
          status: 'active'
        }
      ]
    }

    // Sync each member to database
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
            console.error('Error updating member:', error)
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
            console.error('Error inserting member:', error)
          }
        }
      } catch (memberError) {
        console.error('Error processing member:', member.name, memberError)
      }
    }

    const isTestData = realMembers.length > 0 && realMembers[0].whop_member_id.includes('test_')
    const source = isTestData ? 'test_data' : 'whop_api'

    return Response.json({
      success: true,
      message: `Synced ${syncedCount} members successfully${isTestData ? ' (using test data for development)' : ' from your Whop community'}`,
      count: syncedCount,
      members: realMembers.map(m => ({ name: m.name, email: m.email, tier: m.tier })),
      source: source,
      note: isTestData ? 'This is test data. Use sync-members-v2 for real Whop members.' : 'Real members from Whop API'
    })

  } catch (error) {
    console.error('Error syncing members:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}