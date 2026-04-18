"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Terminal,
  Code2,
  Lightbulb,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface Iteration {
  iterationNumber: number;
  code: string;
  executionResult: {
    stdout: string;
    stderr: string;
    exitCode: number;
    error: {
      name: string;
      value: string;
      traceback: string;
    } | null;
    executionTimeMs: number;
  };
  reasoning?: string;
  timestamp: number;
}

interface IterationData {
  iterations: Iteration[];
  sandboxId?: string;
  finalOutput?: string;
  status: "running" | "completed" | "failed";
  maxIterations?: number;
  currentIteration?: number;
  language?: "javascript" | "typescript" | "python";
}

interface IterationDisplayProps {
  data: IterationData;
  className?: string;
}

// ============================================================================
// Main Display Component
// ============================================================================

export function IterationDisplay({ data, className }: IterationDisplayProps) {
  const [expandedIteration, setExpandedIteration] = useState<number | null>(
    data.iterations.length > 0 ? data.iterations[data.iterations.length - 1].iterationNumber : null
  );

  const { iterations, status, maxIterations = 10, language = "typescript" } = data;
  const currentIteration = data.currentIteration ?? iterations.length;

  return (
    <Card className={cn("border-amber-500/20 bg-amber-500/5", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                status === "running" && "bg-amber-500/20 text-amber-600",
                status === "completed" && "bg-green-500/20 text-green-600",
                status === "failed" && "bg-red-500/20 text-red-600"
              )}
            >
              {status === "running" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : status === "completed" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Iteration Mode {status === "running" ? "Running" : status}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                GLM-5.1 iteratively refining {language} code in E2B sandbox
              </p>
            </div>
          </div>
          <Badge
            variant={
              status === "running"
                ? "default"
                : status === "completed"
                ? "secondary"
                : "destructive"
            }
            className={cn(
              status === "running" && "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {status === "running"
              ? `Iteration ${currentIteration}/${maxIterations}`
              : status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round((currentIteration / maxIterations) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                status === "running" && "bg-amber-500",
                status === "completed" && "bg-green-500",
                status === "failed" && "bg-red-500"
              )}
              style={{ width: `${(currentIteration / maxIterations) * 100}%` }}
            />
          </div>
        </div>

        {/* Iterations List */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground">
            Iteration History
          </h4>
          <ScrollArea className="h-[300px] rounded-md border">
            <div className="space-y-1 p-2">
              {iterations.map((iteration) => (
                <IterationItem
                  key={iteration.iterationNumber}
                  iteration={iteration}
                  isExpanded={expandedIteration === iteration.iterationNumber}
                  onToggle={() =>
                    setExpandedIteration(
                      expandedIteration === iteration.iterationNumber
                        ? null
                        : iteration.iterationNumber
                    )
                  }
                  language={language}
                />
              ))}

              {status === "running" && iterations.length < currentIteration && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                  <span className="text-xs text-muted-foreground">
                    Iteration {currentIteration} in progress...
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Final Output */}
        {data.finalOutput && status === "completed" && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">
              Final Working Code
            </h4>
            <div className="relative rounded-md border bg-muted/30">
              <pre className="max-h-[200px] overflow-auto p-3 text-xs">
                <code>{data.finalOutput}</code>
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Iteration Item Component
// ============================================================================

interface IterationItemProps {
  iteration: Iteration;
  isExpanded: boolean;
  onToggle: () => void;
  language: string;
}

function IterationItem({
  iteration,
  isExpanded,
  onToggle,
  language,
}: IterationItemProps) {
  const { iterationNumber, code, executionResult, reasoning, timestamp } = iteration;
  const success = executionResult.exitCode === 0 && !executionResult.error;

  return (
    <div
      className={cn(
        "rounded-md border transition-colors",
        success ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5",
        isExpanded && "ring-1 ring-amber-500/20"
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className="flex h-auto w-full items-center justify-between p-2 font-normal hover:bg-transparent"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium",
              success
                ? "bg-green-500/20 text-green-600"
                : "bg-red-500/20 text-red-600"
            )}
          >
            {success ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
          </div>
          <span className="text-xs font-medium">Iteration {iterationNumber}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              success
                ? "border-green-500/30 text-green-600"
                : "border-red-500/30 text-red-600"
            )}
          >
            Exit {executionResult.exitCode}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </Button>

      {isExpanded && (
        <div className="border-t px-2 py-3">
          <div className="space-y-3">
            {/* Code Section */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Code2 className="h-3 w-3" />
                <span>Generated Code</span>
              </div>
              <div className="relative rounded-md bg-muted">
                <pre className="max-h-[150px] overflow-auto p-2 text-xs">
                  <code>{code}</code>
                </pre>
              </div>
            </div>

            {/* Execution Output */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Terminal className="h-3 w-3" />
                <span>Execution Output</span>
                <span className="ml-auto">
                  {executionResult.executionTimeMs}ms
                </span>
              </div>
              <div className="rounded-md bg-black/90 p-2 font-mono text-xs">
                {executionResult.stdout && (
                  <div className="text-green-400">
                    <span className="text-muted-foreground">stdout:</span>
                    <pre className="mt-1 whitespace-pre-wrap">{executionResult.stdout}</pre>
                  </div>
                )}
                {executionResult.stderr && (
                  <div className="mt-2 text-red-400">
                    <span className="text-muted-foreground">stderr:</span>
                    <pre className="mt-1 whitespace-pre-wrap">{executionResult.stderr}</pre>
                  </div>
                )}
                {executionResult.error && (
                  <div className="mt-2 text-red-400">
                    <span className="text-muted-foreground">error:</span>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {executionResult.error.name}: {executionResult.error.value}
                      {"\n"}
                      {executionResult.error.traceback}
                    </pre>
                  </div>
                )}
                {!executionResult.stdout && !executionResult.stderr && !executionResult.error && (
                  <span className="text-muted-foreground">No output</span>
                )}
              </div>
            </div>

            {/* Reasoning Section */}
            {reasoning && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lightbulb className="h-3 w-3" />
                  <span>AI Reasoning</span>
                </div>
                <div className="rounded-md border bg-amber-500/5 p-2 text-xs">
                  <p className="whitespace-pre-wrap text-amber-700">{reasoning}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Compact Badge (for use in message lists)
// ============================================================================

interface IterationBadgeProps {
  data: IterationData;
  className?: string;
}

export function IterationBadge({ data, className }: IterationBadgeProps) {
  const { status, currentIteration = 0, maxIterations = 10 } = data;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs",
        status === "running" && "bg-amber-500/10 text-amber-600",
        status === "completed" && "bg-green-500/10 text-green-600",
        status === "failed" && "bg-red-500/10 text-red-600",
        className
      )}
    >
      {status === "running" ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : status === "completed" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      <span>
        {status === "running"
          ? `Iteration ${currentIteration}/${maxIterations}`
          : `Iteration ${status}`}
      </span>
    </div>
  );
}

// ============================================================================
// Skeleton Loading State
// ============================================================================

export function IterationDisplaySkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("border-amber-500/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          <div className="space-y-1">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="h-10 animate-pulse rounded-md bg-muted" />
          <div className="h-10 animate-pulse rounded-md bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}
