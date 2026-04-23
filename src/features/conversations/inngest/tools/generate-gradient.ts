import { z } from "zod";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";
import { generateGradient, GradientStyle } from "@/lib/gradient-generator";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface GenerateGradientToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
  messageId: Id<"messages">;
}

export const createGenerateGradientTool = ({
  projectId,
  internalKey,
  messageId,
}: GenerateGradientToolOptions) => {
  return createTool({
    name: "generateGradient",
    description:
      "Generate a beautiful CSS gradient (mesh, aurora, noise, or aurora-flow) and save it to the project as a CSS file. Use this as a supporting asset for hero backgrounds, section backgrounds, or atmospheric fills, then continue updating the relevant page/component files to import and use it.",
    parameters: z.object({
      colors: z
        .array(z.string())
        .min(2)
        .max(8)
        .describe("Array of hex color codes (e.g. ['#ff6b6b', '#4ecdc4', '#45b7d1']). Must have at least 2 colors."),
      style: z
        .enum(["mesh", "aurora", "noise", "aurora-flow"])
        .optional()
        .describe("Gradient style. 'mesh' = soft overlapping blobs with blur. 'aurora' = ethereal radial blend. 'noise' = mesh + subtle grain overlay. 'aurora-flow' = animated shifting gradients. Default is mesh."),
      fileName: z
        .string()
        .optional()
        .describe("Name of the CSS file to create. Default is 'gradients.css'. Can include a path like 'src/styles/gradients.css'."),
      className: z
        .string()
        .optional()
        .describe("CSS class name for the gradient. Default is 'hero-gradient'."),
    }),
    handler: async (params, { step: toolStep }) => {
      const { colors, style = "mesh", fileName = "gradients.css", className = "hero-gradient" } = params;

      return await toolStep?.run("generate-gradient", async () => {
        const result = generateGradient(colors, style as GradientStyle, className);

        const normalizedName = fileName
          .replace(/^\/+/, "")
          .replace(/\/+/g, "/")
          .replace(/\/$/, "");

        const segments = normalizedName.split("/");
        const actualFileName = segments[segments.length - 1];
        const folderSegments = segments.slice(0, -1);

        let resolvedParentId: Id<"files"> | undefined;

        const folderCache = new Map<string, Id<"files">>();

        async function ensureFolderPath(
          paths: string[],
          baseParentId: Id<"files"> | undefined
        ): Promise<Id<"files">> {
          let currentParentId = baseParentId;
          let currentPath = "";

          for (const segment of paths) {
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;
            if (folderCache.has(currentPath)) {
              currentParentId = folderCache.get(currentPath)!;
            } else {
              const folderId = await convex.mutation(api.system.createFolder, {
                internalKey,
                projectId,
                name: segment,
                parentId: currentParentId,
              });
              folderCache.set(currentPath, folderId);
              currentParentId = folderId;
            }
          }

          return currentParentId!;
        }

        if (folderSegments.length > 0) {
          resolvedParentId = await ensureFolderPath(folderSegments, undefined);
        }

        const createResults = await convex.mutation(api.system.createFiles, {
          internalKey,
          projectId,
          parentId: resolvedParentId,
          files: [{ name: actualFileName, content: result.css }],
        });

        const created = createResults.find((r) => !r.error);
        const failed = createResults.find((r) => r.error);

        if (failed) {
          return `Error creating gradient file: ${failed.error}`;
        }

        await convex.mutation(api.system.appendToolCall, {
          internalKey,
          messageId,
          toolName: "generateGradient",
          label: `Generate ${style} gradient`,
        }).catch(() => {});

        return `Created ${normalizedName} with class .${result.className}. This only adds the CSS asset, so continue by updating the relevant layout/page/component files to import and use it: <div className="${result.className}">...</div>`;
      });
    },
  });
};
