# Migration Plan: Anthropic → OpenRouter (OpenAI-Compatible)

## TL;DR

> **Quick Summary**: Migrate 3 files from Anthropic SDK to OpenRouter using `@ai-sdk/openai-compatible` with `createOpenAICompatible()` pattern. Uses existing v2.0.30 package already installed. Replace structured `Output.object()` with plain `generateText()` and manual JSON parsing for better model compatibility.
> 
> **Deliverables**:
> - 3 migrated files using `@ai-sdk/openai-compatible`
> - Updated `package.json` (remove `@ai-sdk/anthropic` only, keep existing `@ai-sdk/openai-compatible`)
> - Integration tests verifying OpenRouter responses
> 
> **Estimated Effort**: Quick (2-3 hours)
> **Parallel Execution**: NO - Sequential dependencies
> **Critical Path**: Migrate files → Verify build → Add tests → Remove old package

---

## Context

### Original Request
Switch from Anthropic SDK to OpenRouter using the OpenAI-compatible provider pattern from AI SDK.

### Interview Summary
**Key Discussions**:
- **Model selection**: Use `minimax/minimax-m2.5` for background job (expert coding), `qwen/qwen3-coder-next` for real-time suggestions and quick edits
- **Provider approach**: Use `@ai-sdk/openai-compatible` v2.0.30 (already installed) with `createOpenAICompatible()`
- **Structured output**: User explicitly requested to switch from `Output.object()` to plain text + manual JSON parsing for better compatibility
- **Environment**: `OPENROUTER_API_KEY` already configured in environment (not in `.env.local`)
- **Test strategy**: Tests-after (add integration tests after migration)

### Research Findings
**Codebase Analysis**:
- 3 files use Anthropic SDK directly (`@ai-sdk/anthropic`)
- 1 file already uses OpenRouter via `@inngest/agent-kit` (different pattern, out of scope)
- `ai` SDK v6.0.6 is current version
- `@ai-sdk/openai-compatible` v2.0.30 already installed - use this instead of adding new package

**Technical Pattern** (from research):
```typescript
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';

const openrouter = createOpenAICompatible({
  name: 'openrouter',
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const { text } = await generateText({
  model: openrouter('provider/model-name'),
  prompt: '...',
});
```

### Metis Review
**Identified Gaps** (addressed):
- **Model existence**: User confirmed `qwen/qwen3-coder-next` exists on OpenRouter
- **Environment**: User confirmed `OPENROUTER_API_KEY` is set
- **Structured output**: User opted to switch to manual JSON parsing (explicitly set in scope)
- **Reference pattern**: Acknowledged no in-code reference exists, but official documentation is sufficient

---

## Work Objectives

### Core Objective
Migrate 3 files from Anthropic SDK (`@ai-sdk/anthropic`) to OpenRouter (`@ai-sdk/openai-compatible`) with updated model names and manual JSON parsing.

### Concrete Deliverables
- `src/inngest/functions.ts` - Uses `minimax/minimax-m2.5`, manual JSON parsing
- `src/app/api/suggestion/route.ts` - Uses `qwen/qwen3-coder-next`, manual JSON parsing
- `src/app/api/quick-edit/route.ts` - Uses `qwen/qwen3-coder-next`, manual JSON parsing
- `package.json` - Remove `@ai-sdk/anthropic` (keep existing `@ai-sdk/openai-compatible`)
- Test files verifying the migration

### Definition of Done
- [ ] All 3 files import from `@ai-sdk/openai-compatible`
- [ ] No Anthropic SDK imports remain in codebase
- [ ] `bun run build` passes with zero TypeScript errors
- [ ] Integration tests verify OpenRouter responses
- [ ] `@ai-sdk/anthropic` removed from package.json

### Must Have
- Use `@ai-sdk/openai-compatible` v2.0.30 (already installed)
- Preserve existing error handling logic
- Maintain same API route behavior (200/400/500 responses)
- Use manual JSON parsing instead of `Output.object()`

### Must NOT Have (Guardrails)
- **DO NOT**: Touch `process-message.ts` (already uses OpenRouter via different library)
- **DO NOT**: Modify `.env.example` (only update `.env.local` if needed)
- **DO NOT**: Add fallback provider logic or A/B testing
- **DO NOT**: Change route response shapes beyond what's necessary for model switch
- **DO NOT**: Add model selection UI changes
- **DO NOT**: Add telemetry or logging beyond existing

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> ALL tasks in this plan MUST be verifiable WITHOUT any human action.
>
> **FORBIDDEN** — acceptance criteria requiring human action:
> - "User manually tests..."
> - "User visually confirms..."
> - "User interacts with..."
>
> **ALL verification is executed by the agent** using tools (Playwright, interactive_bash, curl, etc.).

