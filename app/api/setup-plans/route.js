import { whopSdk } from '@/lib/whop-sdk'

export async function POST() {
  try {
    console.log('Setting up FlowMail subscription plans...')

    // First, let's try to create an access pass
    const accessPass = await whopSdk.accessPasses.create({
      name: 'FlowMail Premium',
      description: 'Premium email marketing features for FlowMail',
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID
    })

    console.log('Access pass created:', accessPass.id)

    // Create Starter Plan
    const starterPlan = await whopSdk.plans.create({
      accessPassId: accessPass.id,
      name: 'Starter Plan',
      price: 2900, // $29.00 in cents
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      description: '3,000 emails/month + basic features'
    })

    console.log('Starter plan created:', starterPlan.id)

    // Create Growth Plan
    const growthPlan = await whopSdk.plans.create({
      accessPassId: accessPass.id,
      name: 'Growth Plan',
      price: 4900, // $49.00 in cents
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      description: '5,000 emails/month + advanced features'
    })

    console.log('Growth plan created:', growthPlan.id)

    // Create Pro Plan
    const proPlan = await whopSdk.plans.create({
      accessPassId: accessPass.id,
      name: 'Pro Plan',
      price: 12900, // $129.00 in cents
      currency: 'usd',
      interval: 'month',
      intervalCount: 1,
      description: '10,000 emails/month + premium features'
    })

    console.log('Pro plan created:', proPlan.id)

    return Response.json({
      success: true,
      message: 'Plans created successfully!',
      accessPass: {
        id: accessPass.id,
        name: accessPass.name
      },
      plans: {
        starter: {
          id: starterPlan.id,
          name: starterPlan.name,
          price: '$29/month'
        },
        growth: {
          id: growthPlan.id,
          name: growthPlan.name,
          price: '$49/month'
        },
        pro: {
          id: proPlan.id,
          name: proPlan.name,
          price: '$129/month'
        }
      },
      nextSteps: {
        step1: 'Copy the plan IDs above',
        step2: 'Update your .env.development file:',
        envVars: {
          WHOP_STARTER_PLAN_ID: starterPlan.id,
          WHOP_GROWTH_PLAN_ID: growthPlan.id,
          WHOP_PRO_PLAN_ID: proPlan.id
        },
        step3: 'Restart your development server'
      }
    })

  } catch (error) {
    console.error('Error setting up plans:', error)
    
    return Response.json({
      success: false,
      error: 'Failed to create plans',
      details: error.message,
      suggestion: 'You may need to create plans manually in your Whop dashboard',
      manualSteps: {
        step1: 'Go to https://whop.com/dashboard/developer',
        step2: 'Select your app',
        step3: 'Go to Access Passes tab',
        step4: 'Create an access pass called "FlowMail Premium"',
        step5: 'Add pricing plans: Growth ($49/month) and Pro ($99/month)',
        step6: 'Copy the plan IDs and update your .env file'
      }
    }, { status: 500 })
  }
}

export async function GET() {
  return Response.json({
    message: 'Plan setup endpoint',
    usage: 'POST to create FlowMail subscription plans',
    warning: 'This will create new plans in your Whop dashboard'
  })
}