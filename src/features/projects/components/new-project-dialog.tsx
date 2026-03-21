"use client";

import { useState } from "react";
import ky from "ky";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ImageIcon, SparklesIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";

import posthog from "posthog-js";

import { useUploadThing } from "@/lib/uploadthing";
import { Id } from "../../../../convex/_generated/dataModel";

interface NewProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function dataUrlToFile(dataUrl: string, filename: string, mimeType: string): File {
  const [header, data] = dataUrl.split(",");
  const isBase64 = header?.includes("base64") ?? false;

  if (isBase64 && data) {
    const binaryStr = atob(data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return new File([bytes], filename, { type: mimeType });
  }

  const decoded = data ? decodeURIComponent(data) : "";
  return new File([decoded], filename, { type: mimeType });
}

function AttachImageButton() {
  const attachments = usePromptInputAttachments();
  return (
    <PromptInputButton
      onClick={() => attachments.openFileDialog()}
      title="Attach image"
    >
      <ImageIcon className="size-4" />
    </PromptInputButton>
  );
}

function EnhancePromptButton({
  input,
  onEnhanced,
}: {
  input: string;
  onEnhanced: (enhanced: string) => void;
}) {
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!input.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const { enhancedPrompt } = await ky
        .post("/api/enhance-prompt", {
          json: { prompt: input.trim() },
          timeout: 30000,
        })
        .json<{ enhancedPrompt: string }>();

      onEnhanced(enhancedPrompt);
      posthog.capture("prompt_enhanced", {
        prompt_length: input.trim().length,
      });
    } catch {
      toast.error("Failed to enhance prompt");
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <PromptInputButton
      onClick={handleEnhance}
      disabled={!input.trim() || isEnhancing}
      title="Enhance prompt"
    >
      <SparklesIcon className={`size-4 ${isEnhancing ? "animate-pulse" : ""}`} />
    </PromptInputButton>
  );
}

export const NewProjectDialog = ({
  open,
  onOpenChange,
}: NewProjectDialogProps) => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { startUpload, isUploading } = useUploadThing("imageUploader");

  const isLoading = isSubmitting || isUploading;

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!message.text) return;

    setIsSubmitting(true);

    try {
      let imageUrls: string[] = [];

      const imageFiles = message.files
        .filter((f) => f.mediaType?.startsWith("image/") && f.url)
        .map((f, i) =>
          dataUrlToFile(
            f.url,
            f.filename ?? `image-${i}.png`,
            f.mediaType ?? "image/png"
          )
        );

      if (imageFiles.length > 0) {
        const uploaded = await startUpload(imageFiles);
        imageUrls = uploaded?.map((f) => f.ufsUrl) ?? [];
      }

      const { projectId } = await ky
        .post("/api/projects/create-with-prompt", {
          json: { prompt: message.text.trim(), imageUrls },
        })
        .json<{ projectId: Id<"projects"> }>();

      posthog.capture("project_created", {
        has_images: imageUrls.length > 0,
        image_count: imageUrls.length,
        project_id: projectId,
      });
      toast.success("Project created");
      onOpenChange(false);
      setInput("");
      router.push(`/projects/${projectId}`);
    } catch (error) {
      posthog.captureException(error);
      toast.error("Unable to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg p-0"
      >
        <DialogHeader className="hidden">
          <DialogTitle>What do you want to build?</DialogTitle>
          <DialogDescription>
            Describe your project and AI will help you create it.
          </DialogDescription>
        </DialogHeader>
        <PromptInput
          accept="image/*"
          multiple
          onSubmit={handleSubmit}
          className="border-none!"
        >
          <PromptInputHeader>
            <PromptInputAttachments>
              {(file) => <PromptInputAttachment key={file.id} data={file} />}
            </PromptInputAttachments>
          </PromptInputHeader>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask LuminaWeb to build..."
              onChange={(e) => setInput(e.target.value)}
              value={input}
              disabled={isLoading}
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <AttachImageButton />
              <EnhancePromptButton input={input} onEnhanced={setInput} />
            </PromptInputTools>
            <PromptInputSubmit
              disabled={!input || isLoading}
              status={isLoading ? "submitted" : undefined}
            />
          </PromptInputFooter>
        </PromptInput>
      </DialogContent>
    </Dialog>
  );
};
