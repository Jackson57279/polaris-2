import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Internal key validator (reuses the same pattern as convex/system.ts)
 */
const validateInternalKey = (key: string) => {
  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    throw new Error("POLARIS_CONVEX_INTERNAL_KEY is not configured");
  }
  if (key !== internalKey) {
    throw new Error("Invalid internal key");
  }
};

/**
 * Internal helper to ensure a customer row exists/updated.
 * Used within other mutations to avoid cross-calling mutations (and typegen timing issues).
 */
const ensureCustomer = async (
  ctx: any,
  args: { dodoCustomerId: string; email: string; name?: string; clerkUserId?: string }
) => {
  const now = Date.now();

  // Prefer dodoCustomerId
  const byDodo = await ctx.db
    .query("customers")
    .withIndex("by_dodo", (q: any) => q.eq("dodoCustomerId", args.dodoCustomerId))
    .collect();

  let existing = byDodo[0];

  if (!existing) {
    const byEmail = await ctx.db
      .query("customers")
      .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .collect();
    existing = byEmail[0];
  }

  if (existing) {
    await ctx.db.patch(existing._id, {
      dodoCustomerId: args.dodoCustomerId,
      email: args.email,
      name: args.name ?? existing.name,
      clerkUserId: args.clerkUserId ?? existing.clerkUserId,
      updatedAt: now,
    });
    return existing._id;
  }

  const id = await ctx.db.insert("customers", {
    dodoCustomerId: args.dodoCustomerId,
    email: args.email,
    name: args.name,
    clerkUserId: args.clerkUserId,
    createdAt: now,
    updatedAt: now,
  });
  return id;
};

/**
 * Upsert a Dodo customer mapping (Clerk > Dodo)
 * - Ensures we have a single customer row linked to a Dodo customer id, Clerk user id and email
 */
