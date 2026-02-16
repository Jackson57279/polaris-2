import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getConvexServerClient } from "@/lib/convex-server";

/**
 * Clerk-aware Customer Portal bootstrapper
 * - Looks up the mapped Dodo customer_id for the current Clerk user in Convex
 * - If found, redirects to /customer-portal?customer_id=...
 * - Otherwise returns 404 with guidance
 *
 * Optional query:
 *   ?send_email=true  -> passes through to /customer-portal handler
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ensure we have an email (useful for operator logs)
  const u = await currentUser().catch(() => null);
  const email = u?.primaryEmailAddress?.emailAddress;

  const convex = getConvexServerClient();
  const INTERNAL_KEY = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!INTERNAL_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: POLARIS_CONVEX_INTERNAL_KEY is not set" },
      { status: 500 },
    );
  }

  // Query Convex for the mapping
  let customer: any = null;
  try {
    customer = await (convex as any).query("billing:getCustomerByClerk", {
      internalKey: INTERNAL_KEY,
      clerkUserId: userId,
    });
  } catch (err) {
    console.error("Convex query failed (billing:getCustomerByClerk):", err);
    return NextResponse.json({ error: "Upstream error" }, { status: 502 });
  }

  if (!customer?.dodoCustomerId) {
    // Not found yet — likely user has not completed a checkout
    return NextResponse.json(
      {
        error: "No Dodo customer mapping for this user",
        detail:
          "Ask the user to complete a checkout first so the webhook can upsert the mapping, or build an admin path to pre-create a Dodo customer.",
        userId,
        email,
      },
      { status: 404 },
    );
  }

  const url = new URL("/customer-portal", req.url);
  url.searchParams.set("customer_id", customer.dodoCustomerId);

  const sendEmail = req.nextUrl.searchParams.get("send_email");
  if (sendEmail) url.searchParams.set("send_email", sendEmail);

  // Delegate to the adapter route which handles redirect/session creation
  return NextResponse.redirect(url);
}