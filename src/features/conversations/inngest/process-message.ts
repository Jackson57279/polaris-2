import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT,
} from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { firecrawl } from "@/lib/firecrawl";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
  imageUrls?: string[];
};

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
          });
        });
      }
    }
  },
  {
    event: "message/sent",
  },
  async ({ event, step }) => {
    const {
      messageId,
      conversationId,
      projectId,
      message,
      imageUrls,
    } = event.data as MessageEvent;

    const rawInternalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!rawInternalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    // Rebind after narrowing so TypeScript tracks this as `string` (not `string | undefined`)
    // inside nested async closures (TypeScript loses narrowing across closure boundaries).
    const internalKey: string = rawInternalKey;

    await step.sleep("wait-for-db-sync", "1s");

    const { conversation } = await step.run(
      "get-conversation",
      async () => {
        const conv = await convex.query(api.system.getConversationById, {
          internalKey,
          conversationId,
        });
        return { conversation: conv };
      }
    );

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

    const codingModel =
      process.env.POLARIS_CODING_MODEL ?? "google/gemini-3.1-pro-preview";

    const openrouter = createOpenAICompatible({
      name: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    // Fetch recent messages for conversation context
    const recentMessages = await step.run("get-recent-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: 10,
      });
    });

    // Build system prompt with conversation history (exclude the current processing message)
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    // Filter out the current processing message and empty messages
    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== messageId && msg.content.trim() !== ""
    );

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    // Generate conversation title if it's still the default
    const shouldGenerateTitle =
      conversation.title === DEFAULT_CONVERSATION_TITLE;

    if (shouldGenerateTitle) {
      const generatedTitle = await step.run(
        "generate-conversation-title",
        async () => {
          const result = await generateText({
            model: openrouter("x-ai/grok-4.1-fast"),
            prompt: `${TITLE_GENERATOR_SYSTEM_PROMPT}\n\nUser message:\n${message}`,
            experimental_telemetry: {
              isEnabled: true,
              recordInputs: true,
              recordOutputs: true,
            },
          });

          const text = result.text.trim();
          return text.length > 0 ? text : null;
        }
      );

      if (generatedTitle) {
        await step.run("update-conversation-title", async () => {
          await convex.mutation(api.system.updateConversationTitle, {
            internalKey,
            conversationId,
            title: generatedTitle,
          });
        });
      }
    }

    // Build the user message content — include images as proper vision parts when present
    const userContent =
      imageUrls && imageUrls.length > 0
        ? [
            { type: "text" as const, text: message },
            ...imageUrls.map((url) => ({ type: "image" as const, image: url })),
          ]
        : message;

    // Run the coding agent with full tool-calling support
    const aiResult = await generateText({
      model: openrouter(codingModel),
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
      stopWhen: stepCountIs(10),
      temperature: 0.3,
      maxOutputTokens: 8000,
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: false, // avoid logging potentially large file contents
        recordOutputs: true,
      },
      tools: {
        listFiles: tool({
          description:
            "List all files and folders in the project. Returns names, IDs, types, and parentId for each item. Items with parentId: null are at root level. Use the parentId to understand the folder structure - items with the same parentId are in the same folder.",
          inputSchema: z.object({}),
          execute: async () => {
            try {
              const files = await convex.query(api.system.getProjectFiles, {
                internalKey,
                projectId,
              });
              const sorted = files.sort((a, b) => {
                if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
                return a.name.localeCompare(b.name);
              });
              return JSON.stringify(
                sorted.map((f) => ({
                  id: f._id,
                  name: f.name,
                  type: f.type,
                  parentId: f.parentId ?? null,
                }))
              );
            } catch (error) {
              return `Error listing files: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),

        readFiles: tool({
          description:
            "Read the content of files from the project. Returns file contents.",
          inputSchema: z.object({
            fileIds: z.array(z.string()).describe("Array of file IDs to read"),
          }),
          execute: async ({ fileIds }) => {
            if (!fileIds.length)
              return "Error: Provide at least one file ID";
            try {
              const results: { id: string; name: string; content: string }[] = [];
              for (const fileId of fileIds) {
                const file = await convex.query(api.system.getFileById, {
                  internalKey,
                  fileId: fileId as Id<"files">,
                });
                if (file?.content) {
                  results.push({
                    id: file._id,
                    name: file.name,
                    content: file.content,
                  });
                }
              }
              if (results.length === 0)
                return "Error: No files found with provided IDs. Use listFiles to get valid fileIDs.";
              return JSON.stringify(results);
            } catch (error) {
              return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),

        updateFile: tool({
          description: "Update the content of an existing file",
          inputSchema: z.object({
            fileId: z.string().describe("The ID of the file to update"),
            content: z.string().describe("The new content for the file"),
          }),
          execute: async ({ fileId, content }) => {
            const file = await convex.query(api.system.getFileById, {
              internalKey,
              fileId: fileId as Id<"files">,
            });
            if (!file)
              return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
            if (file.type === "folder")
              return `Error: "${fileId}" is a folder, not a file. You can only update file contents.`;
            try {
              await convex.mutation(api.system.updateFile, {
                internalKey,
                fileId: fileId as Id<"files">,
                content,
              });
              return `File "${file.name}" updated successfully`;
            } catch (error) {
              return `Error updating file: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),

        createFiles: tool({
          description:
            "Create multiple files at once. File names can include paths (e.g., 'src/index.css') - parent folders will be automatically created. More efficient than creating files one by one.",
          inputSchema: z.object({
            parentId: z
              .string()
              .describe(
                "The ID of the parent folder. Use empty string for root level. Must be a valid folder ID from listFiles."
              ),
            files: z
              .array(
                z.object({
                  name: z
                    .string()
                    .describe(
                      "The file name including extension, can include path like 'src/index.css'"
                    ),
                  content: z.string().describe("The file content"),
                })
              )
              .describe("Array of files to create"),
          }),
          execute: async ({ parentId, files }) => {
            try {
              let resolvedParentId: Id<"files"> | undefined;

              if (parentId && parentId !== "") {
                try {
                  const parentFolder = await convex.query(
                    api.system.getFileById,
                    { internalKey, fileId: parentId as Id<"files"> }
                  );
                  if (!parentFolder)
                    return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
                  if (parentFolder.type !== "folder")
                    return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
                  resolvedParentId = parentId as Id<"files">;
                } catch {
                  return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use empty string for root level.`;
                }
              }

              const folderCache = new Map<string, Id<"files">>();

              async function ensureFolderPath(
                segments: string[],
                baseParentId: Id<"files"> | undefined
              ): Promise<Id<"files">> {
                let currentParentId = baseParentId;
                let currentPath = "";
                for (const segment of segments) {
                  currentPath = currentPath
                    ? `${currentPath}/${segment}`
                    : segment;
                  if (folderCache.has(currentPath)) {
                    currentParentId = folderCache.get(currentPath)!;
                  } else {
                    const folderId = await convex.mutation(
                      api.system.createFolder,
                      {
                        internalKey,
                        projectId,
                        name: segment,
                        parentId: currentParentId,
                      }
                    );
                    folderCache.set(currentPath, folderId);
                    currentParentId = folderId;
                  }
                }
                return currentParentId!;
              }

              const transformedFiles: Array<{
                name: string;
                content: string;
                resolvedParentId: Id<"files"> | undefined;
              }> = [];

              for (const file of files) {
                const normalizedName = file.name
                  .replace(/^\/+/, "")
                  .replace(/\/+/g, "/")
                  .replace(/\/$/, "");
                if (!normalizedName)
                  return `Error: Invalid file name "${file.name}".`;
                const segments = normalizedName.split("/");
                if (segments.length === 1) {
                  transformedFiles.push({
                    name: segments[0],
                    content: file.content,
                    resolvedParentId,
                  });
                } else {
                  const folderSegments = segments.slice(0, -1);
                  const fileName = segments[segments.length - 1];
                  const fileFolderId = await ensureFolderPath(
                    folderSegments,
                    resolvedParentId
                  );
                  transformedFiles.push({
                    name: fileName,
                    content: file.content,
                    resolvedParentId: fileFolderId,
                  });
                }
              }

              const filesByParent = new Map<
                string,
                {
                  files: Array<{ name: string; content: string }>;
                  parentId: Id<"files"> | undefined;
                }
              >();
              for (const tf of transformedFiles) {
                const key = tf.resolvedParentId ?? "__root__";
                if (!filesByParent.has(key)) {
                  filesByParent.set(key, {
                    files: [],
                    parentId: tf.resolvedParentId,
                  });
                }
                filesByParent
                  .get(key)!
                  .files.push({ name: tf.name, content: tf.content });
              }

              let totalCreated = 0;
              let totalFailed = 0;
              const createdNames: string[] = [];
              const failedNames: string[] = [];

              for (const {
                files: groupFiles,
                parentId: groupParentId,
              } of filesByParent.values()) {
                const results = await convex.mutation(api.system.createFiles, {
                  internalKey,
                  projectId,
                  parentId: groupParentId,
                  files: groupFiles,
                });
                const created = results.filter((r) => !r.error);
                const failed = results.filter((r) => r.error);
                totalCreated += created.length;
                totalFailed += failed.length;
                createdNames.push(...created.map((r) => r.name));
                failedNames.push(...failed.map((r) => `${r.name} (${r.error})`));
              }

              let response = `Created ${totalCreated} file(s)`;
              if (createdNames.length > 0)
                response += `: ${createdNames.join(", ")}`;
              if (totalFailed > 0)
                response += `. Failed: ${failedNames.join(", ")}`;
              return response;
            } catch (error) {
              return `Error creating files: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),

        createFolder: tool({
          description: "Create a new folder in the project",
          inputSchema: z.object({
            name: z.string().describe("The name of the folder to create"),
            parentId: z
              .string()
              .describe(
                "The ID (not name!) of the parent folder from listFiles, or empty string for root level"
              ),
          }),
          execute: async ({ name, parentId }) => {
            try {
              if (parentId) {
                const parentFolder = await convex.query(
                  api.system.getFileById,
                  { internalKey, fileId: parentId as Id<"files"> }
                );
                if (!parentFolder)
                  return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
                if (parentFolder.type !== "folder")
                  return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
              }
              const folderId = await convex.mutation(api.system.createFolder, {
                internalKey,
                projectId,
                name,
                parentId: parentId ? (parentId as Id<"files">) : undefined,
              });
              return `Folder created with ID: ${folderId}`;
            } catch (error) {
              return `Error creating folder: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),

        renameFile: tool({
          description: "Rename a file or folder",
          inputSchema: z.object({
            fileId: z
              .string()
              .describe("The ID of the file or folder to rename"),
            newName: z
              .string()
              .describe("The new name for the file or folder"),
          }),
          execute: async ({ fileId, newName }) => {
            const file = await convex.query(api.system.getFileById, {
              internalKey,
              fileId: fileId as Id<"files">,
            });
            if (!file)
              return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
            try {
              await convex.mutation(api.system.renameFile, {
                internalKey,
                fileId: fileId as Id<"files">,
                newName,
              });
              return `Renamed "${file.name}" to "${newName}" successfully`;
            } catch (error) {
              return `Error renaming file: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),

        deleteFiles: tool({
          description:
            "Delete files or folders from the project. If deleting a folder, all contents will be deleted recursively.",
          inputSchema: z.object({
            fileIds: z
              .array(z.string())
              .describe("Array of file or folder IDs to delete"),
          }),
          execute: async ({ fileIds }) => {
            if (!fileIds.length) return "Error: Provide at least one file ID";
            const filesToDelete: {
              id: string;
              name: string;
              type: string;
            }[] = [];
            for (const fileId of fileIds) {
              const file = await convex.query(api.system.getFileById, {
                internalKey,
                fileId: fileId as Id<"files">,
              });
              if (!file)
                return `Error: File with ID "${fileId}" not found. Use listFiles to get valid file IDs.`;
              filesToDelete.push({
                id: file._id,
                name: file.name,
                type: file.type,
              });
            }
            try {
              const results: string[] = [];
              for (const file of filesToDelete) {
                await convex.mutation(api.system.deleteFile, {
                  internalKey,
                  fileId: file.id as Id<"files">,
                });
                results.push(
                  `Deleted ${file.type} "${file.name}" successfully`
                );
              }
              return results.join("\n");
            } catch (error) {
              return `Error deleting files: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),

        scrapeUrls: tool({
          description:
            "Scrape content from URLs to get documentation or reference material. Use this when the user provides URLs or references external documentation. Returns markdown content from the scraped pages.",
          inputSchema: z.object({
            urls: z
              .array(z.string())
              .describe("Array of URLs to scrape for content"),
          }),
          execute: async ({ urls }) => {
            if (!urls.length) return "Error: Provide at least one URL";
            try {
              const results: { url: string; content: string }[] = [];
              for (const url of urls) {
                try {
                  const result = await firecrawl.scrape(url, {
                    formats: ["markdown"],
                  });
                  if (result.markdown) {
                    results.push({ url, content: result.markdown });
                  }
                } catch {
                  results.push({
                    url,
                    content: `Failed to scrape URL: ${url}`,
                  });
                }
              }
              if (results.length === 0)
                return "No content could be scraped from the provided URLs.";
              return JSON.stringify(results);
            } catch (error) {
              return `Error scraping URLs: ${error instanceof Error ? error.message : "Unknown error"}`;
            }
          },
        }),
      },
    });

    const assistantResponse =
      aiResult.text ||
      "I processed your request. Let me know if you need anything else!";

    // Update the assistant message with the response (this also sets status to completed)
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse,
      });
    });

    return { success: true, messageId, conversationId };
  }
);
