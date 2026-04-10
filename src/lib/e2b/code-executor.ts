/**
 * E2B Code Executor
 *
 * High-level utilities for executing code in E2B sandboxes
 * specifically designed for AI iteration workflows.
 */

import { Sandbox } from "@e2b/code-interpreter";
import {
  getOrCreateSandbox,
  executeCode,
  runCommand,
  setupProjectFiles,
  type ExecutionResult,
  type ExecutionCallbacks,
} from "./sandbox-manager";

export interface IterationContext {
  conversationId: string;
  messageId?: string;
  language: "javascript" | "typescript" | "python";
  testCommand?: string;
  maxIterations: number;
  projectFiles?: Array<{ path: string; content: string }>;
}

export interface IterationResult {
  iterationNumber: number;
  code: string;
  executionResult: ExecutionResult;
  reasoning?: string;
  timestamp: number;
  success: boolean;
}

export interface IterationCallbacks {
  onIterationStart?: (iterationNumber: number, maxIterations: number) => void;
  onIterationComplete?: (result: IterationResult) => void;
  onExecutionOutput?: (type: "stdout" | "stderr", line: string) => void;
  onComplete?: (results: IterationResult[], finalCode: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Run an iteration cycle with code execution
 */
export async function runIteration(
  sandbox: Sandbox,
  code: string,
  language: "javascript" | "typescript" | "python",
  iterationNumber: number,
  maxIterations: number,
  callbacks?: IterationCallbacks
): Promise<IterationResult> {
  callbacks?.onIterationStart?.(iterationNumber, maxIterations);

  const executionCallbacks: ExecutionCallbacks = {
    onStdout: (data) => {
      callbacks?.onExecutionOutput?.("stdout", data.line);
    },
    onStderr: (data) => {
      callbacks?.onExecutionOutput?.("stderr", data.line);
    },
  };

  const executionResult = await executeCode(
    sandbox,
    code,
    language,
    executionCallbacks
  );

  const success = executionResult.exitCode === 0 && !executionResult.error;

  const result: IterationResult = {
    iterationNumber,
    code,
    executionResult,
    timestamp: Date.now(),
    success,
  };

  callbacks?.onIterationComplete?.(result);
  return result;
}

/**
 * Run tests in the sandbox
 */
export async function runTests(
  sandbox: Sandbox,
  testCommand: string,
  callbacks?: ExecutionCallbacks
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    const result = await runCommand(sandbox, testCommand, callbacks);
    const executionTimeMs = Date.now() - startTime;

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      results: [],
      error: result.exitCode !== 0 ? {
        name: "TestError",
        value: `Tests failed with exit code ${result.exitCode}`,
        traceback: result.stderr,
      } : null,
      executionTimeMs,
    };
  } catch (error) {
    const executionTimeMs = Date.now() - startTime;

    return {
      stdout: "",
      stderr: error instanceof Error ? error.message : String(error),
      exitCode: -1,
      results: [],
      error: {
        name: error instanceof Error ? error.name : "TestError",
        value: error instanceof Error ? error.message : String(error),
        traceback: error instanceof Error ? error.stack || "" : "",
      },
      executionTimeMs,
    };
  }
}

/**
 * Prepare sandbox with iteration context
 */
export async function prepareSandbox(
  context: IterationContext
): Promise<Sandbox> {
  const sandbox = await getOrCreateSandbox(
    context.conversationId,
    context.messageId
  );

  // Setup project files if provided
  if (context.projectFiles && context.projectFiles.length > 0) {
    await setupProjectFiles(sandbox, context.projectFiles);
  }

  return sandbox;
}

// Re-export types
export type { ExecutionResult, ExecutionCallbacks } from "./sandbox-manager";
