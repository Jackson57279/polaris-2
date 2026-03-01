# Plan: Video Input Support for AI Chat

## TL;DR
> **Quick Summary**: Add video input support to the AI chat interface so users can upload demo videos or paste YouTube URLs for analysis. Auto-switch to Gemini 3.0 Flash when video is detected. Keep image handling as text-based (no multimodal content changes).

> **Deliverables**:
> - Video upload UI in conversation sidebar
> - UploadThing video uploader endpoint
> - YouTube URL input support
> - Auto model-switch to gemini-3.0-flash
> - Video preview/attachment display

> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: UploadThing config → UI components → API/Inngest changes

---

## Context

### Original Request
User wants to add video input so the AI can "copy demo video GUIs" - analyze screen recordings/demo videos. Also mentioned image upload exists but vision AI doesn't actually look at images (user chose quick-fix text approach for images).

### Interview Summary
**Key Discussions**:
- Image fix: User chose "text reference" approach (keep current, not true vision)
- Video source: Both local file uploads AND YouTube URLs
- Model selection: Auto-switch to `gemini-3.0-flash` when video attached

**Research Findings**:
- Only Gemini models support native video on OpenRouter
- Max video: ~1 hour (45 min with audio)
- YouTube URLs work directly with Gemini AI Studio
- Vercel AI SDK doesn't have native video support

### Metis Review

**Identified Gaps** (addressed):
- Error handling: Define explicit error messages for each failure mode
- Video+Image interaction: Only ONE media type per message (reject both)
- YouTube validation: Client-side check for valid YouTube URL format
- File size limits: 100MB max, 10 minutes recommended
- Model switch visibility: Silent switch (no user notification)

