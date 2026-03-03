import type { Metadata } from "next";
import { PricingTable } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "View plans and manage your LuminaWeb subscription. Upgrade for more AI usage and features.",
  openGraph: {
    title: "Pricing | LuminaWeb",
    description: "Plans and subscription management for LuminaWeb Cloud IDE.",
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
