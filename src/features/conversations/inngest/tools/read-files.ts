import { z } from "zod";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { buildFilePathMap } from "./file-paths";

interface ReadFilesToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
  messageId: Id<"messages">;
}

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "Provide at least one file ID"),
});

export const createReadFilesTool = ({
  projectId,
  internalKey,
  messageId,
}: ReadFilesToolOptions) => {
  return createTool({
    name: "readFiles",
    description: "Read the content of files from the project. Returns file contents.",
    parameters: z.object({
      fileIds: z.array(z.string()).describe("Array of file IDs to read"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { fileIds } = parsed.data;

      try {
        return await toolStep?.run("read-files", async () => {
          const uniqueFileIds = [...new Set(fileIds)] as Id<"files">[];
          const projectFiles = await convex.query(api.system.getProjectFiles, {
            internalKey,
            projectId,
          });
          const pathById = buildFilePathMap(projectFiles);

          const results = projectFiles
            .filter(
              (file) =>
                uniqueFileIds.includes(file._id) &&
                file.type === "file" &&
                typeof file.content === "string"
            )
            .map((file) => ({
              id: file._id,
              name: file.name,
              path: pathById.get(file._id) ?? file.name,
              content: file.content,
            }));

          if (results.length === 0) {
            return "Error: No files found with provided IDs. Use listFiles to get valid fileIDs.";
          }

          const fileNames = results.map((r) => r.path);
          await convex.mutation(api.system.appendToolCall, {
            internalKey,
            messageId,
            toolName: "readFiles",
            label: `Read ${fileNames.join(", ")}`,
          }).catch(() => {});

          return JSON.stringify(results);
        });
      } catch (error) {
        return `Error reading files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }
  });
};
