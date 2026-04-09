/**
 * E2B Sandbox Manager
 *
 * Manages E2B sandbox lifecycle for conversation-based iteration mode.
 * Provides getOrCreate, execute, and cleanup functionality.
 */

import { Sandbox } from "@e2b/code-interpreter";
import { E2B_CONFIG, validateE2BConfig } from "./client";

export interface SandboxSession {
  sandboxId: string;
  conversationId: string;
  messageId?: string;
  createdAt: Date;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  results: any[];
  error: {
    name: string;
    value: string;
    traceback: string;
  } | null;
  executionTimeMs: number;
}

export interface ExecutionCallbacks {
  onStdout?: (data: { line: string; timestamp: number }) => void;
  onStderr?: (data: { line: string; timestamp: number }) => void;
  onResult?: (result: any) => void;
  onError?: (error: any) => void;
}

/**
 * Get existing sandbox or create a new one for a conversation
 */
export async function getOrCreateSandbox(
  conversationId: string,
  messageId?: string
): Promise<Sandbox> {
  validateE2BConfig();

  // List existing sandboxes to find one for this conversation
  const sandboxes = await Sandbox.list();
  const existing = sandboxes.find(
    (s) => s.metadata?.conversationId === conversationId
  );

  if (existing) {
    console.log(`[E2B] Reconnecting to sandbox ${existing.sandboxId}`);
    return await Sandbox.connect(existing.sandboxId, {
      apiKey: E2B_CONFIG.apiKey,
      timeoutMs: E2B_CONFIG.defaultTimeoutMs,
    });
  }

  // Create new sandbox with metadata
  console.log(`[E2B] Creating new sandbox for conversation ${conversationId}`);
  return await Sandbox.create({
    apiKey: E2B_CONFIG.apiKey,
    metadata: {
      conversationId,
      messageId: messageId || "",
      createdAt: new Date().toISOString(),
    },
    timeoutMs: E2B_CONFIG.defaultTimeoutMs,
    lifecycle: {
      onTimeout: "pause",
      autoResume: true,
    },
  });
}

/**
 * Execute code in a sandbox
 */
export async function executeCode(
  sandbox: Sandbox,
  code: string,
  language: "javascript" | "typescript" | "python" = "typescript",
  callbacks?: ExecutionCallbacks
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    if (language === "python") {
      // Use Python execution
      const execution = await sandbox.runCode(code, {
        onStdout: callbacks?.onStdout,
        onStderr: callbacks?.onStderr,
        onResult: callbacks?.onResult,
        onError: callbacks?.onError,
      });

      return {
        stdout: execution.logs.stdout,
        stderr: execution.logs.stderr,
        exitCode: execution.error ? 1 : 0,
        results: execution.results,
        error: execution.error,
        executionTimeMs: Date.now() - startTime,
      };
    } else {
      // Use Node.js for JavaScript/TypeScript
      // Write code to a file and execute it
      const filename = language === "typescript" ? "index.ts" : "index.js";
      const filepath = `/home/user/${filename}`;

      await sandbox.files.write(filepath, code);

      // Run the code with node or ts-node
      const command = language === "typescript"
        ? `npx ts-node ${filepath}`
        : `node ${filepath}`;

      const result = await sandbox.commands.run(command, {
        onStdout: callbacks?.onStdout,
        onStderr: callbacks?.onStderr,
        timeoutMs: 5 * 60 * 1000, // 5 minute timeout for single execution
      });

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode ?? 0,
        results: [],
        error: result.exitCode !== 0 ? {
          name: "ExecutionError",
          value: `Process exited with code ${result.exitCode}`,
          traceback: result.stderr,
        } : null,
        executionTimeMs: Date.now() - startTime,
      };
    }
  } catch (error) {
    return {
      stdout: "",
      stderr: "",
      exitCode: 1,
      results: [],
      error: {
        name: error instanceof Error ? error.name : "UnknownError",
        value: error instanceof Error ? error.message : String(error),
        traceback: error instanceof Error ? error.stack || "" : "",
      },
      executionTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Run a command in the sandbox
 */
export async function runCommand(
  sandbox: Sandbox,
  command: string,
  callbacks?: ExecutionCallbacks
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await sandbox.commands.run(command, {
    onStdout: callbacks?.onStdout,
    onStderr: callbacks?.onStderr,
    timeoutMs: 5 * 60 * 1000,
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode ?? 0,
  };
}

/**
 * Setup project files in sandbox
 */
export async function setupProjectFiles(
  sandbox: Sandbox,
  files: Array<{ path: string; content: string }>
): Promise<void> {
  for (const file of files) {
    const fullPath = `/home/user/${file.path}`;
    await sandbox.files.write(fullPath, file.content);
  }
}

/**
 * Read file from sandbox
 */
export async function readFile(
  sandbox: Sandbox,
  path: string
): Promise<string> {
  const fullPath = path.startsWith("/") ? path : `/home/user/${path}`;
  return await sandbox.files.read(fullPath);
}

/**
 * List files in sandbox directory
 */
export async function listFiles(
  sandbox: Sandbox,
  path: string = "/home/user"
): Promise<Array<{ name: string; type: "file" | "dir"; path: string }>> {
  const entries = await sandbox.files.list(path);
  return entries.map((e) => ({
    name: e.name,
    type: e.type,
    path: `${path}/${e.name}`,
  }));
}

/**
 * Cleanup sandbox for a conversation
 */
export async function cleanupSandbox(conversationId: string): Promise<void> {
  const sandboxes = await Sandbox.list();
  const sandbox = sandboxes.find(
    (s) => s.metadata?.conversationId === conversationId
  );

  if (sandbox) {
    console.log(`[E2B] Cleaning up sandbox ${sandbox.sandboxId}`);
    await Sandbox.kill(sandbox.sandboxId);
  }
}

/**
 * Get sandbox info
 */
export async function getSandboxInfo(
  sandbox: Sandbox
): Promise<{ sandboxId: string; endAt: Date }> {
  const info = await sandbox.getInfo();
  return {
    sandboxId: info.sandboxId,
    endAt: info.endAt,
  };
}
