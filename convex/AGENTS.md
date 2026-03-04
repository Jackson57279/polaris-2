# convex/AGENTS.md – Convex Backend Patterns

**Scope:** Database schema, public vs internal API, auth patterns, indexes.

---

## Architecture

Polaris uses Convex as its real-time database with a **dual API pattern**:

| API Type | Files | Auth | Caller |
|----------|-------|------|--------|
| **Public** | `projects.ts`, `files.ts`, `conversations.ts` | `verifyAuth(ctx)` + owner check | Frontend React |
| **Internal** | `system.ts` (666 lines) | `internalKey` env var | Inngest, API routes |

---

## Public API Pattern

```typescript
// convex/projects.ts
import { query } from "./_generated/server";
import { verifyAuth } from "./auth";

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (project?.ownerId !== identity.subject) {
      throw new Error("Unauthorized");
    }
    return project;
  },
});
```

**Required:** Every public handler must:
1. Call `verifyAuth(ctx)`
2. Verify `project.ownerId === identity.subject`

---

## Internal API Pattern

```typescript
// convex/system.ts
const validateInternalKey = (key: string) => {
  if (key !== process.env.POLARIS_CONVEX_INTERNAL_KEY) {
    throw new Error("Invalid internal key");
  }
};

export const createMessage = mutation({
  args: { internalKey: v.string(), ... },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    // ... no user auth checks
  },
});
```

**Called from:** Inngest functions, Next.js API routes via `ConvexHttpClient`.

**Never expose:** `internalKey` to frontend.

---

## Database Schema (9 Tables)

```typescript
// convex/schema.ts
tables: {
  projects: { name, ownerId, updatedAt, importStatus, ... }
  files: { projectId, parentId, name, type, content, storageId }
  conversations: { projectId, title, updatedAt }
  messages: { conversationId, projectId, role, content, status }
  payments: { paymentId, clerkUserId, status, amount }
  subscriptions: { subscriptionId, clerkUserId, status, planId }
  wallets: { clerkUserId, currency, balance }
  wallet_ledger: { clerkUserId, amount, beforeBalance, afterBalance }
  billing_webhook_events: { type, payloadJson }
}
```

---

## Index Naming Convention

Pattern: `by_<field>` or `by_<field1>_<field2>`

| Table | Index | Fields | Purpose |
|-------|-------|--------|---------|
| projects | `by_owner` | `["ownerId"]` | List user's projects |
| files | `by_project` | `["projectId"]` | All project files |
| files | `by_project_parent` | `["projectId", "parentId"]` | Files in folder |
| messages | `by_conversation` | `["conversationId"]` | Chat history |
| messages | `by_project_status` | `["projectId", "status"]` | Find processing msgs |
| subscriptions | `by_clerk_user_status` | `["clerkUserId", "status"]` | Active sub check |

**Usage:**
```typescript
.withIndex("by_project_parent", (q) => 
  q.eq("projectId", args.projectId).eq("parentId", args.parentId)
)
```

---

## Clerk Integration

```typescript
// convex/auth.config.ts
export default {
  providers: [{
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN!,
    applicationID: "convex",
  }],
};

// convex/auth.ts
export const verifyAuth = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  return identity; // identity.subject = Clerk user ID
};
```

---

## Key Backend Modules

| File | Purpose | API Type |
|------|---------|----------|
| `schema.ts` | 9 tables, 15 indexes | Config |
| `auth.ts` | `verifyAuth()` helper | Shared |
| `system.ts` | Internal API (27 mutations/queries) | Internal |
| `projects.ts` | Project CRUD | Public |
| `files.ts` | File/folder operations | Public |
| `conversations.ts` | Conversations, messages | Public |
| `billing.ts` | Payments, subscriptions | Mixed |
| `clerk.ts` | Webhook handlers | Internal |

---

## Common Operations

```typescript
// Insert
const id = await ctx.db.insert("projects", { name, ownerId, updatedAt: Date.now() });

// Get
const doc = await ctx.db.get("projects", id);

// Patch
await ctx.db.patch("projects", id, { name: newName, updatedAt: Date.now() });

// Query with index
const docs = await ctx.db.query("files")
  .withIndex("by_project", (q) => q.eq("projectId", projectId))
  .collect();

// Paginate
const { page, continueCursor } = await ctx.db.query("messages")
  .withIndex("by_conversation", (q) => q.eq("conversationId", convId))
  .order("desc")
  .paginate(paginationOpts);
```

---

## Where to Add Code

| Task | Location |
|------|----------|
| New table | `schema.ts` → add table + indexes |
| New public API | `convex/{domain}.ts` → use `verifyAuth` pattern |
| New internal API | `convex/system.ts` → add with `internalKey` |
| Webhook handler | `convex/clerk.ts` + `http.ts` |

---

## Calling from Server/Inngest

```typescript
import { convex } from "@/lib/convex-client";
import { api } from "@/../convex/_generated/api";

await convex.mutation(api.system.createMessage, {
  internalKey: process.env.POLARIS_CONVEX_INTERNAL_KEY!,
  conversationId: "...",
  content: "...",
  role: "assistant",
});
```
