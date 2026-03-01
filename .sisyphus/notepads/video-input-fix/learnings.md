# Video Input Fix - Learnings

## UploadThing File Size Constraints
- UploadThing has strict type constraints on `maxFileSize` values
- Supported sizes: 1B, 2B, 4B, 8B, 16B, 32B, 1KB, 2KB, 4KB, 8KB, 16KB, 32KB, 1MB, 2MB, 4MB, 8MB, 16MB, 32MB, 1GB, 2GB, 4GB, 8GB, 16GB, 32GB
- "100MB" is NOT a valid size - must use "32MB" (the largest practical size for video uploads)
- This is enforced at the TypeScript type level, not runtime

## UploadThing Router Pattern
- All uploaders follow the same pattern: `f({ fileType: config }).middleware(...).onUploadComplete(...)`
- Middleware always checks auth via Clerk and throws `UploadThingError("Unauthorized")` if not authenticated
- `onUploadComplete` returns an object with `url: file.ufsUrl` and optionally `name: file.name`
- The router is exported as `ourFileRouter` and typed with `satisfies FileRouter`
- The type `OurFileRouter` is exported for use in client-side helpers

## Implementation Details
- `videoUploader` added at line 19-29 in `/src/app/api/uploadthing/core.ts`
- Configuration: `video: { maxFileSize: "32MB", maxFileCount: 1 }`
- Accepts MIME types: video/mp4, video/webm, video/quicktime (handled by UploadThing's "video" type)
- Returns both URL and filename for video metadata tracking
## Video Type Definitions Created

### Task: Create TypeScript type definitions for video attachments

**Completed:** ✅

### Files Created
- `/src/types/video.ts` - VideoAttachment type definition
- `/src/types/index.ts` - Export barrel file

### Type Definition
```typescript
export type VideoAttachment = {
  type: 'file' | 'youtube';
  url: string; // UploadThing URL or YouTube URL
  fileName?: string;
  thumbnailUrl?: string;
};
```

### Key Decisions
1. **Union type for `type` field**: Allows discriminating between file uploads and YouTube URLs
2. **Optional fields**: `fileName` and `thumbnailUrl` are optional to support both upload and YouTube scenarios
3. **URL field**: Single `url` field handles both UploadThing URLs and YouTube URLs
4. **Barrel export**: Created `index.ts` for clean imports from `@/types`

### Verification
- TypeScript compilation: ✅ No errors with `tsc --noEmit`
- Directory structure: ✅ `/src/types/` created successfully
- Export pattern: ✅ Follows project conventions

### Next Steps
- Task 2: Create runtime validation with Zod
- Task 3: Add to Convex schema

## Task 4: Update Messages API for videoUrls

**Completed:** ✅

### Changes Made
- File: `/src/app/api/messages/route.ts`
- Added `videoUrls: z.array(z.string()).optional()` to request schema (line 14)
- Extracted `videoUrls` from parsed request body (line 34)
- Passed `videoUrls` to Inngest `message/sent` event data (line 110)

### Implementation Pattern
Followed the same pattern as `create-with-prompt/route.ts`:
- Optional array of strings for URLs
- Extracted from request body via Zod schema
- Passed directly to Inngest event data

### Verification
- TypeScript compilation: ✅ No errors with `tsc --noEmit`
- Schema validation: ✅ Zod schema properly typed
- Event data: ✅ videoUrls passed to Inngest event

### Notes
- No mutual exclusivity validation added yet (imageUrls not in this endpoint)
- videoUrls is optional, allowing backward compatibility
- Inngest event now receives videoUrls for downstream processing

## Task 2: Add videoUrls to Schema - COMPLETED

**Change Made:**
- Added `videoUrls: v.optional(v.array(v.string()))` to messages table in `convex/schema.ts` (line 80)
- Placed after `status` field, following existing optional array pattern
- No TypeScript/Convex errors detected

**Pattern Used:**
```typescript
videoUrls: v.optional(v.array(v.string()))
```

**Verification:**
- LSP diagnostics: clean (no errors)
- Schema structure: valid
- Field placement: logical (after status, before closing brace)

**Notes:**
- Follows existing convention for optional fields in messages table
- Array of strings matches expected video URL storage pattern
- Ready for message processing to populate this field

## Task 5: Update process-message Inngest for video handling

**Completed:** Yes

### Changes Made
- File: `/src/features/conversations/inngest/process-message.ts`
- Added `videoUrls?: string[]` to `MessageEvent` interface (line 30)
- Extracted `videoUrls` from event data destructuring (line 69)
- Changed `codingModel` from `const` to `let` for dynamic model switching (line 95)
- Added model switch to `google/gemini-3.0-flash` when videoUrls present (lines 98-102)
- Added video URL text appending after image URL handling (lines 224-226)

### Key Design Decisions
1. Text-based approach: Video URLs appended as plain text, same pattern as imageUrls
2. Model switch before agent creation: codingModel is mutated before createAgent() so the agent uses the correct model
3. Console.log for debugging: Logs model switch with video count for Inngest observability
4. No mutual exclusivity: imageUrls and videoUrls can coexist

### Verification
- LSP diagnostics: No errors
- tsc --noEmit: Clean compilation
- Pattern consistency: Matches imageUrls handling exactly
