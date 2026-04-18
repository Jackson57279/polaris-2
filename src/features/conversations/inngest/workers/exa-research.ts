import { generateText } from "ai";
import { NonRetriableError } from "inngest";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { createVercelAIModel } from "@/lib/ai-models";
import { getExaClient } from "@/lib/exa-client";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { EXA_RESEARCH_PROMPT } from "../constants";
import type { ExaResearchInput, ResearchArtifact } from "./types";
import { extractJSONFromMarkdown } from "@/lib/utils";

const MAX_RESULTS_PER_QUERY = 3;
const MAX_CONTENT_LENGTH = 2000;

export async function runExaResearch(
  data: ExaResearchInput,
  internalKey: string
): Promise<ResearchArtifact> {
  const exa = getExaClient();

  let artifact: ResearchArtifact;

  if (!exa || data.searchQueries.length === 0) {
    artifact = { summary: "No external research performed.", citations: [] };
  } else {
    const allResults: { url: string; title: string; text: string }[] = [];

    for (const query of data.searchQueries.slice(0, 3)) {
      try {
        const response = await exa.searchAndContents(query, {
          type: "neural",
          numResults: MAX_RESULTS_PER_QUERY,
          text: true,
        });

        for (const result of response.results) {
          allResults.push({
            url: result.url,
            title: result.title ?? query,
            text: (result.text ?? "").slice(0, MAX_CONTENT_LENGTH),
          });
        }
      } catch {
        // Individual query failure is non-fatal
      }
    }

    if (allResults.length === 0) {
      artifact = { summary: "External search returned no results.", citations: [] };
    } else {
      const searchContext = allResults
        .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.text}`)
        .join("\n\n---\n\n");

      const result = await generateText({
        model: createVercelAIModel("research"),
        prompt: `${EXA_RESEARCH_PROMPT}

User request: "${data.userMessage}"
Search queries used: ${data.searchQueries.join(", ")}

Search results:
${searchContext}`,
      });

      try {
        const cleaned = extractJSONFromMarkdown(result.text);
        artifact = JSON.parse(cleaned) as ResearchArtifact;
      } catch {
        artifact = {
          summary: result.text,
          citations: allResults.map((r) => ({ url: r.url, title: r.title, content: r.text })),
        };
      }
    }
  }

  await convex.mutation(api.system.createRunArtifact, {
    internalKey,
    messageId: data.messageId as Id<"messages">,
    workerType: "exa_research" as const,
    status: "completed" as const,
    summary: artifact.summary,
    payload: JSON.stringify(artifact),
  });

  return artifact;
}

export const exaResearchWorker = inngest.createFunction(
  { id: "exa-research-worker", triggers: [{ event: "worker/exa-research" }] },
  async ({ event, step }) => {
    const data = event.data as ExaResearchInput;
    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    return await step.run("search-analyze-save", () =>
      runExaResearch(data, internalKey)
    );
  }
);
