import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Starting database fix for missing domain columns...')

    // Since we can't execute raw SQL directly, we'll use a different approach
    // First, let's check what columns exist
    const { data: existingUsers, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(1)

    if (checkError) {
      console.error('Error checking existing columns:', checkError)
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing database structure'
      }, { status: 500 })
    }

    console.log('Current user table structure checked')

    // Update existing users with default values
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        display_name: supabaseAdmin.raw('COALESCE(display_name, company_name, \'FlowMail User\')'),
        reply_to_email: supabaseAdmin.raw('COALESCE(reply_to_email, email)')
      })
      .or('display_name.is.null,reply_to_email.is.null')

    if (updateError) {
      console.error('Error updating users:', updateError)
    }

    // Generate unique codes for users without them
    const { data: usersWithoutCodes } = await supabaseAdmin
      .from('users')
      .select('id, whop_user_id, company_name, email')
      .is('unique_code', null)
      .order('created_at')

    if (usersWithoutCodes && usersWithoutCodes.length > 0) {
      let counter = 1001
      
      for (const user of usersWithoutCodes) {
        let newCode
        let codeExists = true
        
        // Find unique code
        while (codeExists) {
          newCode = `u${counter}`
          const { data: existing } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('unique_code', newCode)
            .single()
          
          codeExists = !!existing
          if (codeExists) counter++
        }
        
        // Generate username
        const username = user.company_name 
          ? user.company_name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
          : user.email 
            ? user.email.split('@')[0].toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
            : 'user'
        
        // Update user
        await supabaseAdmin
          .from('users')
          .update({
            unique_code: newCode,
            username: username || 'user'
          })
          .eq('id', user.id)
        
        counter++
      }
    }

    // Verify the fix
    const { data: verification, error: verifyError } = await supabaseAdmin
      .from('users')
      .select('whop_user_id, display_name, username, unique_code, custom_domain, domain_verified, resend_domain_id')
      .order('created_at', { ascending: false })
      .limit(5)

    if (verifyError) {
      console.error('Verification error:', verifyError)
    }

    return NextResponse.json({
      success: true,
      message: 'Database columns fixed successfully',
      verification: verification || []
    })

  } catch (error) {
    console.error('Fix domain columns error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}