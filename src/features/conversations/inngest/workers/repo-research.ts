import { generateText } from "ai";
import { NonRetriableError } from "inngest";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { createVercelAIModel } from "@/lib/ai-models";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { REPO_RESEARCH_PROMPT } from "../constants";
import type { RepoResearchInput, ResearchArtifact } from "./types";

const MAX_KEY_FILES = 8;
const MAX_FILE_CONTENT_LENGTH = 3000;

function isKeyFile(name: string): boolean {
  return (
    name === "package.json" ||
    name === "tsconfig.json" ||
    name.endsWith(".config.ts") ||
    name.endsWith(".config.js") ||
    name.endsWith(".config.mjs") ||
    name === ".env.example" ||
    name === "README.md"
  );
}

export async function runRepoResearch(
  data: RepoResearchInput,
  internalKey: string
): Promise<ResearchArtifact> {
  const files = await convex.query(api.system.getProjectFiles, {
    internalKey,
    projectId: data.projectId as Id<"projects">,
  });

  const folders = files.filter((f) => f.type === "folder");
  const fileEntries = files.filter((f) => f.type === "file");

  const fileTree = [
    ...folders.map((f) => `[dir]  ${f.name}`),
    ...fileEntries.map((f) => `[file] ${f.name}`),
  ].join("\n");

  const keyFiles = fileEntries.filter((f) => isKeyFile(f.name));
  const keyFileContents: { name: string; content: string }[] = [];

  for (const file of keyFiles.slice(0, MAX_KEY_FILES)) {
    const full = await convex.query(api.system.getFileById, {
      internalKey,
      fileId: file._id,
    });
    if (full?.content) {
      keyFileContents.push({
        name: full.name,
        content: full.content.slice(0, MAX_FILE_CONTENT_LENGTH),
      });
    }
  }

  const result = await generateText({
    model: createVercelAIModel("research"),
    prompt: `${REPO_RESEARCH_PROMPT}

User request: "${data.userMessage}"
Focus areas: ${data.focusAreas.join(", ") || "general"}

Project files:
${fileTree}

Key file contents:
${keyFileContents.map((f) => `--- ${f.name} ---\n${f.content}`).join("\n\n")}`,
  });

  let artifact: ResearchArtifact;
  try {
    artifact = JSON.parse(result.text) as ResearchArtifact;
  } catch {
    artifact = { summary: result.text, relevantFiles: [] };
  }

  await convex.mutation(api.system.createRunArtifact, {
    internalKey,
    messageId: data.messageId as Id<"messages">,
    workerType: "repo_research" as const,
    status: "completed" as const,
    summary: artifact.summary,
    payload: JSON.stringify(artifact),
  });

  return artifact;
}

export const repoResearchWorker = inngest.createFunction(
  { id: "repo-research-worker" },
  { event: "worker/repo-research" },
  async ({ event, step }) => {
    const data = event.data as RepoResearchInput;
    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    return await step.run("analyze-save", () =>
      runRepoResearch(data, internalKey)
    );
  }
);
