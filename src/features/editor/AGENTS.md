# src/features/editor/AGENTS.md – Code Editor

**Scope:** CodeMirror 6 setup, custom extensions, editor state management.

---

## Architecture

The editor uses **CodeMirror 6** with custom extensions for AI features:

```
CodeEditor (component)
    ├── CodeMirror instance
    ├── Extensions (composed)
    │   ├── basicSetup
    │   ├── oneDark theme
    │   ├── language support (TS/JS/CSS/HTML/JSON/Markdown/Python)
    │   ├── suggestionExtension (ghost text)
    │   ├── quickEditExtension (Cmd+K)
    │   ├── minimap
    │   ├── indentationMarkers
    │   └── customKeymap
    └── State management (Zustand)
```

---

## Directory Structure

```
editor/
├── components/
│   ├── code-editor.tsx       # Main editor component
│   └── editor-breadcrumbs.tsx # File path breadcrumbs
├── extensions/
│   ├── index.ts              # Extension composition
│   ├── theme.ts              # One Dark custom theme
│   ├── language.ts           # Language detection/support
│   ├── suggestion/           # AI suggestion (ghost text)
│   │   └── index.ts
│   ├── quick-edit/           # Cmd+K quick edit
│   │   └── index.ts
│   └── ...
├── hooks/
│   └── use-editor.ts         # Editor initialization
├── store/
│   └── editor-store.ts       # Zustand state
└── lib/
    └── file-icons.ts         # Language icon mapping
```

---

## Extension System

Extensions are composed in `extensions/index.ts`:

```typescript
export const createExtensions = (options: ExtensionOptions): Extension[] => {
  return [
    // Base
    basicSetup,
    oneDark,
    
    // Language
    getLanguageSupport(filename),
    
    // AI features
    suggestionExtension({ projectId, fileId }),
    quickEditExtension({ projectId, fileId }),
    
    // Visual
    minimap(),
    indentationMarkers(),
    
    // Custom
    customKeymap,
    EditorView.updateListener.of(handleUpdate),
  ];
};
```

---

## Suggestion Extension

Provides **ghost text suggestions** (like Copilot):

```typescript
// extensions/suggestion/index.ts
export const suggestionExtension = (options: SuggestionOptions) => {
  return ViewPlugin.fromClass(class {
    // Fetches suggestions from /api/suggestion
    // Displays as ghost text decoration
    // Accept with Tab
  });
};
```

**API:** `POST /api/suggestion` – streams AI completion.

---

## Quick Edit Extension

**Cmd+K** functionality for inline editing:

```typescript
// extensions/quick-edit/index.ts
export const quickEditExtension = (options: QuickEditOptions) => {
  return [
    // Selection tooltip with "Edit" button
    // Opens input popup
    // Sends selection + instruction to /api/quick-edit
    // Replaces selection with result
  ];
};
```

**API:** `POST /api/quick-edit` – returns edited code.

---

## Language Support

Auto-detected from file extension:

| Extension | Language Package |
|-----------|-----------------|
| `.ts`, `.tsx` | `@codemirror/lang-javascript` |
| `.js`, `.jsx` | `@codemirror/lang-javascript` |
| `.css` | `@codemirror/lang-css` |
| `.html` | `@codemirror/lang-html` |
| `.json` | `@codemirror/lang-json` |
| `.md` | `@codemirror/lang-markdown` |
| `.py` | `@codemirror/lang-python` |

---

## State Management

Zustand store in `store/editor-store.ts`:

```typescript
interface EditorStore {
  activeFileId: string | null;
  openFiles: string[]; // Tab state
  setActiveFile: (id: string) => void;
  openFile: (id: string) => void;
  closeFile: (id: string) => void;
}
```

---

## Where to Add Code

| Task | Location |
|------|----------|
| New extension | `extensions/{name}/index.ts` → add to `extensions/index.ts` |
| Modify theme | `extensions/theme.ts` |
| Add language | `extensions/language.ts` |
| Editor component changes | `components/code-editor.tsx` |
| State changes | `store/editor-store.ts` |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `components/code-editor.tsx` | Main editor component |
| `extensions/index.ts` | Extension composition |
| `extensions/suggestion/index.ts` | Ghost text AI suggestions |
| `extensions/quick-edit/index.ts` | Cmd+K inline editing |
| `store/editor-store.ts` | Tab/active file state |
| `hooks/use-editor.ts` | Editor initialization |
