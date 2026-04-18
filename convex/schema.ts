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
    iterationMode: v.optional(v.boolean()),
    iterationData: v.optional(
      v.object({
        iterations: v.array(
          v.object({
            iterationNumber: v.number(),
            code: v.string(),
            executionResult: v.optional(v.string()),
            reasoning: v.optional(v.string()),
            timestamp: v.number(),
          })
        ),
        sandboxId: v.optional(v.string()),
        finalOutput: v.optional(v.string()),
        status: v.union(
          v.literal("running"),
          v.literal("completed"),
          v.literal("failed")
        ),
        maxIterations: v.optional(v.number()),
        currentIteration: v.optional(v.number()),
        testCommand: v.optional(v.string()),
        language: v.optional(v.union(v.literal("javascript"), v.literal("typescript"), v.literal("python"))),
      })
    ),
    imageUrls: v.optional(v.array(v.string())),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_project_status", ["projectId", "status"]),

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

  build_validations: defineTable({
    messageId: v.id("messages"),
    projectId: v.id("projects"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("passed"),
      v.literal("failed"),
      v.literal("skipped"),
    ),
    command: v.optional(v.string()),
    exitCode: v.optional(v.number()),
    output: v.optional(v.string()),
    errorOutput: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_project", ["projectId"]),

  api_keys: defineTable({
    keyHash: v.string(),
    clerkUserId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_key_hash", ["keyHash"])
    .index("by_user", ["clerkUserId"]),

  e2b_sandboxes: defineTable({
    conversationId: v.id("conversations"),
    messageId: v.optional(v.id("messages")),
    sandboxId: v.string(),
    status: v.union(v.literal("active"), v.literal("paused"), v.literal("destroyed")),
    createdAt: v.number(),
    lastUsedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"])
    .index("by_message", ["messageId"])
    .index("by_sandbox_id", ["sandboxId"]),

  preview_captures: defineTable({
    messageId: v.id("messages"),
    projectId: v.id("projects"),
    status: v.union(v.literal("pending"), v.literal("running"), v.literal("completed"), v.literal("failed")),
    viewport: v.optional(v.object({
      width: v.number(),
      height: v.number(),
    })),
    imageStorageId: v.optional(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    durationMs: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_project", ["projectId"]),
});
