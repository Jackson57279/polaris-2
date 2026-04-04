# Shared Utilities

Cross-cutting utilities and client configurations. Code shared across features. No React components — pure utilities and configurations.

## Overview

9 files. Client configurations for Convex, Inngest, UploadThing, PostHog, Exa, Firecrawl. Plus shared utilities and AI model definitions.

## Files

| File | Purpose | Notes |
|------|---------|-------|
| `utils.ts` | Core utilities | `cn()` helper, formatters |
| `ai-models.ts` | AI model configs | OpenRouter model definitions |
| `convex-client.ts` | Convex client | Browser client setup |
| `convex-server.ts` | Convex server | Server-side Convex client |
| `uploadthing.ts` | UploadThing | File upload configuration |
| `posthog-server.ts` | PostHog | Server-side analytics |
| `exa-client.ts` | Exa API | Web search client |
| `firecrawl.ts` | Firecrawl | Web scraping client |
| `blog-posts.ts` | Blog content | Large file (~26k lines) |

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Class merging | `utils.ts#cn` | `cn(...inputs)` merges Tailwind classes |
| AI model config | `ai-models.ts` | OpenRouter model definitions |
| Convex browser client | `convex-client.ts` | Use in React components |
| Convex server client | `convex-server.ts` | Use in API routes |
| File uploads | `uploadthing.ts` | UploadThing configuration |
| Analytics | `posthog-server.ts` | Server-side PostHog |
| Web search | `exa-client.ts` | Exa API integration |
| Web scraping | `firecrawl.ts` | Firecrawl integration |

## Conventions

- **cn()**: Tailwind class merging via `tailwind-merge` + `clsx`
- **Client configs**: One file per external service
- **No React**: Keep components in `components/`
- **Pure functions**: Utilities should be side-effect free
- **Barrel exports**: Export from `index.ts` where applicable

## Key Utilities

### cn() - Class Name Merging

```ts
import { cn } from "@/lib/utils";

// Merges Tailwind classes, handles conflicts
const className = cn("px-4 py-2", "px-6", "bg-blue-500 hover:bg-blue-600");
// Result: "py-2 px-6 bg-blue-500 hover:bg-blue-600"
```

### AI Models

```ts
import { models } from "@/lib/ai-models";

// Model definitions for OpenRouter
// Includes: grok, claude, gpt-4, etc.
```

## Anti-Patterns

- **Don't** add React components here
- **Don't** import from features (creates circular deps)
- **Don't** put business logic here
- **Don't** add UI-related code

## Notes

- **Pure utilities**: This directory is for shared functions only
- **Client configs**: Each external service has its own config file
- **No barrel**: Import directly from specific files
- **Large file**: `blog-posts.ts` contains static blog content (~26k lines)

## Dependencies

- `tailwind-merge` - Tailwind class deduplication
- `clsx` - Conditional class names
- `convex` - Convex client
- `uploadthing` - File uploads
- `posthog-node` - Server analytics
- `exa-js` - Web search
- `@mendable/firecrawl-js` - Web scraping
