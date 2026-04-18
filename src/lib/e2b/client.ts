import "server-only";

/**
 * E2B Client Configuration
 *
 * Provides secure, isolated sandboxes for AI code execution.
 * Used exclusively for iteration mode with GLM-5.1.
 */

export const E2B_CONFIG = {
  apiKey: process.env.E2B_API_KEY!,
  defaultTimeoutMs: 15 * 60 * 1000, // 15 minutes for iterations
  maxIterations: 10,
};

export function validateE2BConfig(): void {
  if (!E2B_CONFIG.apiKey) {
    throw new Error("E2B_API_KEY is required for iteration mode");
  }
}
