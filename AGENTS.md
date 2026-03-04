# AGENTS.md – Polaris codebase context for AI agents

Polaris is a browser-based cloud IDE (Cursor-style): projects, file explorer, CodeMirror editor, AI conversation assistant with file tools, WebContainer preview/terminal, GitHub import/export, and optional deploy (Vercel/Netlify). Use this file for consistent edits, conventions, and where to add code.

---

## Tech stack

| Layer | Tech |
|-------|------|
| **Package manager** | **bun** (use `bun install`, `bun run …`, `bun test`) |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Editor** | CodeMirror 6, custom extensions (suggestion, quick-edit, minimap, theme, language) |
| **Backend / DB** | Convex (real-time DB, auth via JWT from Clerk) |
| **Background jobs** | Inngest (e.g. `process-message`, import/export, deploy) |
| **AI** | OpenRouter via `@ai-sdk/openai-compatible`; Vercel AI SDK (`ai`, `generateText`, streamText); AgentKit for conversation agent + tools |
| **Auth** | Clerk (GitHub OAuth); Convex `verifyAuth` uses `ctx.auth.getUserIdentity()` |
| **Execution / preview** | WebContainer API, xterm.js |
| **UI** | shadcn/ui, Radix, `class-variance-authority`, `tailwind-merge`, `clsx` |

---

## Repository layout

- **`src/app/`** – Next.js App Router: `page.tsx`, `layout.tsx`, `api/` routes.
- **`src/features/`** – Feature modules; prefer adding/changing code here over ad-hoc `src/components` when it’s feature-specific.
  - **`auth/`** – Unauthenticated / loading views (Clerk used in app/layout and API).
  - **`conversations/`** – Chat UI, hooks, and **Inngest**: `inngest/process-message.ts`, `inngest/tools/*`, `inngest/constants.ts` (system prompts).
  - **`editor/`** – CodeMirror: `code-editor.tsx`, extensions (suggestion, quick-edit, minimap, theme, language), store, breadcrumbs.
  - **`preview/`** – WebContainer boot, terminal, preview settings.
  - **`projects/`** – Project list/detail, file explorer, navbar, deploy/export/import dialogs, and project-related Inngest (import-github-repo, export-to-github).
- **`src/components/`** – Shared: `ui/` (shadcn), `ai-elements/` (chat UI), `sidebar`.
- **`src/lib/`** – Shared libs: `convex-client.ts` (ConvexHttpClient for server/Inngest), `convex-server.ts` if used, `uploadthing.ts`, `firecrawl.ts`, `utils.ts`.
- **`src/inngest/`** – Inngest client and function registration: `client.ts`, `functions.ts` (register all Inngest functions).
- **`convex/`** – Convex backend: `schema.ts`, `auth.config.ts`, `auth.ts` (verifyAuth), `http.ts` (Clerk webhook), `clerk.ts`, `billing.ts`, `projects.ts`, `files.ts`, `conversations.ts`, `actions.ts`, **`system.ts`** (internal-only API for Inngest/server).
- **`test/`** – Tests (e.g. `bun test`); e.g. `openrouter-integration.test.ts`.

Path alias: **`@/`** → `src/` (e.g. `@/lib/convex-client`, `@/inngest/client`, `@/features/...`).

---

## Convex: public vs internal (system)

- **Public API** – `convex/projects.ts`, `files.ts`, `conversations.ts`, etc. Called from the frontend with Convex React client; all handlers use **`verifyAuth(ctx)`** and enforce `project.ownerId === identity.subject` (or equivalent) for access.
- **Internal API** – `convex/system.ts`. Used only by Next.js API routes and Inngest (server-side). Every function takes **`internalKey: v.string()`** and validates it against **`process.env.POLARIS_CONVEX_INTERNAL_KEY`**; no user identity. Used for: creating/updating messages, conversation title, project/files CRUD for the agent, import/export/deploy status, etc.
- **Calling Convex from server/Inngest** – Use **`ConvexHttpClient`** from `@/lib/convex-client` with `NEXT_PUBLIC_CONVEX_URL` and pass `internalKey` for all `api.system.*` calls. Never expose `internalKey` to the client.
- **Indexes** – Prefer querying by index (e.g. `by_owner`, `by_project`, `by_conversation`, `by_project_status`) instead of full-table scans.

