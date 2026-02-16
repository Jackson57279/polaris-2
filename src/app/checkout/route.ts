import { Checkout } from "@dodopayments/nextjs";

/**
 * Checkout route
 * - GET: static checkout link (?productId=&quantity=...)
 * - POST: checkout session (recommended) - body includes product_cart and options
 *
 * Env vars:
 * - DODO_PAYMENTS_API_KEY
 * - DODO_PAYMENTS_RETURN_URL (optional)
 * - DODO_PAYMENTS_ENVIRONMENT: "test_mode" | "live_mode" (optional; defaults to live if omitted)
 */

const ENV = process.env.DODO_PAYMENTS_ENVIRONMENT as
  | "test_mode"
  | "live_mode"
  | undefined;

// Static checkout (supports simple GET query params)
export const GET = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: ENV,
  type: "static",
});

// Checkout Sessions (recommended) - POST JSON body
export const POST = Checkout({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  returnUrl: process.env.DODO_PAYMENTS_RETURN_URL,
  environment: ENV,
  type: "session",
});