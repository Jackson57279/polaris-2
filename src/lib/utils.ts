import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MARKDOWN_JSON_REGEX = /```(?:json)?\s*([\s\S]*?)\s*```/;

export function extractJSONFromMarkdown(text: string): string {
  const match = text.match(MARKDOWN_JSON_REGEX);
  return match?.[1]?.trim() ?? text.trim();
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
