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

			console.log(`Payment ${id} succeeded for ${user_id} with amount ${final_amount} ${currency}, plan: ${plan_id}`);

			// Update user subscription in background
			if (user_id) {
				waitUntil(
					handlePaymentSuccess(user_id, plan_id, final_amount, currency, metadata)
				);
			} else {
				console.error('No user_id found in payment webhook');
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

		// First, check if user exists in database
		const { data: existingUser, error: userError } = await supabaseAdmin
			.from('users')
			.select('*')
			.eq('whop_user_id', user_id)
			.single();

		if (userError && userError.code !== 'PGRST116') {
			console.error('Error checking user:', userError);
			return;
		}

		if (!existingUser) {
			console.log('User not found in database, creating new user...');
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
				console.error('Error creating user:', createError);
				return;
			}
		}

		// Determine plan type based on plan_id
		let planType = 'free';
		if (plan_id === process.env.WHOP_STARTER_PLAN_ID) {
			planType = 'starter';
		} else if (plan_id === process.env.WHOP_GROWTH_PLAN_ID) {
			planType = 'growth';
		} else if (plan_id === process.env.WHOP_PRO_PLAN_ID) {
			planType = 'pro';
		}

		console.log(`Updating user ${user_id} to plan ${planType}`);

		// Update user in database
		const { error } = await supabaseAdmin
			.from('users')
			.update({
				plan: planType,
				subscription_status: 'active',
				subscription_id: plan_id,
				whop_subscription_id: plan_id,
				whop_plan_id: plan_id,
				plan_updated_at: new Date().toISOString(),
				subscription_updated_at: new Date().toISOString(),
				updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id);

		if (error) {
			console.error('Error updating user subscription:', error);
		} else {
			console.log(`✅ Successfully updated user ${user_id} to ${planType} plan`);
		}

		// Log subscription event
		await (supabaseAdmin
			.from('subscription_events')
			.insert({
				user_id: user_id,
				event_type: 'payment_succeeded',
				whop_subscription_id: plan_id,
				whop_plan_id: plan_id,
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

		console.log('=== PAYMENT SUCCESS HANDLED ===');

	} catch (error) {
		console.error('Error in handlePaymentSuccess:', error);
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