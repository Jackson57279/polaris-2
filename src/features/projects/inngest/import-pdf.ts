import { NonRetriableError } from "inngest";
import ky from "ky";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

interface ImportPdfEvent {
  projectId: Id<"projects">;
  conversationId: Id<"conversations">;
  pdfUrl: string;
  fileName: string;
}

export const importPdf = inngest.createFunction(
  {
    id: "import-pdf",
    triggers: [{ event: "pdf/import.document" }],
    onFailure: async ({ event, step }) => {
      const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
      if (!internalKey) return;

      const { projectId } = event.data.event.data as ImportPdfEvent;

      await step.run("set-failed-status", async () => {
        await convex.mutation(api.system.updateImportStatus, {
          internalKey,
          projectId,
          status: "failed",
        });
      });
    },
  },
  async ({ event, step }) => {
    const { projectId, conversationId, pdfUrl, fileName } =
      event.data as ImportPdfEvent;

    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;
    if (!internalKey) {
      throw new NonRetriableError("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    const { text: pdfText } = await step.run("extract-pdf-text", async () => {
      const pdfBuffer = await ky.get(pdfUrl).arrayBuffer();
      const pdfParse = await import("pdf-parse").then((m: any) => m.default || m);
      const result = await pdfParse(Buffer.from(pdfBuffer));
      return { text: result.text };
    });

    const projectName = fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    const prompt = buildResumePrompt(projectName, pdfText);

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

function buildResumePrompt(projectName: string, resumeText: string): string {
  return `Create a stunning portfolio website from this resume/CV.

Resume content:
"""
${resumeText}
"""

Project name: "${projectName}"

Build a complete, professional portfolio website with the following:
- Clean, modern design that showcases the person's skills and experience
- Hero section with name and headline/summary
- About section highlighting key skills and expertise
- Experience/Work history section with timeline layout
- Projects/portfolio showcase section
- Education section
- Contact section with professional contact links
- Full responsive layout (mobile, tablet, desktop)
- Tailwind CSS for styling with a polished, cohesive design system
- index.html as the entry point, or a Next.js/React app if more appropriate
- Professional typography and spacing
- Smooth animations and hover effects where appropriate
- package.json configured with proper scripts

Make it visually impressive—this should look like a premium personal brand site that stands out.`;
}
