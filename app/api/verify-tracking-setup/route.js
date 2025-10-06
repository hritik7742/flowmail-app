import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('=== VERIFYING EMAIL TRACKING SETUP ===')

    const checks = {
      environment: {},
      database: {},
      webhook: {},
      overall: { status: 'unknown', issues: [] }
    }

    // Check 1: Environment Variables
    checks.environment = {
      resend_api_key: !!process.env.RESEND_API_KEY,
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_service_key: !!process.env.SUPABASE_SERVICE_KEY,
      nextauth_url: !!process.env.NEXTAUTH_URL
    }

    // Check 2: Database Schema
    try {
      // Check if email_events table exists with correct columns
      const { data: emailEventsColumns } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'email_events')

      const requiredColumns = ['id', 'campaign_id', 'event_type', 'email_id', 'recipient_email', 'created_at']
      const existingColumns = emailEventsColumns?.map(col => col.column_name) || []
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))

      checks.database.email_events_table = existingColumns.length > 0
      checks.database.required_columns = missingColumns.length === 0
      checks.database.missing_columns = missingColumns

      // Check if campaigns table has tracking columns
      const { data: campaignsColumns } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'campaigns')

      const campaignColumns = campaignsColumns?.map(col => col.column_name) || []
      checks.database.campaigns_tracking = campaignColumns.includes('clicks')

      // Test database connection
      const { data: testQuery } = await supabaseAdmin
        .from('email_events')
        .select('id')
        .limit(1)

      checks.database.connection = true
      checks.database.can_query = testQuery !== null

    } catch (dbError) {
      checks.database.connection = false
      checks.database.error = dbError.message
    }

    // Check 3: Webhook Endpoint
    try {
      const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/resend`
      
      // Test if webhook endpoint is accessible
      const testData = {
        type: 'email.opened',
        data: {
          email_id: 'verification_test',
          to: ['test@example.com'],
          created_at: new Date().toISOString()
        }
      }

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      })

      checks.webhook.endpoint_accessible = webhookResponse.ok
      checks.webhook.endpoint_url = webhookUrl
      checks.webhook.response_status = webhookResponse.status

    } catch (webhookError) {
      checks.webhook.endpoint_accessible = false
      checks.webhook.error = webhookError.message
    }

    // Overall Assessment
    const issues = []
    
    if (!checks.environment.resend_api_key) issues.push('RESEND_API_KEY not configured')
    if (!checks.environment.supabase_url) issues.push('NEXT_PUBLIC_SUPABASE_URL not configured')
    if (!checks.environment.supabase_service_key) issues.push('SUPABASE_SERVICE_KEY not configured')
    if (!checks.environment.nextauth_url) issues.push('NEXTAUTH_URL not configured')
    
    if (!checks.database.connection) issues.push('Cannot connect to database')
    if (!checks.database.email_events_table) issues.push('email_events table missing')
    if (!checks.database.required_columns) issues.push(`Missing database columns: ${checks.database.missing_columns?.join(', ')}`)
    if (!checks.database.campaigns_tracking) issues.push('campaigns table missing tracking columns')
    
    if (!checks.webhook.endpoint_accessible) issues.push('Webhook endpoint not accessible')

    checks.overall.issues = issues
    checks.overall.status = issues.length === 0 ? 'ready' : 'needs_setup'

    // Recommendations
    const recommendations = []
    if (issues.length === 0) {
      recommendations.push('✅ Setup looks good! Test by sending a campaign and opening the email.')
      recommendations.push('📊 Check your analytics dashboard for open rate updates.')
      recommendations.push('🔗 Configure Resend webhook in dashboard if not done already.')
    } else {
      recommendations.push('❌ Setup incomplete. Please address the issues listed above.')
      recommendations.push('📖 Refer to RESEND-WEBHOOK-SETUP-COMPLETE.md for detailed instructions.')
      if (checks.database.missing_columns?.length > 0) {
        recommendations.push('🗄️ Run fix-email-tracking-schema.sql in Supabase SQL Editor.')
      }
    }

    return Response.json({
      success: true,
      status: checks.overall.status,
      checks,
      issues,
      recommendations,
      setup_complete: issues.length === 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error verifying setup:', error)
    return Response.json({
      success: false,
      error: error.message,
      status: 'error'
    }, { status: 500 })
  }
}

export async function POST() {
  // Alias for GET request
  return GET()
}