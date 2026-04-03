This directory defines the high-level concepts, business logic, and architecture of this project using markdown. It is managed by [lat.md](https://www.npmjs.com/package/lat.md) — a tool that anchors source code to these definitions. Install the `lat` command with `npm i -g lat.md` and run `lat --help`.

# AI Response Parsing

## JSON Extraction from Markdown

Utilities for extracting and parsing JSON from AI responses that may wrap content in markdown code blocks.

### extractJSONFromMarkdown

Extracts JSON content from markdown code blocks. Handles multiple code blocks and selects the one that looks like valid JSON.

- Uses regex with global flag to find ALL code blocks
- Prefers blocks that start with `{` or `[` (JSON-like)
- Falls back to first match if no JSON-like content found
- Handles responses with multiple code blocks or nested markdown

// @lat: [[AI Response Parsing#JSON Extraction from Markdown]]

### safeParseAIJSON

Safely parses JSON from AI responses, extracting from markdown if needed and providing detailed error messages on failure.

- Wraps `extractJSONFromMarkdown` with error handling
- Throws descriptive errors with content preview on parse failure
- Generic type parameter for type-safe parsing

// @lat: [[AI Response Parsing#JSON Extraction from Markdown]]
