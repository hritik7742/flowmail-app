export async function POST(request) {
  try {
    console.log('=== TESTING RESEND WEBHOOK ENDPOINT ===')
    
    // Test data that mimics a real Resend webhook
    const testWebhookData = {
      type: 'email.opened',
      data: {
        email_id: 'test_email_' + Date.now(),
        to: ['test@example.com'],
        subject: 'Test Email Subject',
        created_at: new Date().toISOString(),
        tags: [
          { name: 'campaign_id', value: 'test_campaign_123' },
          { name: 'source', value: 'flowmail-app' }
        ]
      }
    }

    console.log('Sending test webhook data:', JSON.stringify(testWebhookData, null, 2))

    // Call our webhook endpoint
    const webhookUrl = `${process.env.NEXTAUTH_URL}/api/webhooks/resend`
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testWebhookData)
    })

    const result = await response.json()

    console.log('Webhook response:', result)
    console.log('Webhook status:', response.status)

    if (response.ok) {
      return Response.json({
        success: true,
        message: 'Webhook test successful',
        webhook_response: result,
        test_data: testWebhookData
      })
    } else {
      return Response.json({
        success: false,
        error: 'Webhook test failed',
        webhook_response: result,
        status: response.status
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error testing webhook:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({
    message: 'Resend Webhook Test Endpoint',
    usage: 'Send a POST request to test the webhook functionality',
    webhook_url: `${process.env.NEXTAUTH_URL}/api/webhooks/resend`
  })
}