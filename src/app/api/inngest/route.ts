import { serve } from "inngest/next";

import { inngest } from "@/inngest/client";
import { processMessage } from "@/features/conversations/inngest/process-message";
import { importGithubRepo } from "@/features/projects/inngest/import-github-repo";
import { exportToGithub } from "@/features/projects/inngest/export-to-github";
import { importFigma } from "@/features/projects/inngest/import-figma";
import { importPdf } from "@/features/projects/inngest/import-pdf";
import { repoResearchWorker } from "@/features/conversations/inngest/workers/repo-research";
import { exaResearchWorker } from "@/features/conversations/inngest/workers/exa-research";
import { reviewWorker } from "@/features/conversations/inngest/workers/review";
import { validateBuild } from "@/features/conversations/inngest/validate-build";

export const maxDuration = 300;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processMessage,
    importGithubRepo,
    exportToGithub,
    importFigma,
    importPdf,
    repoResearchWorker,
    exaResearchWorker,
    reviewWorker,
    validateBuild,
  ],
});
