export async function GET() {
  try {
    console.log('=== WHOP CONFIGURATION TEST ===')
    
    // Check environment variables
    const config = {
      NEXT_PUBLIC_WHOP_APP_ID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
      WHOP_API_KEY: process.env.WHOP_API_KEY ? 'Set (hidden)' : 'Missing',
      NEXT_PUBLIC_WHOP_COMPANY_ID: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      NEXT_PUBLIC_WHOP_AGENT_USER_ID: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID
    }
    
    console.log('Configuration:', config)
    
    // Test API key with a simple request
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    const apiKey = process.env.WHOP_API_KEY
    
    if (!companyId || !apiKey) {
      return Response.json({
        success: false,
        error: 'Missing environment variables',
        config,
        fix: 'Set all required environment variables in .env.local'
      })
    }
    
    // Test API access
    try {
      const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return Response.json({
          success: true,
          message: '✅ Whop API configuration is working!',
          config,
          company: {
            id: data.id,
            name: data.name,
            status: 'Active'
          }
        })
      } else {
        const errorData = await response.json()
        return Response.json({
          success: false,
          error: `API Error: ${response.status}`,
          details: errorData,
          config,
          fix: response.status === 403 ? 
            'Check your Whop app permissions in dashboard' : 
            'Check your API key and Company ID'
        })
      }
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Failed to connect to Whop API',
        details: error.message,
        config,
        fix: 'Check your internet connection and API key'
      })
    }
    
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Configuration test failed',
      details: error.message
    })
  }
}
