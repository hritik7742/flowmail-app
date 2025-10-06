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

    const cleanDomain = customDomain.toLowerCase().trim()

    // Register domain with Resend
    const resendResponse = await fetch('https://api.resend.com/domains', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: cleanDomain,
        region: 'us-east-1' // or your preferred region
      })
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.json()
      return NextResponse.json({
        success: false,
        error: `Failed to register domain with Resend: ${error.message}`
      }, { status: 400 })
    }

    const domainData = await resendResponse.json()

    // Save domain data to database
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .update({
        custom_domain: cleanDomain,
        resend_domain_id: domainData.id,
        domain_dns_records: domainData.records, // Save the actual DNS records
        domain_verified: false
      })
      .eq('whop_user_id', whopUserId)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        success: false,
        error: 'Failed to save domain configuration'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      domain: domainData,
      message: 'Domain registered successfully. Please add the DNS records.'
    })

  } catch (error) {
    console.error('Domain registration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}