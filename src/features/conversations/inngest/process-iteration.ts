/**
 * Process Iteration - Inngest Function
 *
 * Handles AI iteration mode using GLM-5.1 and E2B sandbox.
 * Iteratively generates, executes, and refines code until success or max iterations.
 */

import { generateText } from "ai";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { createVercelAIModel } from "@/lib/ai-models";
import {
  getOrCreateSandbox,
  executeCode,
  cleanupSandbox,
  type ExecutionResult,
} from "@/lib/e2b";

interface IterationEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
  imageUrls?: string[];
  maxIterations?: number;
  testCommand?: string;
  language?: "javascript" | "typescript" | "python";
}

interface IterationData {
  iterationNumber: number;
  code: string;
  executionResult: ExecutionResult;
  reasoning?: string;
  timestamp: number;
}

const MAX_ITERATIONS = 10;
const ITERATION_SYSTEM_PROMPT = `You are an expert software engineer specializing in iterative code refinement.
Your goal is to write, test, and fix code until it works correctly.

You have access to a sandboxed execution environment where you can:
1. Generate code based on the user's request
2. See the execution results (stdout, stderr, exit code)
3. Analyze errors and refine the code
4. Repeat until the code works

Rules:
- Write complete, runnable code
- If execution fails, analyze the error and provide a fixed version
- Explain your reasoning for each change
- Focus on correctness over elegance
- For TypeScript/JavaScript, assume Node.js environment
- For Python, assume standard library + common packages available

Output format:
<code>
Your complete code here
</code>
<reasoning>
Your analysis of what you're doing and why
</reasoning>

If the code executed successfully and meets the requirements, explicitly state "SUCCESS" in your reasoning.`;

const generateInitialCode = async (
  message: string,
  language: "javascript" | "typescript" | "python",
  imageUrls?: string[]
): Promise<{ code: string; reasoning: string }> => {
  const model = createVercelAIModel("iteration");

  const result = await generateText({
    model,
    system: ITERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Write ${language} code to accomplish this task:\n\n${message}\n\nProvide complete, runnable code that can be executed in a sandbox.`,
          },
          ...(imageUrls?.map((url) => ({
            type: "image" as const,
            image: url,
          })) || []),
        ],
      },
    ],
    temperature: 0.2,
    maxTokens: 8000,
  });

  return parseResponse(result.text);
};

const generateRefinedCode = async (
  message: string,
  previousCode: string,
  executionResult: ExecutionResult,
  iterationNumber: number,
  language: "javascript" | "typescript" | "python"
): Promise<{ code: string; reasoning: string }> => {
  const model = createVercelAIModel("iteration");

  const errorContext = executionResult.error
    ? `Error: ${executionResult.error.name}: ${executionResult.error.value}\nTraceback:\n${executionResult.error.traceback}`
    : executionResult.stderr
      ? `Stderr output:\n${executionResult.stderr}`
      : "Exit code non-zero but no error output";

  const result = await generateText({
    model,
    system: ITERATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Write ${language} code to accomplish this task:\n\n${message}\n\nProvide complete, runnable code.`,
      },
      {
        role: "assistant",
        content: `<code>\n${previousCode}\n</code>`,
      },
      {
        role: "user",
        content: `The code failed to execute correctly (iteration ${iterationNumber}/${MAX_ITERATIONS}).\n\n${errorContext}\n\nStdout:\n${executionResult.stdout}\n\nPlease fix the code and provide a corrected version.`,
      },
    ],
    temperature: 0.2,
    maxTokens: 8000,
  });

  return parseResponse(result.text);
};

const parseResponse = (text: string): { code: string; reasoning: string } => {
  const codeMatch = text.match(/<code>([\s\S]*?)<\/code>/);
  const reasoningMatch = text.match(/<reasoning>([\s\S]*?)<\/reasoning>/);

  const code = codeMatch?.[1]?.trim() || text.trim();
  const reasoning = reasoningMatch?.[1]?.trim() || "No explicit reasoning provided.";

  return { code, reasoning };
};

const isSuccessCheck = (reasoning: string): boolean => {
  return reasoning.toLowerCase().includes("success");
};

