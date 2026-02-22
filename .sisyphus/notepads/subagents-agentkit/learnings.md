- Created general.ts agent: a General fallback agent for Inngest conversations.
- Used Gemini-3.1-Pro via OpenRouter as the capable model.
- Pulled GENERAL_SYSTEM_PROMPT from constants and createdFullTools from ../tools.
- Followed established agent factory pattern (planner.ts as reference).
- Compiled with tsc --noEmit successfully (no TS errors).
- Implemented the index.ts exporting six agents as per Plan.
- Re-exported ToolOptions for convenience from ../tools.
- Verified TypeScript compile via tsc --noEmit with no errors.

## Task 14: Agent Badge Component

**Date:** 2026-02-22

### Component Pattern
- Simple functional component with TypeScript interface
- Uses `cn()` utility from `@/lib/utils` for Tailwind class merging
- Graceful null handling: returns `null` when agentType is undefined/null
- Fallback color for unknown agent types ensures robustness

### Color Mapping Strategy
- Record<string, string> for agent type → color mapping
- Consistent Tailwind pattern: `bg-{color}-100 text-{color}-700`
- Provides visual distinction for 6 agent types
- Fallback to gray for unknown types

### Component Structure
- Non-interactive span element (not button)
- Inline-flex for proper alignment
- Small text size (text-xs) with medium font weight
- Rounded corners for modern appearance
- Padding: px-2 py-0.5 for compact badge style

### Integration Points
- Can be imported and used in message components
- Suitable for displaying agent attribution on chat messages
- Follows existing ai-elements component patterns

