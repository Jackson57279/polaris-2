"use client";

import { useRef, useState } from "react";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import posthog from "posthog-js";

import { useUploadThing } from "@/lib/uploadthing";

import { Id } from "../../../../convex/_generated/dataModel";

interface ImportFigmaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportFigmaDialog = ({
  open,
  onOpenChange,
}: ImportFigmaDialogProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing("figUploader");
  const isLoading = isSubmitting || isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".fig")) {
      toast.error("Please select a valid Figma (.fig) file");
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);

    try {
      const uploaded = await startUpload([selectedFile]);
      if (!uploaded?.[0]) {
        toast.error("Upload failed. Please try again.");
        return;
      }

      const { url: figFileUrl } = uploaded[0];

      const { projectId } = await ky
        .post("/api/figma/import", {
          json: { figFileUrl, fileName: selectedFile.name },
        })
        .json<{ success: boolean; projectId: Id<"projects">; eventId: string }>();

      posthog.capture("figma_import_started", {
        project_id: projectId,
        file_name: selectedFile.name,
      });
      toast.success("Building your website from Figma design...");
      onOpenChange(false);
      setSelectedFile(null);

      router.push(`/projects/${projectId}`);
    } catch (error) {
      if (error instanceof HTTPError) {
        const body = await error.response.json<{ error: string }>();
        if (body.error?.includes("Pro plan required")) {
          toast.error("Upgrade to import Figma designs", {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/pricing"),
            },
          });
          onOpenChange(false);
          return;
        }
      }
      toast.error("Unable to import Figma file. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from Figma</DialogTitle>
          <DialogDescription>
            Upload a Figma design file (.fig) and the AI will build a complete
            website from it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".fig"
              className="hidden"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <UploadIcon className="size-8 mx-auto mb-3 text-muted-foreground" />
            {selectedFile ? (
              <div>
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium">
                  Click to select a .fig file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Figma design files up to 50MB
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || isLoading}>
              {isUploading
                ? "Uploading..."
                : isSubmitting
                  ? "Building..."
                  : "Build Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