export const processIteration = inngest.createFunction(
  {
    id: "process-iteration",
    name: "Process Iteration Mode",
    concurrency: {
      limit: 3, // Limit concurrent expensive iterations
    },
    timeout: "15m",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId, conversationId } = event.data.event.data as IterationEvent;
      const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

      if (internalKey) {
        await step.run("cleanup-on-failure", async () => {
          // Update iteration status to failed
          await convex.mutation(api.system.updateMessageIterationData, {
            internalKey,
            messageId,
            iterationData: {
              status: "failed",
            },
          });

          // Update message with failure status
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "I encountered an error during iteration mode. The process was unable to complete.",
          });

          await convex.mutation(api.system.updateMessageStatus, {
            internalKey,
            messageId,
            status: "completed",
          });

          // Cleanup E2B sandbox
          await cleanupSandbox(conversationId);
        });
      }
    },
  },
  {
    event: "message/iteration",
  },
  async ({ event, step }) => {
    const {
      messageId,
      conversationId,
      projectId,
      message,
      imageUrls,
      maxIterations = MAX_ITERATIONS,
      testCommand,
      language = "typescript",
    } = event.data as IterationEvent;

    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    let sandboxId: string = "";

    try {
      // ──────────────────────────────────────────────
      // Stage 1: Setup E2B Sandbox
      // ──────────────────────────────────────────────
      sandboxId = await step.run("setup-sandbox", async () => {
        const sb = await getOrCreateSandbox(conversationId, messageId);
        const info = await sb.getInfo();
        return info.sandboxId;
      });

      // Store sandbox ID in message
      await step.run("update-sandbox-id", async () => {
        await convex.mutation(api.system.updateMessageIterationData, {
          internalKey,
          messageId,
          iterationData: {
            iterations: [],
            sandboxId: sandboxId,
            status: "running",
            maxIterations,
            currentIteration: 0,
            testCommand,
            language,
          },
        });
      });

      // ──────────────────────────────────────────────
      // Stage 2: Iteration Loop
      // ──────────────────────────────────────────────
      let currentCode = "";
      let isComplete = false;
      let isSuccess = false;

      for (let iteration = 1; iteration <= maxIterations; iteration++) {
        // Check if cancelled
        const shouldContinue = await step.run(
          `iteration-${iteration}`,
          async () => {
            // Reconnect to sandbox inside the step
            const { Sandbox } = await import("@e2b/code-interpreter");
            const sandbox = await Sandbox.connect(sandboxId, {
              apiKey: process.env.E2B_API_KEY!,
            });

            // Update current iteration
            await convex.mutation(api.system.updateMessageIterationData, {
              internalKey,
              messageId,
              iterationData: {
                currentIteration: iteration,
                status: "running",
              },
            });

            let code: string;
            let reasoning: string;

            if (iteration === 1) {
              // Initial code generation
              const result = await generateInitialCode(message, language, imageUrls);
              code = result.code;
              reasoning = result.reasoning;
            } else {
              // Refine based on previous execution - fetch from database
              const message = await convex.query(api.system.getMessageById, {
                internalKey,
                messageId,
              });
              const iterationData = message?.iterationData;
              const iterations = iterationData?.iterations || [];
              const previousIteration = iterations[iterations.length - 1];

              if (!previousIteration) {
                throw new Error("No previous iteration found");
              }

              const previousExecutionResult: ExecutionResult = JSON.parse(previousIteration.executionResult || '{}');
              const result = await generateRefinedCode(
                message,
                previousIteration.code,
                previousExecutionResult,
                iteration,
                language
              );
              code = result.code;
              reasoning = result.reasoning;
            }

            currentCode = code;

            // Execute code in sandbox
            let executionResult = await executeCode(sandbox, code, language);

            // Execute test command if provided
            if (testCommand && executionResult.exitCode === 0 && !executionResult.error) {
              const { runCommand } = await import("@/lib/e2b/sandbox-manager");
              const testStartTime = Date.now();
              try {
                const testResult = await runCommand(sandbox, testCommand);
                const testExecutionTimeMs = Date.now() - testStartTime;

                // If tests fail, mark execution as failed
                if (testResult.exitCode !== 0) {
                  executionResult = {
                    ...executionResult,
                    exitCode: testResult.exitCode,
                    stderr: testResult.stderr || executionResult.stderr,
                    error: {
                      name: "TestError",
                      value: `Tests failed with exit code ${testResult.exitCode}`,
                      traceback: testResult.stderr,
                    },
                    executionTimeMs: executionResult.executionTimeMs + testExecutionTimeMs,
                  };
                }
              } catch (testError) {
                const testExecutionTimeMs = Date.now() - testStartTime;
                executionResult = {
                  ...executionResult,
                  exitCode: 1,
                  error: {
                    name: testError instanceof Error ? testError.name : "TestError",
                    value: testError instanceof Error ? testError.message : String(testError),
                    traceback: testError instanceof Error ? testError.stack || "" : "",
                  },
                  executionTimeMs: executionResult.executionTimeMs + testExecutionTimeMs,
                };
              }
            }

            // Update message with iteration data
            await convex.mutation(api.system.appendIteration, {
              internalKey,
              messageId,
              iteration: {
                iterationNumber: iteration,
                code,
                executionResult: JSON.stringify(executionResult),
                reasoning,
                timestamp: Date.now(),
              },
            });

            // Check if successful (based only on execution result, not reasoning)
            const success = executionResult.exitCode === 0 && !executionResult.error;

            if (success) {
              return { success: true, finalCode: code };
            }

            // If last iteration and still not successful
            if (iteration === maxIterations) {
              return { success: false, finalCode: code };
            }

            return { continue: true };
          }
        );

        if (shouldContinue?.success) {
          currentCode = shouldContinue.finalCode;
          isComplete = true;
          isSuccess = true;
          break;
        }

        if (shouldContinue?.success === false) {
          currentCode = shouldContinue.finalCode;
          isComplete = true;
          isSuccess = false;
          break;
        }
      }

      // ──────────────────────────────────────────────
      // Stage 3: Finalize
      // ──────────────────────────────────────────────
      await step.run("finalize", async () => {
        // Fetch iterations from database instead of using in-memory array
        const message = await convex.query(api.system.getMessageById, {
          internalKey,
          messageId,
        });
        const iterationData = message?.iterationData;
        const iterations = iterationData?.iterations || [];
        const iterationCount = iterations.length;
        const lastIteration = iterations[iterations.length - 1];

        // Generate final summary
        const model = createVercelAIModel("manager");
        const summaryResult = await generateText({
          model,
          messages: [
            {
              role: "user",
              content: `Summarize the iteration process and provide the final working code.\n\nIterations: ${iterationCount}\nFinal code:\n\`\`\`${language}\n${currentCode}\n\`\`\`\n\nProvide a brief summary of what was accomplished and any important notes.`,
            },
          ],
        });

        // Update message with final content
        await convex.mutation(api.system.updateMessageContent, {
          internalKey,
          messageId,
          content: summaryResult.text,
        });

        // Update iteration status to completed
        const lastExitCode = lastIteration
          ? JSON.parse(lastIteration.executionResult || '{}').exitCode
          : null;
        await convex.mutation(api.system.updateMessageIterationData, {
          internalKey,
          messageId,
          iterationData: {
            status: lastExitCode === 0 ? "completed" : "failed",
            finalOutput: currentCode,
          },
        });

        await convex.mutation(api.system.updateMessageStatus, {
          internalKey,
          messageId,
          status: "completed",
        });
      });

      return {
        success: isSuccess,
        iterations: maxIterations,
        messageId,
      };
    } catch (error) {
      console.error("Iteration error:", error);

      // Update message with error
      await step.run("handle-error", async () => {
        // Update iteration status to failed
        await convex.mutation(api.system.updateMessageIterationData, {
          internalKey,
          messageId,
          iterationData: {
            status: "failed",
          },
        });

        await convex.mutation(api.system.updateMessageContent, {
          internalKey,
          messageId,
          content: `I encountered an error during iteration mode: ${error instanceof Error ? error.message : String(error)}`,
        });

        await convex.mutation(api.system.updateMessageStatus, {
          internalKey,
          messageId,
          status: "completed",
        });
      });

      throw error;
    } finally {
      // Cleanup sandbox
      if (sandboxId) {
        await step.run("cleanup-sandbox", async () => {
          await cleanupSandbox(conversationId);
        });
      }
    }
  }
);