### Test Decision
- **Infrastructure exists**: NO (no existing test framework)
- **Automated tests**: Tests-after (add after migration)
- **Framework**: bun test (use built-in Bun test runner)

### Test Setup
- [ ] Task 6 will set up `bun test` infrastructure
- [ ] Integration tests will verify OpenRouter API responses

### Agent-Executed QA Scenarios (MANDATORY)

Each task includes specific scenarios for agent verification using:
- **Frontend/UI**: Playwright (playwright skill)
- **API/Backend**: Bash (curl/httpie)
- **Build checks**: Bash (bun run build, grep, etc.)

Scenarios follow format:
```
Scenario: [Descriptive name]
  Tool: [Playwright / Bash]
  Preconditions: [What must be true]
  Steps:
    1. [Exact action with selector/command]
    2. [Next action]
    3. [Assertion]
  Expected Result: [Concrete outcome]
  Evidence: [Screenshot/output path]
```

---

## Execution Strategy

### Sequential Execution (NO Parallel)

All tasks have dependencies on previous steps:

```
Task 1: Install package
  ↓
Task 2: Migrate functions.ts
  ↓
Task 3: Migrate suggestion/route.ts
  ↓
Task 4: Migrate quick-edit/route.ts
  ↓
Task 5: Verify build (no Anthropic refs)
  ↓
Task 6: Set up test infrastructure
  ↓
Task 7: Add integration tests
  ↓
Task 8: Remove @ai-sdk/anthropic
```

**Critical Path**: All 8 tasks in sequence
**Parallel Speedup**: 0% (sequential only)

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2,3,4,5,6,7,8 | None (foundational) |
| 2 | 1 | 5 | None (needs package) |
| 3 | 1 | 5 | 2 (same level, can do in any order) |
| 4 | 1 | 5 | 2, 3 (same level) |
| 5 | 2,3,4 | 6,7,8 | None (verification) |
| 6 | 5 | 7 | None (infrastructure) |
| 7 | 6 | 8 | None (tests need infra) |
| 8 | 7 | None | None (cleanup) |

---

## TODOs

