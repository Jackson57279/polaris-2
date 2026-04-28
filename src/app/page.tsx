import type { Metadata } from "next";
import { MarketingLanding } from "@/features/marketing/components/marketing-landing";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  title: "LuminaWeb – Meet your first autonomous builder",
  description:
    "LuminaWeb helps teams design, ship, and scale software in the browser — from prompt to production with a single conversation.",
  openGraph: {
    title: "LuminaWeb – Meet your first autonomous builder",
    description:
      "Design, ship, and scale software in the browser. Prompt-driven, AI-native, in-browser execution. Start building in seconds.",
    url: baseUrl,
    type: "website",
  },
  alternates: baseUrl ? { canonical: baseUrl } : undefined,
};

const Home = () => {
  return <MarketingLanding />;
};

export default Home;
