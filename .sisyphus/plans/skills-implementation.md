# Skill System Implementation Plan

## TL;DR

> **Objective**: Add a skill system to Polaris that groups tools into reusable capabilities, compatible with the skills.sh/Agent Skills ecosystem.
> 
> **Deliverables**:
> - Skill registry and types (`src/features/conversations/skills/`)
> - Refactored existing 8 tools into 2 built-in skills (file-management, web-research)
> - SKILL.md parser for external skills
> - Skill loading from `.agents/skills/` directory
> - Integration with `process-message.ts`
> - (Optional Phase 3) UI for skill management
> 
> **Estimated Effort**: Medium (3 phases, ~15-20 tasks)
> **Parallel Execution**: YES - 4 waves per phase
> **Critical Path**: Phase 1 Wave 1 → Phase 1 Wave 2 → Phase 2 Wave 1 → Phase 2 Wave 2 → Phase 3 (optional)

---

## Context

### Original Request
Add skills to Polaris agent like Claude Code does, using skills.sh ecosystem. Skills are reusable capabilities that extend agent functionality.

### Interview Summary
**Key Decisions**:
- Use **Hybrid Approach**: Built-in TypeScript skills + external SKILL.md support
- Three phases: Foundation → External Skills → UI Integration
- Skills are **groups of related tools** with metadata and instructions
- Maintain **backward compatibility** with existing tool system

**Metis Review Findings**:
- Guardrails needed for scope boundaries and security
- Critical decisions around skill activation scope and conflict resolution
- External skills should be documentation-only (no code execution) in Phase 2
- Feature flag required for rollback capability

### Guardrails from Metis Review
**MUST NOT**:
- Allow external skills to execute arbitrary scripts without sandboxing
- Break existing tool functionality during any phase
- Add UI components until core skill system is working
- Implement skills.sh CLI integration until SKILL.md parser is fully tested
- Allow skills to modify other skills' behavior
- Enable dynamic tool creation from SKILL.md in Phase 1 or 2

**MUST**:
- Keep existing 8 tools working with zero behavioral changes
- Validate SKILL.md YAML frontmatter before loading (fail gracefully)
- Limit active skills per conversation (suggest max 10)
- Keep total system prompt under token limit
- Add feature flag `ENABLE_SKILL_SYSTEM` for rollback

**EXPLICITLY EXCLUDED (Scope Lock)**:
- Tool permission system per skill
- Dynamic tool creation from SKILL.md
- Real-time collaboration on skills
- Skill marketplace/discovery UI (use skills.sh CLI)
- Automatic skill suggestion
- Nested skill dependencies

---

## Work Objectives

### Core Objective
Implement a skill system that groups the existing 8 tools into logical categories and supports loading external SKILL.md files from the skills.sh ecosystem.

### Concrete Deliverables
- `src/features/conversations/skills/types.ts` - TypeScript interfaces
- `src/features/conversations/skills/registry.ts` - Skill registry class
- `src/features/conversations/skills/core/file-management/` - File operation skill
- `src/features/conversations/skills/core/web-research/` - Web scraping skill
- `src/features/conversations/skills/parser/skill-parser.ts` - SKILL.md parser
- `src/features/conversations/skills/loader/skill-loader.ts` - Skill discovery
- `src/features/conversations/skills/index.ts` - Public exports
- Updated `process-message.ts` - Integration with skill registry

### Definition of Done
- [ ] All 8 existing tools work identically to before
- [ ] Skills can be loaded from `.agents/skills/` directory
- [ ] Skill instructions appear in system prompt
- [ ] Invalid skills are skipped gracefully with logging
- [ ] Feature flag controls skill system enablement

### Must Have
- Backward compatibility with existing tools
- Skill registry with registration/lookup
- Built-in skills for file operations and web research
- SKILL.md parser with YAML frontmatter support
- Skill discovery from filesystem
- Graceful error handling for malformed skills

### Must NOT Have (Guardrails)
- Breaking changes to existing tool behavior
- Code execution from external skills (Phase 2)
- UI components until Phase 3
- skills.sh CLI integration until parser is tested
- Dynamic tool creation from SKILL.md

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test available)
- **Automated tests**: YES (tests after implementation)
- **Framework**: bun test
- **Coverage**: Unit tests for parser, registry, loader

