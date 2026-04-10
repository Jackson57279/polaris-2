"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { CameraIcon, Loader2Icon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

interface PreviewCaptureProps {
  messageId: Id<"messages">;
  className?: string;
}

export function PreviewCapture({ messageId, className }: PreviewCaptureProps) {
  const capture = useQuery(api.conversations.getPreviewCapture, { messageId });
  const [isOpen, setIsOpen] = useState(true);

  if (!capture) {
    return null;
  }

  const getStatusIcon = () => {
    switch (capture.status) {
      case "pending":
        return <Loader2Icon className="size-4 animate-spin text-muted-foreground" />;
      case "running":
        return <Loader2Icon className="size-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircleIcon className="size-4 text-green-500" />;
      case "failed":
        return <AlertCircleIcon className="size-4 text-red-500" />;
      default:
        return <CameraIcon className="size-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    switch (capture.status) {
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            Queued
          </Badge>
        );
      case "running":
        return (
          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-600">
            Capturing...
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
            Captured
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="secondary" className="text-xs bg-red-500/10 text-red-600">
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const viewportText = capture.viewport
    ? `${capture.viewport.width}×${capture.viewport.height}`
    : null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn(
        "w-full overflow-hidden rounded-lg border bg-card",
        className
      )}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-sm">Preview Capture</span>
          {getStatusBadge()}
          {viewportText && (
            <span className="text-muted-foreground text-xs">
              {viewportText}
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="p-3 pt-0">
          {capture.status === "completed" && capture.imageUrl ? (
            <div className="overflow-hidden rounded-md border">
              <img
                src={capture.imageUrl}
                alt="Preview capture"
                className="w-full h-auto max-h-[600px] object-contain bg-muted"
                loading="lazy"
              />
            </div>
          ) : capture.status === "failed" ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {capture.error || "Failed to capture preview"}
            </div>
          ) : capture.status === "running" ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              Capturing screenshot...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
              <Loader2Icon className="size-4 animate-spin" />
              Waiting in queue...
            </div>
          )}

          {capture.durationMs != null && capture.status === "completed" && (
            <div className="mt-2 text-muted-foreground text-xs">
              Captured in {(capture.durationMs / 1000).toFixed(1)}s
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
