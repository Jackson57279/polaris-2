import { Id } from "../../../../../convex/_generated/dataModel";

type ProjectFileRecord = {
  _id: Id<"files">;
  name: string;
  type: "file" | "folder";
  parentId?: Id<"files">;
};

export function buildFilePathMap(files: ProjectFileRecord[]) {
  const byId = new Map(files.map((file) => [file._id, file]));
  const pathById = new Map<Id<"files">, string>();

  const resolvePath = (fileId: Id<"files">): string => {
    const cached = pathById.get(fileId);
    if (cached) {
      return cached;
    }

    const file = byId.get(fileId);
    if (!file) {
      return "";
    }

    const parentPath = file.parentId ? resolvePath(file.parentId) : "";
    const path = parentPath ? `${parentPath}/${file.name}` : file.name;
    pathById.set(fileId, path);
    return path;
  };

  for (const file of files) {
    resolvePath(file._id);
  }

  return pathById;
}