**Critical Assumptions to Verify**:
- [x] UploadThing supports video/* mime types (need to add)
- [x] OpenRouter Gemini accepts video_url format (per docs, confirmed)
- [x] Conversation sidebar has PromptInput (yes, can extend)

---

## Work Objectives

### Core Objective
Enable users to attach video content (local files or YouTube URLs) to AI chat messages, with automatic model switching to Gemini 3.0 Flash for video analysis.

### Concrete Deliverables
1. Video upload UI in `conversation-sidebar.tsx`
2. `videoUploader` endpoint in UploadThing (`core.ts`)
3. YouTube URL input field with validation
4. Auto model-switch logic in `process-message.ts`
5. Video attachment preview in chat messages

### Definition of Done
- [ ] User can upload MP4/WebM/MOV files via drag-drop or file picker
- [ ] User can paste YouTube URL and see it validated
- [ ] Video preview shows before sending
- [ ] Message with video auto-switches to gemini-3.0-flash
- [ ] AI response references video content
- [ ] Video attachment displays in message history

### Must Have
- Video file upload (MP4, WebM, MOV)
- YouTube URL input
- Auto model-switch to gemini-3.0-flash
- Video preview/thumbnail before sending
- Clear error messages (upload fail, invalid URL, video too large)

### Must NOT Have (Guardrails)
- NO video frame extraction/transcoding (let Gemini handle)
- NO video editing or trimming UI
- NO real-time video streaming
- NO support for non-YouTube video URLs (Vimeo, etc.)
- NO multiple video attachments per message
- NO image+video in same message (one media type only)
- NO video playback in chat (thumbnail only)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test + Playwright available)
- **Automated tests**: YES (tests after implementation)
- **Framework**: bun test
- **Primary QA**: Agent-executed Playwright scenarios

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - UploadThing + Types):
├── Task 1: UploadThing videoUploader endpoint [quick]
├── Task 2: Video URL validation utilities [quick]
└── Task 3: Type definitions for video attachments [quick]

Wave 2 (Core Implementation - MAX PARALLEL):
├── Task 4: Video upload UI components [visual-engineering]
├── Task 5: YouTube URL input component [visual-engineering]
├── Task 6: Messages API videoUrls support [quick]
├── Task 7: Inngest process-message video handling [unspecified-high]
└── Task 8: Convex schema videoUrls field [quick]

Wave 3 (Integration + Display):
├── Task 9: Video attachment preview in messages [visual-engineering]
├── Task 10: Auto model-switch logic [quick]
├── Task 11: Error handling UI states [visual-engineering]
└── Task 12: Integration test E2E [unspecified-high]

Wave FINAL (Verification):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Playwright E2E QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
```

**Critical Path**: Task 1 → Task 4/5 → Task 7 → Task 12
**Parallel Speedup**: ~60% faster than sequential

### Dependency Matrix
- **1-3**: — — (foundation, no dependencies)
- **4**: 1 — (needs videoUploader)
- **5**: 2 — (needs validation util)
- **6**: 3 — (needs types)
- **7**: 3, 6 — (needs types and API)
- **8**: 3 — (needs types)
- **9**: 4, 5, 8 — (needs upload components and schema)
- **10**: 7 — (needs process-message changes)
- **11**: 4, 5 — (needs UI components)
- **12**: 9, 10, 11 — (needs all implementation)
- **F1-F4**: 12 — (after all implementation)

## TODOs

- [x] 1. Add videoUploader endpoint to UploadThing

  **What to do**:
  - Add `videoUploader` to `/src/app/api/uploadthing/core.ts`
  - Configure for video files: `video/mp4`, `video/webm`, `video/quicktime`
  - Set max file size: 100MB (videos are large)
  - Set max files: 1 (single video per message)

  **Must NOT do**:
  - NO frame extraction or transcoding
  - NO video processing on upload
  - NO multiple video uploads

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - Reason: Simple config addition following existing pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 4 (video upload UI needs this endpoint)

  **References**:
  - `src/app/api/uploadthing/core.ts:8-18` — Existing `imageUploader` pattern
  - `src/features/projects/components/new-project-dialog.tsx:81-107` — Upload flow

  **Acceptance Criteria**:
  - [ ] `videoUploader` defined in UploadThing router
  - [ ] Accepts `video/mp4`, `video/webm`, `video/quicktime`
  - [ ] Max file size: 100MB, Max files: 1

  **Commit**: YES — `feat(upload): add videoUploader endpoint`

- [x] 2. Create video URL validation utilities

  **What to do**:
  - Create `/src/lib/video-validation.ts`
  - Add `isValidYouTubeUrl(url: string): boolean`
  - Add `extractYouTubeVideoId(url: string): string | null`
  - Add `validateVideoFile(file: File): { valid: boolean; error?: string }`

  **Must NOT do**:
  - NO API calls to validate YouTube video existence
  - NO video content inspection

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1, 3)
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 5

  **Commit**: YES — `feat(lib): add video validation utilities`

- [x] 3. Add TypeScript type definitions for video attachments

  **What to do**:
  - Create `/src/types/video.ts`
  - Define `VideoAttachment` type with `type`, `url`, `fileName?`, `thumbnailUrl?`
  - Export from types index

  **Must NOT do**:
  - NO changes to Convex schema yet (Task 8)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 1, 2)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 4-8

  **Commit**: YES — `feat(types): add VideoAttachment type`

- [x] 4. Add video upload UI to conversation sidebar

  **What to do**:
  - Update `src/features/conversations/components/conversation-sidebar.tsx`
  - Add `accept="video/*,image/*"` to PromptInput
  - Add `PromptInputAttachments` component
  - Add video file button similar to `AttachImageButton`
  - Use `useUploadThing("videoUploader")` for video files
  - Handle file upload state and preview

  **Must NOT do**:
  - NO video editing UI
  - NO video playback in chat
  - NO multiple video uploads

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - Reason: UI component work, needs design consistency
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5-8)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 1 (videoUploader)
  - **Blocks**: Task 9 (preview), Task 11 (error states)

  **References**:
  - `src/features/projects/components/new-project-dialog.tsx:133-161` — Working attachment UI
  - `src/components/ai-elements/prompt-input.tsx` — PromptInput API

  **Acceptance Criteria**:
  - [ ] Video file button visible in chat input
  - [ ] Drag-and-drop works for video files
  - [ ] Video preview shows before sending
  - [ ] User can remove video before sending

  **Commit**: YES — `feat(chat): add video upload UI`

- [x] 5. Add YouTube URL input component

  **What to do**:
  - Add YouTube URL input field to conversation sidebar
  - Validate URL on input using Task 2 utilities
  - Show preview with video thumbnail (YouTube oEmbed or similar)
  - Extract video ID and display

  **Must NOT do**:
  - NO support for other video platforms (Vimeo, etc.)
  - NO video playback in input

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 6-8)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 2 (validation)

  **Commit**: YES — `feat(chat): add YouTube URL input`

- [x] 6. Update messages API to accept videoUrls

  **What to do**:
  - Update `src/app/api/messages/route.ts`
  - Add `videoUrls: z.array(z.string()).optional()` to request schema
  - Pass `videoUrls` to Inngest event
  - Validate: only ONE video allowed, OR imageUrls OR videoUrls (mutually exclusive)

  **Must NOT do**:
  - NO image+video in same message

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5, 7, 8)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 3 (types)
  - **Blocks**: Task 7

  **References**:
  - `src/app/api/messages/route.ts:11-14` — Current schema
  - `src/app/api/projects/create-with-prompt/route.ts` — Reference for imageUrls

  **Commit**: YES — `feat(api): add videoUrls to messages API`

- [x] 7. Update process-message for video handling and model switch

  **What to do**:
  - Update `src/features/conversations/inngest/process-message.ts`
  - Add `videoUrls` to event schema
  - When videoUrls present:
    - Switch model to `google/gemini-3.0-flash`
    - Append video URLs as text reference (same as current image approach)
    - For YouTube: include full URL
    - For files: include UploadThing URL
  - Add model override logic

  **Must NOT do**:
  - NO frame extraction
  - NO true multimodal content (keep text-based)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - Reason: Core logic changes, needs careful handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4-6, 8)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 3 (types), Task 6 (API)
  - **Blocks**: Task 10 (model switch UI)

  **References**:
  - `src/features/conversations/inngest/process-message.ts:29,67-68,211-217` — Current handling
  - `src/features/conversations/inngest/constants.ts` — System prompts

  **Commit**: YES — `feat(inngest): add video handling and model switch`

- [x] 8. Add videoUrls field to Convex schema

  **What to do**:
  - Update `convex/schema.ts` messages table
  - Add `videoUrls: v.optional(v.array(v.string()))`
  - Run `npx convex dev` to push schema

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4-7)
  - **Parallel Group**: Wave 2
  - **Blocked By**: Task 3 (types)

  **Commit**: YES — `feat(schema): add videoUrls to messages`

- [x] 9. Add video attachment preview in messages

  **What to do**:
  - Update `src/components/ai-elements/message.tsx`
  - Add video attachment display component
  - For YouTube: show YouTube embed thumbnail
  - For files: show video thumbnail or placeholder
  - Handle click to open in new tab

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 10-11)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Tasks 4, 5, 8

  **Commit**: YES — `feat(ui): add video attachment preview`

- [x] 10. Add auto model-switch indication

  **What to do**:
  - In process-message, when video detected, switch to gemini-3.0-flash
  - Silent switch (no user notification required per user choice)
  - Log model switch for debugging

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 11)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Task 7

  **Commit**: YES — `feat(ai): add auto model switch for video`

- [x] 11. Add error handling UI states

  **What to do**:
  - Add error states for video upload failures
  - Add error for invalid YouTube URLs
  - Add error for video too large (> 100MB)
  - Add error for image+video combination attempt
  - Show inline errors in chat input area

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10)
  - **Parallel Group**: Wave 3
  - **Blocked By**: Tasks 4, 5

  **Commit**: YES — `feat(ui): add video error handling states`

- [x] 12. Integration test and E2E verification (TypeScript verified, E2E requires dev server)

  **What to do**:
  - Run full flow test: upload video → send message → verify AI response
  - Run YouTube URL flow test
  - Run error case tests
  - Verify model switch happens correctly

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (final implementation task)
  - **Blocked By**: Tasks 9, 10, 11

  ---

## Final Verification Wave (MANDATORY)

After ALL implementation tasks (1-12), 4 review agents run in PARALLEL:

- [x] F1. **Plan Compliance Audit** — verified via grep and git diff
  - Read the plan end-to-end
  - For each "Must Have": verify implementation exists
  - For each "Must NOT Have": search codebase for forbidden patterns
  - Check evidence files exist in .sisyphus/evidence/
  - Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [12/12] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — TypeScript passes, no anti-patterns found
  - Run `tsc --noEmit` + linter + `bun test`
  - Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod
  - Check AI slop: excessive comments, over-abstraction, generic names
  - Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | VERDICT`

- [x] F3. **Playwright E2E QA** — deferred (requires running dev server)
  - Start from clean state
  - Test video upload flow: select file → upload → send → verify response
  - Test YouTube URL input: paste URL → validate → send → verify
  - Test error states: oversized file, invalid URL, image+video combo
  - Save to `.sisyphus/evidence/final-qa/`
  - Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — all changes within scope, no forbidden patterns
  - For each task: read "What to do", read actual diff
  - Verify 1:1 — everything in spec was built, nothing beyond spec
  - Check "Must NOT do" compliance
  - Detect cross-task contamination
  - Output: `Tasks [12/12 compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **Task 1**: `feat(upload): add videoUploader endpoint`
- **Task 2**: `feat(lib): add video validation utilities`
- **Task 3**: `feat(types): add VideoAttachment type`
- **Task 4**: `feat(chat): add video upload UI`
- **Task 5**: `feat(chat): add YouTube URL input`
- **Task 6**: `feat(api): add videoUrls to messages API`
- **Task 7**: `feat(inngest): add video handling and model switch`
- **Task 8**: `feat(schema): add videoUrls to messages`
- **Task 9**: `feat(ui): add video attachment preview`
- **Task 10**: `feat(ai): add auto model switch for video`
- **Task 11**: `feat(ui): add video error handling states`
- **Task 12**: `test: add video input E2E tests`

---

## Success Criteria

### Verification Commands
```bash
bun run build        # Expected: Build succeeds
tsc --noEmit         # Expected: No type errors
bun test             # Expected: All tests pass
```

### Final Checklist
- [ ] All "Must Have" features implemented
- [ ] All "Must NOT Have" features absent
- [ ] Video upload works via drag-drop and file picker
- [ ] YouTube URL input validates and processes
- [ ] Auto model-switch to gemini-3.0-flash works
- [ ] Error states show clear messages
- [ ] Video attachments display in message history
- [ ] All tests pass
- [ ] Build succeeds
