export async function GET() {
  try {
    const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    const apiKey = process.env.WHOP_API_KEY
    
    console.log('Testing Whop API connection...')
    console.log('Company ID:', companyId ? 'Set' : 'Missing')
    console.log('API Key:', apiKey ? 'Set' : 'Missing')
    
    if (!companyId || !apiKey) {
      return Response.json({
        success: false,
        error: 'Missing Whop API credentials',
        details: {
          companyId: companyId ? 'Set' : 'Missing',
          apiKey: apiKey ? 'Set' : 'Missing'
        }
      })
    }

    // Test API connection
    const response = await fetch(`https://api.whop.com/api/v2/memberships?company_id=${companyId}&limit=5`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    console.log('Whop API response status:', response.status)
    console.log('Whop API response:', responseText)

    if (response.ok) {
      const data = JSON.parse(responseText)
      return Response.json({
        success: true,
        message: 'Whop API connection successful',
        memberCount: data.data ? data.data.length : 0,
        sampleMembers: data.data ? data.data.slice(0, 3).map(m => ({
          id: m.id,
          email: m.user?.email || 'No email',
          name: m.user?.name || m.user?.username || 'No name',
          status: m.status
        })) : []
      })
    } else {
      return Response.json({
        success: false,
        error: `Whop API error: ${response.status}`,
        details: responseText
      })
    }

  } catch (error) {
    console.error('Error testing Whop connection:', error)
    return Response.json({
      success: false,
      error: error.message
    })
  }
}