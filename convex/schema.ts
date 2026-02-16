import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    name: v.string(),
    ownerId: v.string(),
    updatedAt: v.number(),
    importStatus: v.optional(
      v.union(
        v.literal("importing"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    exportStatus: v.optional(
      v.union(
        v.literal("exporting"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled"),
      ),
    ),
    exportRepoUrl: v.optional(v.string()),
    settings: v.optional(
      v.object({
        installCommand: v.optional(v.string()),
        devCommand: v.optional(v.string()),
      })
    ),
  }).index("by_owner", ["ownerId"]),

  files: defineTable({
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    type: v.union(v.literal("file"), v.literal("folder")),
    content: v.optional(v.string()), // Text files only
    storageId: v.optional(v.id("_storage")), // Binary files only
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_parent", ["parentId"])
    .index("by_project_parent", ["projectId", "parentId"]),

  conversations: defineTable({
    projectId: v.id("projects"),
    title: v.string(),
    updatedAt: v.number(),
  }).index("by_project", ["projectId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    projectId: v.id("projects"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled")
      )
    ),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_project_status", ["projectId", "status"]),

  customers: defineTable({
    clerkUserId: v.optional(v.string()),
    dodoCustomerId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk", ["clerkUserId"])
    .index("by_dodo", ["dodoCustomerId"])
    .index("by_email", ["email"]),

  payments: defineTable({
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
      v.literal("partially_captured_and_capturable")
    ),
    totalAmount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    paymentMethodType: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_payment", ["paymentId"])
    .index("by_customer", ["dodoCustomerId"]),

  subscriptions: defineTable({
    subscriptionId: v.string(),
    dodoCustomerId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("on_hold"),
      v.literal("cancelled"),
      v.literal("failed"),
      v.literal("expired")
    ),
    productId: v.optional(v.string()),
    quantity: v.optional(v.number()),
    nextBillingDate: v.optional(v.number()),
    currentPeriodEnd: v.optional(v.number()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subscription", ["subscriptionId"])
    .index("by_sub_customer", ["dodoCustomerId"]),

  wallets: defineTable({
    dodoCustomerId: v.string(),
    currency: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  })
    .index("by_wallet_key", ["dodoCustomerId", "currency"]),

  wallet_ledger: defineTable({
    dodoCustomerId: v.string(),
    currency: v.string(),
    amount: v.number(),
    isCredit: v.boolean(),
    reason: v.optional(v.string()),
    referenceObjectId: v.optional(v.string()),
    beforeBalance: v.optional(v.number()),
    afterBalance: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_ledger_customer", ["dodoCustomerId"]),

  billing_webhook_events: defineTable({
    type: v.string(),
    payload: v.any(),
    createdAt: v.number(),
  }).index("by_type", ["type"])
});
