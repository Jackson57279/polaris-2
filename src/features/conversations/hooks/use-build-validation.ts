import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export const useBuildValidation = (messageId: Id<"messages"> | undefined) => {
  return useQuery(
    api.conversations.getBuildValidation,
    messageId ? { messageId } : "skip"
  );
};

export const useBuildValidationsByProject = (projectId: Id<"projects"> | undefined) => {
  return useQuery(
    api.conversations.getBuildValidationsByProject,
    projectId ? { projectId } : "skip"
  );
};
