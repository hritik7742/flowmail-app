export async function GET() {
  try {
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    const apiKey = process.env.WHOP_API_KEY
    
    console.log('=== SIMPLE WHOP TEST ===')
    console.log('Company ID:', companyId)
    console.log('API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'Missing')
    
    if (!companyId || !apiKey) {
      return Response.json({
        success: false,
        error: 'Missing environment variables',
        companyId: !!companyId,
        apiKey: !!apiKey
      })
    }
    
    // Simple test - just try to get company info
    const response = await fetch(`https://api.whop.com/api/v2/companies/${companyId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      return Response.json({
        success: true,
        message: '✅ API key is working!',
        company: {
          id: data.id,
          name: data.name,
          status: data.status
        },
        nextStep: 'Now test memberships endpoint'
      })
    } else {
      return Response.json({
        success: false,
        error: `API Error: ${response.status}`,
        details: data,
        suggestions: [
          'Check if your API key is correct',
          'Verify your Company ID is correct',
          'Make sure your Whop app is active'
        ]
      })
    }
    
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Test failed',
      details: error.message
    })
  }
}
