import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { inngest } from "@/inngest/client";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface CapturePreviewToolOptions {
  projectId: Id<"projects">;
  messageId: Id<"messages">;
  internalKey: string;
}

const paramsSchema = z.object({
  viewport: z
    .object({
      width: z.number().min(320).max(3840).default(1280),
      height: z.number().min(240).max(2160).default(800),
    })
    .optional()
    .default({ width: 1280, height: 800 }),
  waitForNetworkIdle: z.boolean().optional().default(true),
  delayMs: z.number().min(0).max(10000).optional().default(2000),
});

export const createCapturePreviewTool = ({
  projectId,
  messageId,
  internalKey,
}: CapturePreviewToolOptions) => {
  return createTool({
    name: "capturePreview",
    description:
      "Initiates a screenshot capture of the current website preview. Use this when the user asks you to iterate on the design, fix visual issues, or improve the UI based on what you see. The screenshot will be processed and made available for analysis. Returns a confirmation that the capture was initiated.",
    parameters: z.object({
      viewport: z
        .object({
          width: z.number().describe("Viewport width in pixels (320-3840)"),
          height: z.number().describe("Viewport height in pixels (240-2160)"),
        })
        .optional()
        .describe("Optional viewport dimensions for the screenshot"),
      waitForNetworkIdle: z
        .boolean()
        .optional()
        .describe("Wait for network to be idle before capturing (default: true)"),
      delayMs: z
        .number()
        .optional()
        .describe("Additional delay in ms after load before capturing (0-10000)"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { viewport, waitForNetworkIdle, delayMs } = parsed.data;

      try {
        // Create the preview capture record
        const previewCaptureId = await toolStep?.run("create-preview-capture", async () => {
          return await convex.mutation(api.system.createPreviewCapture, {
            internalKey,
            messageId,
            projectId,
            viewport,
          });
        });

        if (!previewCaptureId) {
          return "Error: Failed to create preview capture record";
        }

        try {
          // Trigger the screenshot capture via Inngest
          await inngest.send({
            name: "preview/capture",
            data: {
              previewCaptureId,
              messageId,
              projectId,
              viewport,
              waitForNetworkIdle,
              delayMs,
            },
          });

          // Log the tool call
          await convex.mutation(api.system.appendToolCall, {
            internalKey,
            messageId,
            toolName: "capturePreview",
            label: `Capture preview (${viewport.width}x${viewport.height})`,
          }).catch(() => {});

          return `Preview capture initiated. The screenshot will be available shortly at viewport ${viewport.width}x${viewport.height}. The image will be analyzed to help with your iteration.`;
        } catch (innerError) {
          // Mark the preview capture as failed since we already created the record
          await convex.mutation(api.system.updatePreviewCaptureStatus, {
            internalKey,
            previewCaptureId,
            status: "failed",
            error: innerError instanceof Error ? innerError.message : "Unknown error during capture initiation",
          }).catch(() => {});

          throw innerError;
        }
      } catch (error) {
        return `Error capturing preview: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    },
  });
};
