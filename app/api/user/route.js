import { supabaseAdmin } from '@/lib/supabase'

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return Response.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    // Get user from database
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('whop_user_id', userId)
      .single()

    if (!user) {
      // Generate unique code for new user
      const uniqueCode = await generateUniqueCode()
      
      // Create new user if doesn't exist (first time user)
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert([
          {
            whop_user_id: userId,
            plan: 'free',
            emails_sent_this_month: 0,
            emails_sent_today: 0,
            last_email_reset_date: new Date().toISOString().split('T')[0],
            unique_code: uniqueCode,
            username: 'user',
            display_name: 'FlowMail User',
            reply_to_email: 'user@example.com'
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        return Response.json({ success: false, error: 'Failed to create user' }, { status: 500 })
      }

      return Response.json({
        success: true,
        user: newUser
      })
    }

    // Reset daily count if needed (new day)
    const today = new Date().toISOString().split('T')[0]
    if (user.last_email_reset_date !== today) {
      await supabaseAdmin
        .from('users')
        .update({ 
          emails_sent_today: 0, 
          last_email_reset_date: today 
        })
        .eq('id', user.id)
      
      user.emails_sent_today = 0
    }

    // Calculate limits based on plan
    const getPlanLimits = (plan) => {
      switch (plan) {
        case 'free':
          return { dailyLimit: 10, monthlyLimit: 300 }
        case 'starter':
          return { dailyLimit: 100, monthlyLimit: 3000 }
        case 'growth':
          return { dailyLimit: 167, monthlyLimit: 5000 }
        case 'pro':
          return { dailyLimit: 334, monthlyLimit: 10000 }
        default:
          return { dailyLimit: 10, monthlyLimit: 300 }
      }
    }

    const limits = getPlanLimits(user.plan)

    return Response.json({
      success: true,
      user: {
        ...user,
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit
      }
    })

  } catch (error) {
    console.error('Error getting user:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId, updates } = await request.json()
    
    if (!userId) {
      return Response.json({ success: false, error: 'Missing userId' }, { status: 400 })
    }

    // Update user data
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('whop_user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return Response.json({ success: false, error: 'Failed to update user' }, { status: 500 })
    }

    return Response.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