export const upsertCustomer = mutation({
  args: {
    internalKey: v.string(),
    dodoCustomerId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const now = Date.now();

    // Try locate by dodoCustomerId, then by clerkUserId, then by email
    const byDodo = await ctx.db
      .query("customers")
      .withIndex("by_dodo", (q) => q.eq("dodoCustomerId", args.dodoCustomerId))
      .collect();

    let existing =
      byDodo[0] ??
      (args.clerkUserId
        ? (
            await ctx.db
              .query("customers")
              .withIndex("by_clerk", (q) => q.eq("clerkUserId", args.clerkUserId!))
              .collect()
          )[0]
        : undefined) ??
      (
        await ctx.db
          .query("customers")
          .withIndex("by_email", (q) => q.eq("email", args.email))
          .collect()
      )[0];

    if (existing) {
      await ctx.db.patch(existing._id, {
        dodoCustomerId: args.dodoCustomerId,
        email: args.email,
        name: args.name ?? existing.name,
        clerkUserId: args.clerkUserId ?? existing.clerkUserId,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("customers", {
      dodoCustomerId: args.dodoCustomerId,
      email: args.email,
      name: args.name,
      clerkUserId: args.clerkUserId,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/**
 * Lookup customer mapping by Clerk user id
 */
export const getCustomerByClerk = query({
  args: {
    internalKey: v.string(),
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const rows = await ctx.db
      .query("customers")
      .withIndex("by_clerk", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();
    return rows[0] ?? null;
  },
});

/**
 * Upsert a Payment record from webhook payload
 */
export const upsertPayment = mutation({
  args: {
    internalKey: v.string(),
    paymentId: v.string(),
    dodoCustomerId: v.string(),
    status: v.union(
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled"),
      v.literal("processing"),
      v.literal("requires_customer_action"),
      v.literal("requires_merchant_action"),
      v.literal("requires_payment_method"),
      v.literal("requires_confirmation"),
      v.literal("requires_capture"),
      v.literal("partially_captured"),
      v.literal("partially_captured_and_capturable"),
    ),
    totalAmount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    paymentMethodType: v.optional(v.string()),
    metadata: v.optional(v.any()),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const now = Date.now();

    // Link customer row if we have basic info
    if (args.customerEmail) {
      await ensureCustomer(ctx, {
        dodoCustomerId: args.dodoCustomerId,
        email: args.customerEmail,
        name: args.customerName,
        clerkUserId: args.clerkUserId,
      });
    }

    const existing = (
      await ctx.db
        .query("payments")
        .withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId))
        .collect()
    )[0];

    if (existing) {
      await ctx.db.patch(existing._id, {
        dodoCustomerId: args.dodoCustomerId,
        status: args.status,
        totalAmount: args.totalAmount,
        currency: args.currency,
        paymentMethod: args.paymentMethod,
        paymentMethodType: args.paymentMethodType,
        metadata: args.metadata,
        updatedAt: now,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("payments", {
      paymentId: args.paymentId,
      dodoCustomerId: args.dodoCustomerId,
      status: args.status,
      totalAmount: args.totalAmount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      paymentMethodType: args.paymentMethodType,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

/**
 * Upsert a Subscription record from webhook payload
 */
export const upsertSubscription = mutation({
  args: {
    internalKey: v.string(),
    subscriptionId: v.string(),
    dodoCustomerId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("cancelled"),
      v.literal("failed"),
      v.literal("expired"),
    ),
    productId: v.optional(v.string()),
    quantity: v.optional(v.number()),
    nextBillingDate: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    metadata: v.optional(v.any()),
    customerEmail: v.optional(v.string()),
    customerName: v.optional(v.string()),
    clerkUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const now = Date.now();

    // Ensure customer row exists
    if (args.customerEmail) {
      await ensureCustomer(ctx, {
        dodoCustomerId: args.dodoCustomerId,
        email: args.customerEmail,
        name: args.customerName,
        clerkUserId: args.clerkUserId,
      });
    }

    const existing = (
      await ctx.db
        .query("subscriptions")
        .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
        .collect()
    )[0];

    const patch = {
      dodoCustomerId: args.dodoCustomerId,
      status: args.status,
      productId: args.productId,
      quantity: args.quantity,
      nextBillingDate: args.nextBillingDate,
      currentPeriodEnd: args.currentPeriodEnd,
      metadata: args.metadata,
      updatedAt: now,
    } as const;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    const id = await ctx.db.insert("subscriptions", {
      subscriptionId: args.subscriptionId,
      createdAt: now,
      ...patch,
    });
    return id;
  },
});

/**
 * Record a wallet ledger entry and update wallet balance
 * Positive amount for credit, negative for debit (isCredit controls sign application)
 */
export const recordWalletLedger = mutation({
  args: {
    internalKey: v.string(),
    dodoCustomerId: v.string(),
    currency: v.string(),
    amount: v.number(), // smallest unit
    isCredit: v.boolean(),
    reason: v.optional(v.string()),
    referenceObjectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const now = Date.now();

    const wallet = (
      await ctx.db
        .query("wallets")
        .withIndex("by_wallet_key", (q) =>
          q.eq("dodoCustomerId", args.dodoCustomerId).eq("currency", args.currency),
        )
        .collect()
    )[0];

    const before = wallet?.balance ?? 0;
    const delta = args.isCredit ? args.amount : -args.amount;
    const after = before + delta;

    // Upsert wallet
    if (wallet) {
      await ctx.db.patch(wallet._id, { balance: after, updatedAt: now });
    } else {
      await ctx.db.insert("wallets", {
        dodoCustomerId: args.dodoCustomerId,
        currency: args.currency,
        balance: after,
        updatedAt: now,
      });
    }

    // Insert ledger record
    const id = await ctx.db.insert("wallet_ledger", {
      dodoCustomerId: args.dodoCustomerId,
      currency: args.currency,
      amount: Math.abs(args.amount),
      isCredit: args.isCredit,
      reason: args.reason,
      referenceObjectId: args.referenceObjectId,
      beforeBalance: before,
      afterBalance: after,
      createdAt: now,
    });

    return id;
  },
});

/**
 * Persist raw webhook payload (for auditing / replays)
 */
export const recordWebhookEvent = mutation({
  args: {
    internalKey: v.string(),
    type: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const id = await ctx.db.insert("billing_webhook_events", {
      type: args.type,
      payload: args.payload,
      createdAt: Date.now(),
    });
    return id;
  },
});