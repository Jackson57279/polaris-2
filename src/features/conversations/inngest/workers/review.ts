import { generateText } from "ai";
import { NonRetriableError } from "inngest";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { createVercelAIModel } from "@/lib/ai-models";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { REVIEW_PROMPT } from "../constants";
import type { ReviewInput, ReviewArtifact } from "./types";

const MAX_FILES_TO_REVIEW = 10;
const MAX_FILE_CONTENT_LENGTH = 4000;

export const reviewWorker = inngest.createFunction(
  { id: "review-worker" },
  { event: "worker/review" },
  async ({ event, step }) => {
    const data = event.data as ReviewInput;
    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    const artifact: ReviewArtifact = await step.run(
      "review-implementation",
      async () => {
        const files = await convex.query(api.system.getProjectFiles, {
          internalKey,
          projectId: data.projectId as Id<"projects">,
        });

        const sourceFiles = files.filter(
          (f) =>
            f.type === "file" &&
            !f.name.startsWith(".") &&
            !f.name.includes("node_modules") &&
            (f.name.endsWith(".ts") ||
              f.name.endsWith(".tsx") ||
              f.name.endsWith(".js") ||
              f.name.endsWith(".jsx") ||
              f.name.endsWith(".css") ||
              f.name.endsWith(".json"))
        );

        const filesToReview = sourceFiles.slice(0, MAX_FILES_TO_REVIEW);
        const fileContents: { name: string; content: string }[] = [];

        for (const file of filesToReview) {
          const full = await convex.query(api.system.getFileById, {
            internalKey,
            fileId: file._id,
          });
          if (full?.content) {
            fileContents.push({
              name: full.name,
              content: full.content.slice(0, MAX_FILE_CONTENT_LENGTH),
            });
          }
        }

        const result = await generateText({
          model: createVercelAIModel("review"),
          prompt: `${REVIEW_PROMPT}

User request: "${data.userMessage}"

Implementation summary from the coding agent:
${data.implementationSummary}

Current project files:
${fileContents.map((f) => `--- ${f.name} ---\n${f.content}`).join("\n\n")}`,
        });

        try {
          return JSON.parse(result.text) as ReviewArtifact;
        } catch {
          return {
            issues: [],
            suggestions: [result.text],
            quality: "good" as const,
          } satisfies ReviewArtifact;
        }
      }
    );

    await step.run("save-artifact", async () => {
      await convex.mutation(api.system.createRunArtifact, {
        internalKey,
        messageId: data.messageId as Id<"messages">,
        workerType: "review" as const,
        status: "completed" as const,
        summary:
          artifact.quality === "good"
            ? "Review passed"
            : `Review: ${artifact.issues.length} issue(s) found`,
        payload: JSON.stringify(artifact),
      });
    });

    return artifact;
  }
);
