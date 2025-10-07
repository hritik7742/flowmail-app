import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from '@/lib/supabase';

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	try {
		// Validate the webhook to ensure it's from Whop
		const webhookData = await validateWebhook(request);

		console.log('=== WHOP WEBHOOK RECEIVED ===');
		console.log('Action:', webhookData.action);
		console.log('Data:', JSON.stringify(webhookData.data, null, 2));

		// Handle different webhook events
		if (webhookData.action === "payment.succeeded") {
			const { id, final_amount, amount_after_fees, currency, user_id, plan_id, metadata } = webhookData.data;

			console.log(`💰 Payment ${id} succeeded for ${user_id} with amount ${final_amount} ${currency}, plan: ${plan_id}`);
			console.log('📊 Full payment data:', JSON.stringify(webhookData.data, null, 2));

			// Update user subscription in background
			if (user_id && final_amount && currency) {
				console.log('🚀 Processing payment success in background...');
				waitUntil(
					handlePaymentSuccess(user_id, plan_id, final_amount, currency, metadata)
				);
			} else {
				console.error('❌ Missing required payment data:', {
					user_id: !!user_id,
					final_amount: !!final_amount,
					currency: !!currency
				});
			}
		}

		if (webhookData.action === "membership.went_valid") {
			const { user_id, plan_id, id } = webhookData.data;
			
			console.log(`Membership went valid for ${user_id}, plan: ${plan_id}, membership: ${id}`);

			if (user_id && plan_id) {
				waitUntil(
					handleMembershipCreated(user_id, plan_id, id)
				);
			}
		}

		if (webhookData.action === "membership.went_invalid") {
			const { user_id, plan_id, id } = webhookData.data;
			
			console.log(`Membership went invalid for ${user_id}, plan: ${plan_id}, membership: ${id}`);

			if (user_id && plan_id) {
				waitUntil(
					handleMembershipCancelled(user_id, plan_id, id)
				);
			}
		}

		// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
		return new Response("OK", { status: 200 });

	} catch (error) {
		console.error('Webhook error:', error);
		return new Response("Error processing webhook", { status: 500 });
	}
}

