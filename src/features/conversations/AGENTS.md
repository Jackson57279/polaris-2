# src/features/conversations/AGENTS.md – Conversations & AI Agent

**Scope:** Chat UI, Inngest message processing, AI tools, AgentKit integration.

---

## Architecture

The conversation system uses **Inngest + AgentKit** for AI agent orchestration:

```
User sends message
    ↓
/api/messages/route.ts → creates msg → sends `message/sent`
    ↓
process-message.ts (Inngest) → orchestrates agent
    ↓
Agent uses tools → calls Convex system API
    ↓
Updates message with response
```

---

## Directory Structure

```
conversations/
├── components/           # Chat UI components
│   ├── conversation-sidebar.tsx
│   └── ...
├── hooks/               # React hooks
│   └── use-conversations.ts
├── inngest/             # Background job
│   ├── process-message.ts    # Main orchestrator (251 lines)
│   ├── constants.ts          # System prompts
│   └── tools/                # 8 AI tools
│       ├── list-files.ts
│       ├── read-files.ts
│       ├── create-files.ts
│       ├── create-folder.ts
│       ├── update-file.ts
│       ├── rename-file.ts
│       ├── delete-files.ts
│       └── scrape-urls.ts
└── types.ts             # Shared types
```

---

## Inngest Event Flow

### Triggering Events

| Event | Triggered By | Handler |
|-------|-------------|---------|
| `message/sent` | `/api/messages/route.ts` | `process-message.ts` |
| `message/cancel` | `/api/messages/cancel/route.ts` | `process-message.ts` (cancelOn) |

### Cancellation Flow

```typescript
// process-message.ts
cancelOn: [{ 
  event: "message/cancel", 
  if: "event.data.messageId == async.data.messageId" 
}]
```

---

## Agent Orchestration

```typescript
// process-message.ts
const codingAgent = createAgent({
  name: "Coding Agent",
  system: CODING_AGENT_SYSTEM_PROMPT,
  model: openrouter("x-ai/grok-4.1-fast"),
  tools: [
    createListFiles({ internalKey, projectId }),
    createReadFiles({ internalKey, projectId }),
    createCreateFiles({ internalKey, projectId }),
    // ... 8 tools total
  ],
});

const network = createNetwork({
  agents: [codingAgent],
  maxIter: 20,
  defaultModel: openrouter("x-ai/grok-4.1-fast"),
  defaultRouter: ({ network }) => {
    const lastMessage = network?.state?.results?.at(-1);
    // Continue until text response without tool calls
    if (lastMessage?.type === "assistant" && lastMessage?.tool_calls?.length > 0) {
      return { agent: codingAgent, call: "agent" };
    }
    return null; // Stop iteration
  },
});
```

---

## Tool Implementation Pattern

All tools follow a **factory pattern** with Zod validation:

```typescript
// tools/read-files.ts
import { createTool } from "@inngest/agent-kit";
import { z } from "zod";

interface ToolOptions {
  internalKey: string;
  projectId: Id<"projects">;
}

export const createReadFiles = (options: ToolOptions) => {
  return createTool({
    name: "read_files",
    description: "Read contents of files by their IDs",
    parameters: z.object({
      fileIds: z.array(z.string()).describe("Array of file IDs to read"),
    }),
    handler: async (params, { step }) => {
      return await step?.run("read-files", async () => {
        const files = await Promise.all(
          params.fileIds.map(id => 
            convex.query(api.system.getFileById, {
              internalKey: options.internalKey,
              fileId: id as Id<"files">,
            })
          )
        );
        return JSON.stringify(files);
      });
    },
  });
};
```

### Key Patterns

1. **Factory function** accepts `ToolOptions` (internalKey, projectId)
2. **Zod validation** for parameters with `.describe()` for AI
3. **Step wrapping** with `step?.run()` for Inngest tracking
4. **Convex calls** via `api.system.*` with internalKey
5. **JSON return** - tools return stringified JSON

---

## System Prompts

Located in `constants.ts`:

```typescript
export const CODING_AGENT_SYSTEM_PROMPT = `You are a helpful coding assistant...`;
export const TITLE_GENERATOR_SYSTEM_PROMPT = `Generate a concise title...`;
```

---

## Where to Add Code

| Task | Location |
|------|----------|
| New tool | `inngest/tools/{tool-name}.ts` → follow factory pattern |
| Modify agent behavior | `inngest/process-message.ts` |
| Update system prompt | `inngest/constants.ts` |
| New UI component | `components/` |
| New hook | `hooks/` |

---

## Tool Reference

| Tool | Purpose | Key Params |
|------|---------|------------|
| `list_files` | List project files | `folderId?` |
| `read_files` | Read file contents | `fileIds[]` |
| `create_files` | Create files | `files[]` (auto-creates folders) |
| `create_folder` | Create folder | `name`, `parentId` |
| `update_file` | Update content | `fileId`, `content` |
| `rename_file` | Rename file/folder | `fileId`, `newName` |
| `delete_files` | Delete files | `fileIds[]` |
| `scrape_urls` | Scrape URLs | `urls[]` |

---

## API Routes

| Route | Purpose |
|-------|---------|
| `/api/messages/route.ts` | Send message, trigger Inngest |
| `/api/messages/cancel/route.ts` | Cancel processing message |
