import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MARKDOWN_JSON_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/g;

// @lat: [[lat.md#AI Response Parsing#JSON Extraction from Markdown]]
export function extractJSONFromMarkdown(text: string): string {
  // Try to find the first JSON code block
  const matches = Array.from(text.matchAll(MARKDOWN_JSON_REGEX));
  
  // Find the match that looks like valid JSON (starts with { or [)
  for (const match of matches) {
    const content = match[1]?.trim();
    if (content && (content.startsWith('{') || content.startsWith('['))) {
      return content;
    }
  }
  
  // Fall back to first match if no JSON-like content found
  if (matches.length > 0) {
    return matches[0][1]?.trim() ?? text.trim();
  }
  
  return text.trim();
}

export function safeParseAIJSON<T>(text: string): T {
  const cleaned = extractJSONFromMarkdown(text);
  
  if (!cleaned) {
    throw new Error("Empty response received from AI");
  }
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    const preview = cleaned.length > 100 ? cleaned.slice(0, 100) + "..." : cleaned;
    throw new Error(
      `Failed to parse JSON response. Preview: "${preview}". ` +
      `Original error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
