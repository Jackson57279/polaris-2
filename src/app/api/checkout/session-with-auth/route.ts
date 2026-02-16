import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Authenticated wrapper for creating Checkout Sessions
 * - Injects Clerk user details (email/name) and metadata into the body
 * - Proxies to the built-in /checkout POST (adapter handler) to generate checkout_url
 *
 * Usage (client-side):
 * fetch("/api/checkout/session-with-auth", {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({
 *     product_cart: [{ product_id: "pdt_xxx", quantity: 1 }],
 *     // ... any other Checkout Session fields supported by the adapter
 *     // e.g. billing_currency, discount_code, feature_flags, subscription_data, etc.
 *   })
 * })
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = await currentUser();
  if (!u?.primaryEmailAddress?.emailAddress) {
    return NextResponse.json({ error: "Missing user email" }, { status: 400 });
  }

  const email = u.primaryEmailAddress.emailAddress;
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || undefined;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore; default empty body
  }

  // Merge customer + metadata
  const merged = {
    ...body,
    customer: {
      // if client already provided a customer, we only fill missing parts
      ...(body?.customer ?? {}),
      email,
      name: body?.customer?.name ?? name,
    },
    metadata: {
      ...(body?.metadata ?? {}),
      clerk_user_id: userId,
    },
  };

  // Proxy to adapter route handler at /checkout (POST) for session creation
  // Ensures we don't duplicate handler logic here.
  const res = await fetch(new URL("/checkout", req.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Forward cookies/auth if needed for adapter logic (not strictly required)
      cookie: req.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(merged),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}