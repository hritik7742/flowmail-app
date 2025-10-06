import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request) {
  try {
    console.log('🔧 Setting up domain columns...')

    // Add columns for Resend domain integration
    const queries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS resend_domain_id TEXT;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS domain_dns_records JSONB;',
      'CREATE INDEX IF NOT EXISTS idx_users_resend_domain_id ON users(resend_domain_id);',
      'CREATE INDEX IF NOT EXISTS idx_users_custom_domain ON users(custom_domain);'
    ]

    for (const query of queries) {
      console.log('Executing:', query)
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query })
      if (error) {
        console.error('SQL Error:', error)
        // Continue with other queries even if one fails
      }
    }

    // Update any existing domains to have null resend_domain_id (they'll need to re-register)
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        resend_domain_id: null, 
        domain_dns_records: null, 
        domain_verified: false 
      })
      .not('custom_domain', 'is', null)
      .is('resend_domain_id', null)

    if (updateError) {
      console.error('Update error:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Domain columns setup completed successfully'
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}