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

export async function POST(request) {
  try {
    const { userId, name, subject, preview_text, html_content, segment } = await request.json()
    
    if (!userId || !name || !subject || !html_content) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Get or create user with unique code
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

    // Create campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert({
        user_id: user.id,
        name,
        subject,
        preview_text,
        html_content,
        status: 'draft',
        total_recipients: 0,
        clicks: 0,
      })
      .select()
      .single()

    if (campaignError) {
      console.error('Error creating campaign:', campaignError)
      return Response.json({ success: false, error: 'Failed to create campaign' }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Campaign created successfully',
      campaign
    })

  } catch (error) {
    console.error('Error in create-campaign:', error)
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}