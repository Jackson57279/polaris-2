# Subagents for Inngest AgentKit

## TL;DR

> **Quick Summary**: Add intent-based subagent routing to Polaris using AgentKit Networks. A Classifier agent detects user intent and routes to specialist agents (Planner, Builder, Debugger, Researcher, General) with role-specific tools.
> 
> **Deliverables**:
> - 6 specialized agents with different tools and models
> - Intent classification and routing system
> - Agent attribution badges in chat UI
> - Tool bundles for role-based access control
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Types → Agents → Network Router → UI Badge

---

## Context

### Original Request
"Let's add subagents, figure out how it works in inngest agentkit please."

### Interview Summary
**Key Discussions**:
- **Subagent Strategy**: Intent-based routing with single-shot classification (no clarifying questions)
- **Agent Roster**: 6 agents - Classifier, Planner, Builder, Debugger, Researcher, General
- **Tool Distribution**: Specialized tool sets per role (read-only for Planner, full for Builder)
- **Model Configuration**: Fast model (grok-4.1-fast) for Classifier/Researcher, Capable (gemini-3.1-pro) for others
- **UI Integration**: Agent attribution badge on each message

**Research Findings**:
- AgentKit uses Networks for orchestration with shared state
- Router function decides next agent based on `network.state.data`
- Each agent can have different tools and models
- Current setup: single agent with 8 file tools

### Metis Review
**Identified Gaps** (addressed):
- **Router Conflict**: Must use hybrid routing - Classifier first, then specialist, then existing stop logic
- **State Schema**: Define `PolarisNetworkState` interface with intent, currentAgent, switchCount
- **Classification Persistence**: Add `set_intent` tool for Classifier to save decision
- **Guardrails**: Implement `maxAgentSwitches` (≤5) to prevent infinite loops

---

## Work Objectives

### Core Objective
Implement a multi-agent system where a Classifier detects user intent and routes to specialist agents with appropriate tools for the task type.

### Concrete Deliverables
- Agent definitions with specialized tools
- Intent classification and routing logic
- Agent attribution in message metadata and UI
- Tool bundles for role-specific access

### Definition of Done
- [ ] Classifier correctly routes to specialist ≥85% accuracy
- [ ] Agent badge displays on each message
- [ ] Tool restrictions enforced per agent role
- [ ] No router conflicts with existing logic
- [ ] Loop prevention guardrails active

### Must Have
- Classifier agent with `set_intent` tool
- Planner agent (read-only + .md file creation)
- Builder agent (all tools)
- Debugger agent (read + write for fixes)
- Researcher agent (scrapeUrls only)
- General agent (all tools, fallback)
- Agent badge in UI

### Must NOT Have (Guardrails)
- Slash commands for agent switching (out of scope)
- Multi-turn classification (clarifying questions)
- User manual agent selection
- New file tools (use existing 8 only)
- Streaming agent responses
- Agent memory/persistence beyond conversation

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: Tests after implementation
- **Framework**: bun test
- **Test focus**: Agent routing logic, classification accuracy

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — types + tool bundles):
├── Task 1: NetworkState interface + types [quick]
├── Task 2: Tool bundles (read-only, planning, debugging, full) [quick]
└── Task 3: Agent system prompts in constants.ts [quick]

Wave 2 (After Wave 1 — agent definitions):
├── Task 4: Classifier agent + set_intent tool [quick]
├── Task 5: Planner agent [quick]
├── Task 6: Builder agent [quick]
├── Task 7: Debugger agent [quick]
├── Task 8: Researcher agent [quick]
└── Task 9: General agent [quick]

Wave 3 (After Wave 2 — network router):
├── Task 10: Agent index exports [quick]
└── Task 11: Network router with hybrid routing [deep]

Wave 4 (After Wave 3 — data + UI):
├── Task 12: Convex schema - add agentType field [quick]
├── Task 13: Convex mutations for agent attribution [quick]
├── Task 14: UI agent badge component [visual-engineering]
└── Task 15: Integrate badge in chat message [visual-engineering]

Wave 5 (After Wave 4 — verification):
├── Task 16: Classification accuracy test [quick]
├── Task 17: Router behavior test [quick]
└── Task 18: End-to-end agent routing test [deep]

