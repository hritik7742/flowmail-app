export async function GET() {
  try {
    // Test environment variables
    const envCheck = {
      WHOP_API_KEY: process.env.WHOP_API_KEY ? 'Set' : 'Missing',
      WHOP_CLIENT_ID: process.env.WHOP_CLIENT_ID ? 'Set' : 'Missing',
      WHOP_CLIENT_SECRET: process.env.WHOP_CLIENT_SECRET ? 'Set' : 'Missing',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set' : 'Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
    }

    // Test Whop API connection
    let whopTest = 'Not tested'
    try {
      const response = await fetch('https://api.whop.com/api/v2/me', {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        whopTest = `Success - User: ${data.name || data.username || 'Unknown'}`
      } else {
        whopTest = `Failed - Status: ${response.status}`
      }
    } catch (error) {
      whopTest = `Error: ${error.message}`
    }

    return Response.json({
      success: true,
      environment: envCheck,
      whopApiTest: whopTest,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}