### QA Policy
Every task includes agent-executed QA scenarios:
- **Backend/Parser**: Bun tests with assertions
- **Integration**: Verify agent behavior with skill system enabled/disabled
- **Files**: Check file structure and content

---

## Execution Strategy

### Parallel Execution Waves

#### Phase 1: Built-in Skills Foundation

```
Wave 1 (Foundation - types and registry):
├── Task 1: Create skill types and interfaces [quick]
├── Task 2: Create SkillRegistry class [quick]
├── Task 3: Add feature flag infrastructure [quick]
└── Task 4: Create skills index exports [quick]

Wave 2 (Skill migration - file-management):
├── Task 5: Create file-management skill structure [quick]
├── Task 6: Migrate list-files tool to skill [quick]
├── Task 7: Migrate read-files tool to skill [quick]
├── Task 8: Migrate create-files tool to skill [quick]
├── Task 9: Migrate update-file tool to skill [quick]
├── Task 10: Migrate delete-files tool to skill [quick]
├── Task 11: Migrate rename-file tool to skill [quick]
└── Task 12: Migrate create-folder tool to skill [quick]

Wave 3 (Skill migration - web-research):
├── Task 13: Create web-research skill structure [quick]
└── Task 14: Migrate scrape-urls tool to skill [quick]

Wave 4 (Integration):
├── Task 15: Update process-message.ts to use skills [unspecified-high]
├── Task 16: Create re-exports for backward compatibility [quick]
├── Task 17: Add skill instructions to system prompt [quick]
└── Task 18: Write tests for skill registry [unspecified-low]

Wave 5 (Verification):
├── Task 19: Verify all 8 tools work unchanged [deep]
└── Task 20: Verify feature flag works correctly [unspecified-low]
```

#### Phase 2: External SKILL.md Support

```
Wave 1 (Parser foundation):
├── Task 21: Add js-yaml dependency [quick]
├── Task 22: Create SKILL.md parser [unspecified-high]
├── Task 23: Create skill validator [unspecified-low]
└── Task 24: Write parser tests [unspecified-low]

Wave 2 (Loader):
├── Task 25: Create skill discovery function [unspecified-high]
├── Task 26: Add skill loading to registry [unspecified-high]
├── Task 27: Handle malformed skills gracefully [unspecified-low]
└── Task 28: Write loader tests [unspecified-low]

Wave 3 (Integration):
├── Task 29: Load external skills in process-message.ts [unspecified-high]
├── Task 30: Merge external skill instructions to prompt [unspecified-high]
├── Task 31: Add skill loading logging [quick]
└── Task 32: Test with sample SKILL.md files [deep]
```

#### Phase 3: UI Integration (Optional - Future)

```
Wave 1 (Schema):
├── Task 33: Add skills table to Convex schema [quick]
└── Task 34: Add skill queries/mutations [quick]

Wave 2 (API):
├── Task 35: Create skill installation API endpoint [unspecified-high]
└── Task 36: Create skill management endpoints [unspecified-high]

Wave 3 (UI):
├── Task 37: Create skill browser component [visual-engineering]
├── Task 38: Create skill card component [visual-engineering]
├── Task 39: Add skill panel to conversation sidebar [visual-engineering]
└── Task 40: Integrate skill management UI [visual-engineering]
```

### Critical Path
- Task 1-4 → Task 5-12 → Task 13-14 → Task 15-17 → Task 19 (Phase 1 complete)
- Task 21-24 → Task 25-28 → Task 29-32 (Phase 2 complete)
- Task 33-40 (Phase 3 optional)

---

## TODOs

### Phase 1: Built-in Skills Foundation

