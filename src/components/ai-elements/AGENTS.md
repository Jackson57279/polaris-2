# src/components/ai-elements/AGENTS.md – AI UI Components

**Scope:** 29 AI-specific UI components (5,769 total lines).

---

## Overview

This directory contains **AI conversation UI components**. These are highly specialized, complex components that interact with the AI system.

**⚠️ Complexity Warning:** `prompt-input.tsx` is 1,416 lines (24% of entire directory) - a known hotspot.

---

## Component Inventory

### Input Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| `prompt-input.tsx` | 1,416 | Main chat input (CRITICAL HOTSPOT) |
| `model-selector.tsx` | ~150 | AI model dropdown |
| `attachment-manager.tsx` | ~120 | File attachments |

### Message Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| `message.tsx` | 449 | Message bubble rendering |
| `context.tsx` | 408 | Message context provider |
| `inline-citation.tsx` | 288 | Source citations |
| `chain-of-thought.tsx` | 231 | Thinking/reasoning display |

### Action Components
| Component | Lines | Purpose |
|-----------|-------|---------|
| `open-in-chat.tsx` | 365 | "Open in chat" buttons |
| `queue.tsx` | 274 | Message queue/status |
| `web-preview.tsx` | 263 | Web artifact preview |
| `confirmation.tsx` | ~150 | Action confirmations |

---

## Critical Hotspot: prompt-input.tsx

**1,416 lines, 92 exports** - This is a God Component handling:

- Text input with complex state
- File attachments (blob URL conversion)
- Voice recording
- Model selection
- Command palette
- Keyboard shortcuts
- Form submission

**Pattern:** Compound component with nested context providers.

```typescript
// Usage pattern
<PromptInput>
  <PromptInput.Attachments />
  <PromptInput.TextArea />
  <PromptInput.ModelSelector />
  <PromptInput.VoiceButton />
  <PromptInput.SubmitButton />
</PromptInput>
```

**⚠️ Modification Warning:** Changes here have wide impact. Prefer extracting to sub-components.

---

## Component Patterns

### Compound Component Pattern

Used in `prompt-input.tsx`:

```typescript
const PromptInputContext = createContext<...>();

export const PromptInput = Object.assign(PromptInputRoot, {
  Attachments: PromptInputAttachments,
  TextArea: PromptInputTextArea,
  ModelSelector: PromptInputModelSelector,
  // ... sub-components
});
```

### Context Provider Pattern

Used in `context.tsx` for AI state:

```typescript
interface AIContextType {
  activeTool: string | null;
  setActiveTool: (tool: string | null) => void;
  // ... AI-related state
}

export const AIProvider: React.FC<{ children }> = ({ children }) => {
  // ... state management
  return <AIContext.Provider value={...}>{children}</AIContext.Provider>;
};
```

---

## Where to Add Code

| Task | Location |
|------|----------|
| New input feature | Consider if it belongs in prompt-input or separate |
| New message type | `message.tsx` or new component |
| New AI action | New component file |
| Context changes | `context.tsx` |

---

## Recommended Refactoring

**prompt-input.tsx** should be split:

```
ai-elements/
├── input/
│   ├── index.tsx           # Barrel export
│   ├── prompt-input.tsx    # Reduced root component
│   ├── attachments.tsx     # File attachments
│   ├── model-selector.tsx  # Model dropdown
│   └── voice-input.tsx     # Voice recording
```

---

## Key Files Reference

| File | Purpose | Complexity |
|------|---------|------------|
| `prompt-input.tsx` | Main input | **CRITICAL** |
| `message.tsx` | Message rendering | High |
| `context.tsx` | AI context | High |
| `inline-citation.tsx` | Citations | Medium |
| `open-in-chat.tsx` | Quick actions | Medium |
| `chain-of-thought.tsx` | Reasoning display | Medium |
| `web-preview.tsx` | Web preview | Medium |