- [ ] **1. Verify @ai-sdk/openai-compatible Package**

  **What to do**:
  - Verify `@ai-sdk/openai-compatible` v2.0.30 is already in `package.json` dependencies
  - No installation needed - package already present
  - Verify `bun install` works to ensure lockfile is up to date

  **Must NOT do**:
  - Do not install additional packages
  - Do not remove `@ai-sdk/anthropic` yet (do in task 8)
  - Do not modify any source files

  **Recommended Agent Profile**:
  - **Category**: `quick` - Simple verification
  - **Skills**: None needed
  - **Justification**: Package already installed, just verify

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential
  - **Blocks**: Tasks 2, 3, 4 (all migrations need package verified)
  - **Blocked By**: None (first task)

  **References**:
  - Current `package.json` - Shows current AI SDK dependencies
  - `process-message.ts:122` - Shows how `OPENROUTER_API_KEY` is accessed (for pattern reference)

  **Acceptance Criteria**:
  - [ ] Package exists: `@ai-sdk/openai-compatible` in `package.json`
  - [ ] Verify: `grep '@ai-sdk/openai-compatible' package.json` returns result
  - [ ] Version is v2.0.30 or compatible with ai SDK v6

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Verify existing package
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: cat package.json | grep '@ai-sdk/openai-compatible'
      2. Assert: Output contains '@ai-sdk/openai-compatible'
      3. Run: bun install
      4. Assert: Exit code 0
    Expected Result: Package verified, install works
    Evidence: Terminal output captured
  ```

  **Commit**: NO (verification only, no changes)

---

- [ ] **2. Migrate src/inngest/functions.ts**

  **What to do**:
  - Replace `import { anthropic } from "@ai-sdk/anthropic"` with `import { createOpenAICompatible } from "@ai-sdk/openai-compatible"`
  - Replace `anthropic('claude-3-haiku-20240307')` with `openrouter('minimax/minimax-m2.5')`
  - Replace structured `Output.object()` with plain `generateText()` + manual JSON parsing
  - Add OpenRouter provider initialization:
    ```typescript
    const openrouter = createOpenAICompatible({
      name: 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
    ```
  - Preserve telemetry configuration (may not work with OpenRouter, but keep for now)
  - Keep existing error handling and Firecrawl integration

  **Current Code Structure** (lines 1-44):
  ```typescript
  import { anthropic } from "@ai-sdk/anthropic";
  import { generateText, Output } from "ai";
  // ... other imports
  
  const { text: demoText } = await generateText({
    model: anthropic('claude-3-haiku-20240307'),
    experimental_telemetry: { isEnabled: true, functionId: "demo-text-generation" },
    // ...
    output: Output.object({ schema: z.object({ ... }) }),
  });
  ```

  **Target Code Structure**:
  ```typescript
  import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
  import { generateText } from "ai";
  // ... other imports

  const openrouter = createOpenAICompatible({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1', 
  });
  
  const { text: rawText } = await generateText({
    model: openrouter('minimax/minimax-m2.5'),
    experimental_telemetry: { isEnabled: true, functionId: "demo-text-generation" },
    // ... (no output field - returns plain text)
  });
  
  // Parse JSON manually
  const demoText = JSON.parse(rawText);
  ```

  **Must NOT do**:
  - Do not change Firecrawl integration logic
  - Do not change the zod schema structure
  - Do not change error handling patterns

  **Recommended Agent Profile**:
  - **Category**: `quick` - Single file refactoring with clear pattern
  - **Skills**: None needed
  - **Justification**: Straightforward SDK swap with known pattern

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 4)
  - **Parallel Group**: Wave 2 (Migration Wave)
  - **Blocks**: Task 5 (verification needs all 3 migrated)
  - **Blocked By**: Task 1 (package installation)

  **References** (CRITICAL - Pattern Sources):
  - **Pattern References**:
    - `process-message.ts:120-165` - Shows OpenRouter API usage pattern (though via different library)
    - Official docs: `https://github.com/OpenRouterTeam/ai-sdk-provider` - Official usage examples
  
  - **API/Type References**:
    - `src/inngest/functions.ts:36-44` - Current Anthropic usage to migrate
    - Zod schema definitions in same file (lines ~40) - Must preserve
  
  - **External References**:
    - AI SDK docs: `https://ai-sdk.dev/providers/openai-compatible-providers` - createOpenAICompatible API
    - Model ID: `minimax/minimax-m2.5` - Already used in `process-message.ts`

  **Acceptance Criteria**:
  - [ ] Import changed: `from '@ai-sdk/openai-compatible'` instead of `@ai-sdk/anthropic`
  - [ ] Model changed: `openrouter('minimax/minimax-m2.5')` instead of `anthropic('claude-3-haiku-20240307')`
  - [ ] Using `generateText()` without `Output.object()`
  - [ ] Manual JSON parsing added: `JSON.parse(rawText)`
  - [ ] `createOpenAICompatible` initialized with `OPENROUTER_API_KEY` and baseURL

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Verify Anthropic imports removed from functions.ts
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: grep '@ai-sdk/anthropic' src/inngest/functions.ts
      2. Assert: Exit code 1 (no matches found)
      3. Run: grep '@ai-sdk/openai-compatible' src/inngest/functions.ts
      4. Assert: Exit code 0 (match found)
      5. Run: grep "minimax/minimax-m2.5" src/inngest/functions.ts
      6. Assert: Exit code 0 (match found)
      7. Run: grep "createOpenAICompatible" src/inngest/functions.ts
      8. Assert: Exit code 0 (match found)
    Expected Result: No Anthropic refs, has OpenAI-compatible refs
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `refactor(inngest): migrate functions.ts from Anthropic to OpenRouter`
  - Files: `src/inngest/functions.ts`

---

- [ ] **3. Migrate src/app/api/suggestion/route.ts**

  **What to do**:
  - Replace Anthropic import with `@ai-sdk/openai-compatible`
  - Replace `anthropic("claude-3-7-sonnet-20250219")` with `openrouter("qwen/qwen3-coder-next")`
  - Replace `Output.object()` with plain `generateText()` + manual JSON parsing
  - Add OpenRouter provider initialization with baseURL
  - Preserve all existing validation and error handling

  **Current Code Structure** (lines 85-89):
  ```typescript
  const result = await generateText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    output: Output.object({ schema: suggestionSchema }),
    // ...
  });
  ```

  **Target Code Structure**:
  ```typescript
  const openrouter = createOpenAICompatible({
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });
  
  const { text: rawResult } = await generateText({
    model: openrouter("qwen/qwen3-coder-next"),
    // No output field - returns plain text
    // ...
  });
  
  const result = suggestionSchema.parse(JSON.parse(rawResult));
  ```

  **Must NOT do**:
  - Do not change the API route response format (must return same JSON structure)
  - Do not change input validation logic
  - Do not change error response codes

  **Recommended Agent Profile**:
  - **Category**: `quick` - Single file migration
  - **Skills**: None needed
  - **Justification**: Same pattern as Task 2

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 4)
  - **Parallel Group**: Wave 2 (Migration Wave)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:
  - **Pattern References**:
    - `src/app/api/suggestion/route.ts:85-89` - Current code to migrate
    - Same as Task 2 references
  
  - **API/Type References**:
    - `suggestionSchema` definition in same file - Must preserve

  **Acceptance Criteria**:
  - [ ] No Anthropic imports
  - [ ] Uses `openrouter("qwen/qwen3-coder-next")`
  - [ ] Uses manual JSON parsing with Zod validation
  - [ ] Route still returns 200 on success, 400/500 on errors
  - [ ] Uses `createOpenAICompatible` with baseURL

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Verify suggestion route migrated
    Tool: Bash
    Steps:
      1. Run: grep '@ai-sdk/anthropic' src/app/api/suggestion/route.ts
      2. Assert: Exit code 1
      3. Run: grep 'qwen/qwen3-coder-next' src/app/api/suggestion/route.ts
      4. Assert: Exit code 0
      5. Run: grep 'JSON.parse' src/app/api/suggestion/route.ts
      6. Assert: Exit code 0
      7. Run: grep 'createOpenAICompatible' src/app/api/suggestion/route.ts
      8. Assert: Exit code 0
    Expected Result: Migrated to OpenRouter with manual parsing
    Evidence: Terminal output captured
  ```

  **Commit**: YES
  - Message: `refactor(api): migrate suggestion route to OpenRouter`
  - Files: `src/app/api/suggestion/route.ts`

---

- [ ] **4. Migrate src/app/api/quick-edit/route.ts**

  **What to do**:
  - Same pattern as Task 3
  - Replace `anthropic("claude-3-7-sonnet-20250219")` with `openrouter("qwen/qwen3-coder-next")`
  - Replace structured output with manual JSON parsing
  - Preserve Firecrawl documentation integration

  **Current Code Structure** (lines 104-108):
  ```typescript
  const result = await generateText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    output: Output.object({ schema: quickEditSchema }),
    // ...
  });
  ```

  **Must NOT do**:
  - Do not change Firecrawl integration
  - Do not change the Cmd+K feature logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:
  - Same as Tasks 2, 3
  - Firecrawl integration preserved

  **Acceptance Criteria**:
  - [ ] No Anthropic imports
  - [ ] Uses `qwen/qwen3-coder-next`
  - [ ] Manual JSON parsing with Zod
  - [ ] Firecrawl integration intact
  - [ ] Uses `createOpenAICompatible` with baseURL

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Verify quick-edit route migrated
    Tool: Bash
    Steps:
      1. Run: grep '@ai-sdk/anthropic' src/app/api/quick-edit/route.ts && exit 1 || echo 'No Anthropic refs'
      2. Run: grep 'qwen/qwen3-coder-next' src/app/api/quick-edit/route.ts
      3. Assert: Exit code 0
      4. Run: grep 'createOpenAICompatible' src/app/api/quick-edit/route.ts
      5. Assert: Exit code 0
    Expected Result: Fully migrated
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `refactor(api): migrate quick-edit route to OpenRouter`
  - Files: `src/app/api/quick-edit/route.ts`

---

- [ ] **5. Verify Build and No Anthropic References**

  **What to do**:
  - Run `bun run build` and verify zero TypeScript errors
  - Run `grep -r "@ai-sdk/anthropic" src/` and verify no results
  - Run `grep -r "createOpenAICompatible" src/` and verify 3 results (one per migrated file)
  - Verify no runtime errors in build output

  **Must NOT do**:
  - Do not proceed if build fails
  - Do not ignore TypeScript errors

  **Recommended Agent Profile**:
  - **Category**: `quick` - Verification only
  - **Skills**: None
  - **Justification**: Pure verification task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (Verification)
  - **Blocks**: Tasks 6, 7, 8 (need verification pass)
  - **Blocked By**: Tasks 2, 3, 4 (all migrations complete)

  **References**:
  - All 3 migrated files as validation targets

  **Acceptance Criteria**:
  - [ ] `bun run build` exits with code 0
  - [ ] No TypeScript errors in output
  - [ ] `grep "@ai-sdk/anthropic" src/` returns empty
  - [ ] `grep "createOpenAICompatible" src/` returns exactly 3 matches

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Verify build passes and no Anthropic refs remain
    Tool: Bash
    Steps:
      1. Run: bun run build 2>&1 | tee /tmp/build-output.txt
      2. Assert: Exit code 0
      3. Run: grep -i 'error' /tmp/build-output.txt | grep -v 'warn' | wc -l
      4. Assert: Output equals 0 (no errors)
      5. Run: grep -r '@ai-sdk/anthropic' src/ --include='*.ts' | wc -l
      6. Assert: Output equals 0
      7. Run: grep -r 'createOpenAICompatible' src/ --include='*.ts' | wc -l
      8. Assert: Output equals 3
    Expected Result: Build clean, no Anthropic, 3 OpenRouter instances
    Evidence: /tmp/build-output.txt, terminal output
  ```

  **Commit**: NO (no code changes, verification only)

