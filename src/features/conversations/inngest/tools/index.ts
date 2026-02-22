// Strongly-typed ToolOptions for Inngest tool factories
export interface ToolOptions {
  internalKey: string;
  projectId: Id<"projects">;
}
import { createListFilesTool } from './list-files';
import { createReadFilesTool } from './read-files';
import { createCreateFilesTool } from './create-files';
import { createCreateFolderTool } from './create-folder';
import { createUpdateFileTool } from './update-file';
import { createRenameFileTool } from './rename-file';
import { createDeleteFilesTool } from './delete-files';
import { createScrapeUrlsTool } from './scrape-urls';
import { Id } from "../../../../../convex/_generated/dataModel";

// ToolOptions is exported above; no re-exports needed

export const createReadOnlyTools = (opts: ToolOptions) => [
  createScrapeUrlsTool(),
];

export const createPlanningTools = (opts: ToolOptions) => [
  createListFilesTool(opts),
  createReadFilesTool(opts),
  createScrapeUrlsTool(),
  createCreateFilesTool(opts),
];

export const createDebuggingTools = (opts: ToolOptions) => [
  createListFilesTool(opts),
  createReadFilesTool(opts),
  createScrapeUrlsTool(),
  createCreateFilesTool(opts),
  createUpdateFileTool(opts),
  createDeleteFilesTool(opts),
];

export const createFullTools = (opts: ToolOptions) => [
  createListFilesTool(opts),
  createReadFilesTool(opts),
  createCreateFilesTool(opts),
  createUpdateFileTool(opts),
  createDeleteFilesTool(opts),
  createRenameFileTool(opts),
  createCreateFolderTool(opts),
  createScrapeUrlsTool(),
];