---

## Inngest

- **Client** – `src/inngest/client.ts` (Inngest instance; Sentry middleware). Use this to `inngest.send({ name: "event/name", data: { ... } })`.
- **Registration** – All functions are registered and served from **`src/inngest/functions.ts`**; the Inngest dev server hits **`/api/inngest`**.
- **Conversation agent** – Event **`message/sent`** triggers **`process-message`** in `src/features/conversations/inngest/process-message.ts`. It uses AgentKit, OpenRouter, and Convex `api.system.*` for messages and file tools. Cancellation: **`message/cancel`** and `cancelOn` for in-flight runs.
- **Tools** – File operations are implemented under `src/features/conversations/inngest/tools/` (read-files, list-files, update-file, create-files, create-folder, rename-file, delete-files, scrape-urls). They call Convex system API with `internalKey`.
- **Other flows** – GitHub import/export and deploy are in `src/features/projects/inngest/` and use system mutations for status updates.

---

## AI and OpenRouter

- **Provider** – OpenRouter via **`@ai-sdk/openai-compatible`**: `createOpenAICompatible({ name: 'openrouter', apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1' })`. Model is passed as e.g. `openrouter("x-ai/grok-4.1-fast")` or as configured in `process-message.ts`.
- **Where used** – Conversation agent (process-message), suggestion API (`src/app/api/suggestion/route.ts`), quick-edit API (`src/app/api/quick-edit/route.ts`), and demo Inngest in `src/inngest/functions.ts`. Store API keys in **`.env` / `.env.local`** (never hardcode).
- **System prompts** – `src/features/conversations/inngest/constants.ts`: `CODING_AGENT_SYSTEM_PROMPT`, `TITLE_GENERATOR_SYSTEM_PROMPT`. Agent is instructed to use listFiles/readFiles, then create/update/rename/delete via tools and to prefer **bun** for user-facing package manager (WebContainer preview still uses npm).

---

## Auth (Clerk)

- **App** – Clerk in `src/app/layout.tsx`; protected routes rely on Clerk + Convex `verifyAuth` in Convex handlers.
- **Webhooks** – Clerk webhook is **POST `/api/webhooks/clerk`** (or similar); Convex receives via `http.ts` and `internal.clerk.handleClerkWebhook`. Billing webhook uses **`CLERK_WEBHOOK_SIGNING_SECRET`** and is documented in README.
- **Convex** – `convex/auth.config.ts` uses Clerk JWT issuer; `convex/auth.ts` exports `verifyAuth(ctx)` for use in every public Convex handler.

---

## Billing (Clerk Billing + Convex ledger)

- **Tables** – `payments`, `subscriptions`, `wallets`, `wallet_ledger`, `billing_webhook_events` in `convex/schema.ts`. Mutations in **`convex/billing.ts`** (upsert payment/subscription, record ledger, webhook event).
- **Routes** – Pricing: `/pricing`; customer portal: `/customer-portal/[[...customerPortal]]`; wallet ledger (admin): **POST `/api/wallet/ledger`** (uses `POLARIS_CONVEX_INTERNAL_KEY` or equivalent server-side auth). Env: **`CLERK_WEBHOOK_SIGNING_SECRET`**, **`POLARIS_CONVEX_INTERNAL_KEY`**.

---

## Environment variables (reference)

- **Clerk:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN`, `CLERK_WEBHOOK_SIGNING_SECRET`
- **Convex:** `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, **`POLARIS_CONVEX_INTERNAL_KEY`**
- **AI:** **`OPENROUTER_API_KEY`** (used by API routes and Inngest)
- **Optional:** `SENTRY_DSN`, `FIRECRAWL_API_KEY`; deploy (Vercel/Netlify) use their own env in API routes.

