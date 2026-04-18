"use client";

import { useRef, useState } from "react";
import ky, { HTTPError } from "ky";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadIcon, FileText } from "lucide-react";

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

interface ImportPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportPdfDialog = ({
  open,
  onOpenChange,
}: ImportPdfDialogProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing("pdfUploader");
  const isLoading = isSubmitting || isUploading;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".pdf")) {
      toast.error("Please select a valid PDF file");
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

      const { url: pdfUrl } = uploaded[0];

      const { projectId } = await ky
        .post("/api/pdf/import", {
          json: { pdfUrl, fileName: selectedFile.name },
        })
        .json<{ success: boolean; projectId: Id<"projects">; eventId: string }>();

      posthog.capture("pdf_import_started", {
        project_id: projectId,
        file_name: selectedFile.name,
      });
      toast.success("Building your portfolio from resume...");
      onOpenChange(false);
      setSelectedFile(null);

      router.push(`/projects/${projectId}`);
    } catch (error) {
      if (error instanceof HTTPError) {
        const body = await error.response.json<{ error: string }>();
        if (body.error?.includes("Pro plan required")) {
          toast.error("Upgrade to import PDF resumes", {
            action: {
              label: "Upgrade",
              onClick: () => router.push("/pricing"),
            },
          });
          onOpenChange(false);
          return;
        }
      }
      toast.error("Unable to import PDF file. Please try again.");
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
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Resume to Portfolio
          </DialogTitle>
          <DialogDescription>
            Upload a resume or CV PDF and the AI will build a complete
            portfolio website from it.
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
              accept=".pdf"
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
                  Click to select a PDF file
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Resume/CV PDFs up to 10MB
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
                  : "Build Portfolio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
