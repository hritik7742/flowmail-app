import { WhopApp } from "@whop/react/components";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from '@/components/Providers'

// Conditional WhopApp wrapper to handle missing environment variables
const ConditionalWhopApp = ({ children }: { children: React.ReactNode }) => {
  // Check if we have valid Whop environment variables
  const hasValidWhopConfig = process.env.NEXT_PUBLIC_WHOP_APP_ID && 
                            process.env.NEXT_PUBLIC_WHOP_APP_ID !== 'dev_app_id' &&
                            process.env.NEXT_PUBLIC_WHOP_APP_ID !== 'your_whop_app_id_here';
  
  if (hasValidWhopConfig) {
    return <WhopApp>{children}</WhopApp>;
  }
  
  // Return children without WhopApp wrapper for development
  return <>{children}</>;
};

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "FlowMail - Email Marketing for Whop Creators",
	description: "Send beautiful email campaigns to your community members",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<ConditionalWhopApp>{children}</ConditionalWhopApp>
				</Providers>
			</body>
		</html>
	);
}