- [x] 1. Create skill types and interfaces

  **What to do**:
  - Create `src/features/conversations/skills/types.ts`
  - Define `Skill` interface with name, description, tools, instructions, metadata
  - Define `SkillFactory<TContext>` type for factory functions
  - Add types for skill registry operations
  
  **File Structure**:
  ```typescript
  export interface Skill {
    name: string;
    description: string;
    category?: string;
    tools: Tool[];
    instructions?: string;
    metadata?: {
      version?: string;
      author?: string;
      internal?: boolean;
    };
  }
  
  export interface SkillFactory<TContext> {
    (context: TContext): Skill;
  }
  ```

  **Must NOT do**:
  - Add runtime logic, just types
  - Import heavy dependencies
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-4)
  - **Blocks**: Task 2, 5, 13
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] TypeScript file compiles without errors
  - [ ] All interfaces are exported
  
  **QA Scenarios**:
  ```
  Scenario: Types compile successfully
    Tool: Bash
    Steps:
      1. Run: cd /home/dih/polaris-cwa/polaris && bun tsc --noEmit
    Expected Result: No TypeScript errors
    Evidence: .sisyphus/evidence/task-1-types-compile.log
  ```

  **Commit**: YES
  - Message: `feat(skills): add skill types and interfaces`
  - Files: `src/features/conversations/skills/types.ts`

---

- [x] 2. Create SkillRegistry class

  **What to do**:
  - Create `src/features/conversations/skills/registry.ts`
  - Implement SkillRegistry class with:
    - `register(skill: Skill)` - Add skill to registry
    - `get(name: string)` - Get skill by name
    - `getAll()` - Get all registered skills
    - `getTools()` - Get all tools from all skills
    - `getSystemInstructions()` - Concatenate skill instructions
  - Handle duplicate skill names (last registered wins, log warning)
  
  **Must NOT do**:
  - Add persistence (just in-memory registry)
  - Add external skill loading (handled separately)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 15, 26
  - **Blocked By**: Task 1

  **Acceptance Criteria**:
  - [ ] Registry class compiles
  - [ ] All methods work as documented
  - [ ] Duplicate names are handled (warning logged)
  
  **QA Scenarios**:
  ```
  Scenario: Registry works correctly
    Tool: Bash
    Steps:
      1. Create test file with registry usage
      2. Run: bun test src/features/conversations/skills/registry.test.ts
    Expected Result: Tests pass
    Evidence: .sisyphus/evidence/task-2-registry-test.log
  ```

  **Commit**: YES
  - Message: `feat(skills): add SkillRegistry class`
  - Files: `src/features/conversations/skills/registry.ts`

---

- [x] 3. Add feature flag infrastructure

  **What to do**:
  - Add `ENABLE_SKILL_SYSTEM` environment variable check
  - Create utility function to check if skill system is enabled
  - Default to false if not set (safe rollout)
  - Add to .env.example
  
  **Must NOT do**:
  - Remove existing tool registration
  - Change behavior when flag is disabled

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: Task 15
  - **Blocked By**: None

  **Acceptance Criteria**:
  - [ ] Flag can be set in environment
  - [ ] Utility function returns correct value
  - [ ] .env.example updated
  
  **QA Scenarios**:
  ```
  Scenario: Feature flag works
    Tool: Bash
    Steps:
      1. Check .env.example has ENABLE_SKILL_SYSTEM
      2. Test utility function with flag on/off
    Expected Result: Flag controls behavior
    Evidence: .sisyphus/evidence/task-3-feature-flag.log
  ```

  **Commit**: YES
  - Message: `feat(skills): add ENABLE_SKILL_SYSTEM feature flag`
  - Files: `src/features/conversations/skills/feature-flag.ts`, `.env.example`

---

- [x] 4. Create skills index exports

  **What to do**:
  - Create `src/features/conversations/skills/index.ts`
  - Export types, registry, feature flag utilities
  - Prepare for skill factory exports (will be added later)
  
  **Must NOT do**:
  - Export skill factories yet (they don't exist)
  - Add circular dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-3)
  - **Blocks**: Task 5, 13, 15
  - **Blocked By**: Task 1, 2

  **Acceptance Criteria**:
  - [ ] Index file compiles
  - [ ] All exports are accessible
  
  **QA Scenarios**:
  ```
  Scenario: Exports work
    Tool: Bash
    Steps:
      1. Import from skills module
      2. Verify exports are accessible
    Expected Result: No import errors
    Evidence: .sisyphus/evidence/task-4-exports.log
  ```

  **Commit**: YES (grouped with Wave 1)
  - Message: `feat(skills): add skills module index exports`
  - Files: `src/features/conversations/skills/index.ts`

