import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { whopUserId, customDomain } = await request.json()

    if (!whopUserId || !customDomain) {
      return NextResponse.json(
        { success: false, error: 'User ID and domain required' },
        { status: 400 }
      )
    }

    // Get domain ID from database
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('resend_domain_id, domain_dns_records')
      .eq('whop_user_id', whopUserId)
      .single()

    if (dbError || !userData?.resend_domain_id) {
      return NextResponse.json({
        success: false,
        error: 'Domain not registered. Please add domain first.'
      }, { status: 400 })
    }

    // Verify domain with Resend API
    const resendResponse = await fetch(
      `https://api.resend.com/domains/${userData.resend_domain_id}/verify`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!resendResponse.ok) {
      const error = await resendResponse.json()
      return NextResponse.json({
        success: false,
        error: `Verification failed: ${error.message}`
      }, { status: 400 })
    }

    const verificationData = await resendResponse.json()

    // Check verification status
    const allVerified = verificationData.records?.every(record => record.status === 'verified')

    if (allVerified) {
      // Update database
      await supabaseAdmin
        .from('users')
        .update({
          domain_verified: true,
          domain_verified_at: new Date().toISOString()
        })
        .eq('whop_user_id', whopUserId)
    }

    return NextResponse.json({
      success: true,
      verified: allVerified,
      verification: verificationData,
      message: allVerified 
        ? 'Domain verified successfully!'
        : 'Some DNS records are not configured correctly.'
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}