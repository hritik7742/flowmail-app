import { Resend } from 'resend'

// Create Resend instance with fallback for missing API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendEmail({ to, subject, html, from = process.env.FROM_EMAIL || 'noreply@flowmail.rovelin.com', campaignId = null, subscriberId = null }) {
  try {
    console.log('=== RESEND EMAIL FUNCTION ===')
    console.log('To:', to)
    console.log('Subject:', subject)
    console.log('From:', from)
    console.log('HTML length:', html?.length || 0)
    console.log('Resend API key:', process.env.RESEND_API_KEY ? `Set (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : 'Missing')
    
    if (!resend) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    if (!to || !subject || !html) {
      throw new Error('Missing required email parameters: to, subject, or html')
    }

    // Build tags array for tracking
    const tags = [
      {
        name: 'category',
        value: 'flowmail-campaign'
      },
      {
        name: 'source',
        value: 'flowmail-app'
      }
    ]

    // Add campaign ID tag if provided
    if (campaignId) {
      tags.push({
        name: 'campaign_id',
        value: campaignId
      })
    }

    // Add subscriber ID tag if provided
    if (subscriberId) {
      tags.push({
        name: 'subscriber_id',
        value: subscriberId
      })
    }

    const emailData = {
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      tags
    }

    console.log('Sending email with data:', { ...emailData, html: `${html.substring(0, 100)}...` })
    
    const data = await resend.emails.send(emailData)
    
    console.log('Resend response:', data)
    
    // Check if there's an error in the response
    if (data.error) {
      console.log('❌ Resend returned an error:', data.error)
      throw new Error(`Resend error (${data.error.statusCode}): ${data.error.message}`)
    }
    
    console.log('✅ Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ Error sending email:', error)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    return { success: false, error: error.message }
  }
}

export { resend }