---

- [x] 5. Create file-management skill structure

  **What to do**:
  - Create directory: `src/features/conversations/skills/core/file-management/`
  - Create `SKILL.md` with skill metadata and instructions
  - Create `index.ts` for skill factory
  - Create `tools/` subdirectory
  
  **SKILL.md Content**:
  ```yaml
  ---
  name: file-management
  description: Create, read, update, and delete files and folders in the project
  ---
  
  # File Management Skill
  
  Use this skill to manage project files and folders.
  
  ## When to Use
  - Creating new files or folders
  - Reading existing file contents
  - Updating file contents
  - Renaming or deleting files
  
  ## Guidelines
  1. Use listFiles first to understand project structure
  2. Use readFiles to understand existing code before modifying
  3. Batch create operations with createFiles for efficiency
  4. File paths can include directories (e.g., "src/components/Button.tsx")
  ```

  **Must NOT do**:
  - Move tool implementations yet (just structure)
  - Import tool factories yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6-12)
  - **Blocks**: Task 6-12
  - **Blocked By**: Task 1-4

  **Acceptance Criteria**:
  - [ ] Directory structure exists
  - [ ] SKILL.md has valid frontmatter
  - [ ] index.ts exists with placeholder
  
  **QA Scenarios**:
  ```
  Scenario: Skill structure exists
    Tool: Bash
    Steps:
      1. Check directory exists: ls src/features/conversations/skills/core/file-management/
      2. Verify SKILL.md exists
    Expected Result: All files present
    Evidence: .sisyphus/evidence/task-5-structure.log
  ```

  **Commit**: YES (grouped with Wave 2)
  - Message: `feat(skills): add file-management skill structure`
  - Files: `src/features/conversations/skills/core/file-management/*`

---

- [x] 6-12. Migrate tools to file-management skill

  **What to do for each tool**:
  - Copy tool factory to `skills/core/file-management/tools/`
  - Update imports to use correct relative paths
  - Export from skill's `index.ts`
  - Keep original in place (backward compatibility)
  
  **Tools to migrate**:
  - Task 6: list-files.ts
  - Task 7: read-files.ts
  - Task 8: create-files.ts
  - Task 9: update-file.ts
  - Task 10: delete-files.ts
  - Task 11: rename-file.ts
  - Task 12: create-folder.ts

  **Must NOT do**:
  - Delete original tool files
  - Change tool behavior
  - Break existing imports

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES (all 7 tools)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 15
  - **Blocked By**: Task 5

  **Acceptance Criteria**:
  - [ ] All 7 tools exist in new location
  - [ ] Tools compile without errors
  - [ ] Original tools still work
  
  **QA Scenarios**:
  ```
  Scenario: Tools migrated successfully
    Tool: Bash
    Steps:
      1. Verify all tool files exist in new location
      2. Run TypeScript check
      3. Verify original imports still work
    Expected Result: No errors
    Evidence: .sisyphus/evidence/task-6-12-migration.log
  ```

  **Commit**: YES (group all 7 tools)
  - Message: `feat(skills): migrate file tools to file-management skill`
  - Files: `src/features/conversations/skills/core/file-management/tools/*`

---

- [x] 13. Create web-research skill structure

  **What to do**:
  - Create directory: `src/features/conversations/skills/core/web-research/`
  - Create `SKILL.md` with metadata and instructions
  - Create `index.ts` for skill factory
  - Create `tools/` subdirectory
  
  **Must NOT do**:
  - Move scrape-urls yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 14)
  - **Blocks**: Task 14
  - **Blocked By**: Task 1-4

  **Acceptance Criteria**:
  - [ ] Directory structure exists
  - [ ] SKILL.md created
  
  **Commit**: YES (group with Task 14)
  - Message: `feat(skills): add web-research skill`
  - Files: `src/features/conversations/skills/core/web-research/*`

---

