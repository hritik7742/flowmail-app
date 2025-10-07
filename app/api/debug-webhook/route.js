// Debug webhook endpoint to check what's happening
export async function GET() {
  return new Response(JSON.stringify({
    message: "🔍 Webhook Debug Information",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    
    // Check environment variables
    env_check: {
      webhook_secret: process.env.WHOP_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing",
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
      supabase_service_key: process.env.SUPABASE_SERVICE_KEY ? "✅ Set" : "❌ Missing",
      whop_app_id: process.env.NEXT_PUBLIC_WHOP_APP_ID ? "✅ Set" : "❌ Missing",
      whop_api_key: process.env.WHOP_API_KEY ? "✅ Set" : "❌ Missing",
      starter_plan_id: process.env.WHOP_STARTER_PLAN_ID ? "✅ Set" : "❌ Missing",
      growth_plan_id: process.env.WHOP_GROWTH_PLAN_ID ? "✅ Set" : "❌ Missing",
      pro_plan_id: process.env.WHOP_PRO_PLAN_ID ? "✅ Set" : "❌ Missing"
    },
    
    // Webhook URLs
    webhook_url: "https://flowmail-app-gamma.vercel.app/api/webhooks",
    test_url: "https://flowmail-app-gamma.vercel.app/api/test-webhook",
    
    // Instructions
    instructions: [
      "1. Check if all environment variables are set ✅",
      "2. Verify webhook URL in Whop dashboard",
      "3. Test webhook with mock data",
      "4. Check Vercel function logs",
      "5. Verify database connection"
    ]
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
    
    console.log('=== WEBHOOK DEBUG RECEIVED ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Body:', JSON.stringify(body, null, 2));
    
    // Test database connection
    const { supabaseAdmin } = await import('@/lib/supabase');
    
    // Try to get user data
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .limit(5);
    
    return new Response(JSON.stringify({
      message: "Webhook debug received successfully",
      received_data: body,
      database_test: {
        users_found: users?.length || 0,
        database_error: error?.message || null,
        sample_users: users?.slice(0, 2) || []
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Debug webhook error:', error);
    return new Response(JSON.stringify({
      error: "Failed to process debug webhook",
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
