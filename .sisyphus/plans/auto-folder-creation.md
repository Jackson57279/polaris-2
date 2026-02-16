# Work Plan: Auto-Create Folders When Creating Files with Paths

## TL;DR

**Problem**: AI tries to create files with paths like `src/index.css` or `src/main.jsx`, but the `createFiles` tool doesn't automatically create parent folders. Files end up at root level with path names instead of being nested.

**Solution**: Modify the `createFiles` tool to:
1. Parse file names for path separators (`/`)
2. Automatically create parent folders recursively  
3. Place files in correct nested locations

**Deliverables**:
- Modified `create-files.ts` tool with path parsing and auto-folder creation
- Updated system prompt mentioning path support
- Maintained backward compatibility with existing folder ID workflow

**Estimated Effort**: Short (30-60 min)
**Parallel Execution**: NO - single task

---

## Context

### Current Problem
The AI has two tools:
- `createFolder` - Creates a folder and returns its ID
- `createFiles` - Creates files in a specific folder (requires `parentId`)

When the AI tries to create `src/index.css`:
- Current: Creates file named "src/index.css" at root level
- Expected: Creates `src/` folder, then creates `index.css` inside it

### Current Workflow
1. List files to see structure
2. **Create folders first** to get their IDs  
3. Use `createFiles` with folder ID as `parentId`
4. Files are created with simple names (not paths)

### The Issue
The AI often tries to create files with path names directly (e.g., `src/index.css`), but:
- The tool treats the whole string as the file name
- No parent folder is created
- File ends up at root with wrong name

---

## Work Objectives

### Core Objective
Enable path-based file creation in the `createFiles` tool so AI can create nested files in one call without manually managing folder IDs.

### Concrete Deliverables
1. **Enhanced `create-files.ts`**: Parse file names for `/` separators, auto-create parent folders
2. **Updated system prompt**: Mention that path-based file names are now supported
3. **Backward compatibility**: Existing code using `parentId` continues to work

### Definition of Done
- [ ] Creating `src/index.css` automatically creates `src/` folder and places file correctly
- [ ] Creating `src/components/Button.tsx` creates full nested structure
- [ ] Existing behavior (using `parentId` with simple names) still works
- [ ] All tests pass

### Must Have
- Path parsing that handles multiple levels (`a/b/c/d/file.txt`)
- Folder deduplication (don't create same folder twice in one call)
- Proper error handling for invalid paths
- Backward compatibility

### Must NOT Have
- Changes to database schema
- Changes to Convex mutations
- Changes to other tools (listFiles, readFiles, etc.)
- Breaking changes to existing API

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: YES (tests after implementation)
- **Framework**: bun test

### Agent-Executed QA Scenarios

**Scenario 1: Create file with single-level path**
- Tool: Bash (curl via Convex API or direct function call)
- Steps:
  1. Call createFiles with file name "src/index.css"
  2. List files to verify structure
- Expected: `src/` folder exists with `index.css` inside it
- Evidence: File list JSON showing correct parentId relationships

**Scenario 2: Create file with multi-level path**
- Tool: Bash (curl via Convex API or direct function call)
- Steps:
  1. Call createFiles with file name "src/components/Button.tsx"
  2. List files to verify full structure
- Expected: `src/components/` nested folder with `Button.tsx` inside

**Scenario 3: Backward compatibility**
- Tool: Bash (curl via Convex API or direct function call)
- Steps:
  1. Get folder ID for existing folder
  2. Call createFiles with parentId and simple name "App.tsx"
- Expected: File created in specified folder (not at root)

**Scenario 4: Multiple files with shared parent**
- Tool: Bash (curl via Convex API or direct function call)
- Steps:
  1. Call createFiles with ["src/index.css", "src/main.jsx"]
  2. List files
- Expected: Single `src/` folder with both files inside (no duplicates)

---

## Execution Strategy

### Single Task
This is a focused change to one file (`create-files.ts`). No parallelization needed.

---

## TODOs

- [x] 1. Modify createFiles tool to support path-based file names

  **What to do**:
  - Update `create-files.ts` to parse file names for `/` separators
  - Implement recursive folder creation logic
  - Track created folders to avoid duplicates in same batch
  - Modify file creation to use resolved folder IDs
  - Update tool description to mention path support

  **Must NOT do**:
  - Don't modify Convex mutations (createFile, createFolder, createFiles)
  - Don't change database schema
  - Don't break existing parentId-based workflow
  - Don't modify other tools

  **Recommended Agent Profile**:
  - **Category**: `quick` (focused single-file change)
  - **Skills**: None needed (TypeScript/Next.js is standard)

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: N/A (single task)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:
  - `src/features/conversations/inngest/tools/create-files.ts` - Tool to modify
  - `src/features/conversations/inngest/tools/create-folder.ts` - Reference for folder creation pattern
  - `convex/system.ts:253-305` - createFiles mutation (backend - DO NOT MODIFY)
  - `convex/system.ts:307-343` - createFolder mutation (backend - DO NOT MODIFY)
  - `src/features/conversations/inngest/constants.ts` - System prompt to update

  **Acceptance Criteria**:
  - [x] Path parsing works: "src/index.css" → creates src/ folder + index.css file
  - [x] Multi-level paths work: "a/b/c/file.txt" creates nested structure
  - [x] Folder deduplication: Multiple files in same path create folder once
  - [x] Backward compatibility: Using parentId + simple name still works
  - [x] Error handling: Invalid paths return helpful error messages
  - [x] Tool description updated to mention path support
  - [x] System prompt updated in `constants.ts`

  **Agent-Executed QA Scenarios**:

  **Scenario: Single-level path**
  ```
  Tool: Bash
  Steps:
    1. Run test: bun test src/features/conversations/inngest/tools/create-files.test.ts
    2. Or manually test via Convex dashboard
  Expected: Test passes showing src/ folder created with index.css inside
  Evidence: Test output showing success
  ```

  **Scenario: Multi-level path**
  ```
  Tool: Bash
  Steps:
    1. Create file with path "src/components/ui/Button.tsx"
    2. List files to verify structure
  Expected: Nested folders created, file in correct location
  Evidence: File list showing correct hierarchy
  ```

  **Scenario: Backward compatibility**
  ```
  Tool: Bash
  Steps:
    1. Create folder "components" (get ID)
    2. Create file with parentId=<components-id>, name="App.tsx"
  Expected: App.tsx created inside components folder
  Evidence: File has correct parentId in database
  ```

  **Commit**: YES
  - Message: `feat: auto-create folders when creating files with paths`
  - Files: `src/features/conversations/inngest/tools/create-files.ts`, `src/features/conversations/inngest/constants.ts`
  - Pre-commit: `bun test` (if tests exist)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat: auto-create folders when creating files with paths` | create-files.ts, constants.ts | bun test |

---

## Success Criteria

### Verification Commands
```bash
# Run tests
bun test

# Expected: All tests pass
```

### Final Checklist
- [x] Path-based file creation works (`src/index.css` → correct structure)
- [x] Multi-level paths work (`src/components/Button.tsx`)
- [x] Folder deduplication works (shared parent created once)
- [x] Backward compatibility maintained (parentId workflow)
- [x] System prompt updated
- [x] Tool description updated
- [x] TypeScript compiles without errors
- [x] No changes to database schema or mutations
