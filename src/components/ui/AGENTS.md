# UI Components

shadcn/ui component library. 50+ Radix UI primitives styled with Tailwind CSS. Generic UI components only — NOT AI-specific.

## Overview

52 components from shadcn/ui registry. Built on Radix UI primitives. Used across the app for consistent UI patterns.

## Structure

All components are flat in this directory:

```
src/components/ui/
├── accordion.tsx
├── alert-dialog.tsx
├── alert.tsx
├── aspect-ratio.tsx
├── avatar.tsx
├── badge.tsx
├── breadcrumb.tsx
├── button.tsx          # Primary action component
├── button-group.tsx
├── calendar.tsx        # Date picker (complex)
├── card.tsx
├── carousel.tsx
├── chart.tsx           # Recharts wrapper (complex, 10k lines)
├── checkbox.tsx
├── collapsible.tsx
├── command.tsx         # Cmd+K palette (complex)
├── context-menu.tsx    # Right-click menus (complex)
├── dialog.tsx
├── dropdown-menu.tsx
├── form.tsx            # React Hook Form integration
├── hover-card.tsx
├── input.tsx
├── input-otp.tsx       # One-time password input
├── label.tsx
├── menubar.tsx
├── navigation-menu.tsx
├── pagination.tsx
├── popover.tsx
├── progress.tsx
├── radio-group.tsx
├── resizable.tsx       # react-resizable-panels
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
├── sheet.tsx           # Slide-out panels
├── sidebar.tsx
├── skeleton.tsx
├── slider.tsx
├── sonner.tsx          # Toast notifications
├── switch.tsx
├── table.tsx
├── tabs.tsx
├── textarea.tsx
├── toggle-group.tsx
├── toggle.tsx
└── tooltip.tsx
```

## Where to Look

| Task | Location | Notes |
|------|----------|-------|
| Buttons | `button.tsx`, `button-group.tsx` | Primary actions |
| Forms | `form.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx` | RHF integration |
| Overlays | `dialog.tsx`, `sheet.tsx`, `popover.tsx`, `alert-dialog.tsx` | Modals/panels |
| Navigation | `tabs.tsx`, `breadcrumb.tsx`, `navigation-menu.tsx` | Navigation |
| Feedback | `toast.tsx`, `sonner.tsx`, `alert.tsx`, `skeleton.tsx` | User feedback |
| Data display | `table.tsx`, `card.tsx`, `badge.tsx` | Data presentation |
| Date/time | `calendar.tsx` | Complex date picker |
| Charts | `chart.tsx` | Recharts wrapper |
| Command palette | `command.tsx` | Cmd+K interface |

## Conventions

- **CVA**: Uses `class-variance-authority` for component variants
- **cn()**: Merge Tailwind classes via `src/lib/utils.ts`
- **Forward refs**: All components use `React.forwardRef`
- **Radix primitives**: Built on `@radix-ui/*` packages
- **Variants**: Default, destructive, outline, secondary, ghost, link
- **Sizes**: Default, sm, lg, icon

## Usage Pattern

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Button variant="default" size="default">Click me</Button>
```

## Anti-Patterns

- **Don't** put AI-specific components here (use `../ai-elements/`)
- **Don't** add business logic to UI components
- **Don't** modify component APIs without checking usage
- Keep components generic and reusable

## Notes

- **Registry**: Components from `shadcn/ui` registry
- **Customization**: Modify `className` via `cn()` helper
- **Theme**: Styled with Tailwind 4 CSS variables
- **Icons**: Uses `lucide-react` for icons

## Large Files

| File | Lines | Note |
|------|-------|------|
| `chart.tsx` | ~10k | Recharts wrapper with many chart types |
| `command.tsx` | ~4.8k | Complex command palette |
| `calendar.tsx` | ~7.8k | Full-featured date picker |
| `context-menu.tsx` | ~8.3k | Right-click context menus |

## Dependencies

- `@radix-ui/*` - Headless UI primitives
- `class-variance-authority` - Component variants
- `tailwind-merge` + `clsx` - Class merging
- `lucide-react` - Icons
