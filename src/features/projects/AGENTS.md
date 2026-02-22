# src/features/projects/AGENTS.md – Project Management

**Scope:** File explorer, deploy, GitHub import/export, project UI.

---

## Architecture

The projects feature handles:
- **File Explorer:** Tree view, CRUD operations
- **Deploy:** Vercel/Netlify deployment
- **GitHub:** Import/export repositories
- **Project UI:** Dashboard, dialogs, settings

---

## Directory Structure

```
projects/
├── components/
│   ├── file-explorer/
│   │   ├── tree.tsx           # File tree (233 lines)
│   │   ├── file-item.tsx
│   │   └── folder-item.tsx
│   ├── deploy-popover.tsx     # Deploy UI (389 lines)
│   ├── export-popover.tsx     # GitHub export (346 lines)
│   ├── import-dialog.tsx      # GitHub import
│   ├── project-navbar.tsx     # IDE navbar
│   └── projects-view.tsx      # Dashboard
├── hooks/
│   ├── use-files.ts           # File operations
│   ├── use-deploy.ts          # Deploy logic
│   └── use-projects.ts        # Project CRUD
├── inngest/                   # Background jobs
│   ├── import-github-repo.ts  # GitHub import (193 lines)
│   ├── export-to-github.ts    # GitHub export (286 lines)
│   └── import-figma.ts        # Figma import
└── lib/
    └── file-tree.ts           # Tree utilities
```

---

## File Explorer

**Component:** `components/file-explorer/tree.tsx`

Features:
- Hierarchical file tree
- Create/rename/delete files and folders
- Drag and drop
- Context menus
- File icons by extension

**State:** Managed via `useFiles()` hook with optimistic updates.

---

## Deploy (Vercel/Netlify)

**Flow:**

```
User clicks Deploy
    ↓
Create deployment in Convex (status: "pending")
    ↓
Client polls for status
    ↓
API route calls Vercel/Netlify
    ↓
Update deployment status via system.ts
```

**API Routes:**
- `/api/deploy/vercel/route.ts`
- `/api/deploy/netlify/route.ts`

**Status values:** `pending` | `building` | `completed` | `failed`

---

## GitHub Import

**Flow:**

```
User enters repo URL
    ↓
POST /api/github/import
    ↓
Send `github/import.repo` event
    ↓
import-github-repo.ts (Inngest)
    ↓
Fetch repo contents → Create files/folders
    ↓
Update importStatus: "completed" | "failed"
```

**Binary files:** Downloaded and uploaded to Convex storage.

---

## GitHub Export

**Flow:**

```
User clicks Export
    ↓
POST /api/github/export
    ↓
Send `github/export.repo` event
    ↓
export-to-github.ts (Inngest)
    ↓
Create repo → Create blobs → Create tree
→ Create commit → Update ref
    ↓
Update exportStatus with repoUrl
```

**Cancellation:** `github/export.cancel` event with `cancelOn`.

---

## Inngest Functions

| Function | Event | Purpose |
|----------|-------|---------|
| `importGithubRepo` | `github/import.repo` | Clone repo to project |
| `exportToGithub` | `github/export.repo` | Push project to repo |
| `importFigma` | `figma/import.fig` | Import Figma design |

---

## Status Tracking

Project table tracks async operations:

```typescript
// convex/schema.ts
projects: {
  importStatus: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("failed")
  ),
  exportStatus: v.union(...),
  exportRepoUrl: v.optional(v.string()),
  deploymentStatus: v.union(...),
  deploymentUrl: v.optional(v.string()),
}
```

---

## Where to Add Code

| Task | Location |
|------|----------|
| File explorer changes | `components/file-explorer/` |
| Deploy provider | Add to `hooks/use-deploy.ts`, `app/api/deploy/{provider}/` |
| GitHub operations | `inngest/import-github-repo.ts`, `export-to-github.ts` |
| New project dialog | `components/` |
| Project settings | Update `convex/projects.ts` |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `components/file-explorer/tree.tsx` | File tree UI |
| `hooks/use-files.ts` | File operations hook |
| `hooks/use-deploy.ts` | Deploy logic |
| `components/deploy-popover.tsx` | Deploy UI |
| `components/export-popover.tsx` | GitHub export UI |
| `inngest/import-github-repo.ts` | GitHub import job |
| `inngest/export-to-github.ts` | GitHub export job |
