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

		console.log('Webhook received:', webhookData.action, webhookData.data);

		// Handle different webhook events
		if (webhookData.action === "payment.succeeded") {
			const { id, final_amount, amount_after_fees, currency, user_id, plan_id } = webhookData.data;

			console.log(`Payment ${id} succeeded for ${user_id} with amount ${final_amount} ${currency}, plan: ${plan_id}`);

			// Update user subscription in background
			if (user_id && plan_id && final_amount && currency) {
				waitUntil(
					handlePaymentSuccess(user_id, plan_id, final_amount, currency)
				);
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

async function handlePaymentSuccess(user_id: string, plan_id: string, amount: number, currency: string) {
	try {
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
				subscription_updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id);

		if (error) {
			console.error('Error updating user subscription:', error);
		} else {
			console.log(`Successfully updated user ${user_id} to ${planType} plan`);
		}

		// Log subscription event
		await supabaseAdmin
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
					plan_id: plan_id
				}
			});

	} catch (error) {
		console.error('Error in handlePaymentSuccess:', error);
	}
}

async function handleMembershipCreated(user_id: string, plan_id: string, subscription_id: string) {
	try {
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
				subscription_updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id);

		if (error) {
			console.error('Error updating membership created:', error);
		}

	} catch (error) {
		console.error('Error in handleMembershipCreated:', error);
	}
}

async function handleMembershipCancelled(user_id: string, plan_id: string, subscription_id: string) {
	try {
		// Downgrade to free plan
		const { error } = await supabaseAdmin
			.from('users')
			.update({
				plan: 'free',
				subscription_status: 'cancelled',
				plan_updated_at: new Date().toISOString(),
				subscription_updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id);

		if (error) {
			console.error('Error updating membership cancelled:', error);
		}

	} catch (error) {
		console.error('Error in handleMembershipCancelled:', error);
	}
}

async function handleMembershipExpired(user_id: string, plan_id: string, subscription_id: string) {
	try {
		// Downgrade to free plan
		const { error } = await supabaseAdmin
			.from('users')
			.update({
				plan: 'free',
				subscription_status: 'expired',
				plan_updated_at: new Date().toISOString(),
				subscription_updated_at: new Date().toISOString()
			})
			.eq('whop_user_id', user_id);

		if (error) {
			console.error('Error updating membership expired:', error);
		}

	} catch (error) {
		console.error('Error in handleMembershipExpired:', error);
	}
}
