import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('=== SETTING UP RESEND EVENTS TABLE ===')

    // Create resend_events table for storing webhook events
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS resend_events (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          event_type TEXT NOT NULL,
          email_id TEXT,
          recipient_email TEXT,
          subject TEXT,
          campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
          subscriber_id UUID REFERENCES subscribers(id) ON DELETE SET NULL,
          event_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_resend_events_email_id ON resend_events(email_id);
      CREATE INDEX IF NOT EXISTS idx_resend_events_campaign_id ON resend_events(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_resend_events_event_type ON resend_events(event_type);
    `

    // Execute the SQL
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      console.error('Error creating table:', error)
      return Response.json({
        success: false,
        error: 'Failed to create resend_events table',
        details: error.message,
        suggestion: 'Run this SQL manually in your Supabase SQL editor'
      })
    }

    console.log('✅ Resend events table created successfully')

    // Test the table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('resend_events')
      .select('*')
      .limit(1)

    if (testError) {
      console.error('Error testing table:', testError)
      return Response.json({
        success: false,
        error: 'Table created but not accessible',
        details: testError.message
      })
    }

    console.log('✅ Table is accessible')

    return Response.json({
      success: true,
      message: 'Resend events table created successfully',
      sql: createTableSQL,
      nextSteps: [
        'Table is ready to store Resend webhook events',
        'Set up webhooks in your Resend dashboard',
        'Point webhook URL to: /api/webhooks/resend'
      ]
    })

  } catch (error) {
    console.error('Setup error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}