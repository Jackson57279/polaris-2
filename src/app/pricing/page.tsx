import type { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "View plans and manage your Polaris subscription. Upgrade for more AI usage and features.",
  openGraph: {
    title: "Pricing | Polaris",
    description: "Plans and subscription management for Polaris Cloud IDE.",
  },
  robots: { index: true, follow: true },
};

const PricingPage = () => {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <PricingTable for="user" newSubscriptionRedirectUrl="/" />
    </main>
  );
};

export default PricingPage;
