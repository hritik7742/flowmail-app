import { WhopServerSdk } from "@whop/api";

// Validate required environment variables only in production and when actually needed
const validateEnvVars = () => {
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
};

// Create a mock SDK for development when environment variables are missing
const createMockSdk = () => ({
	plans: {
		list: async () => ({ data: [], message: 'Environment variables not configured' })
	},
	companies: {
		list: async () => ({ data: [], message: 'Environment variables not configured' }),
		getCompany: async () => ({ 
			id: 'mock-company-id', 
			title: 'Mock Company',
			message: 'Environment variables not configured' 
		})
	},
	users: {
		list: async () => ({ data: [], message: 'Environment variables not configured' }),
		getUser: async () => ({ 
			id: 'mock-user-id', 
			name: 'Mock User',
			username: 'mockuser',
			message: 'Environment variables not configured' 
		})
	},
	verifyUserToken: async () => ({ 
		userId: 'mock-user-id',
		message: 'Environment variables not configured' 
	}),
	access: {
		checkIfUserHasAccessToCompany: async () => ({ 
			hasAccess: true,
			accessLevel: 'admin',
			message: 'Environment variables not configured' 
		}),
		checkIfUserHasAccessToExperience: async () => ({ 
			hasAccess: true,
			message: 'Environment variables not configured' 
		})
	},
	payments: {
		createCheckoutSession: async () => ({ 
			id: 'mock-checkout-session-id',
			url: 'https://mock-checkout-url.com',
			message: 'Environment variables not configured' 
		})
	}
});

// Check if we have the required environment variables
const hasRequiredEnvVars = process.env.NEXT_PUBLIC_WHOP_APP_ID && 
                          process.env.WHOP_API_KEY && 
                          process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

export const whopSdk = hasRequiredEnvVars ? (() => {
	validateEnvVars(); // Validate only when we have the required vars
	return WhopServerSdk({
		// App ID from Whop dashboard
		appId: process.env.NEXT_PUBLIC_WHOP_APP_ID || '',

		// App API key from Whop dashboard (server-side only)
		appApiKey: process.env.WHOP_API_KEY || '',

		// Agent user ID for making requests on behalf of the app
		onBehalfOfUserId: process.env.WHOP_AGENT_USER_ID || '',

		// Company ID for the requests
		companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || '',
	});
})() : createMockSdk();
