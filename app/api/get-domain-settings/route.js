import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { whopUserId } = await request.json()

    if (!whopUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      )
    }

    // Get user's domain settings
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('custom_domain, resend_domain_id, domain_dns_records, domain_verified, domain_verified_at, unique_code, username, display_name, reply_to_email')
      .eq('whop_user_id', whopUserId)
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch domain settings'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userData,
        uniqueCode: userData.unique_code,
        displayName: userData.display_name,
        username: userData.username,
        replyToEmail: userData.reply_to_email
      }
    })

  } catch (error) {
    console.error('Get domain settings error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}