# Luminaweb

Browser-based AI code editor. Cloud IDE with AI agent that edits files, in-browser terminal via WebContainer, and real-time sync via Convex.

## Overview

247 files. Next.js 16 + React 19 + TypeScript. Feature-based organization with self-contained modules. AI chat with inline suggestions, CodeMirror 6 editor, WebContainer preview.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind 4 |
| Editor | CodeMirror 6 with custom extensions |
| Backend | Convex (real-time) + Inngest (background jobs) |
| AI | OpenRouter (multi-provider) |
| Auth | Clerk |
| Execution | WebContainer + xterm.js |
| UI | shadcn/ui (Radix + Tailwind) |

## Structure

```
./
├── convex/              # Backend: Convex schema, queries, mutations
├── src/
│   ├── app/             # Next.js App Router (pages + API routes)
│   ├── components/
│   │   ├── ui/          # shadcn/ui components (52 files)
│   │   └── ai-elements/ # AI-specific React components (30 files)
│   ├── features/        # Feature modules (auth, conversations, editor, preview, projects)
│   ├── lib/             # Shared utilities, client configs
│   └── hooks/           # Global React hooks
├── public/              # Static assets
├── test/                # Test files
└── lat.md/              # Project knowledge base (lat.md format)
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Add page/route | `src/app/` | App Router pattern |
| Add API endpoint | `src/app/api/*/route.ts` | REST-style routes |
| Add UI component | `src/components/ui/` | shadcn/ui components |
| Add AI component | `src/components/ai-elements/` | Chat-specific components |
| Add feature | `src/features/[name]/` | Self-contained module |
| Backend logic | `convex/` | Convex queries/mutations |
| Background jobs | `src/features/*/inngest/` | Inngest functions |
| Shared utilities | `src/lib/` | Cross-cutting helpers |
| Global state | `src/hooks/` or feature stores | Zustand for editor |

## Conventions

- **App Router**: `page.tsx` for pages, `route.ts` for APIs, `layout.tsx` for layouts
- **Feature-based**: Each feature owns its components, hooks, and jobs
- **shadcn/ui**: Generic UI components from `@/components/ui/*`
- **AI elements**: Specialized chat components in `ai-elements/`
- **Naming**: Kebab-case files, PascalCase components
- **Convex**: `v.*` validators, `.index()` for queries, Clerk user sync
- **Inngest**: Background jobs co-located with features they serve

## Anti-Patterns

- **Don't** use Pages Router (no `pages/` directory)
- **Don't** import across features (use `src/lib/` for shared code)
- **Don't** put generic UI in `ai-elements/` (use `ui/`)
- **Don't** modify `convex/_generated/` (auto-generated)
- **Don't** store secrets in Convex tables
- **Don't** use `getServerSideProps` or `getStaticProps`

## Commands

```bash
bun run dev              # Start Next.js dev server
bun run build            # Production build
bun run lint             # ESLint
bun test                 # Run tests
npx convex dev           # Start Convex dev server
npx inngest-cli@latest dev  # Start Inngest dev server
lat check                # Validate lat.md links
```

## Environment

Required in `.env.local`:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `OPENROUTER_API_KEY`
- `POLARIS_CONVEX_INTERNAL_KEY`

## Large Files

| File | Lines | Note |
|------|-------|------|
| `convex/system.ts` | ~23k | Main backend logic |
| `src/components/ai-elements/prompt-input.tsx` | ~1.4k | Complex chat input |
| `src/app/api/mcp/route.ts` | ~604 | MCP server |
| `src/features/conversations/inngest/process-message.ts` | ~575 | Message processing |
| `src/lib/blog-posts.ts` | ~26k | Blog content |

## Notes

- **Real-time**: Convex provides automatic sync to frontend
- **WebContainer**: Preview feature uses StackBlitz WebContainer
- **Billing**: Clerk Billing + Convex wallet ledger for credits
- **lat.md**: Project uses lat.md for architecture documentation (see `lat.md/`)

## Sub-AGENTS.md

- [convex/AGENTS.md](./convex/AGENTS.md) - Convex backend
- [src/app/AGENTS.md](./src/app/AGENTS.md) - App Router pages & APIs
- [src/components/ai-elements/AGENTS.md](./src/components/ai-elements/AGENTS.md) - AI components
- [src/features/AGENTS.md](./src/features/AGENTS.md) - Feature modules
- [src/components/ui/AGENTS.md](./src/components/ui/AGENTS.md) - shadcn/ui components
- [src/lib/AGENTS.md](./src/lib/AGENTS.md) - Shared utilities

---

**Generated:** 2025-04-03  
**Commit:** 8197782  
**Branch:** main
