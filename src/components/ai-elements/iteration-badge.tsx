"use client";

import { Badge } from "@/components/ui/badge";
import { CameraIcon, RefreshCwIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IterationBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function IterationBadge({ className, showIcon = true }: IterationBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 bg-purple-500/10 text-purple-600 hover:bg-purple-500/20",
        className
      )}
    >
      {showIcon && <RefreshCwIcon className="size-3" />}
      <span>Iteration Mode</span>
    </Badge>
  );
}

interface PreviewCaptureBadgeProps {
  className?: string;
  showIcon?: boolean;
}

export function PreviewCaptureBadge({ className, showIcon = true }: PreviewCaptureBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
        className
      )}
    >
      {showIcon && <CameraIcon className="size-3" />}
      <span>Preview Capture</span>
    </Badge>
  );
}
