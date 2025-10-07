// Test webhook endpoint to debug webhook issues
export async function GET() {
  return new Response(JSON.stringify({
    message: "Webhook test endpoint is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    webhook_secret: process.env.WHOP_WEBHOOK_SECRET ? "Set" : "Not set",
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
    whop_app_id: process.env.NEXT_PUBLIC_WHOP_APP_ID ? "Set" : "Not set"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('=== TEST WEBHOOK RECEIVED ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));
    
    return new Response(JSON.stringify({
      message: "Test webhook received successfully",
      received_data: body,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    return new Response(JSON.stringify({
      error: "Failed to process test webhook",
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
