"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RefreshCw, Clock, Zap } from "lucide-react";
import { useState, createContext, useContext, type ReactNode } from "react";

// ============================================================================
// Iteration Mode Context
// ============================================================================

interface IterationModeContextType {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  language: "javascript" | "typescript" | "python";
  setLanguage: (language: "javascript" | "typescript" | "python") => void;
  testCommand: string;
  setTestCommand: (command: string) => void;
}

const IterationModeContext = createContext<IterationModeContextType | null>(null);

export function useIterationMode() {
  const context = useContext(IterationModeContext);
  if (!context) {
    throw new Error(
      "useIterationMode must be used within IterationModeProvider"
    );
  }
  return context;
}

export function useOptionalIterationMode() {
  return useContext(IterationModeContext);
}

// ============================================================================
// Provider Component
// ============================================================================

interface IterationModeProviderProps {
  children: ReactNode;
  defaultEnabled?: boolean;
  defaultLanguage?: "javascript" | "typescript" | "python";
}

export function IterationModeProvider({
  children,
  defaultEnabled = false,
  defaultLanguage = "typescript",
}: IterationModeProviderProps) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [language, setLanguage] = useState<"javascript" | "typescript" | "python">(defaultLanguage);
  const [testCommand, setTestCommand] = useState("");

  return (
    <IterationModeContext.Provider
      value={{
        enabled,
        setEnabled,
        language,
        setLanguage,
        testCommand,
        setTestCommand,
      }}
    >
      {children}
    </IterationModeContext.Provider>
  );
}

// ============================================================================
// Toggle Button Component
// ============================================================================

interface IterationModeToggleProps {
  className?: string;
  variant?: "default" | "compact";
}

export function IterationModeToggle({
  className,
  variant = "default",
}: IterationModeToggleProps) {
  const context = useOptionalIterationMode();

  if (!context) {
    return null;
  }

  const { enabled, setEnabled, language } = context;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={enabled ? "default" : "ghost"}
            size={variant === "compact" ? "icon-sm" : "sm"}
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "gap-2 transition-all duration-200",
              enabled && "bg-amber-600 hover:bg-amber-700 text-white",
              !enabled && "text-muted-foreground hover:text-foreground",
              className
            )}
          >
            <RefreshCw
              className={cn(
                "size-4",
                enabled && "animate-spin-slow"
              )}
            />
            {variant === "default" && (
              <span className="hidden sm:inline">
                {enabled ? "Iteration Mode On" : "I don't care about time"}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">
              {enabled ? "Iteration Mode Enabled" : "Enable Iteration Mode"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? `Using GLM-5.1 to iteratively refine ${language} code in E2B sandbox. May take 5-15 minutes.`
                : "Click to enable deep iteration mode. The AI will iteratively write, test, and fix code until it works correctly."}
            </p>
            {enabled && (
              <div className="flex items-center gap-2 text-xs text-amber-500">
                <Clock className="size-3" />
                <span>Slower but more thorough</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============================================================================
// Language Selector Component
// ============================================================================

interface IterationModeLanguageSelectProps {
  className?: string;
}

export function IterationModeLanguageSelect({
  className,
}: IterationModeLanguageSelectProps) {
  const context = useOptionalIterationMode();

  if (!context || !context.enabled) {
    return null;
  }

  const { language, setLanguage } = context;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        type="button"
        variant={language === "typescript" ? "secondary" : "ghost"}
        size="icon-xs"
        onClick={() => setLanguage("typescript")}
        className="h-6 w-6 text-xs"
        title="TypeScript"
      >
        TS
      </Button>
      <Button
        type="button"
        variant={language === "javascript" ? "secondary" : "ghost"}
        size="icon-xs"
        onClick={() => setLanguage("javascript")}
        className="h-6 w-6 text-xs"
        title="JavaScript"
      >
        JS
      </Button>
      <Button
        type="button"
        variant={language === "python" ? "secondary" : "ghost"}
        size="icon-xs"
        onClick={() => setLanguage("python")}
        className="h-6 w-6 text-xs"
        title="Python"
      >
        PY
      </Button>
    </div>
  );
}

// ============================================================================
// Status Badge Component
// ============================================================================

interface IterationModeBadgeProps {
  status?: "running" | "completed" | "failed";
  currentIteration?: number;
  maxIterations?: number;
  className?: string;
}

export function IterationModeBadge({
  status = "running",
  currentIteration = 0,
  maxIterations = 10,
  className,
}: IterationModeBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
        status === "running" && "bg-amber-500/10 text-amber-600 border border-amber-500/20",
        status === "completed" && "bg-green-500/10 text-green-600 border border-green-500/20",
        status === "failed" && "bg-red-500/10 text-red-600 border border-red-500/20",
        className
      )}
    >
      <RefreshCw
        className={cn(
          "size-3",
          status === "running" && "animate-spin"
        )}
      />
      <span>
        {status === "running" && currentIteration > 0
          ? `Iteration ${currentIteration}/${maxIterations}`
          : status === "running"
          ? "Starting..."
          : status === "completed"
          ? "Completed"
          : "Failed"}
      </span>
    </div>
  );
}

// ============================================================================
// Quick Toggle Component (for use in compact UIs)
// ============================================================================

interface IterationModeQuickToggleProps {
  className?: string;
}

export function IterationModeQuickToggle({
  className,
}: IterationModeQuickToggleProps) {
  const context = useOptionalIterationMode();

  if (!context) {
    return null;
  }

  const { enabled, setEnabled } = context;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setEnabled(!enabled)}
            className={cn(
              "transition-colors",
              enabled && "text-amber-600 hover:text-amber-700",
              !enabled && "text-muted-foreground",
              className
            )}
          >
            {enabled ? (
              <Zap className="size-4 fill-amber-500 text-amber-500" />
            ) : (
              <Zap className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{enabled ? "Iteration mode on (GLM-5.1 + E2B)" : "Enable iteration mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
