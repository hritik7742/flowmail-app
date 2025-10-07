// Test webhook setup and environment variables
export async function GET() {
  const envCheck = {
    webhook_secret: process.env.WHOP_WEBHOOK_SECRET ? "✅ Set" : "❌ Missing",
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing",
    supabase_service_key: process.env.SUPABASE_SERVICE_KEY ? "✅ Set" : "❌ Missing",
    whop_app_id: process.env.NEXT_PUBLIC_WHOP_APP_ID ? "✅ Set" : "❌ Missing",
    whop_api_key: process.env.WHOP_API_KEY ? "✅ Set" : "❌ Missing",
    starter_plan_id: process.env.WHOP_STARTER_PLAN_ID ? "✅ Set" : "❌ Missing",
    growth_plan_id: process.env.WHOP_GROWTH_PLAN_ID ? "✅ Set" : "❌ Missing",
    pro_plan_id: process.env.WHOP_PRO_PLAN_ID ? "✅ Set" : "❌ Missing"
  };

  return new Response(JSON.stringify({
    message: "🔧 FlowMail Webhook Setup Check",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    webhook_url: "https://flowmail-app-gamma.vercel.app/api/webhooks",
    test_url: "https://flowmail-app-gamma.vercel.app/api/test-webhook",
    environment_variables: envCheck,
    status: Object.values(envCheck).every(v => v.includes("✅")) ? "✅ Ready" : "❌ Missing Variables"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
