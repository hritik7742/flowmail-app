import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(request) {
  try {
    const headersList = headers()
    const signature = headersList.get('whop-signature')
    const body = await request.text()
    
    // Verify webhook signature (important for security)
    if (!signature || !process.env.WHOP_WEBHOOK_SECRET) {
      console.error('Missing webhook signature or secret')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the webhook payload
    const event = JSON.parse(body)
    console.log('📨 Webhook received:', event.type, event.data?.id)

    switch (event.type) {
      case 'membership.created':
      case 'membership.updated':
        await handleMembershipUpdate(event.data)
        break
        
      case 'membership.cancelled':
      case 'membership.expired':
        await handleMembershipCancellation(event.data)
        break
        
      case 'payment.succeeded':
        await handlePaymentSuccess(event.data)
        break
        
      default:
        console.log('Unhandled webhook event:', event.type)
    }

    return Response.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleMembershipUpdate(membership) {
  try {
    console.log('🔄 Processing membership update:', membership.id)
    
    // Determine plan based on membership data
    let plan = 'free'
    if (membership.plan_id === process.env.WHOP_STARTER_PLAN_ID) {
      plan = 'starter'
    } else if (membership.plan_id === process.env.WHOP_GROWTH_PLAN_ID) {
      plan = 'growth'
    } else if (membership.plan_id === process.env.WHOP_PRO_PLAN_ID) {
      plan = 'pro'
    }

    // Update or create user record
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('whop_user_id', membership.user_id)
      .single()

    if (existingUser) {
      // Update existing user
      await supabaseAdmin
        .from('users')
        .update({
          plan,
          // Reset monthly count when upgrading (fresh start)
          emails_sent_this_month: 0,
          updated_at: new Date().toISOString()
        })
        .eq('whop_user_id', membership.user_id)
      
      console.log(`✅ Updated user ${membership.user_id} to ${plan} plan`)
    } else {
      // Create new user
      await supabaseAdmin
        .from('users')
        .insert([{
          whop_user_id: membership.user_id,
          plan,
          emails_sent_this_month: 0,
          emails_sent_today: 0,
          last_email_reset_date: new Date().toISOString().split('T')[0]
        }])
      
      console.log(`✅ Created new user ${membership.user_id} with ${plan} plan`)
    }

  } catch (error) {
    console.error('Error handling membership update:', error)
    throw error
  }
}

async function handleMembershipCancellation(membership) {
  try {
    console.log('❌ Processing membership cancellation:', membership.id)
    
    // Downgrade user to free plan
    await supabaseAdmin
      .from('users')
      .update({
        plan: 'free',
        // Reset to daily limits
        emails_sent_today: 0,
        last_email_reset_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('whop_user_id', membership.user_id)
    
    console.log(`✅ Downgraded user ${membership.user_id} to free plan`)

  } catch (error) {
    console.error('Error handling membership cancellation:', error)
    throw error
  }
}

async function handlePaymentSuccess(payment) {
  try {
    console.log('💳 Processing successful payment:', payment.id)
    
    // Reset monthly email count on successful payment (new billing cycle)
    if (payment.membership_id) {
      const membership = payment.membership
      
      await supabaseAdmin
        .from('users')
        .update({
          emails_sent_this_month: 0,
          updated_at: new Date().toISOString()
        })
        .eq('whop_user_id', membership.user_id)
      
      console.log(`✅ Reset monthly count for user ${membership.user_id} - new billing cycle`)
    }

  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}