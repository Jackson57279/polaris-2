# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into LuminaWeb. The integration includes client-side initialization via `instrumentation-client.ts`, user identification using Clerk user IDs, a reverse proxy through Next.js rewrites to reduce ad-blocker interference, a server-side PostHog client (`src/lib/posthog-server.ts`), and 12 tracked events spanning both client and server code.

> **Note:** Run `bun add posthog-js posthog-node` to install the required packages (network access to npmjs.org was not available in the integration environment).

## Events instrumented

| Event name | Description | File |
|---|---|---|
| `project_created` | User successfully creates a new project from the prompt dialog | `src/features/projects/components/new-project-dialog.tsx` |
| `prompt_enhanced` | User clicks the enhance prompt button in the new project dialog | `src/features/projects/components/new-project-dialog.tsx` |
| `github_import_started` | User successfully submits the GitHub import form | `src/features/projects/components/import-github-dialog.tsx` |
| `figma_import_started` | User successfully submits the Figma import form | `src/features/projects/components/import-figma-dialog.tsx` |
| `deploy_initiated` | User clicks deploy button in the deploy popover | `src/features/projects/components/deploy-popover.tsx` |
| `deploy_error_sent_to_chat` | User sends a deploy error to the AI chat for assistance | `src/features/projects/components/deploy-popover.tsx` |
| `github_export_initiated` | User submits the export to GitHub form | `src/features/projects/components/export-popover.tsx` |
| `project_created_with_prompt` | *(server)* Project successfully created via the create-with-prompt API | `src/app/api/projects/create-with-prompt/route.ts` |
| `ai_message_sent` | *(server)* User sends a message to the AI assistant | `src/app/api/messages/route.ts` |
| `deploy_completed` | *(server)* Project successfully deployed to Vercel | `src/app/api/deploy/vercel/route.ts` |
| `deploy_failed` | *(server)* Project deployment to Vercel failed | `src/app/api/deploy/vercel/route.ts` |
| `github_import_initiated` | *(server)* GitHub repository import successfully kicked off | `src/app/api/github/import/route.ts` |

## Other changes

- **`src/instrumentation-client.ts`** — PostHog client-side initialization added alongside existing Sentry setup
- **`next.config.ts`** — PostHog reverse proxy rewrites added (`/ingest/*` → PostHog US)
- **`src/lib/posthog-server.ts`** — New server-side PostHog client helper
- **`src/components/providers.tsx`** — `PostHogUserIdentifier` component added; identifies users via Clerk ID after authentication

## Next steps

Visit [https://us.posthog.com/project/351075](https://us.posthog.com/project/351075) to view incoming events. Suggested dashboard insights to build manually:

1. **Project creation funnel** — `project_created_with_prompt` → `ai_message_sent` (first message in a new project)
2. **Daily active projects** — `ai_message_sent` unique sessions over time
3. **Deployment success rate** — `deploy_completed` vs `deploy_failed` trend
4. **Import methods breakdown** — `github_import_started` vs `figma_import_started` over time
5. **Prompt enhancement adoption** — `prompt_enhanced` as a ratio of `project_created`

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