async function handlePaymentSuccess(
	user_id: string, 
	plan_id: string | null | undefined, 
	amount: number, 
	currency: string,
	metadata?: Record<string, unknown> | null
) {
	try {
		console.log('=== HANDLING PAYMENT SUCCESS ===');
		console.log('User ID:', user_id);
		console.log('Plan ID:', plan_id);
		console.log('Amount:', amount);
		console.log('Currency:', currency);
		console.log('Metadata:', metadata);

		// Validate required parameters
		if (!user_id) {
			console.error('❌ No user_id provided in payment webhook');
			return;
		}

		// First, check if user exists in database
		console.log('🔍 Checking if user exists in database...');
		const { data: existingUser, error: userError } = await (supabaseAdmin
			.from('users')
			.select('*')
			.eq('whop_user_id', user_id)
			.single() as any);

		if (userError && userError.code !== 'PGRST116') {
			console.error('❌ Error checking user:', userError);
			return;
		}

		if (!existingUser) {
			console.log('👤 User not found in database, creating new user...');
			// Create user if doesn't exist
			const { error: createError } = await (supabaseAdmin
				.from('users')
				.insert({
					whop_user_id: user_id,
					plan: 'free',
					subscription_status: 'inactive',
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString()
				}) as any);

			if (createError) {
				console.error('❌ Error creating user:', createError);
				return;
			}
			console.log('✅ User created successfully');
		} else {
			console.log('✅ User found in database:', existingUser.whop_user_id);
		}

		// Determine plan type based on plan_id
		let planType = 'free';
		console.log('🔍 Determining plan type...');
		console.log('Plan ID from webhook:', plan_id);
		console.log('Environment plan IDs:');
		console.log('- Starter:', process.env.WHOP_STARTER_PLAN_ID);
		console.log('- Growth:', process.env.WHOP_GROWTH_PLAN_ID);
		console.log('- Pro:', process.env.WHOP_PRO_PLAN_ID);

		if (plan_id === process.env.WHOP_STARTER_PLAN_ID) {
			planType = 'starter';
		} else if (plan_id === process.env.WHOP_GROWTH_PLAN_ID) {
			planType = 'growth';
		} else if (plan_id === process.env.WHOP_PRO_PLAN_ID) {
			planType = 'pro';
		} else {
			// If plan_id doesn't match any known plans, try to determine from amount
			if (amount >= 50) {
				planType = 'pro';
			} else if (amount >= 25) {
				planType = 'growth';
			} else if (amount >= 10) {
				planType = 'starter';
			}
			console.log(`⚠️ Plan ID didn't match known plans, determined plan from amount: ${planType}`);
		}

		console.log(`📝 Updating user ${user_id} to plan ${planType}`);

		// Update user in database
		const { error: updateError } = await (supabaseAdmin
			.from('users')
			.update({
				plan: planType,
				subscription_status: 'active',
				subscription_id: plan_id || 'unknown',
				whop_subscription_id: plan_id || 'unknown',
				whop_plan_id: plan_id || 'unknown',
				plan_updated_at: new Date().toISOString(),
				subscription_updated_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id) as any);

		if (updateError) {
			console.error('❌ Error updating user subscription:', updateError);
		} else {
			console.log(`✅ Successfully updated user ${user_id} to ${planType} plan`);
		}

		// Log subscription event
		console.log('📊 Logging subscription event...');
		const { error: logError } = await (supabaseAdmin
			.from('subscription_events')
			.insert({
				user_id: user_id,
				event_type: 'payment_succeeded',
				whop_subscription_id: plan_id || 'unknown',
				whop_plan_id: plan_id || 'unknown',
				plan_name: planType,
				status: 'active',
				metadata: {
					amount: amount,
					currency: currency,
					plan_id: plan_id,
					...metadata
				},
				created_at: new Date().toISOString()
			}) as any);

		if (logError) {
			console.error('❌ Error logging subscription event:', logError);
		} else {
			console.log('✅ Subscription event logged successfully');
		}

		console.log('=== PAYMENT SUCCESS HANDLED ===');

	} catch (error) {
		console.error('❌ Error in handlePaymentSuccess:', error);
	}
}

async function handleMembershipCreated(user_id: string, plan_id: string, subscription_id: string) {
	try {
		console.log('=== HANDLING MEMBERSHIP CREATED ===');
		console.log('User ID:', user_id);
		console.log('Plan ID:', plan_id);
		console.log('Subscription ID:', subscription_id);

		let planType = 'free';
		if (plan_id === process.env.WHOP_STARTER_PLAN_ID) {
			planType = 'starter';
		} else if (plan_id === process.env.WHOP_GROWTH_PLAN_ID) {
			planType = 'growth';
		} else if (plan_id === process.env.WHOP_PRO_PLAN_ID) {
			planType = 'pro';
		}

		// Update user subscription
		const { error } = await supabaseAdmin
			.from('users')
			.update({
				plan: planType,
				subscription_status: 'active',
				subscription_id: subscription_id,
				whop_subscription_id: subscription_id,
				whop_plan_id: plan_id,
				plan_updated_at: new Date().toISOString(),
				subscription_updated_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id);

		if (error) {
			console.error('Error updating membership created:', error);
		} else {
			console.log(`✅ Successfully updated membership for user ${user_id} to ${planType} plan`);
		}

	} catch (error) {
		console.error('Error in handleMembershipCreated:', error);
	}
}

async function handleMembershipCancelled(user_id: string, plan_id: string, subscription_id: string) {
	try {
		console.log('=== HANDLING MEMBERSHIP CANCELLED ===');
		console.log('User ID:', user_id);
		console.log('Plan ID:', plan_id);
		console.log('Subscription ID:', subscription_id);

		// Downgrade to free plan
		const { error } = await supabaseAdmin
			.from('users')
			.update({
				plan: 'free',
				subscription_status: 'cancelled',
				plan_updated_at: new Date().toISOString(),
				subscription_updated_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id);

		if (error) {
			console.error('Error updating membership cancelled:', error);
		} else {
			console.log(`✅ Successfully downgraded user ${user_id} to free plan`);
		}

	} catch (error) {
		console.error('Error in handleMembershipCancelled:', error);
	}
}