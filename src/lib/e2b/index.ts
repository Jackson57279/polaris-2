/**
 * E2B Library Barrel Export
 *
 * Centralized exports for E2B integration.
 */

export {
  E2B_CONFIG,
  validateE2BConfig,
} from "./client";

export {
  getOrCreateSandbox,
  executeCode,
  runCommand,
  setupProjectFiles,
  readFile,
  listFiles,
  cleanupSandbox,
  getSandboxInfo,
  type SandboxSession,
  type ExecutionResult,
  type ExecutionCallbacks,
} from "./sandbox-manager";

export {
  runIteration,
  runTests,
  prepareSandbox,
  type IterationContext,
  type IterationResult,
  type IterationCallbacks,
} from "./code-executor";
