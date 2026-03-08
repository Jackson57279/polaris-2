# Polaris MCP Server — AI Agent Integration

## TL;DR

> **Quick Summary**: Build an MCP (Model Context Protocol) server that lets external AI agents (Claude Code, Cursor, Windsurf, custom) control Polaris IDE remotely via HTTP/SSE with API key authentication.
> 
> **Deliverables**:
> - MCP server at `/api/mcp` endpoint
> - 8+ tool definitions (file ops, commands, preview, deploy)
> - API key auth with Pro user check
> - Configuration docs
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 3 waves
> **Critical Path**: Install SDK → Core server setup → Tools → Auth → Tests

---

## Context

### Original Request
"Figure out how we can have AI agents use us for UI generation in like claude code, like maybe through an MCP server or something."

### Interview Summary
**Key Discussions**:
- **Goal**: General MCP server — any AI agent can connect
- **Transport**: HTTP/SSE (remote connections, not stdio)
- **Auth**: API key auth — Pro users only
- **Tools**: File operations, command execution, preview URLs, project management, deployment

**Research Findings**:
- MCP uses JSON-RPC 2.0 over SSE transport
- SDK: `@modelcontextprotocol/sdk` (TypeScript)
- Protocol version: 2025-11-25
- Claude Code connects via URL configuration
- Existing Polaris APIs (convex/system.ts, /api/suggestion, /api/quick-edit) can be wrapped

### Metis Review (Self-Review)
**Identified Gaps** (addressed in plan):
- Need Pro subscription check mechanism
- Need to pick MCP endpoint path
- Need to decide which file operations to expose

---

## Work Objectives

### Core Objective
Build an MCP server that exposes Polaris IDE capabilities to external AI agents via the Model Context Protocol, with API key authentication restricted to Pro users.

### Concrete Deliverables
- MCP server implementation at `/api/mcp` route
- Tool definitions: list_files, read_file, write_file, create_folder, delete_file, rename_file, run_command, get_preview_url, deploy_project, get_project_status
- API key authentication middleware with Pro user validation
- Documentation for connecting external agents

### Definition of Done
- [ ] MCP server responds to `initialize` request
- [ ] Tools are discoverable via `tools/list`
- [ ] API key required for all tool calls
- [ ] Non-Pro users get clear error message
- [ ] At least 8 tools functional
- [ ] Integration tests pass

### Must Have
- HTTP/SSE transport (not stdio)
- API key authentication
- Pro user restriction
- File operations (read, write, list, create folder, delete, rename)
- Command execution via WebContainer
- Preview URL retrieval

### Must NOT Have (Guardrails)
- No OAuth flow (keeping it simple with API key)
- No billing integration beyond Pro check
- No full project creation from scratch (only file/project manipulation)
- No access to internal Convex admin functions

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (bun test)
- **Automated tests**: Tests after implementation
- **Framework**: bun test
- Tests verify: Auth flow, tool definitions, Pro check, JSON-RPC compliance

### QA Policy
Every task includes agent-executed QA scenarios:
- **API tests**: Use curl to send JSON-RPC requests, verify responses
- **Auth tests**: Verify Pro vs non-Pro behavior
- **Tool tests**: Call each tool, verify expected output

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation):
├── Task 1: Install MCP SDK and set up server scaffolding
├── Task 2: Create MCP server class with HTTP/SSE transport
└── Task 3: Implement basic initialization handler

Wave 2 (Core Tools):
├── Task 4: Add file operation tools (list, read, write, delete, rename, mkdir)
├── Task 5: Add command execution tool (WebContainer)
├── Task 6: Add preview URL tool
└── Task 7: Add project status tool

Wave 3 (Auth + Polish):
├── Task 8: Implement API key auth middleware
├── Task 9: Add Pro user subscription check
├── Task 10: Add deployment tool
├── Task 11: Write integration tests
└── Task 12: Create documentation

Final: Verify all tools work, auth enforced
```

---

## TODOs

- [ ] 1. **Install MCP SDK and set up server scaffolding**

  **What to do**:
  - Install `@modelcontextprotocol/sdk` and dependencies
  - Create `src/mcp/server.ts` — MCP server class setup
  - Configure package.json scripts
  - Test basic server imports

  **Must NOT do**:
  - Don't implement any tools yet
  - Don't add auth logic

  **Recommended Agent Profile**:
  - **Category**: `quick` — Simple setup task
  - **Skills**: []

  **Parallelization**:
  - Can Run In Parallel: NO (foundational)
  - Blocks: Tasks 2-12

  **References**:
  - MCP SDK docs: `https://modelcontextprotocol.io/docs`
  - Example: `https://github.com/modelcontextprotocol/typescript-sdk`

  **Acceptance Criteria**:
  - [ ] `@modelcontextprotocol/sdk` installed
  - [ ] `src/mcp/server.ts` created with basic Server class
  - [ ] `bun run mcp:dev` starts server without errors

  **QA Scenarios**:
  - Run `bun install` and verify package in node_modules
  - Run `bun run mcp:dev` and check it starts

- [ ] 2. **Create MCP server with HTTP/SSE transport**

  **What to do**:
  - Set up Next.js API route at `/api/mcp`
  - Implement `StreamableHTTPServerTransport`
  - Handle JSON-RPC requests
  - Add CORS for external connections

  **Must NOT do**:
  - Don't expose any tools yet
  - Don't add auth

  **References**:
  - Next.js API routes: `src/app/api/`
  - SSE transport: `@modelcontextprotocol/sdk/server/streamableHttp.js`

  **Acceptance Criteria**:
  - [ ] POST `/api/mcp` accepts JSON-RPC requests
  - [ ] Server responds to initialize handshake
  - [ ] Returns protocol version 2025-11-25

  **QA Scenarios**:
  - Send initialize request via curl, verify response

