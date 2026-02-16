import { z } from "zod";
import { createTool } from "@inngest/agent-kit";

import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

interface CreateFilesToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

const paramsSchema = z.object({
  parentId: z.string(),
  files: z
    .array(
      z.object({
        name: z.string().min(1, "File name cannot be empty"),
        content: z.string(),
      })
    )
    .min(1, "Provide at least one file to create"),
});

export const createCreateFilesTool = ({
  projectId,
  internalKey,
}: CreateFilesToolOptions) => {
  return createTool({
    name: "createFiles",
    description:
      "Create multiple files at once. File names can include paths (e.g., 'src/index.css') - parent folders will be automatically created. More efficient than creating files one by one.",
    parameters: z.object({
      parentId: z
        .string()
        .describe(
          "The ID of the parent folder. Use empty string for root level. Must be a valid folder ID from listFiles."
        ),
      files: z
        .array(
          z.object({
            name: z.string().describe("The file name including extension, can include path like 'src/index.css'"),
            content: z.string().describe("The file content"),
          })
        )
        .describe("Array of files to create"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error: ${parsed.error.issues[0].message}`;
      }

      const { parentId, files } = parsed.data;

      try {
        return await toolStep?.run("create-files", async () => {
          let resolvedParentId: Id<"files"> | undefined;

          if (parentId && parentId !== "") {
            try {
              resolvedParentId = parentId as Id<"files">;
              const parentFolder = await convex.query(api.system.getFileById, {
                internalKey,
                fileId: resolvedParentId,
              });
              if (!parentFolder) {
                return `Error: Parent folder with ID "${parentId}" not found. Use listFiles to get valid folder IDs.`;
              }
              if (parentFolder.type !== "folder") {
                return `Error: The ID "${parentId}" is a file, not a folder. Use a folder ID as parentId.`;
              }
            } catch {
              return `Error: Invalid parentId "${parentId}". Use listFiles to get valid folder IDs, or use empty string for root level.`;
            }
          }

          const folderCache = new Map<string, Id<"files">>();

          async function ensureFolderPath(
            pathSegments: string[],
            baseParentId: Id<"files"> | undefined
          ): Promise<Id<"files">> {
            let currentParentId = baseParentId;
            let currentPath = "";

            for (const segment of pathSegments) {
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

          const transformedFiles: Array<{
            name: string;
            content: string;
            resolvedParentId: Id<"files"> | undefined;
          }> = [];

          for (const file of files) {
            const normalizedName = file.name
              .replace(/^\/+/, "")
              .replace(/\/+/g, "/")
              .replace(/\/$/, "");

            if (!normalizedName) {
              return `Error: Invalid file name "${file.name}". File name cannot be empty or just slashes.`;
            }

            const segments = normalizedName.split("/");

            if (segments.length === 1) {
              transformedFiles.push({
                name: segments[0],
                content: file.content,
                resolvedParentId,
              });
            } else {
              const folderSegments = segments.slice(0, -1);
              const fileName = segments[segments.length - 1];

              const fileFolderId = await ensureFolderPath(folderSegments, resolvedParentId);

              transformedFiles.push({
                name: fileName,
                content: file.content,
                resolvedParentId: fileFolderId,
              });
            }
          }

          const filesByParent = new Map<
            string,
            { files: Array<{ name: string; content: string }>; parentId: Id<"files"> | undefined }
          >();

          for (const tf of transformedFiles) {
            const key = tf.resolvedParentId ?? "__root__";
            if (!filesByParent.has(key)) {
              filesByParent.set(key, { files: [], parentId: tf.resolvedParentId });
            }
            filesByParent.get(key)!.files.push({ name: tf.name, content: tf.content });
          }

          let totalCreated = 0;
          let totalFailed = 0;
          const createdNames: string[] = [];
          const failedNames: string[] = [];

          for (const { files: groupFiles, parentId: groupParentId } of filesByParent.values()) {
            const results = await convex.mutation(api.system.createFiles, {
              internalKey,
              projectId,
              parentId: groupParentId,
              files: groupFiles,
            });

            const created = results.filter((r) => !r.error);
            const failed = results.filter((r) => r.error);

            totalCreated += created.length;
            totalFailed += failed.length;
            createdNames.push(...created.map((r) => r.name));
            failedNames.push(...failed.map((r) => `${r.name} (${r.error})`));
          }

          let response = `Created ${totalCreated} file(s)`;
          if (createdNames.length > 0) {
            response += `: ${createdNames.join(", ")}`;
          }
          if (totalFailed > 0) {
            response += `. Failed: ${failedNames.join(", ")}`;
          }

          return response;
        });
      } catch (error) {
        return `Error creating files: ${error instanceof Error ? error.message : "Unknown error"}`;
      }
    }
  });
};