Copy from **`.env.example`**; never commit secrets. Use **bun** for install/scripts.

---

## Scripts (bun)

- **`bun run dev`** – Next.js dev server.
- **`bun run build`** – Next.js production build (prefer this unless user asks to run dev).
- **`bun run start`** – Next.js production server.
- **`bun run lint`** – ESLint.
- **`bun test`** – Run tests.

Convex: **`npx convex dev`** (development). Inngest: **`npx inngest-cli@latest dev`** for local event processing.

---

## Conventions for agents

1. **TypeScript** – Strict mode; avoid **`any`**; use proper types from `convex/_generated/dataModel` (e.g. `Id<"projects">`) and from Convex validators.
2. **Imports** – Prefer **`@/`** for app code; Convex code uses relative imports to `./_generated/api` and `./_generated/server`.
3. **Secrets** – No hardcoded API keys or internal keys; use `.env` / `.env.local` and `process.env`.
4. **Convex** – Public handlers: always **`verifyAuth(ctx)`** and check resource ownership. Server/Inngest-only: use **`api.system.*`** with **`internalKey`**.
5. **Comments** – Prefer minimal comments; let code and naming be clear.
6. **Package manager** – Use **bun** for this repo (install, run, test). In agent instructions to users for local commands, recommend **bun**; for in-browser WebContainer, only npm is assumed.
7. **New features** – Add under **`src/features/<feature>/`** (components, hooks, inngest, constants). Shared UI in **`src/components/ui/`** or **`src/components/ai-elements/`**. New Convex tables/functions: **`convex/schema.ts`** and appropriate module (`projects`, `files`, `conversations`, **`system`** for internal-only). New Inngest functions: implement then register in **`src/inngest/functions.ts`**.
8. **API routes** – Next.js Route Handlers under `src/app/api/`; validate input (e.g. Zod), use Clerk `auth()` for user, use `convex` from `@/lib/convex-client` and `internalKey` when calling `api.system.*`.

---

## Quick reference: where to change what

| Change | Location |
|--------|----------|
| Conversation agent system prompt | `src/features/conversations/inngest/constants.ts` |
| Message processing / tools | `src/features/conversations/inngest/process-message.ts`, `.../tools/*.ts` |
| AI model / OpenRouter config | `process-message.ts`; `src/app/api/suggestion/route.ts`; `src/app/api/quick-edit/route.ts`; `src/inngest/functions.ts` |
| Convex schema | `convex/schema.ts` |
| Internal Convex API (Inngest/server) | `convex/system.ts` |
| Public Convex API (frontend) | `convex/projects.ts`, `files.ts`, `conversations.ts`, etc. |
| Inngest events and functions | `src/inngest/client.ts`, `src/inngest/functions.ts`; feature-specific inngest under `src/features/*/inngest/` |
| Send message / cancel | `src/app/api/messages/route.ts`, `src/app/api/messages/cancel/route.ts` |
| Editor behavior / extensions | `src/features/editor/` |
| File explorer / project UI | `src/features/projects/components/` |
| Deploy (Vercel/Netlify) | `src/features/projects/hooks/use-deploy.ts`, `src/app/api/deploy/vercel/route.ts`, `src/app/api/deploy/netlify/route.ts` |
| GitHub import/export | `src/app/api/github/import/route.ts`, `.../export/route.ts`; `src/features/projects/inngest/import-github-repo.ts`, `export-to-github.ts` |

Use this file as the single source of context for structure, conventions, and where to add or modify code.

---

## Sub-Documentation

| Directory | See |
|-----------|-----|
| `convex/` | `convex/AGENTS.md` – Backend patterns, schema, indexes |
| `src/features/conversations/` | `src/features/conversations/AGENTS.md` – Inngest, AI tools |
| `src/features/editor/` | `src/features/editor/AGENTS.md` – CodeMirror, extensions |
| `src/features/projects/` | `src/features/projects/AGENTS.md` – File explorer, deploy |
| `src/components/ai-elements/` | `src/components/ai-elements/AGENTS.md` – AI UI components |

