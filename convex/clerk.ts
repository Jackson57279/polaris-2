"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";

export const handleClerkWebhook = internalAction({
  args: {
    payloadString: v.string(),
    svixId: v.string(),
    svixTimestamp: v.string(),
    svixSignature: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SIGNING_SECRET is not configured");
    }

    const wh = new Webhook(webhookSecret);
    let evt: { type: string; data: unknown };

    try {
      evt = wh.verify(args.payloadString, {
        "svix-id": args.svixId,
        "svix-timestamp": args.svixTimestamp,
        "svix-signature": args.svixSignature,
      }) as { type: string; data: unknown };
    } catch (err) {
      console.error("Error verifying webhook:", err);
      throw new Error("Invalid webhook signature");
    }

    await ctx.runMutation(internal.billing.recordWebhookEventInternal, {
      type: evt.type,
      payloadJson: toJsonString(evt),
    });

    const data = asRecord(evt.data);
    if (!data) {
      return;
    }

    if (evt.type.startsWith("paymentAttempt.")) {
      const paymentId = getString(data, "id");
      const clerkUserId = extractClerkUserId(data);
      if (paymentId && clerkUserId) {
        const metadata = asRecord(data.metadata);
        await ctx.runMutation(internal.billing.upsertPaymentInternal, {
          paymentId,
          clerkUserId,
          status: mapPaymentStatus(evt.type, getString(data, "status")),
          totalAmount: getNumber(data, "amount") ?? getNumber(data, "amount_due") ?? 0,
          currency: getString(data, "currency") ?? "USD",
          paymentMethod: getString(data, "payment_method"),
          paymentMethodType: getString(data, "payment_method_type"),
          metadataJson: metadata ? toJsonString(metadata) : undefined,
        });
      }
    }

    if (evt.type.startsWith("subscription")) {
      const subscriptionId = getString(data, "id") ?? getString(data, "subscription_id");
      const clerkUserId = extractClerkUserId(data);
      
      if (subscriptionId && clerkUserId) {
        const plan = asRecord(data.plan);
        const metadata = asRecord(data.metadata);

        await ctx.runMutation(internal.billing.upsertSubscriptionInternal, {
          subscriptionId,
          clerkUserId,
          status: mapSubscriptionStatus(evt.type),
          planId: getString(data, "plan_id") ?? (plan ? getString(plan, "id") : undefined),
          quantity: getNumber(data, "quantity"),
          currentPeriodEnd: toMillis(data.period_end) ?? toMillis(data.current_period_end),
          metadataJson: metadata ? toJsonString(metadata) : undefined,
        });
      }
    }
  },
});

// Helpers below:

const mapPaymentStatus = (eventType: string, rawStatus?: string): "pending" | "paid" | "failed" => {
  if (rawStatus === "paid") return "paid";
  if (rawStatus === "failed") return "failed";
  if (rawStatus === "pending") return "pending";
  return eventType === "paymentAttempt.updated" ? "pending" : "pending";
};

const mapSubscriptionStatus = (eventType: string) => {
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

  const payer = data.payer as Record<string, unknown> | undefined;
  if (!payer || typeof payer !== "object" || Array.isArray(payer)) return undefined;

  return (
    getString(payer, "user_id") ??
    getString(payer, "userId") ??
    getString(payer, "id")
  );
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const getString = (record: Record<string, unknown>, key: string) => 
  typeof record[key] === "string" ? record[key] as string : undefined;

const getNumber = (record: Record<string, unknown>, key: string) => 
  typeof record[key] === "number" ? record[key] as number : undefined;

const toMillis = (value: unknown): number | undefined => {
  if (typeof value === "number") {
    return value > 1_000_000_000_000 ? value : value * 1000;
  }
  if (typeof value !== "string") return undefined;
  
  const numeric = Number(value);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  }
  
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toJsonString = (value: unknown): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "Failed to serialize payload" });
  }
};