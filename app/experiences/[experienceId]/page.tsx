import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FlowMailApp from "./FlowMailApp";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	try {
		// The user token is in the headers
		const { userId } = await whopSdk.verifyUserToken(headersList);

		const result = await whopSdk.access.checkIfUserHasAccessToExperience({
			userId,
			experienceId,
		});

		const user = await whopSdk.users.getUser({ userId });

		// Check if user has access
		if (!result.hasAccess) {
			return (
				<div className="flex justify-center items-center h-screen px-8">
					<div className="text-center">
						<h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
						<p className="text-gray-600">You don't have access to this experience.</p>
					</div>
				</div>
			);
		}

		// Pass user data to our FlowMail app
		return <FlowMailApp user={{...user, email: '', name: user.name || ''}} userId={userId} experienceId={experienceId} />;

	} catch (error) {
		console.error('Error in experience page:', error);
		return (
			<div className="flex justify-center items-center h-screen px-8">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
					<p className="text-gray-600">Something went wrong. Please try again.</p>
				</div>
			</div>
		);
	}
}
