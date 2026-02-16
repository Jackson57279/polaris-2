import { CustomerPortal } from "@dodopayments/nextjs";

/**
 * Customer Portal route
 * - GET: /customer-portal?customer_id=cus_123&send_email=true
 *
 * Env vars:
 * - DODO_PAYMENTS_API_KEY
 * - DODO_PAYMENTS_ENVIRONMENT: "test_mode" | "live_mode" (optional; defaults to live if omitted)
 *
 * Note:
 * - For Clerk integration, you can build a wrapper route that looks up the Dodo customer_id
 *   from Convex using the authenticated Clerk user, then redirect to this route with the
 *   customer_id query param populated.
 */

const ENV = process.env.DODO_PAYMENTS_ENVIRONMENT as
  | "test_mode"
  | "live_mode"
  | undefined;

export const GET = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: ENV,
});