import {
  createAgent,
  openai,
  createNetwork,
  type Message,
} from "@inngest/agent-kit";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT,
  isUIGenerationRequest,
  fetchDesignGuidelines,
} from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { createReadFilesTool } from "./tools/read-files";
import { createListFilesTool } from "./tools/list-files";
import { createUpdateFileTool } from "./tools/update-file";
import { createCreateFilesTool } from "./tools/create-files";
import { createCreateFolderTool } from "./tools/create-folder";
import { createRenameFileTool } from "./tools/rename-file";
import { createDeleteFilesTool } from "./tools/delete-files";
import { createScrapeUrlsTool } from "./tools/scrape-urls";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
  imageUrls?: string[];
};

const extractAssistantText = (messages: Message[]): string | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.type !== "text" || message.role !== "assistant") {
      continue;
    }

    const content =
      typeof message.content === "string"
        ? message.content
        : message.content
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("");

    const trimmedContent = content.trim();
    if (trimmedContent) {
      return trimmedContent;
    }
  }

  return null;
};

const FALLBACK_AGENT_RESPONSE =
  "I processed your request, but I wasn't able to produce a final text reply. Please try again or ask me to summarize the latest changes.";

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

      // Update the message with error content
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

    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY; 

    if (!internalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

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

    // Inject premium design guidelines for UI generation requests
    if (isUIGenerationRequest(message)) {
      const designGuidelines = await step.run("fetch-design-guidelines", async () => {
        return await fetchDesignGuidelines();
      });

      if (designGuidelines) {
        systemPrompt += `\n\n<design_guidelines>\n${designGuidelines}\n</design_guidelines>`;
      }
    }

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
      const openrouter = createOpenAICompatible({
        name: "openrouter",
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: "https://openrouter.ai/api/v1",
      });

      const generatedTitle = await step.run(
        "generate-conversation-title",
        async () => {
          const result = await generateText({
            model: openrouter("x-ai/grok-4.1-fast"),
            // Keep title prompt short and deterministic
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

    // Create the coding agent with file tools
    const codingAgent = createAgent({
      name: "polaris-coding-agent",
      description: "An expert AI coding assistant",
      system: systemPrompt,
      model: openai({
        model: codingModel,
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: "https://openrouter.ai/api/v1",
        defaultParameters: {
          temperature: 0.3,
          max_completion_tokens: 8000,
        },
      }),
      tools: [
        createListFilesTool({ internalKey, projectId }),
        createReadFilesTool({ internalKey }),
        createUpdateFileTool({ internalKey }),
        createCreateFilesTool({ projectId, internalKey }),
        createCreateFolderTool({ projectId, internalKey }),
        createRenameFileTool({ internalKey }),
        createDeleteFilesTool({ internalKey }),
        createScrapeUrlsTool(),
      ],
    });

    // Create network with single agent
    const network = createNetwork({
      name: "polaris-coding-network",
      agents: [codingAgent],
      maxIter: 10,
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        if (!lastResult) {
          return codingAgent;
        }

        const hasToolCalls =
          lastResult.output.some((message) => message.type === "tool_call") ||
          lastResult.toolCalls.length > 0;

        if (!hasToolCalls) {
          return undefined;
        }

        return codingAgent;
      }
    });

    // Build the full message content including any reference images
    let fullMessage = message;
    if (imageUrls && imageUrls.length > 0) {
      fullMessage += `\n\nReference images provided by the user:\n${imageUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}`;
    }

    // Run the network directly (not inside step.run) because agent-kit
    // internally uses step.* calls, and nesting steps is not allowed.
    const networkResult = await network.run(fullMessage);

    // Search all results in reverse to find the last assistant text response.
    // With multi-iteration networks, the final text may not be in the last result.
    let assistantResponse: string | null = null;
    const results = networkResult.state.results ?? [];
    for (let i = results.length - 1; i >= 0; i--) {
      const extractedText = extractAssistantText(results[i].output);
      if (extractedText) {
        assistantResponse = extractedText;
        break;
      }
    }

    if (!assistantResponse) {
      console.error("Agent network completed without assistant text", {
        messageId,
        conversationId,
        projectId,
        resultCount: results.length,
        summaries: results.map((result, index) => ({
          index,
          outputTypes: result.output.map((message) => ({
            type: message.type,
            role: message.role,
          })),
          toolCallNames: result.toolCalls.map((toolCall) => toolCall.tool.name),
        })),
      });
      assistantResponse = FALLBACK_AGENT_RESPONSE;
    }

    // Update the assistant message with the response (this also sets status to completed)
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse,
      })
    });

    return { success: true, messageId, conversationId };
  }
);
