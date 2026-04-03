# Feature Modules

Feature-based organization with self-contained modules. Each feature owns its components, hooks, and background jobs.

## Overview

5 feature modules: auth, conversations, editor, preview, projects. Each feature is self-contained with components, hooks, and Inngest jobs co-located.

## Features

### auth/
Authentication components (unauthenticated-view, auth-loading-view). Clerk integration.

### conversations/
Chat conversations with AI.
- **components/**: conversation-sidebar.tsx
- **hooks/**: use-conversations.ts, use-build-validation.ts
- **inngest/**: process-message.ts (575 lines), tools/, workers/
  - tools/: File operations (read, write, delete, rename, etc.)
  - workers/: repo-research.ts, exa-research.ts, review.ts

### editor/
CodeMirror 6 editor with custom extensions.
- **components/**: editor-view.tsx, code-editor.tsx, top-navigation.tsx, file-breadcrumbs.tsx
- **extensions/**: suggestion/, quick-edit/, theme.ts, minimap.ts, selection-tooltip.ts
- **hooks/**: use-editor.ts
- **store/**: use-editor-store.ts

### preview/
WebContainer-based live preview.
- **components/**: preview-terminal.tsx, preview-settings-popover.tsx
- **hooks/**: use-webcontainer.ts
- **utils/**: file-tree.ts

### projects/
Project management (files, deployments, imports).
- **components/**: projects-view.tsx, projects-list.tsx, file-explorer/, deploy-popover.tsx, export-popover.tsx, etc.
- **hooks/**: use-projects.ts, use-files.ts, use-deploy.ts
- **inngest/**: import-github-repo.ts, import-figma.ts, export-to-github.ts

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Auth UI | `auth/components/` | Sign in/out flows |
| Chat features | `conversations/` | Messages, processing, AI workers |
| Code editor | `editor/` | CodeMirror extensions, editor state |
| Live preview | `preview/` | WebContainer integration |
| Project mgmt | `projects/` | Files, deployments, GitHub/figma imports |
| Background jobs | `*/inngest/` | Feature-specific Inngest jobs |
| File tree | `projects/components/file-explorer/` | Tree UI, rename/create inputs |

## Conventions

- **Self-contained**: Each feature owns its code
- **Co-location**: Components, hooks, jobs together
- **Barrel exports**: `index.ts` for public API
- **Inngest jobs**: Background work in `*/inngest/` subdirectory
- **Hooks**: Feature-specific state in `*/hooks/`

## Anti-Patterns

- **Don't** import across features (use `src/lib/` for shared code)
- **Don't** put shared utilities in features
- Keep feature code contained — resist cross-feature dependencies

## Notes

- **Pattern**: Each feature mirrors the others in structure
- **Inngest**: Background jobs co-located with features they serve
- **Store**: Editor uses Zustand (use-editor-store.ts)
- **WebContainer**: Preview feature wraps StackBlitz WebContainer
