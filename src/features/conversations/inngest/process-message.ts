import {
  createAgent,
  createNetwork,
  type Message,
} from "@inngest/agent-kit";
import { generateText } from "ai";

import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { createAgentKitModel, createVercelAIModel } from "@/lib/ai-models";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT,
  PLAN_STEP_PROMPT,
  SKILL_ROUTER_PROMPT,
  ENHANCE_SYSTEM_PROMPT,
  isUIGenerationRequest,
  fetchDesignGuidelines,
  fetchMinimalistGuidelines,
  fetchTasteAdvancedGuidelines,
  type DesignSkillType,
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
import { runRepoResearch } from "./workers/repo-research";
import { runExaResearch } from "./workers/exa-research";
import { runReview } from "./workers/review";
import type {
  AgentPlan,
  ResearchArtifact,
  ReviewArtifact,
} from "./workers/types";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
  imageUrls?: string[];
}

const getToolLabel = (
  name: string,
  input: Record<string, unknown>,
  result: unknown
): string | null => {
  const resultStr = typeof result === "string" ? result : "";
  if (resultStr.startsWith("Error")) return null;

  switch (name) {
    case "updateFile": {
      const match = resultStr.match(/^File "(.+)" updated successfully/);
      return match ? `Edit ${match[1]}` : "Edit file";
    }
    case "createFiles": {
      const files = (input.files as Array<{ name: string }>) ?? [];
      const names = files.map((f) => f.name).join(", ");
      return names ? `Create ${names}` : "Create files";
    }
    case "createFolder": {
      const folderName = (input.name as string) ?? "folder";
      return `Create folder ${folderName}`;
    }
    case "renameFile": {
      const match = resultStr.match(/^Renamed "(.+)" to "(.+)" successfully/);
      return match ? `Rename ${match[1]} → ${match[2]}` : "Rename file";
    }
    case "deleteFiles": {
      const names = [
        ...resultStr.matchAll(/Deleted (?:file|folder) "(.+)" successfully/g),
      ].map((m) => m[1]);
      return names.length > 0 ? `Delete ${names.join(", ")}` : "Delete files";
    }
    case "scrapeUrls": {
      const urls = (input.urls as string[]) ?? [];
      return `Scrape ${urls.length} URL${urls.length !== 1 ? "s" : ""}`;
    }
    default:
      return null;
  }
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
    concurrency: {
      key: "event.data.conversationId",
      limit: 1,
    },
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
    },
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
      throw new NonRetriableError(
        "POLARIS_CONVEX_INTERNAL_KEY is not configured"
      );
    }

    await step.sleep("wait-for-db-sync", "1s");

    // ──────────────────────────────────────────────
    // Stage 1 — Load conversation context
    // ──────────────────────────────────────────────

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

    const recentMessages = await step.run(
      "get-recent-messages",
      async () => {
        return await convex.query(api.system.getRecentMessages, {
          internalKey,
          conversationId,
          limit: 10,
        });
      }
    );

    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== messageId && msg.content.trim() !== ""
    );

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    // ──────────────────────────────────────────────
    // Stage 1.5 — Auto-enhance UI prompts
    // ──────────────────────────────────────────────

    // Use the (possibly enhanced) message downstream for plan/research/agent.
    // Keep the original for title generation so titles stay concise.
    let workingMessage = message;

    if (isUIGenerationRequest(message)) {
      const enhanced = await step.run("auto-enhance-prompt", async () => {
        const result = await generateText({
          model: createVercelAIModel("enhance"),
          system: ENHANCE_SYSTEM_PROMPT,
          prompt: `Here is the user's prompt to enhance:\n\n${message}`,
          temperature: 0.7,
        });
        return result.text.trim() || null;
      });

      if (enhanced) {
        workingMessage = enhanced;
      }
    }

    // Title generation
    const shouldGenerateTitle =
      conversation.title === DEFAULT_CONVERSATION_TITLE;

    if (shouldGenerateTitle) {
      const generatedTitle = await step.run(
        "generate-conversation-title",
        async () => {
          const result = await generateText({
            model: createVercelAIModel("title"),
            prompt: `${TITLE_GENERATOR_SYSTEM_PROMPT}\n\nUser message:\n${message}`,
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

    // ──────────────────────────────────────────────
    // Stage 2 — Plan
    // ──────────────────────────────────────────────

    const plan = await step.run("create-plan", async () => {
      const contextSummary =
        contextMessages.length > 0
          ? contextMessages
              .slice(-3)
              .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
              .join("\n")
          : "No prior conversation.";

      const result = await generateText({
        model: createVercelAIModel("research"),
        prompt: `${PLAN_STEP_PROMPT}\n\nUser request: "${workingMessage}"\n\nRecent context:\n${contextSummary}`,
      });

      try {
        return JSON.parse(result.text) as AgentPlan;
      } catch {
        return {
          needsResearch: false,
          searchQueries: [],
          focusAreas: [],
          implementationHints: result.text,
          steps: [],
          potentialIssues: [],
          filesToModify: [],
          complexity: "moderate",
        } satisfies AgentPlan;
      }
    });

    // ──────────────────────────────────────────────
    // Stage 3 — Research fan-out (parallel workers)
    // ──────────────────────────────────────────────

    let repoResearch: ResearchArtifact | null = null;
    let exaResearch: ResearchArtifact | null = null;

    if (plan.needsResearch) {
      const workerBase = {
        messageId: messageId as string,
        projectId: projectId as string,
        conversationId: conversationId as string,
        userMessage: workingMessage,
      };

      const [repoResult, exaResult] = await Promise.all([
        step.run("repo-research", () =>
          runRepoResearch({ ...workerBase, focusAreas: plan.focusAreas }, internalKey)
        ),
        step.run("exa-research", () =>
          runExaResearch({ ...workerBase, searchQueries: plan.searchQueries }, internalKey)
        ),
      ]);

      repoResearch = repoResult as ResearchArtifact;
      exaResearch = exaResult as ResearchArtifact;
    }

    // ──────────────────────────────────────────────
    // Stage 4 — Enrich context with research
    // ──────────────────────────────────────────────

    if (repoResearch?.summary) {
      systemPrompt += `\n\n<repo_research>\n${repoResearch.summary}`;
      if (repoResearch.relevantFiles?.length) {
        systemPrompt += `\n\nRelevant files:\n${repoResearch.relevantFiles
          .map((f) => `- ${f.name}: ${f.snippet}`)
          .join("\n")}`;
      }
      systemPrompt += `\n</repo_research>`;
    }

    const skipExaSummaries = new Set([
      "No external research performed.",
      "External search returned no results.",
    ]);

    if (
      exaResearch?.summary &&
      !skipExaSummaries.has(exaResearch.summary)
    ) {
      systemPrompt += `\n\n<external_research>\n${exaResearch.summary}`;
      if (exaResearch.citations?.length) {
        systemPrompt += `\n\nSources:\n${exaResearch.citations
          .map((c) => `- [${c.title}](${c.url})`)
          .join("\n")}`;
      }
      systemPrompt += `\n</external_research>`;
    }

    if (
      plan.implementationHints ||
      plan.steps?.length ||
      plan.potentialIssues?.length ||
      plan.filesToModify?.length
    ) {
      systemPrompt += `\n\n<implementation_plan>`;

      if (plan.implementationHints) {
        systemPrompt += `\n\n## Approach\n${plan.implementationHints}`;
      }

      if (plan.steps?.length) {
        systemPrompt += `\n\n## Implementation Steps\n${plan.steps
          .map((s, i) => `${i + 1}. ${s}`)
          .join("\n")}`;
      }

      if (plan.filesToModify?.length) {
        systemPrompt += `\n\n## Files to Create / Modify\n${plan.filesToModify
          .map((f) => `- ${f}`)
          .join("\n")}`;
      }

      if (plan.potentialIssues?.length) {
        systemPrompt += `\n\n## Watch Out For\n${plan.potentialIssues
          .map((p) => `- ${p}`)
          .join("\n")}`;
      }

      systemPrompt += `\n</implementation_plan>`;
    }

    // ──────────────────────────────────────────────
    // Stage 4.5 — Design skill selection + injection
    // ──────────────────────────────────────────────

    if (isUIGenerationRequest(workingMessage)) {
      const skillType = await step.run("select-design-skill", async () => {
        const result = await generateText({
          model: createVercelAIModel("skill-router"),
          prompt: `${SKILL_ROUTER_PROMPT} ${workingMessage}`,
        });
        try {
          const parsed = JSON.parse(result.text.trim()) as { skill: DesignSkillType };
          return parsed.skill;
        } catch {
          return "taste" as DesignSkillType;
        }
      });

      if (skillType !== "none") {
        const designGuidelines = await step.run("fetch-design-skill", async () => {
          if (skillType === "minimalist") {
            return await fetchMinimalistGuidelines();
          } else if (skillType === "taste-advanced") {
            return await fetchTasteAdvancedGuidelines();
          } else {
            return await fetchDesignGuidelines();
          }
        });

        if (designGuidelines) {
          systemPrompt += `\n\n<design_guidelines skill="${skillType}">\n${designGuidelines}\n</design_guidelines>`;
        }
      }
    }

    // ──────────────────────────────────────────────
    // Stage 5 — Manager builds (coding agent network)
    // ──────────────────────────────────────────────

    const codingAgent = createAgent({
      name: "polaris-coding-agent",
      description: "An expert AI coding assistant",
      system: systemPrompt,
      model: createAgentKitModel("manager"),
      tools: [
        createListFilesTool({ internalKey, projectId, messageId }),
        createReadFilesTool({ internalKey, messageId }),
        createUpdateFileTool({ internalKey, messageId }),
        createCreateFilesTool({ projectId, internalKey, messageId }),
        createCreateFolderTool({ projectId, internalKey, messageId }),
        createRenameFileTool({ internalKey, messageId }),
        createDeleteFilesTool({ internalKey, messageId }),
        createScrapeUrlsTool(),
      ],
    });

    const network = createNetwork({
      name: "polaris-coding-network",
      agents: [codingAgent],
      maxIter: 10,
      router: ({ network: net }) => {
        const lastResult = net.state.results.at(-1);
        if (!lastResult) {
          return codingAgent;
        }

        const hasToolCalls =
          lastResult.output.some((msg) => msg.type === "tool_call") ||
          lastResult.toolCalls.length > 0;

        return hasToolCalls ? codingAgent : undefined;
      },
    });

    let fullMessage = workingMessage;
    if (imageUrls && imageUrls.length > 0) {
      fullMessage += `\n\nReference images provided by the user:\n${imageUrls
        .map((url, i) => `${i + 1}. ${url}`)
        .join("\n")}`;
    }

    // AgentKit internally uses step.* calls — must NOT be nested inside step.run
    const networkResult = await network.run(fullMessage);

    let assistantResponse: string | null = null;
    const agentResults = networkResult.state.results ?? [];
    for (let i = agentResults.length - 1; i >= 0; i--) {
      const extractedText = extractAssistantText(agentResults[i].output);
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
        resultCount: agentResults.length,
      });
      assistantResponse = FALLBACK_AGENT_RESPONSE;
    }

    // ──────────────────────────────────────────────
    // Stage 6 — Review (skipped for simple tasks)
    // ──────────────────────────────────────────────

    if (
      plan.complexity !== "simple" &&
      assistantResponse !== FALLBACK_AGENT_RESPONSE
    ) {
      const reviewResult = (await step.run("review", () =>
        runReview(
          {
            messageId: messageId as string,
            projectId: projectId as string,
            conversationId: conversationId as string,
            userMessage: workingMessage,
            implementationSummary: assistantResponse!,
          },
          internalKey
        )
      )) as ReviewArtifact;

      if (
        reviewResult.quality === "critical_issues" &&
        reviewResult.issues.length > 0
      ) {
        assistantResponse += `\n\n---\n**Review Notes:**
${reviewResult.issues
          .map((issue) => `- ${issue}`)
          .join("\n")}`;
      }
    }

    // ──────────────────────────────────────────────
    // Stage 7 — Finalize
    // ──────────────────────────────────────────────

    const toolCallRecords: Array<{ toolName: string; label: string }> = [];
    for (const result of agentResults) {
      for (const tc of result.toolCalls) {
        const label = getToolLabel(tc.tool.name, tc.tool.input ?? {}, tc.content);
        if (label) {
          toolCallRecords.push({ toolName: tc.tool.name, label });
        }
      }
    }

    const hasFileChanges = toolCallRecords.some(
      (tc) =>
        tc.toolName === "createFiles" ||
        tc.toolName === "updateFile" ||
        tc.toolName === "renameFile"
    );

    if (hasFileChanges) {
      await step.run("trigger-build-validation", async () => {
        await inngest.send({
          name: "build/validate",
          data: {
            messageId,
            projectId,
            conversationId,
          },
        });
      });
    }

    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResponse!,
        toolCalls: toolCallRecords.length > 0 ? toolCallRecords : undefined,
      });
    });

    return { success: true, messageId, conversationId };
  }
);
