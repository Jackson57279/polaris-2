import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

const validateInternalKey = (key: string) => {
  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
  if (!internalKey) {
    throw new Error("POLARIS_CONVEX_INTERNAL_KEY is not configured");
  }
  if (key !== internalKey) {
    throw new Error("Invalid internal key");
  }
};

export const upsertPaymentInternal = internalMutation({
  args: {
    paymentId: v.string(),
    clerkUserId: v.string(),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    totalAmount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    paymentMethodType: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("payments")
      .withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clerkUserId: args.clerkUserId,
        status: args.status,
        totalAmount: args.totalAmount,
        currency: args.currency,
        paymentMethod: args.paymentMethod,
        paymentMethodType: args.paymentMethodType,
        metadataJson: args.metadataJson,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("payments", {
      paymentId: args.paymentId,
      clerkUserId: args.clerkUserId,
      status: args.status,
      totalAmount: args.totalAmount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      paymentMethodType: args.paymentMethodType,
      metadataJson: args.metadataJson,
      createdAt: now,
      updatedAt: now,
    });
  }
});

export const upsertSubscriptionInternal = internalMutation({
  args: {
    subscriptionId: v.string(),
    clerkUserId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("incomplete"),
      v.literal("upcoming"),
      v.literal("ended"),
      v.literal("abandoned"),
    ),
    planId: v.optional(v.string()),
    planSlug: v.optional(v.string()),
    quantity: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    metadataJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clerkUserId: args.clerkUserId,
        status: args.status,
        planId: args.planId,
        planSlug: args.planSlug,
        quantity: args.quantity,
        currentPeriodEnd: args.currentPeriodEnd,
        metadataJson: args.metadataJson,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", {
      subscriptionId: args.subscriptionId,
      clerkUserId: args.clerkUserId,
      status: args.status,
      planId: args.planId,
      planSlug: args.planSlug,
      quantity: args.quantity,
      currentPeriodEnd: args.currentPeriodEnd,
      metadataJson: args.metadataJson,
      createdAt: now,
      updatedAt: now,
    });
  }
});

export const recordWebhookEventInternal = internalMutation({
  args: {
    type: v.string(),
    payloadJson: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("billing_webhook_events", {
      type: args.type,
      payloadJson: args.payloadJson,
      createdAt: Date.now(),
    });
  }
});

export const upsertPayment = mutation({
  args: {
    internalKey: v.string(),
    paymentId: v.string(),
    clerkUserId: v.string(),
    status: v.union(v.literal("pending"), v.literal("paid"), v.literal("failed")),
    totalAmount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    paymentMethodType: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const now = Date.now();

    const existing = (
      await ctx.db
        .query("payments")
        .withIndex("by_payment", (q) => q.eq("paymentId", args.paymentId))
        .collect()
    )[0];

    if (existing) {
      await ctx.db.patch(existing._id, {
        clerkUserId: args.clerkUserId,
        status: args.status,
        totalAmount: args.totalAmount,
        currency: args.currency,
        paymentMethod: args.paymentMethod,
        paymentMethodType: args.paymentMethodType,
        metadataJson: args.metadataJson,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("payments", {
      paymentId: args.paymentId,
      clerkUserId: args.clerkUserId,
      status: args.status,
      totalAmount: args.totalAmount,
      currency: args.currency,
      paymentMethod: args.paymentMethod,
      paymentMethodType: args.paymentMethodType,
      metadataJson: args.metadataJson,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertSubscription = mutation({
  args: {
    internalKey: v.string(),
    subscriptionId: v.string(),
    clerkUserId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("past_due"),
      v.literal("canceled"),
      v.literal("incomplete"),
      v.literal("upcoming"),
      v.literal("ended"),
      v.literal("abandoned"),
    ),
    planId: v.optional(v.string()),
    planSlug: v.optional(v.string()),
    quantity: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    metadataJson: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const now = Date.now();

    const existing = (
      await ctx.db
        .query("subscriptions")
        .withIndex("by_subscription", (q) => q.eq("subscriptionId", args.subscriptionId))
        .collect()
    )[0];

    if (existing) {
      await ctx.db.patch(existing._id, {
        clerkUserId: args.clerkUserId,
        status: args.status,
        planId: args.planId,
        planSlug: args.planSlug,
        quantity: args.quantity,
        currentPeriodEnd: args.currentPeriodEnd,
        metadataJson: args.metadataJson,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("subscriptions", {
      subscriptionId: args.subscriptionId,
      clerkUserId: args.clerkUserId,
      status: args.status,
      planId: args.planId,
      planSlug: args.planSlug,
      quantity: args.quantity,
      currentPeriodEnd: args.currentPeriodEnd,
      metadataJson: args.metadataJson,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const recordWalletLedger = mutation({
  args: {
    internalKey: v.string(),
    clerkUserId: v.string(),
    currency: v.string(),
    amount: v.number(),
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
          q.eq("clerkUserId", args.clerkUserId).eq("currency", args.currency),
        )
        .collect()
    )[0];

    const beforeBalance = wallet?.balance ?? 0;
    const delta = args.isCredit ? args.amount : -args.amount;
    const afterBalance = beforeBalance + delta;

    if (wallet) {
      await ctx.db.patch(wallet._id, { balance: afterBalance, updatedAt: now });
    } else {
      await ctx.db.insert("wallets", {
        clerkUserId: args.clerkUserId,
        currency: args.currency,
        balance: afterBalance,
        updatedAt: now,
      });
    }

    return await ctx.db.insert("wallet_ledger", {
      clerkUserId: args.clerkUserId,
      currency: args.currency,
      amount: Math.abs(args.amount),
      isCredit: args.isCredit,
      reason: args.reason,
      referenceObjectId: args.referenceObjectId,
      beforeBalance,
      afterBalance,
      createdAt: now,
    });
  },
});

export const recordWebhookEvent = mutation({
  args: {
    internalKey: v.string(),
    type: v.string(),
    payloadJson: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db.insert("billing_webhook_events", {
      type: args.type,
      payloadJson: args.payloadJson,
      createdAt: Date.now(),
    });
  },
});

// Authenticated queries — called from the frontend with a Clerk JWT (no internal key needed)

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const clerkUserId = identity.subject;

    // Return the most recent active subscription
    const active = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user_status", (q) =>
        q.eq("clerkUserId", clerkUserId).eq("status", "active")
      )
      .first();

    if (active) return active;

    // Fall back to the most recently updated subscription for any status
    const latest = await ctx.db
      .query("subscriptions")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", clerkUserId))
      .order("desc")
      .first();

    return latest ?? null;
  },
});

export const getMyWallet = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    return await ctx.db
      .query("wallets")
      .withIndex("by_wallet_key", (q) =>
        q.eq("clerkUserId", identity.subject).eq("currency", "USD")
      )
      .first();
  },
});

export const getMyPayments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return await ctx.db
      .query("payments")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .collect();
  },
});
