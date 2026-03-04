import { createAgent, openai, createNetwork } from "@inngest/agent-kit";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT
} from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "../constants";
import { SkillRegistry, isSkillSystemEnabled } from '../skills';
import { fileManagementSkill, webResearchSkill } from '../skills';
import {
  createClassifierAgent,
  createPlannerAgent,
  createBuilderAgent,
  createDebuggerAgent,
  createResearcherAgent,
  createGeneralAgent,
} from './agents';
import { PolarisNetworkState } from './types';

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
    // Create all agents for multi-agent network
    const classifierAgent = createClassifierAgent({ internalKey, projectId });
    const plannerAgent = createPlannerAgent({ internalKey, projectId });
    const builderAgent = createBuilderAgent({ internalKey, projectId });
    const debuggerAgent = createDebuggerAgent({ internalKey, projectId });
    const researcherAgent = createResearcherAgent({ internalKey, projectId });
    const generalAgent = createGeneralAgent({ internalKey, projectId });

    // Create multi-agent network with intent-based routing
    const network = createNetwork<PolarisNetworkState>({
      name: "polaris-multi-agent-network",
      agents: [classifierAgent, plannerAgent, builderAgent, debuggerAgent, researcherAgent, generalAgent],
      maxIter: 20,
      router: ({ network, callCount }) => {
        const MAX_SWITCHES = 5;
        const switchCount = network.state.data.agentSwitchCount || 0;

        // Guardrail: prevent infinite loops
        if (switchCount >= MAX_SWITCHES) {
          return undefined;
        }

        // Phase 1: Classify intent on first call
        if (callCount === 0) {
          return classifierAgent;
        }

        // Phase 2: Route to specialist based on intent
        if (!network.state.data.routed && network.state.data.intent) {
          network.state.data.routed = true;
          network.state.data.agentSwitchCount = switchCount + 1;

          const intent = network.state.data.intent;
          const agentMap: Record<string, typeof classifierAgent> = {
            planner: plannerAgent,
            builder: builderAgent,
            debugger: debuggerAgent,
            researcher: researcherAgent,
            general: generalAgent,
          };
          return agentMap[intent] || generalAgent;
        }

        // Phase 3: Check for completion (existing logic)
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.some(
          (m) => m.type === "text" && m.role === "assistant"
        );
        const hasToolCalls = lastResult?.output.some(
          (m) => m.type === "tool_call"
        );

        // Anthropic outputs text AND tool calls together
        // Only stop if there's text WITHOUT tool calls (final response)
        if (hasTextResponse && !hasToolCalls) {
          return undefined;
        }

        // Continue with current agent (return undefined to continue)
        return undefined;
      },
    });

    // Build the full message content including any reference images
    let fullMessage = message;
    if (imageUrls && imageUrls.length > 0) {
      fullMessage += `\n\nReference images provided by the user:\n${imageUrls.map((url, i) => `${i + 1}. ${url}`).join("\n")}`;
    }

    const result = await network.run(fullMessage);
    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output.find(
      (m) => m.type === "text" && m.role === "assistant"
    );

    const assistantResponse =
      textMessage?.type === "text"
        ? (typeof textMessage.content === "string"
            ? textMessage.content
            : textMessage.content.map((c) => c.text).join(""))
        : "I processed your request. Let me know if you need anything else!";

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