Wave FINAL (After ALL tasks — independent review):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 2 → Task 4-9 → Task 11 → Task 12-13 → Task 14-15 → Task 18
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 6 (Wave 2)
```

### Dependency Matrix

| Task | Blocked By | Blocks |
|------|------------|--------|
| 1 (types) | — | 2, 4-9, 11 |
| 2 (tool bundles) | 1 | 4-9 |
| 3 (prompts) | — | 4-9 |
| 4-9 (agents) | 1, 2, 3 | 10, 11 |
| 10 (index) | 4-9 | 11 |
| 11 (router) | 1, 10 | 12, 16-18 |
| 12 (schema) | — | 13 |
| 13 (mutations) | 12 | 15 |
| 14 (badge UI) | — | 15 |
| 15 (integrate) | 13, 14 | 18 |
| 16-18 (tests) | 11 | F1-F4 |

---

## TODOs

### Wave 1: Types + Tool Bundles

- [x] 1. **NetworkState Interface + Types**

  **What to do**:
  - Create `src/features/conversations/inngest/types.ts`
  - Define `PolarisNetworkState` interface with intent, confidence, routed, agentSwitchCount
  - Export `AgentIntent` type for use in agents

  **Must NOT do**:
  - Add fields not related to routing/state management
  - Include UI-specific types

  **Recommended Agent Profile**:
  - **Category**: `quick` — Single file, well-defined interface

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 2, 4-9, 11
  - **Blocked By**: None

  **References**:
  - `src/features/conversations/inngest/process-message.ts:192-212` - Current network setup
  - AgentKit docs: `https://agentkit.inngest.com/reference/create-network`

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/types.ts`
  - [ ] `PolarisNetworkState` interface exported
  - [ ] `AgentIntent` type exported
  - [ ] `tsc --noEmit` passes

  **QA Scenarios**:
  ```
  Scenario: Types compile correctly
    Tool: Bash
    Steps: Run `tsc --noEmit`
    Expected Result: No TypeScript errors
    Evidence: .sisyphus/evidence/task-01-types-compile.txt
  ```

  **Commit**: YES (Wave 1-2 group)

- [x] 2. **Tool Bundles**

  **What to do**:
  - Create `src/features/conversations/inngest/tools/index.ts`
  - Create 4 tool bundle functions: `createReadOnlyTools`, `createPlanningTools`, `createDebuggingTools`, `createFullTools`
  - Each bundle returns correct subset of existing 8 tools

  **Must NOT do**:
  - Create new tools (use existing 8 only)
  - Modify existing tool implementations

  **Recommended Agent Profile**:
  - **Category**: `quick` — Simple reorganization

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 4-9
  - **Blocked By**: Task 1

  **References**:
  - `src/features/conversations/inngest/tools/*.ts` - All existing tools

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/tools/index.ts`
  - [ ] 4 bundle functions exported
  - [ ] `bun run build` succeeds

  **Commit**: YES (Wave 1-2 group)

- [x] 3. **Agent System Prompts**

  **What to do**:
  - Modify `src/features/conversations/inngest/constants.ts`
  - Add 6 system prompts: CLASSIFIER, PLANNER, BUILDER, DEBUGGER, RESEARCHER, GENERAL

  **Must NOT do**:
  - Include tool descriptions in prompts
  - Make prompts too long (token impact)

  **Recommended Agent Profile**:
  - **Category**: `quick` — Adding constants

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4-9
  - **Blocked By**: None

  **References**:
  - `src/features/conversations/inngest/constants.ts` - Existing prompts

  **Acceptance Criteria**:
  - [ ] 6 new system prompts added
  - [ ] Each prompt is role-specific
  - [ ] `tsc --noEmit` passes

  **Commit**: YES (Wave 1-2 group)

---

### Wave 2: Agent Definitions

- [x] 4. **Classifier Agent**

  **What to do**:
  - Create `src/features/conversations/inngest/agents/classifier.ts`
  - Create `set_intent` tool that saves intent to network.state.data
  - Use fast model: `x-ai/grok-4.1-fast`
  - Tools: only `set_intent`

  **Code Pattern**:
  ```typescript
  export const createClassifierAgent = (opts: ToolOptions) => {
    const setIntentTool = createTool({
      name: 'set_intent',
      description: 'Save the classified intent',
      parameters: z.object({
        intent: z.enum(['planner', 'builder', 'debugger', 'researcher', 'general']),
        confidence: z.number().min(0).max(1),
      }),
      handler: ({ intent, confidence }, { network }) => {
        network.state.data.intent = intent;
        network.state.data.confidence = confidence;
        return `Intent: ${intent}`;
      },
    });
    
    return createAgent({
      name: 'classifier',
      description: 'Classifies user intent for routing',
      system: CLASSIFIER_SYSTEM_PROMPT,
      model: openai({ model: 'x-ai/grok-4.1-fast', ... }),
      tools: [setIntentTool],
    });
  };
  ```

  **Must NOT do**:
  - Give classifier access to file tools
  - Make classifier multi-turn

  **Recommended Agent Profile**:
  - **Category**: `quick` — Single agent definition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5-9)
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - `src/features/conversations/inngest/process-message.ts:169-189` - Existing agent pattern

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/agents/classifier.ts`
  - [ ] `set_intent` tool defined
  - [ ] Agent uses fast model
  - [ ] `tsc --noEmit` passes

  **Commit**: YES (Wave 1-2 group)

- [x] 5. **Planner Agent**

  **What to do**:
  - Create `src/features/conversations/inngest/agents/planner.ts`
  - Use capable model: `google/gemini-3.1-pro`
  - Tools: `createPlanningTools` (read-only + createFiles for .md)
  - System prompt enforces .md-only file creation

  **Must NOT do**:
  - Allow modification of existing code files

  **Recommended Agent Profile**:
  - **Category**: `quick` — Single agent definition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  - `src/features/conversations/inngest/tools/index.ts` - Tool bundles

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/agents/planner.ts`
  - [ ] Uses planning tools bundle
  - [ ] `tsc --noEmit` passes

  **Commit**: YES (Wave 1-2 group)

- [x] 6. **Builder Agent**

  **What to do**:
  - Create `src/features/conversations/inngest/agents/builder.ts`
  - Use capable model: `google/gemini-3.1-pro`
  - Tools: `createFullTools` (all 8)
  - Can derive system from existing `CODING_AGENT_SYSTEM_PROMPT`

  **Recommended Agent Profile**:
  - **Category**: `quick` — Single agent definition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2, 3

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/agents/builder.ts`
  - [ ] Uses full tools bundle
  - [ ] `tsc --noEmit` passes

  **Commit**: YES (Wave 1-2 group)

- [x] 7. **Debugger Agent**

  **What to do**:
  - Create `src/features/conversations/inngest/agents/debugger.ts`
  - Use capable model: `google/gemini-3.1-pro`
  - Tools: `createDebuggingTools` (read + write for fixes)

  **Recommended Agent Profile**:
  - **Category**: `quick` — Single agent definition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2, 3

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/agents/debugger.ts`
  - [ ] Uses debugging tools bundle
  - [ ] `tsc --noEmit` passes

  **Commit**: YES (Wave 1-2 group)

- [x] 8. **Researcher Agent**

  **What to do**:
  - Create `src/features/conversations/inngest/agents/researcher.ts`
  - Use fast model: `x-ai/grok-4.1-fast`
  - Tools: `createReadOnlyTools` (scrapeUrls only)

  **Recommended Agent Profile**:
  - **Category**: `quick` — Single agent definition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2, 3

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/agents/researcher.ts`
  - [ ] Uses read-only tools bundle
  - [ ] `tsc --noEmit` passes

  **Commit**: YES (Wave 1-2 group)

- [x] 9. **General Agent**

  **What to do**:
  - Create `src/features/conversations/inngest/agents/general.ts`
  - Use capable model: `google/gemini-3.1-pro`
  - Tools: `createFullTools` (all 8) - fallback for all intents

  **Recommended Agent Profile**:
  - **Category**: `quick` — Single agent definition

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 10
  - **Blocked By**: Tasks 1, 2, 3

  **Acceptance Criteria**:
  - [ ] File created at `src/features/conversations/inngest/agents/general.ts`
  - [ ] Uses full tools bundle
  - [ ] `tsc --noEmit` passes

  **Commit**: YES (Wave 1-2 group)

---

## Final Verification Wave (MANDATORY)

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Verify all agents created, router implemented, UI badge working, tool restrictions enforced.

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + `bun run lint` + `bun test`. Check for type safety, no `any`.

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Test all 6 agents via Inngest dev server. Verify badge display.

- [ ] F4. **Scope Fidelity Check** — `deep`
  Verify no scope creep: no slash commands, no multi-turn classification, no new tools.

---

## Commit Strategy

- **Wave 1-2**: `feat(agents): add subagent types, tools, and agent definitions`
- **Wave 3**: `feat(agents): add hybrid network router with intent-based routing`
- **Wave 4**: `feat(agents): add agent attribution to messages and UI badges`
- **Wave 5**: `test(agents): add classification and routing tests`

---

## Success Criteria

### Verification Commands
```bash
bun test                                          # Run all tests
bun run lint                                      # Check for errors
tsc --noEmit                                      # Type check
npx inngest-cli@latest dev                        # Test with Inngest dev server
```

### Final Checklist
- [ ] Classifier routes correctly to specialist ≥85% accuracy
- [ ] All 6 agents created with correct tool sets
- [ ] Agent badge displays on messages
- [ ] Tool restrictions enforced (Planner .md only, etc.)
- [ ] No infinite loops (maxAgentSwitches guardrail)
- [ ] Backwards compatible with existing conversations
