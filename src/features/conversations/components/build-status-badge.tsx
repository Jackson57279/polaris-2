"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TerminalIcon,
} from "lucide-react";

import { Doc } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BuildValidation = Doc<"build_validations">;

interface BuildStatusBadgeProps {
  buildValidation: BuildValidation | undefined;
  className?: string;
}

export const BuildStatusBadge = ({
  buildValidation,
  className,
}: BuildStatusBadgeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!buildValidation) {
    return null;
  }

  const { status, output, errorOutput, durationMs, command } = buildValidation;

  const getStatusConfig = () => {
    switch (status) {
      case "pending":
        return {
          icon: Loader2Icon,
          text: "Build pending",
          className: "bg-muted text-muted-foreground",
          iconClassName: "animate-spin",
        };
      case "running":
        return {
          icon: Loader2Icon,
          text: "Building...",
          className: "bg-blue-500/10 text-blue-600",
          iconClassName: "animate-spin",
        };
      case "passed":
        return {
          icon: CheckCircleIcon,
          text: durationMs
            ? `Build passed (${(durationMs / 1000).toFixed(1)}s)`
            : "Build passed",
          className: "bg-green-500/10 text-green-600",
          iconClassName: "",
        };
      case "failed":
        return {
          icon: XCircleIcon,
          text: "Build failed",
          className: "bg-red-500/10 text-red-600",
          iconClassName: "",
        };
      case "skipped":
        return {
          icon: AlertCircleIcon,
          text: "Build skipped",
          className: "bg-muted text-muted-foreground",
          iconClassName: "",
        };
      default:
        return {
          icon: AlertCircleIcon,
          text: "Unknown status",
          className: "bg-muted text-muted-foreground",
          iconClassName: "",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const hasOutput = output || errorOutput;
  const canExpand = status === "failed" || status === "passed";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            config.className
          )}
        >
          <Icon className={cn("w-3.5 h-3.5", config.iconClassName)} />
          {config.text}
        </div>

        {canExpand && hasOutput && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <TerminalIcon className="w-3 h-3 mr-1" />
            {isExpanded ? "Hide" : "View"}
            {isExpanded ? (
              <ChevronUpIcon className="w-3 h-3 ml-1" />
            ) : (
              <ChevronDownIcon className="w-3 h-3 ml-1" />
            )}
          </Button>
        )}
      </div>

      {isExpanded && hasOutput && (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-sidebar border-r border-border flex items-center justify-center">
            <TerminalIcon className="w-4 h-4 text-muted-foreground" />
          </div>
          <pre className="ml-8 bg-sidebar rounded-md p-3 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap break-all">
            {errorOutput && (
              <span className="text-red-500">{errorOutput}</span>
            )}
            {output}
          </pre>
          {command && (
            <div className="ml-8 mt-1 text-xs text-muted-foreground">
              Command: <code>{command}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
