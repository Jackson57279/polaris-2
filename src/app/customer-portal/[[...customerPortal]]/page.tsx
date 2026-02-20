import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

const CustomerPortalPage = () => {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <UserProfile path="/customer-portal" routing="path" />
    </main>
  );
};

export default CustomerPortalPage;
