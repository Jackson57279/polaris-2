# App Router

Next.js 16 App Router with page routes and API routes.

## Overview

Next.js App Router (App Router only, no Pages Router). Page routes for UI, API routes for backend endpoints.

## Page Routes

| Route | File | Purpose |
|-------|------|---------|
| `/` | `page.tsx` | Home/landing |
| `/projects/[projectId]` | `projects/[projectId]/page.tsx` | Project workspace |
| `/pricing` | `pricing/page.tsx` | Pricing page |
| `/blog` | `blog/page.tsx` | Blog listing |
| `/blog/[slug]` | `blog/[slug]/page.tsx` | Blog post |
| `/settings` | `settings/page.tsx` | User settings |
| `/customer-portal` | `customer-portal/[[...customerPortal]]/page.tsx` | Billing portal |

## API Routes

| Route | File | Purpose |
|-------|------|---------|
| `/api/messages` | `api/messages/route.ts` | Chat messages |
| `/api/messages/cancel` | `api/messages/cancel/route.ts` | Cancel message |
| `/api/suggestion` | `api/suggestion/route.ts` | AI inline suggestions |
| `/api/quick-edit` | `api/quick-edit/route.ts` | Cmd+K quick edits |
| `/api/mcp` | `api/mcp/route.ts` | MCP server (604 lines, large) |
| `/api/mcp/keys` | `api/mcp/keys/route.ts` | MCP key management |
| `/api/github/import` | `api/github/import/route.ts` | Import from GitHub |
| `/api/github/export` | `api/github/export/route.ts` | Export to GitHub |
| `/api/figma/import` | `api/figma/import/route.ts` | Import from Figma |
| `/api/deploy/vercel` | `api/deploy/vercel/route.ts` | Deploy to Vercel |
| `/api/deploy/netlify` | `api/deploy/netlify/route.ts` | Deploy to Netlify |
| `/api/inngest` | `api/inngest/route.ts` | Inngest webhook |
| `/api/uploadthing` | `api/uploadthing/route.ts` | File uploads |
| `/api/wallet/ledger` | `api/wallet/ledger/route.ts` | Credit ledger |
| `/api/enhance-prompt` | `api/enhance-prompt/route.ts` | Prompt enhancement |
| `/api/projects/create-with-prompt` | `api/projects/create-with-prompt/route.ts` | AI project creation |

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| API endpoints | `api/*/route.ts` | Follow App Router `route.ts` pattern |
| AI endpoints | `api/suggestion/`, `api/quick-edit/` | Uses OpenRouter |
| GitHub integration | `api/github/` | Import/export repos |
| Figma import | `api/figma/import/` | Figma file import |
| Deployment | `api/deploy/` | Vercel/Netlify APIs |
| MCP server | `api/mcp/route.ts` | Large file (604 lines) |
| File uploads | `api/uploadthing/` | Uploadthing integration |
| Billing | `api/wallet/ledger/` | Wallet ledger API |
| Page routes | `[route]/page.tsx` | Next.js App Router pages |
| Layout | `layout.tsx` | Root layout |
| Global styles | `globals.css` | Tailwind 4 CSS |

## Conventions

- App Router pattern: `route.ts` for APIs, `page.tsx` for pages, `layout.tsx` for layouts
- API routes export async functions (GET, POST, PUT, DELETE)
- Route handlers return `Response` objects
- Dynamic routes use `[param]` syntax
- Catch-all routes use `[...param]` syntax

## Anti-Patterns

- **Don't** use Pages Router patterns (no `pages/` directory)
- **Don't** mix API and page logic in same file
- Keep API routes focused on single responsibility
- **Don't** use `getServerSideProps` or `getStaticProps`

## Notes

- **Large file**: `api/mcp/route.ts` at 604 lines — MCP server implementation
- **AI endpoints**: suggestion and quick-edit use OpenRouter via `@ai-sdk/openai-compatible`
- **Webhooks**: Clerk webhook handler at root level
- **Real-time**: Messages API streams responses
