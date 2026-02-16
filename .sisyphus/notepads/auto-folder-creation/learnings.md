# Auto-Folder Creation Learnings

## Conventions
- Use Convex mutations via `api.system.*` for file operations
- All tool handlers are wrapped in `toolStep?.run()` for Inngest tracking
- Folder creation uses `api.system.createFolder` mutation
- File creation uses `api.system.createFiles` mutation (batch)
- File/folder IDs are typed as `Id<"files">` from Convex

## Important Patterns
- Path parsing should split on `/` and handle multiple levels
- Need to track created folders in a Map to avoid duplicates within same batch
- Must maintain backward compatibility with existing `parentId` workflow
- Tool descriptions are shown to the AI, so mention path support clearly

## Gotchas
- Convex mutations don't return folder objects, just IDs
- Need to query existing folders to check if they already exist
- Path separators should be normalized (no leading/trailing slashes)
- Empty parentId or empty string means root level

## Implementation Strategy
1. Parse each file name for path separators
2. Build folder structure map
3. Create folders recursively from root to leaf
4. Track created folder IDs
5. Create files with resolved parent IDs
6. Handle errors gracefully with helpful messages

## COMPLETED: 2026-02-16

### Files Modified
1. `src/features/conversations/inngest/tools/create-files.ts`
   - Added `folderCache` Map to track created folders
   - Added `ensureFolderPath()` function for recursive folder creation
   - Added path normalization (strip leading/trailing slashes, collapse multiple slashes)
   - Group files by resolved parentId for batch creation
   - Updated tool description to mention path support
   - Updated parameter description for file names

2. `src/features/conversations/inngest/constants.ts`
   - Updated workflow to mention path-based file creation
   - Updated rules to explain path usage

### Key Implementation Details
- Path format: `src/components/Button.tsx` creates `src/`, then `src/components/`, then file
- Backward compatible: `parentId` still works with simple file names
- Folder deduplication: Same path in multiple files creates folder once
- Error handling: Invalid paths return descriptive error messages
- Edge cases handled: Leading/trailing slashes, empty paths, multiple consecutive slashes

### Verification
- ✅ TypeScript compiles without errors
- ✅ No changes to Convex backend (mutations unchanged)
- ✅ Backward compatibility maintained
