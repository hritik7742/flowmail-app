import { WhopServerSdk } from "@whop/api";

// Validate required environment variables only in production
if (process.env.NODE_ENV === 'production') {
	if (!process.env.NEXT_PUBLIC_WHOP_APP_ID) {
		throw new Error('NEXT_PUBLIC_WHOP_APP_ID is required');
	}

	if (!process.env.WHOP_API_KEY) {
		throw new Error('WHOP_API_KEY is required');
	}

	if (!process.env.NEXT_PUBLIC_WHOP_COMPANY_ID) {
		throw new Error('NEXT_PUBLIC_WHOP_COMPANY_ID is required');
	}
}

export const whopSdk = WhopServerSdk({
	// App ID from Whop dashboard
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID || '',

	// App API key from Whop dashboard (server-side only)
	appApiKey: process.env.WHOP_API_KEY || '',

	// Agent user ID for making requests on behalf of the app
	onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID || '',

	// Company ID for the requests
	companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || '',
});
