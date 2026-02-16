import { Webhooks } from "@dodopayments/nextjs";
import { getConvexServerClient } from "@/lib/convex-server";

// Convex HTTP client (server-side)
const convex = getConvexServerClient();

// Internal key to authorize Convex mutations
const INTERNAL_KEY = process.env.POLARIS_CONVEX_INTERNAL_KEY;

// Basic guard for required env vars
if (!process.env.DODO_PAYMENTS_WEBHOOK_SECRET) {
  // Note: Next.js evaluates route files at runtime; we don't throw at import time to avoid build failures.
  console.warn("DODO_PAYMENTS_WEBHOOK_SECRET is not set. Webhook verification will fail.");
}
if (!INTERNAL_KEY) {
  console.warn("POLARIS_CONVEX_INTERNAL_KEY is not set. Webhook Convex sync will fail.");
}

const toMillis = (iso?: string | null) => {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t;
};

async function recordWebhook(payload: any) {
  try {
    if (!INTERNAL_KEY) return;
    // Using untyped invocation to avoid codegen timing during setup
    await (convex as any).mutation("billing:recordWebhookEvent", {
      internalKey: INTERNAL_KEY,
      type: payload?.type ?? "unknown",
      payload,
    });
  } catch (err) {
    console.error("Failed to record webhook event:", err);
  }
}

async function upsertPaymentFromPayload(payload: any, status: any) {
  try {
    if (!INTERNAL_KEY) return;

    const d = payload?.data ?? {};
    const cust = d?.customer ?? {};
    const paymentId = d?.payment_id as string | undefined;
    const dodoCustomerId = cust?.customer_id as string | undefined;
    const clerkUserId = (d?.metadata?.clerk_user_id as string | undefined) ?? undefined;

    // Minimal required identifiers; if missing, only record the event for auditing.
    if (!paymentId || !dodoCustomerId) return;

    await (convex as any).mutation("billing:upsertPayment", {
      internalKey: INTERNAL_KEY,
      paymentId,
      dodoCustomerId,
      status, // adapter validates/casts; we trust event-specific status here
      totalAmount: typeof d?.total_amount === "number" ? d.total_amount : 0,
      currency: (d?.currency as string) ?? "USD",
      paymentMethod: d?.payment_method as string | undefined,
      paymentMethodType: d?.payment_method_type as string | undefined,
      metadata: d?.metadata,
      customerEmail: cust?.email as string | undefined,
      customerName: cust?.name as string | undefined,
      clerkUserId,
    });
  } catch (err) {
    console.error("Failed to upsert payment:", err);
  }
}

async function upsertSubscriptionFromPayload(payload: any, mappedStatus: any) {
  try {
    if (!INTERNAL_KEY) return;

    const d = payload?.data ?? {};
    const cust = d?.customer ?? {};
    const subscriptionId = d?.subscription_id as string | undefined;
    const dodoCustomerId = cust?.customer_id as string | undefined;
    const clerkUserId = (d?.metadata?.clerk_user_id as string | undefined) ?? undefined;

    if (!subscriptionId || !dodoCustomerId) return;

    await (convex as any).mutation("billing:upsertSubscription", {
      internalKey: INTERNAL_KEY,
      subscriptionId,
      dodoCustomerId,
      status: mappedStatus,
      productId: d?.product_id as string | undefined,
      quantity: typeof d?.quantity === "number" ? d.quantity : undefined,
      nextBillingDate: toMillis(d?.next_billing_date as string | undefined),
      currentPeriodEnd: toMillis(d?.current_period_end as string | undefined),
      metadata: d?.metadata,
      customerEmail: cust?.email as string | undefined,
      customerName: cust?.name as string | undefined,
      clerkUserId,
    });
  } catch (err) {
    console.error("Failed to upsert subscription:", err);
  }
}

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET!,
  // Always persist the raw, verified payload for audit/idempotency tracking
  onPayload: async (payload) => {
    await recordWebhook(payload);
  },

  // Payment lifecycle
  onPaymentSucceeded: async (payload) => {
    await recordWebhook(payload);
    await upsertPaymentFromPayload(payload, "succeeded");
  },
  onPaymentFailed: async (payload) => {
    await recordWebhook(payload);
    await upsertPaymentFromPayload(payload, "failed");
  },
  onPaymentProcessing: async (payload) => {
    await recordWebhook(payload);
    await upsertPaymentFromPayload(payload, "processing");
  },
  onPaymentCancelled: async (payload) => {
    await recordWebhook(payload);
    await upsertPaymentFromPayload(payload, "cancelled");
  },

  // Subscription lifecycle
  onSubscriptionActive: async (payload) => {
    await recordWebhook(payload);
    await upsertSubscriptionFromPayload(payload, "active");
  },
  onSubscriptionRenewed: async (payload) => {
    await recordWebhook(payload);
    await upsertSubscriptionFromPayload(payload, "active"); // keep active; update period dates
  },
  onSubscriptionOnHold: async (payload) => {
    await recordWebhook(payload);
    await upsertSubscriptionFromPayload(payload, "on_hold");
  },
  onSubscriptionCancelled: async (payload) => {
    await recordWebhook(payload);
    await upsertSubscriptionFromPayload(payload, "cancelled");
  },
  onSubscriptionFailed: async (payload) => {
    await recordWebhook(payload);
    await upsertSubscriptionFromPayload(payload, "failed");
  },
  onSubscriptionExpired: async (payload) => {
    await recordWebhook(payload);
    await upsertSubscriptionFromPayload(payload, "expired");
  },
});