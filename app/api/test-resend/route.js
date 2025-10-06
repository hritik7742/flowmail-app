import { sendEmail } from '@/lib/resend'

export async function POST(request) {
  try {
    const { testEmail } = await request.json()
    
    if (!testEmail) {
      return Response.json({ success: false, error: 'Test email address required' }, { status: 400 })
    }

    console.log('=== TESTING RESEND CONFIGURATION ===')
    console.log('Test email:', testEmail)
    console.log('Resend API key:', process.env.RESEND_API_KEY ? 'Set' : 'Missing')

    // Test email content
    const testHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #333;">🧪 Resend Test Email</h1>
        <p>This is a test email to verify Resend configuration.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> FlowMail Test</p>
        <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Configuration Check:</strong></p>
          <ul>
            <li>Resend API Key: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}</li>
            <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
          </ul>
        </div>
        <p>If you received this email, Resend is working correctly!</p>
      </div>
    `

    const result = await sendEmail({
      to: testEmail,
      subject: '🧪 FlowMail Resend Test',
      html: testHtml,
    })

    if (result.success) {
      return Response.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}!`,
        emailId: result.data?.id,
        debug: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          environment: process.env.NODE_ENV
        }
      })
    } else {
      return Response.json({
        success: false,
        error: 'Failed to send test email',
        details: result.error,
        debug: {
          hasApiKey: !!process.env.RESEND_API_KEY,
          environment: process.env.NODE_ENV
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Test Resend error:', error)
    return Response.json({
      success: false,
      error: error.message,
      debug: {
        hasApiKey: !!process.env.RESEND_API_KEY,
        environment: process.env.NODE_ENV
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({
    message: 'Resend Test Endpoint',
    instructions: 'Send POST request with { "testEmail": "your@email.com" }',
    configuration: {
      hasApiKey: !!process.env.RESEND_API_KEY,
      environment: process.env.NODE_ENV
    }
  })
}