- [x] 14. Migrate scrape-urls tool

  **What to do**:
  - Copy scrape-urls.ts to web-research/tools/
  - Update imports
  - Export from skill index
  - Keep original in place

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 15
  - **Blocked By**: Task 13

  **Commit**: Grouped with Task 13

---

- [x] 15. Update process-message.ts to use skills

  **What to do**:
  - Import SkillRegistry and skill factories
  - Check ENABLE_SKILL_SYSTEM flag
  - If enabled:
    - Create registry
    - Register file-management and web-research skills
    - Get tools from registry
    - Get system instructions from registry
    - Append instructions to system prompt
  - If disabled:
    - Use existing tool registration (unchanged)
  - Update system prompt construction
  
  **Code Pattern**:
  ```typescript
  import { SkillRegistry, fileManagementSkill, webResearchSkill } from './skills';
  
  // ... inside function
  let tools;
  let systemInstructions = systemPrompt;
  
  if (process.env.ENABLE_SKILL_SYSTEM === 'true') {
    const registry = new SkillRegistry();
    registry.register(fileManagementSkill({ internalKey, projectId }));
    registry.register(webResearchSkill({ internalKey }));
    
    tools = registry.getTools();
    systemInstructions += '\n\n' + registry.getSystemInstructions();
  } else {
    // Legacy tool registration
    tools = [
      createListFilesTool({ internalKey, projectId }),
      // ... all 8 tools
    ];
  }
  
  const codingAgent = createAgent({
    system: systemInstructions,
    tools,
    // ... rest of config
  });
  ```

  **Must NOT do**:
  - Remove legacy code path
  - Change default behavior (flag must be opt-in)
  - Break existing imports

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Tasks 1-14
  - **Blocks**: Task 19

  **Acceptance Criteria**:
  - [ ] process-message.ts compiles
  - [ ] Flag controls which path is used
  - [ ] Both paths register all 8 tools
  - [ ] Skill path adds instructions to prompt
  
  **QA Scenarios**:
  ```
  Scenario: Skill integration works
    Tool: Bash
    Steps:
      1. Verify TypeScript compiles
      2. Check both code paths exist
      3. Verify skill instructions are appended
    Expected Result: No errors, correct behavior
    Evidence: .sisyphus/evidence/task-15-integration.log
  ```

  **Commit**: YES
  - Message: `feat(skills): integrate skill system into process-message`
  - Files: `src/features/conversations/inngest/process-message.ts`

---

- [x] 16. Create re-exports for backward compatibility

  **What to do**:
  - Update `src/features/conversations/inngest/tools/index.ts` (or create it)
  - Re-export all tool factories from new locations
  - Ensure existing imports continue to work
  - Mark as deprecated in JSDoc
  
  **Must NOT do**:
  - Change export signatures
  - Remove any exports

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: Tasks 6-12, 14

  **Commit**: YES
  - Message: `chore(skills): add backward compatibility re-exports`
  - Files: `src/features/conversations/inngest/tools/index.ts`

---

- [x] 17. Add skill instructions to system prompt

  **What to do**:
  - Verify skill instructions are properly formatted
  - Ensure they appear after base system prompt
  - Add separator between skills
  
  **Must NOT do**:
  - Change base system prompt content
  - Remove existing instructions

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 15

  **Commit**: Grouped with Task 15

---

- [x] 18. Write tests for skill registry

  **What to do**:
  - Create `src/features/conversations/skills/registry.test.ts`
  - Test register, get, getAll, getTools, getSystemInstructions
  - Test duplicate name handling
  - Test empty registry edge cases
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Blocked By**: Task 2

  **Acceptance Criteria**:
  - [ ] All registry methods tested
  - [ ] Tests pass with `bun test`
  
  **Commit**: YES
  - Message: `test(skills): add SkillRegistry tests`
  - Files: `src/features/conversations/skills/registry.test.ts`

---

