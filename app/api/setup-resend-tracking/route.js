import { resend } from '@/lib/resend'

export async function POST() {
  try {
    console.log('=== SETTING UP RESEND OPEN TRACKING ===')

    // First, let's get all domains
    const { data: domains, error: domainsError } = await resend.domains.list()
    
    if (domainsError) {
      console.error('Error fetching domains:', domainsError)
      return Response.json({
        success: false,
        error: 'Failed to fetch domains',
        details: domainsError.message
      })
    }

    console.log('Available domains:', domains)

    // Find your domain (flowmail.rovelin.com)
    const targetDomain = domains.data?.find(domain => 
      domain.name === 'flowmail.rovelin.com'
    )

    if (!targetDomain) {
      return Response.json({
        success: false,
        error: 'Domain flowmail.rovelin.com not found',
        availableDomains: domains.data?.map(d => d.name) || []
      })
    }

    console.log('Target domain found:', targetDomain)

    // Enable open tracking on the domain
    const { data: updatedDomain, error: updateError } = await resend.domains.update(targetDomain.id, {
      openTracking: true
    })

    if (updateError) {
      console.error('Error enabling open tracking:', updateError)
      return Response.json({
        success: false,
        error: 'Failed to enable open tracking',
        details: updateError.message
      })
    }

    console.log('✅ Open tracking enabled on domain')

    return Response.json({
      success: true,
      message: 'Open tracking enabled successfully!',
      domain: {
        name: targetDomain.name,
        id: targetDomain.id,
        openTracking: true
      },
      nextSteps: [
        'Open tracking is now enabled on your domain',
        'Emails sent from this domain will automatically include tracking pixels',
        'Set up webhooks to receive real-time open events',
        'Use Resend API to retrieve email statistics'
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