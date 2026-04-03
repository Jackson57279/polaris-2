# AI Elements

AI-specific React components for the chat interface. These are NOT generic UI components — they're specialized for AI interactions.

## Overview

30 components for AI chat UI: message rendering, tool displays, chat input, suggestions, web previews. Large/complex components here.

## Key Components

| Component | Lines | Purpose |
|-----------|-------|---------|
| `prompt-input.tsx` | 1416 | Main chat input (very complex) |
| `message.tsx` | 451 | Message rendering, formatting |
| `open-in-chat.tsx` | 365 | Chat integration helpers |
| `context.tsx` | 408 | Chat context management |
| `web-preview.tsx` | 181 | Browser preview in chat |
| `chain-of-thought.tsx` | 284 | AI reasoning display |
| `inline-citation.tsx` | 234 | Source citations |
| `model-selector.tsx` | 141 | AI model picker |
| `artifact.tsx` | 103 | AI-generated artifacts |
| `code-block.tsx` | 137 | Code display in messages |
| `tool.tsx` | 183 | Tool call UI |
| `suggestion.tsx` | 41 | Inline edit suggestions |

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Chat input | `prompt-input.tsx` | Very large, main input component |
| Message display | `message.tsx` | Message bubbles, formatting, code blocks |
| Tool displays | `tool.tsx` | AI tool call visualization |
| Web previews | `web-preview.tsx` | Browser preview in chat |
| Context management | `context.tsx` | Chat context, state handling |
| Model selection | `model-selector.tsx` | AI model dropdown |
| Suggestions | `suggestion.tsx` | Inline edit suggestions |
| Reasoning | `reasoning.tsx`, `chain-of-thought.tsx` | AI thinking steps |
| Sources | `inline-citation.tsx`, `sources.tsx` | Source citations |
| Queue/loading | `queue.tsx`, `loader.tsx` | Loading states |

## Conventions

- Components are AI-specific (chat-related only)
- Heavy use of React hooks and state management
- Integration with Convex for real-time data
- Custom rendering for code blocks, artifacts, tools

## Anti-Patterns

- **Don't** put generic UI here (use `../ui/` for shadcn components)
- **Don't** import across features directly (use `lib/`)
- Keep components focused on AI interactions only

## Notes

- **Complexity hotspot**: `prompt-input.tsx` at 1416 lines — major component
- **Pattern source**: Use existing components as templates for new AI features
- **Styling**: Uses Tailwind + shadcn/ui components from sibling `ui/` directory
- **Real-time**: Most components connect to Convex for live updates