- [ ] 19. Verify all 8 tools work unchanged

  **What to do**:
  - Test each tool manually or via integration tests
  - Verify identical behavior with skill system on vs off
  - Check tool responses match expected format
  
  **Tools to verify**:
  1. listFiles
  2. readFiles
  3. createFiles
  4. updateFile
  5. deleteFiles
  6. renameFile
  7. createFolder
  8. scrapeUrls

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Tasks 15-18

  **Acceptance Criteria**:
  - [ ] All 8 tools return expected results
  - [ ] Behavior identical to before migration
  - [ ] No regressions in file operations
  
  **QA Scenarios**:
  ```
  Scenario: Tools work correctly
    Tool: interactive_bash (tmux)
    Steps:
      1. Start dev server
      2. Create test conversation
      3. Test each tool via conversation
    Expected Result: All tools function correctly
    Evidence: .sisyphus/evidence/task-19-tool-verification.log
  ```

  **Commit**: N/A (verification task)

---

- [ ] 20. Verify feature flag works correctly

  **What to do**:
  - Test with flag disabled (default)
  - Test with flag enabled
  - Verify no skill instructions when disabled
  - Verify skill instructions when enabled
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 15

  **Acceptance Criteria**:
  - [ ] Flag off → legacy behavior
  - [ ] Flag on → skill system active
  - [ ] No errors in either mode
  
  **Commit**: N/A (verification task)

---

### Phase 2: External SKILL.md Support

- [x] 21. Add js-yaml dependency

  **What to do**:
  - Run `bun add js-yaml`
  - Run `bun add -d @types/js-yaml`
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Parallel Group**: Wave 1 (Phase 2)

  **Commit**: YES
  - Message: `chore(deps): add js-yaml for SKILL.md parsing`
  - Files: `package.json`, `bun.lockb`

---

- [x] 22. Create SKILL.md parser

  **What to do**:
  - Create `src/features/conversations/skills/parser/skill-parser.ts`
  - Parse YAML frontmatter (--- to ---)
  - Extract name, description, metadata
  - Extract markdown body content
  - Return structured skill data
  - Handle errors gracefully
  
  **Code Pattern**:
  ```typescript
  import yaml from 'js-yaml';
  
  export interface ParsedSkill {
    name: string;
    description: string;
    content: string;
    metadata?: Record<string, any>;
  }
  
  export function parseSkillFile(content: string): ParsedSkill {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      throw new Error('Invalid SKILL.md format: missing frontmatter');
    }
    
    const [, yamlContent, bodyContent] = frontmatterMatch;
    const frontmatter = yaml.load(yamlContent) as any;
    
    return {
      name: frontmatter.name,
      description: frontmatter.description,
      content: bodyContent.trim(),
      metadata: frontmatter.metadata,
    };
  }
  ```

  **Must NOT do**:
  - Parse scripts/ or references/ directories yet
  - Execute any code from skills

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 21
  - **Blocks**: Task 24, 25

  **Acceptance Criteria**:
  - [ ] Parser handles valid SKILL.md files
  - [ ] Parser throws clear errors for invalid files
  - [ ] All required fields extracted
  
  **QA Scenarios**:
  ```
  Scenario: Parser works
    Tool: Bash
    Steps:
      1. Create test SKILL.md files
      2. Run parser tests
    Expected Result: All tests pass
    Evidence: .sisyphus/evidence/task-22-parser.log
  ```

  **Commit**: YES
  - Message: `feat(skills): add SKILL.md parser`
  - Files: `src/features/conversations/skills/parser/skill-parser.ts`

---

- [x] 23. Create skill validator

  **What to do**:
  - Create `src/features/conversations/skills/parser/validate-skill.ts`
  - Validate name format (lowercase, hyphens, max 64 chars)
  - Validate description length (max 1024 chars)
  - Return validation result with errors
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 22

  **Commit**: YES (group with Task 22)

---

- [ ] 24. Write parser tests

  **What to do**:
  - Create `src/features/conversations/skills/parser/skill-parser.test.ts`
  - Test valid SKILL.md parsing
  - Test invalid frontmatter (missing, malformed YAML)
  - Test edge cases (empty content, very long content)
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 22

  **Acceptance Criteria**:
  - [ ] Parser tests pass
  - [ ] Coverage for error cases
  
  **Commit**: YES
  - Message: `test(skills): add SKILL.md parser tests`
  - Files: `src/features/conversations/skills/parser/*.test.ts`

---

