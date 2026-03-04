import type { Skill } from "../../types";
import type { Id } from "../../../../../../convex/_generated/dataModel";

import { createListFilesTool } from "./tools/list-files";
import { createReadFilesTool } from "./tools/read-files";
import { createCreateFilesTool } from "./tools/create-files";
import { createUpdateFileTool } from "./tools/update-file";
import { createDeleteFilesTool } from "./tools/delete-files";
import { createRenameFileTool } from "./tools/rename-file";
import { createCreateFolderTool } from "./tools/create-folder";

// Re-export individual tool factories for backward compatibility
export { createListFilesTool } from "./tools/list-files";
export { createReadFilesTool } from "./tools/read-files";
export { createCreateFilesTool } from "./tools/create-files";
export { createUpdateFileTool } from "./tools/update-file";
export { createDeleteFilesTool } from "./tools/delete-files";
export { createRenameFileTool } from "./tools/rename-file";
export { createCreateFolderTool } from "./tools/create-folder";

interface FileManagementContext {
  internalKey: string;
  projectId: Id<"projects">;
}

export function fileManagementSkill(context: FileManagementContext): Skill {
  const { internalKey, projectId } = context;
  return {
    name: "File Management",
    description: "Create, read, update, and delete files and folders in the project",
    category: "core",
    tools: [
      createListFilesTool({ internalKey, projectId }),
      createReadFilesTool({ internalKey }),
      createUpdateFileTool({ internalKey }),
      createCreateFilesTool({ projectId, internalKey }),
      createCreateFolderTool({ projectId, internalKey }),
      createRenameFileTool({ internalKey }),
      createDeleteFilesTool({ internalKey }),
    ],
    instructions: [
      "## File Management",
      "Use listFiles to understand the project structure before making changes.",
      "Use readFiles to understand existing code before updating.",
      "Use createFiles to create multiple files efficiently.",
      "When updating files, preserve existing functionality unless explicitly asked to change it.",
    ].join("\n"),
    metadata: { version: "1.0.0", internal: true },
  };
}
