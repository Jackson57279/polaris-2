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
    deploymentStatus: v.optional(
      v.union(
        v.literal("deploying"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    deploymentProvider: v.optional(
      v.union(v.literal("vercel"), v.literal("netlify")),
    ),
    deploymentUrl: v.optional(v.string()),
    deploymentProjectId: v.optional(v.string()),
    deploymentSiteId: v.optional(v.string()),
    deploymentError: v.optional(v.string()),
    settings: v.optional(
      v.object({
        installCommand: v.optional(v.string()),
        devCommand: v.optional(v.string()),
        buildCommand: v.optional(v.string()),
        outputDir: v.optional(v.string()),
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
    toolCalls: v.optional(
      v.array(
        v.object({
          toolName: v.string(),
          label: v.string(),
        })
      )
    ),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_project_status", ["projectId", "status"]),

  payments: defineTable({
    paymentId: v.string(),
    clerkUserId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
    ),
    totalAmount: v.number(),
    currency: v.string(),
    paymentMethod: v.optional(v.string()),
    paymentMethodType: v.optional(v.string()),
    metadataJson: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_payment", ["paymentId"])
    .index("by_clerk_user", ["clerkUserId"]),

  subscriptions: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subscription", ["subscriptionId"])
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_clerk_user_status", ["clerkUserId", "status"]),

  wallets: defineTable({
    clerkUserId: v.string(),
    currency: v.string(),
    balance: v.number(),
    updatedAt: v.number(),
  })
    .index("by_wallet_key", ["clerkUserId", "currency"]),

  wallet_ledger: defineTable({
    clerkUserId: v.string(),
    currency: v.string(),
    amount: v.number(),
    isCredit: v.boolean(),
    reason: v.optional(v.string()),
    referenceObjectId: v.optional(v.string()),
    beforeBalance: v.optional(v.number()),
    afterBalance: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_ledger_customer", ["clerkUserId"]),

  billing_webhook_events: defineTable({
    type: v.string(),
    payloadJson: v.string(),
    createdAt: v.number(),
  }).index("by_type", ["type"]),

  agent_run_artifacts: defineTable({
    messageId: v.id("messages"),
    workerType: v.union(
      v.literal("repo_research"),
      v.literal("exa_research"),
      v.literal("review"),
    ),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    summary: v.optional(v.string()),
    payload: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_message_worker", ["messageId", "workerType"]),

  api_keys: defineTable({
    keyHash: v.string(),
    clerkUserId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_key_hash", ["keyHash"])
    .index("by_user", ["clerkUserId"]),
});