- [x] 25. Create skill discovery function

  **What to do**:
  - Create `src/features/conversations/skills/loader/skill-loader.ts`
  - Search `.agents/skills/` directory
  - Find all `SKILL.md` files in subdirectories
  - Parse each skill file
  - Return array of skills
  - Handle missing directory gracefully (return empty array)
  - Log warnings for invalid skills (don't crash)
  
  **Discovery Paths**:
  - `.agents/skills/*`
  
  **Code Pattern**:
  ```typescript
  import { parseSkillFile } from '../parser/skill-parser';
  import fs from 'fs/promises';
  import path from 'path';
  
  export async function discoverSkills(projectRoot: string): Promise<Skill[]> {
    const skills: Skill[] = [];
    const skillDir = path.join(projectRoot, '.agents/skills');
    
    try {
      const entries = await fs.readdir(skillDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const skillPath = path.join(skillDir, entry.name, 'SKILL.md');
        
        try {
          const content = await fs.readFile(skillPath, 'utf-8');
          const parsed = parseSkillFile(content);
          
          skills.push({
            name: parsed.name,
            description: parsed.description,
            category: 'external',
            tools: [], // External skills don't have tools yet
            instructions: parsed.content,
            metadata: parsed.metadata,
          });
        } catch (e) {
          console.warn(`Failed to parse skill at ${skillPath}:`, e);
        }
      }
    } catch {
      // Directory doesn't exist, return empty array
    }
    
    return skills;
  }
  ```

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 22
  - **Blocks**: Task 29

  **Acceptance Criteria**:
  - [ ] Discovers skills from directory
  - [ ] Handles missing directory
  - [ ] Skips invalid skills with warnings
  
  **QA Scenarios**:
  ```
  Scenario: Skill discovery works
    Tool: Bash
    Steps:
      1. Create test .agents/skills/ directory
      2. Add sample skills
      3. Run discovery
    Expected Result: Skills found and parsed
    Evidence: .sisyphus/evidence/task-25-discovery.log
  ```

  **Commit**: YES
  - Message: `feat(skills): add skill discovery from filesystem`
  - Files: `src/features/conversations/skills/loader/skill-loader.ts`

---

- [ ] 26. Add skill loading to registry

  **What to do**:
  - Add `loadExternalSkills(skills: Skill[])` method to registry
  - Or update process-message to load and register external skills
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 25
  - **Blocks**: Task 29

  **Commit**: YES (group with Task 25 or 29)

---

- [ ] 27. Handle malformed skills gracefully

  **What to do**:
  - Ensure parser errors don't crash system
  - Log clear error messages
  - Skip invalid skills, continue loading others
  - Add error telemetry if Sentry is configured
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 25

  **Commit**: Grouped with Task 25

---

- [ ] 28. Write loader tests

  **What to do**:
  - Create `src/features/conversations/skills/loader/skill-loader.test.ts`
  - Test directory scanning
  - Test skill parsing integration
  - Test error handling (missing files, invalid YAML)
  
  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 25

  **Commit**: YES
  - Message: `test(skills): add skill loader tests`
  - Files: `src/features/conversations/skills/loader/*.test.ts`

---

- [ ] 29. Load external skills in process-message.ts

  **What to do**:
  - Import `discoverSkills`
  - In skill system path, load external skills from project root
  - Register external skills with registry
  - Merge external instructions with built-in instructions
  
  **Code Pattern**:
  ```typescript
  import { discoverSkills } from './skills/loader/skill-loader';
  
  // ... inside function
  if (process.env.ENABLE_SKILL_SYSTEM === 'true') {
    const registry = new SkillRegistry();
    
    // Register built-in skills
    registry.register(fileManagementSkill({ internalKey, projectId }));
    registry.register(webResearchSkill({ internalKey }));
    
    // Load and register external skills
    const externalSkills = await discoverSkills(projectRoot);
    externalSkills.forEach(skill => registry.register(skill));
    
    // ... rest of setup
  }
  ```

  **Must NOT do**:
  - Load external skills if flag is disabled
  - Fail if external skills are invalid

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Tasks 25, 15
  - **Blocks**: Task 32

  **Acceptance Criteria**:
  - [ ] External skills are loaded when flag enabled
  - [ ] Invalid skills are skipped with warnings
  - [ ] Instructions appear in system prompt
  
  **Commit**: YES
  - Message: `feat(skills): load external skills in process-message`
  - Files: `src/features/conversations/inngest/process-message.ts`

---

- [ ] 30. Merge external skill instructions to prompt

  **What to do**:
  - Ensure external skill content is properly formatted
  - Add skill name as header before each skill's instructions
  - Maintain order (built-in first, then external)
  
  **Must NOT do**:
  - Truncate or modify skill content
  - Remove built-in instructions

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 29

  **Commit**: Grouped with Task 29

---

- [ ] 31. Add skill loading logging

  **What to do**:
  - Log each skill loaded (name, source)
  - Log warnings for invalid skills
  - Log total skills loaded
  - Use console.log or existing logging infrastructure
  
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Task 29

  **Commit**: Grouped with Task 29

---

- [ ] 32. Test with sample SKILL.md files

  **What to do**:
  - Create test skill in `.agents/skills/test-skill/SKILL.md`
  - Run conversation with skill system enabled
  - Verify skill instructions appear in context
  - Test with skills.sh format skills
  
  **Test Skills**:
  - vercel-react-best-practices
  - web-design-guidelines
  
  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: None needed
  
  **Parallelization**:
  - **Blocked By**: Tasks 29-31

  **Acceptance Criteria**:
  - [ ] Real skills load successfully
  - [ ] Instructions appear in context
  - [ ] No parsing errors
  
  **Commit**: N/A (testing task)

---

## Decisions Made

✅ **Skill Activation Scope**: **Per-project**
 Skills are enabled/disabled per project
 Aligns with `.agents/skills/` directory structure
 Skills apply to all conversations in a project

✅ **Conflict Resolution**: **Built-in always wins**
 External skills with duplicate names are skipped
 Prevents external skills from breaking core functionality
 Log warning when duplicate detected

✅ **Token Budget**: **No limit** (trust skill authors)
 No hard truncation of skill instructions
 Rely on skill authors to keep content reasonable
 Monitor in production, add limits if needed

✅ **External Skill Capabilities**: **Scripts with sandboxing**
 External skills can include scripts/ directory
 Scripts execute in sandboxed environment (Phase 2)
 Security review required before script execution
---

## Final Verification Wave (After ALL tasks)

- [ ] F1. **Plan Compliance Audit** - `oracle`
  Verify all "Must Have" items are implemented, all "Must NOT Have" are absent, evidence files exist.

- [ ] F2. **Code Quality Review** - `unspecified-high`
  Run `tsc --noEmit`, `bun test`, check for AI slop patterns.

- [ ] F3. **Integration QA** - `deep`
  Test complete flow: enable flag → load skills → verify instructions in prompt.

- [ ] F4. **Scope Fidelity Check** - `deep`
  Verify no scope creep (no permissions, no dynamic tools, no marketplace UI).

---

## Commit Strategy

- **Phase 1 commits**: Group by wave (Wave 1: tasks 1-4, Wave 2: tasks 5-12, Wave 3: task 13-14, Wave 4: tasks 15-18)
- **Phase 2 commits**: Group by wave (Wave 1: tasks 21-24, Wave 2: tasks 25-28, Wave 3: tasks 29-32)
- **Phase 3**: Separate commits for schema, API, UI (if implemented)

---

## Success Criteria

### Verification Commands
```bash
# TypeScript compiles
bun tsc --noEmit

# Tests pass
bun test src/features/conversations/skills/

# Feature flag works
ENABLE_SKILL_SYSTEM=false bun run dev  # Legacy mode
ENABLE_SKILL_SYSTEM=true bun run dev   # Skill mode

# Skills load from filesystem
ls .agents/skills/  # Should find and load skills
```

### Final Checklist
- [ ] All 8 tools work identically to before Phase 1
- [ ] Skill system can be enabled/disabled via feature flag
- [ ] Built-in skills register correctly
- [ ] External skills load from `.agents/skills/`
- [ ] Skill instructions appear in system prompt
- [ ] Invalid skills are skipped gracefully
- [ ] No scope creep features present
