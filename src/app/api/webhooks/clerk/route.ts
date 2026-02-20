import { NextRequest, NextResponse } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

import { getConvexServerClient } from "@/lib/convex-server";

const INTERNAL_KEY = process.env.POLARIS_CONVEX_INTERNAL_KEY;

type ConvexServerClient = {
  mutation: (name: string, args: Record<string, unknown>) => Promise<unknown>;
};

type PaymentStatus = "pending" | "paid" | "failed";
type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "upcoming"
  | "ended"
  | "abandoned";

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const getString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
};

const getNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
};

const toMillis = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    // Clerk payloads can be epoch seconds.
    return value > 1_000_000_000_000 ? value : value * 1000;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const mapPaymentStatus = (eventType: string, rawStatus?: string): PaymentStatus => {
  if (rawStatus === "paid") return "paid";
  if (rawStatus === "failed") return "failed";
  if (rawStatus === "pending") return "pending";
  return eventType === "paymentAttempt.updated" ? "pending" : "pending";
};

const mapSubscriptionStatus = (eventType: string): SubscriptionStatus => {
  switch (eventType) {
    case "subscription.active":
    case "subscriptionItem.active":
      return "active";
    case "subscription.pastDue":
    case "subscriptionItem.pastDue":
      return "past_due";
    case "subscriptionItem.canceled":
      return "canceled";
    case "subscriptionItem.incomplete":
      return "incomplete";
    case "subscriptionItem.upcoming":
      return "upcoming";
    case "subscriptionItem.ended":
      return "ended";
    case "subscriptionItem.abandoned":
      return "abandoned";
    default:
      return "pending";
  }
};

const extractClerkUserId = (data: Record<string, unknown>): string | undefined => {
  const direct =
    getString(data, "user_id") ??
    getString(data, "userId") ??
    getString(data, "subject");
  if (direct) return direct;

  const payer = asRecord(data.payer);
  if (!payer) return undefined;

  return (
    getString(payer, "user_id") ??
    getString(payer, "userId") ??
    getString(payer, "id")
  );
};

const toJsonString = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "Failed to serialize payload" });
  }
};

const syncPayment = async (
  convex: ConvexServerClient,
  eventType: string,
  data: Record<string, unknown>,
) => {
  if (!INTERNAL_KEY) return;

  const paymentId = getString(data, "id");
  const clerkUserId = extractClerkUserId(data);
  if (!paymentId || !clerkUserId) return;

  const metadata = asRecord(data.metadata);

  await convex.mutation("billing:upsertPayment", {
    internalKey: INTERNAL_KEY,
    paymentId,
    clerkUserId,
    status: mapPaymentStatus(eventType, getString(data, "status")),
    totalAmount: getNumber(data, "amount") ?? getNumber(data, "amount_due") ?? 0,
    currency: getString(data, "currency") ?? "USD",
    paymentMethod: getString(data, "payment_method"),
    paymentMethodType: getString(data, "payment_method_type"),
    metadataJson: metadata ? toJsonString(metadata) : undefined,
  });
};

const syncSubscription = async (
  convex: ConvexServerClient,
  eventType: string,
  data: Record<string, unknown>,
) => {
  if (!INTERNAL_KEY) return;

  const subscriptionId =
    getString(data, "id") ?? getString(data, "subscription_id");
  const clerkUserId = extractClerkUserId(data);
  if (!subscriptionId || !clerkUserId) return;

  const plan = asRecord(data.plan);
  const metadata = asRecord(data.metadata);

  await convex.mutation("billing:upsertSubscription", {
    internalKey: INTERNAL_KEY,
    subscriptionId,
    clerkUserId,
    status: mapSubscriptionStatus(eventType),
    planId: getString(data, "plan_id") ?? (plan ? getString(plan, "id") : undefined),
    quantity: getNumber(data, "quantity"),
    currentPeriodEnd:
      toMillis(data.period_end) ?? toMillis(data.current_period_end),
    metadataJson: metadata ? toJsonString(metadata) : undefined,
  });
};

export async function POST(req: NextRequest) {
  if (!INTERNAL_KEY) {
    return NextResponse.json(
      { error: "POLARIS_CONVEX_INTERNAL_KEY is not configured" },
      { status: 500 },
    );
  }

  let evt: { type: string; data: unknown };
  try {
    evt = (await verifyWebhook(req)) as { type: string; data: unknown };
  } catch (error) {
    console.error("Clerk webhook verification failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const convex = getConvexServerClient() as unknown as ConvexServerClient;

  try {
    await convex.mutation("billing:recordWebhookEvent", {
      internalKey: INTERNAL_KEY,
      type: evt.type,
      payloadJson: toJsonString(evt),
    });

    const data = asRecord(evt.data);
    if (!data) {
      return NextResponse.json({ ok: true });
    }

    if (evt.type.startsWith("paymentAttempt.")) {
      await syncPayment(convex, evt.type, data);
    }

    if (evt.type.startsWith("subscription")) {
      await syncSubscription(convex, evt.type, data);
    }
  } catch (error) {
    console.error("Failed to process Clerk billing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