---

- [ ] **6. Set Up Test Infrastructure**

  **What to do**:
  - Since this project has no existing test framework, set up `bun test`
  - Create `test/` directory structure
  - Create example test file to verify setup works
  - Add test scripts to package.json if missing

  **Test Framework Setup**:
  - Bun has built-in test runner - no package installation needed
  - Just need directory structure and test files

  **Must NOT do**:
  - Do not install jest/vitest (use bun's built-in test runner)
  - Do not create comprehensive test suite (just infrastructure)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None
  - **Justification**: Standard setup task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (Testing)
  - **Blocks**: Task 7 (tests need infra)
  - **Blocked By**: Task 5 (verification must pass first)

  **References**:
  - Bun test docs for patterns

  **Acceptance Criteria**:
  - [ ] `test/` directory exists
  - [ ] Example test file runs: `bun test` passes
  - [ ] Package.json has test script (or verify it exists)

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Verify test infrastructure works
    Tool: Bash
    Steps:
      1. Run: bun test 2>&1 | head -20
      2. Assert: Output shows test runner starting
      3. Assert: Exit code 0 (even if no tests found)
    Expected Result: Test runner operational
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `chore(test): set up bun test infrastructure`
  - Files: `test/`, `package.json` (if modified)

---

- [ ] **7. Add Integration Tests for OpenRouter**

  **What to do**:
  - Create integration tests that verify OpenRouter API responses
  - Test each migrated route with mock requests
  - Verify JSON parsing works correctly
  - Test error handling

  **Test Coverage**:
  - Test `functions.ts` logic (if testable independently)
  - Test `suggestion/route.ts` API endpoint
  - Test `quick-edit/route.ts` API endpoint
  - Mock OpenRouter API responses to avoid real API calls in tests

  **Must NOT do**:
  - Do not make real OpenRouter API calls in tests (mock them)
  - Do not test UI behavior (only API contracts)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-medium` - Test writing requires some effort
  - **Skills**: None
  - **Justification**: Need to write integration tests for API routes

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 8
  - **Blocked By**: Task 6

  **References**:
  - `src/app/api/suggestion/route.ts` - API to test
  - `src/app/api/quick-edit/route.ts` - API to test
  - Zod schemas for validation testing

  **Acceptance Criteria**:
  - [ ] Test file exists: `test/openrouter-integration.test.ts`
  - [ ] Tests verify OpenRouter model responses
  - [ ] Tests verify JSON parsing logic
  - [ ] Tests mock API calls (no real network requests)
  - [ ] `bun test` passes with new tests

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Run integration tests
    Tool: Bash
    Steps:
      1. Run: bun test 2>&1 | tee /tmp/test-output.txt
      2. Assert: Exit code 0
      3. Run: grep -c 'PASS\|passed' /tmp/test-output.txt
      4. Assert: Output shows test count > 0
    Expected Result: All tests pass
    Evidence: /tmp/test-output.txt
  ```

  **Commit**: YES
  - Message: `test(api): add OpenRouter integration tests`
  - Files: `test/openrouter-integration.test.ts`

---

- [ ] **8. Remove @ai-sdk/anthropic Package**

  **What to do**:
  - Run `bun remove @ai-sdk/anthropic`
  - Verify package removed from `package.json`
  - Run `bun install` to update lockfile

  **Must NOT do**:
  - Do not remove if any Anthropic refs still exist (should be verified in Task 5)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (Cleanup)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 5, 7 (verification and tests must pass)

  **References**:
  - Current `package.json` for dependency verification

  **Acceptance Criteria**:
  - [ ] `@ai-sdk/anthropic` removed from `package.json`
  - [ ] `bun install` completes successfully
  - [ ] Final verification: `grep '@ai-sdk/anthropic' package.json` returns empty

  **Agent-Executed QA Scenario**:
  ```
  Scenario: Verify Anthropic package removed
    Tool: Bash
    Steps:
      1. Run: grep '@ai-sdk/anthropic' package.json
      2. Assert: Exit code 1 (not found)
      3. Run: bun install
      4. Assert: Exit code 0
    Expected Result: Package cleanly removed
    Evidence: Terminal output
  ```

  **Commit**: YES
  - Message: `chore(deps): remove @ai-sdk/anthropic`
  - Files: `package.json`, `bun.lock`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|

| 2 | `refactor(inngest): migrate functions.ts from Anthropic to OpenRouter` | `src/inngest/functions.ts` | No Anthropic refs |
| 3 | `refactor(api): migrate suggestion route to OpenRouter` | `src/app/api/suggestion/route.ts` | No Anthropic refs |
| 4 | `refactor(api): migrate quick-edit route to OpenRouter` | `src/app/api/quick-edit/route.ts` | No Anthropic refs |
| 5 | (no commit - verification) | - | - |
| 6 | `chore(test): set up bun test infrastructure` | `test/`, `package.json` | `bun test` works |
| 7 | `test(api): add OpenRouter integration tests` | `test/openrouter-integration.test.ts` | Tests pass |
| 8 | `chore(deps): remove @ai-sdk/anthropic` | `package.json`, `bun.lock` | No Anthropic in deps |

---

## Success Criteria

### Verification Commands
```bash
# 1. Build passes
bun run build
# Expected: Exit code 0, no TypeScript errors

# 2. No Anthropic references remain
grep -r "@ai-sdk/anthropic" src/ --include="*.ts"
# Expected: Empty output

# 3. OpenAI-compatible references present (3 files)
grep -r "createOpenAICompatible" src/ --include="*.ts" | wc -l
# Expected: Output equals 3

# 4. Tests pass
bun test
# Expected: Exit code 0, all tests pass

# 5. Package removed
grep "@ai-sdk/anthropic" package.json
# Expected: Exit code 1 (not found)
```

### Final Checklist
- [ ] All 3 files migrated to `@ai-sdk/openai-compatible`
- [ ] Using correct models: `minimax/minimax-m2.5` and `qwen/qwen3-coder-next`
- [ ] Using manual JSON parsing (not `Output.object()`)
- [ ] Build passes with zero errors
- [ ] Integration tests verify functionality
- [ ] `@ai-sdk/anthropic` removed from dependencies
- [ ] No Anthropic SDK references remain in codebase

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Model not supporting expected output format | HIGH | Using manual JSON parsing instead of structured output |
| `OPENROUTER_API_KEY` missing at runtime | HIGH | Already confirmed set in environment |
| TypeScript compilation errors | MEDIUM | Full build verification in Task 5 |
| Telemetry incompatibility | LOW | Preserving config but noting potential issue |
| qwen3-coder-next doesn't exist | MEDIUM | User confirmed model exists |

---

## Notes for Executor

1. **Manual JSON Parsing**: The user explicitly requested to switch from `Output.object()` to `generateText()` + `JSON.parse()`. This means:
   - Remove `output: Output.object({ schema: ... })` parameter
   - Parse the `text` response manually
   - Validate with Zod schema (`.parse()` or `.safeParse()`)

2. **Model IDs**: Use exact format:
   - `minimax/minimax-m2.5` (with slash)
   - `qwen/qwen3-coder-next` (with slash)

3. **Error Handling**: Preserve existing patterns:
   - API routes return 400 for bad input, 500 for server errors
   - `functions.ts` uses existing error logging

4. **process-message.ts**: Do NOT touch this file. It uses `@inngest/agent-kit` which is a different library pattern. The migration is only for the 3 files using `@ai-sdk/anthropic`.

5. **Telemetry**: The `experimental_telemetry` config is preserved but may not work with OpenRouter. This is noted but not changed per guardrails.

6. **Testing**: Mock OpenRouter API calls in tests - don't make real requests.
