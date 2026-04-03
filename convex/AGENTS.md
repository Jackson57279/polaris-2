# Convex Backend

Convex backend-as-a-service for real-time data and serverless functions.

## Overview

Database, real-time sync, and serverless functions. Clerk integration for auth. 11 TypeScript files defining tables, queries, mutations, and actions.

## Structure

```
convex/
├── schema.ts           # Database table definitions
├── system.ts           # Main backend logic (23k lines)
├── billing.ts          # Wallet, subscriptions, payments
├── files.ts            # File storage operations
├── conversations.ts    # Chat conversations
├── projects.ts         # Project CRUD
├── clerk.ts            # Clerk auth integration
├── actions.ts          # Convex actions
├── http.ts             # HTTP actions
├── auth.ts             # Auth helpers
├── auth.config.ts      # Auth configuration
└── _generated/         # Auto-generated types
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add database table | `schema.ts` | Follow existing table patterns with indexes |
| Project operations | `projects.ts` | Project CRUD, status tracking |
| File operations | `files.ts` | File storage, parent-child relationships |
| Billing logic | `billing.ts` | Wallet ledger, subscriptions, payments |
| Auth integration | `clerk.ts` | Clerk user sync, auth checks |
| Chat features | `conversations.ts` | Messages, conversations |
| System logic | `system.ts` | Large file (23k lines), main backend logic |
| HTTP endpoints | `http.ts` | HTTP action definitions |

## Conventions

- Use Convex validators (`v.string()`, `v.id()`) for table fields
- Define indexes for queries: `.index("by_field", ["field"])`
- Composite indexes for multi-field queries
- Clerk user ID stored as `clerkUserId` string
- Timestamps as `v.number()` (unix ms)

## Anti-Patterns

- **Never** modify `_generated/` files (auto-generated)
- **Don't** add heavy logic to `schema.ts` (keep it declarative)
- **Don't** use Convex for long-running tasks (use Inngest instead)
- **Never** store secrets in Convex tables

## Notes

- **Large file**: `system.ts` is 23k lines — most backend logic lives here
- **Real-time**: Convex provides automatic real-time sync to frontend
- **Auth**: Clerk handles auth, Convex stores user data via `clerk.ts`
- **Billing**: Custom wallet ledger implementation in `billing.ts`
