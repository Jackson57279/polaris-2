import { NonRetriableError } from "inngest";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

interface ImportFigmaEvent {
  projectId: Id<"projects">;
  conversationId: Id<"conversations">;
  figFileUrl: string;
  fileName: string;
}

export const importFigma = inngest.createFunction(
  {
    id: "import-figma",
    onFailure: async ({ event, step }) => {
      const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
      if (!internalKey) return;

      const { projectId } = event.data.event.data as ImportFigmaEvent;

      await step.run("set-failed-status", async () => {
        await convex.mutation(api.system.updateImportStatus, {
          internalKey,
          projectId,
          status: "failed",
        });
      });
    },
  },
  { event: "figma/import.fig" },
  async ({ event, step }) => {
    const { projectId, conversationId, fileName } =
      event.data as ImportFigmaEvent;

    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    const projectName = fileName.replace(/\.fig$/i, "").replace(/[-_]/g, " ");
    const prompt = buildDesignPrompt(projectName, fileName);

    const assistantMessageId = await step.run("create-messages", async () => {
      await convex.mutation(api.system.createMessage, {
        internalKey,
        conversationId,
        projectId,
        role: "user",
        content: prompt,
      });

      return await convex.mutation(api.system.createMessage, {
        internalKey,
        conversationId,
        projectId,
        role: "assistant",
        content: "",
        status: "processing",
      });
    });

    await step.sendEvent("trigger-agent", {
      name: "message/sent",
      data: {
        messageId: assistantMessageId,
        conversationId,
        projectId,
        message: prompt,
        imageUrls: [],
      },
    });

    await step.run("set-completed-status", async () => {
      await convex.mutation(api.system.updateImportStatus, {
        internalKey,
        projectId,
        status: "completed",
      });
    });

    return { success: true, projectId, conversationId };
  }
);

function buildDesignPrompt(projectName: string, fileName: string): string {
  return `Build a complete, beautiful, responsive website from this Figma design file.

Design file: "${fileName}"
Project name: "${projectName}"

Create a production-ready project with the following:
- A visually stunning, modern UI inspired by the design name "${projectName}"
- Full responsive layout (mobile, tablet, desktop)
- Clean component structure with semantic HTML
- Tailwind CSS for styling with a polished design system (consistent colors, spacing, typography)
- index.html as the entry point, or a Next.js/React app if more appropriate
- All pages and sections implied by the design name
- Professional header, navigation, hero section, main content, and footer
- Smooth micro-interactions and hover states where appropriate
- package.json configured with proper scripts

Make it visually impressive—this should look like a real, polished product.`;
}