- [ ] 3. **Implement basic initialization handler**

  **What to do**:
  - Set up tool/list handler
  - Set up tools/call handler stubs
  - Return server capabilities

  **Must NOT do**:
  - Don't implement actual tool logic

  **References**:
  - MCP protocol: `tools/list`, `tools/call` methods

  **Acceptance Criteria**:
  - [ ] Server responds to `tools/list` with empty array
  - [ ] Server responds to `tools/call` with error (not implemented yet)

- [ ] 4. **Add file operation tools**

  **What to do**:
  - Implement `list_files` tool — list project files
  - Implement `read_file` tool — read file content
  - Implement `write_file` tool — write/update file
  - Implement `create_folder` tool — create directory
  - Implement `delete_file` tool — delete file/folder
  - Implement `rename_file` tool — rename file/folder
  - Wrap existing Convex system API calls

  **Must NOT do**:
  - Don't expose internal Convex admin functions

  **References**:
  - File tools: `src/features/conversations/inngest/tools/*.ts`
  - Convex system API: `convex/system.ts`

  **Acceptance Criteria**:
  - [ ] `tools/list` returns 6 file operation tools
  - [ ] Each tool callable with correct parameters
  - [ ] Returns expected output format

- [ ] 5. **Add command execution tool**

  **What to do**:
  - Implement `run_command` tool
  - Execute npm/node commands via WebContainer
  - Return stdout/stderr

  **References**:
  - WebContainer: `src/features/preview/hooks/use-webcontainer.ts`

  **Acceptance Criteria**:
  - [ ] Tool executes `npm install`, `npm run dev`
  - [ ] Returns command output

- [ ] 6. **Add preview URL tool**

  **What to do**:
  - Implement `get_preview_url` tool
  - Return current preview URL from WebContainer

  **References**:
  - WebContainer preview URL logic

  **Acceptance Criteria**:
  - [ ] Returns preview URL or error if not running

- [ ] 7. **Add project status tool**

  **What to do**:
  - Implement `get_project_status` tool
  - Return project info: name, files count, preview status, git status

  **References**:
  - Convex projects API

  **Acceptance Criteria**:
  - [ ] Returns project metadata

- [ ] 8. **Implement API key auth middleware**

  **What to do**:
  - Create API key validation middleware
  - Check `x-api-key` header
  - Store valid keys in database or env
  - Reject requests without valid key

  **Must NOT do**:
  - Don't hardcode API keys in source

  **References**:
  - Existing auth patterns in `convex/`

  **Acceptance Criteria**:
  - [ ] Valid key → request proceeds
  - [ ] Invalid key → 401 error
  - [ ] No key → 401 error

- [ ] 9. **Add Pro user subscription check**

  **What to do**:
  - Check user subscription status via API key
  - Look up user in Convex billing tables
  - Block non-Pro users with clear message

  **References**:
  - Billing tables: `convex/schema.ts` (payments, subscriptions)
  - User lookup via Convex

  **Must NOT do**:
  - Don't expose subscription details

  **Acceptance Criteria**:
  - [ ] Pro user → full access
  - [ ] Non-Pro user → 403 "Pro subscription required"

- [ ] 10. **Add deployment tool**

  **What to do**:
  - Implement `deploy_project` tool
  - Trigger Vercel/Netlify deploy
  - Return deployment status

  **References**:
  - Deploy APIs: `src/app/api/deploy/*`

  **Acceptance Criteria**:
  - [ ] Tool triggers deploy
  - [ ] Returns deploy URL or status

- [ ] 11. **Write integration tests**

  **What to do**:
  - Create `test/mcp/server.test.ts`
  - Test auth flow
  - Test tool calls
  - Test Pro check

  **Framework**: bun test

  **Acceptance Criteria**:
  - [ ] Auth tests pass
  - [ ] Tool tests pass
  - [ ] All tests pass

- [ ] 12. **Create documentation**

  **What to do**:
  - Document MCP endpoint URL
  - Document available tools with parameters
  - Document authentication setup
  - Document connection instructions for Claude Code

  **Must NOT do**:
  - Don't expose internal implementation details

  **Acceptance Criteria**:
  - [ ] README or docs page created
  - [ ] All tools documented
  - [ ] Auth setup explained

---

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — Verify all Must Have items present
- [ ] F2. **Auth Enforcement Test** — Test Pro vs non-Pro access
- [ ] F3. **Tool Functionality Test** — Call each tool, verify output
- [ ] F4. **Documentation Review** — Verify docs are complete

---

## Commit Strategy

- **1**: `feat(mcp): add server scaffolding and SDK setup`
- **2**: `feat(mcp): implement file operation tools`
- **3**: `feat(mcp): add command execution and preview tools`
- **4**: `feat(mcp): implement API key auth with Pro check`
- **5**: `test(mcp): add integration tests`

---

## Success Criteria

### Verification Commands
```bash
# MCP server health check
curl -X POST http://localhost:3000/api/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}'

# Tools list
curl -X POST http://localhost:3000/api/mcp -H "Content-Type: application/json" -H "x-api-key: valid-key" -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

### Final Checklist
- [ ] MCP server initializes correctly
- [ ] All tools listed and callable
- [ ] API key required
- [ ] Pro users can access
- [ ] Non-Pro users blocked with clear message
- [ ] Integration tests pass
