"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  LoaderIcon,
  RocketIcon,
  XCircleIcon,
} from "lucide-react";
import { SiVercel, SiNetlify } from "react-icons/si";
import { toast } from "sonner";
import posthog from "posthog-js";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { DEFAULT_CONVERSATION_TITLE } from "@/features/conversations/constants";
import {
  useConversations,
  useCreateConversation,
} from "@/features/conversations/hooks/use-conversations";

import { useProject } from "../hooks/use-projects";
import { useDeploy, DeployProvider } from "../hooks/use-deploy";
import { Id } from "../../../../convex/_generated/dataModel";

const PROVIDER_LABEL: Record<DeployProvider, string> = {
  vercel: "Vercel",
  netlify: "Netlify",
};

const TOKEN_STORAGE_KEY = (provider: DeployProvider) =>
  `polaris-deploy-token-${provider}`;

const DEPLOY_ID_STORAGE_KEY = (projectId: string, provider: DeployProvider) =>
  `polaris-deploy-id-${projectId}-${provider}`;

interface DeployPopoverProps {
  projectId: Id<"projects">;
}

export const DeployPopover = ({ projectId }: DeployPopoverProps) => {
  const project = useProject(projectId);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<DeployProvider>("vercel");
  const [token, setToken] = useState("");
  const [isSendingToChat, setIsSendingToChat] = useState(false);

  const { status, log, error, deployedUrl, providerDeployId, deploy, reset } =
    useDeploy();
  const conversations = useConversations(projectId);
  const createConversation = useCreateConversation();

  const persistedStatus = project?.deploymentStatus;
  const persistedUrl = project?.deploymentUrl;
  const persistedProvider = project?.deploymentProvider;
  const persistedError = project?.deploymentError;

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY(provider));
      setToken(stored ?? "");
    }
  }, [open, provider]);

  const handleDeploy = async () => {
    if (!token.trim()) return;

    localStorage.setItem(TOKEN_STORAGE_KEY(provider), token.trim());

    const existingDeployId =
      localStorage.getItem(DEPLOY_ID_STORAGE_KEY(projectId, provider)) ??
      undefined;

    posthog.capture("deploy_initiated", {
      provider,
      project_id: projectId,
      is_redeploy: !!existingDeployId,
    });

    await deploy({
      projectId,
      provider,
      token: token.trim(),
      settings: {
        installCommand: project?.settings?.installCommand,
        buildCommand: project?.settings?.buildCommand,
        outputDir: project?.settings?.outputDir,
      },
      existingDeployId,
    });
  };

  useEffect(() => {
    if (providerDeployId) {
      localStorage.setItem(
        DEPLOY_ID_STORAGE_KEY(projectId, provider),
        providerDeployId
      );
    }
  }, [providerDeployId, projectId, provider]);

  const isDeploying =
    status === "building" ||
    status === "uploading" ||
    status === "deploying" ||
    persistedStatus === "deploying";

  const isCompleted =
    status === "completed" ||
    (status === "idle" && persistedStatus === "completed");

  const isFailed =
    status === "failed" || (status === "idle" && persistedStatus === "failed");

  const liveUrl = deployedUrl ?? persistedUrl;
  const displayProvider = persistedProvider ?? provider;
  const displayError =
    error ?? persistedError ?? "Something went wrong. Please check your token and try again.";

  const statusLabel =
    status === "building"
      ? "Building..."
      : status === "uploading"
        ? "Packaging..."
        : status === "deploying"
          ? "Deploying..."
          : null;

  const handleReset = () => {
    reset();
  };

  const buildDeployFixPrompt = () => {
    const providerLabel = PROVIDER_LABEL[displayProvider];
    const installCommand = project?.settings?.installCommand ?? "npm install";
    const buildCommand = project?.settings?.buildCommand ?? "npm run build";
    const outputDir = project?.settings?.outputDir ?? "(auto-detect)";
    const trimmedLog = log.trim();
    const logSnippet = trimmedLog ? trimmedLog.slice(-4000) : "No local deploy log captured.";

    return [
      `Deployment to ${providerLabel} failed. Please fix the project so deployment succeeds.`,
      "",
      "Context:",
      `- Provider: ${providerLabel}`,
      `- Error: ${displayError}`,
      `- Install command: ${installCommand}`,
      `- Build command: ${buildCommand}`,
      `- Output directory: ${outputDir}`,
      "",
      "Recent deploy log:",
      "```",
      logSnippet,
      "```",
      "",
      "Please identify the root cause, make the required code/config changes, and explain the fix.",
    ].join("\n");
  };

  const handleAddToChat = async () => {
    if (isSendingToChat) return;
    setIsSendingToChat(true);

    try {
      let conversationId = conversations?.[0]?._id;

      if (!conversationId) {
        conversationId = await createConversation({
          projectId,
          title: DEFAULT_CONVERSATION_TITLE,
        });
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: buildDeployFixPrompt(),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Unable to send deploy error to chat");
      }

      posthog.capture("deploy_error_sent_to_chat", {
        provider: displayProvider,
        project_id: projectId,
      });
      toast.success("Deploy error sent to chat");
    } catch {
      toast.error("Failed to send deploy error to chat");
    } finally {
      setIsSendingToChat(false);
    }
  };

  const renderContent = () => {
    if (isDeploying) {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <LoaderIcon className="size-4 animate-spin text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              {statusLabel ?? "Deploying..."}
            </p>
          </div>
          {log && (
            <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap break-all">
              {log}
            </pre>
          )}
        </div>
      );
    }

    if (isCompleted && liveUrl) {
      return (
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2Icon className="size-6 text-emerald-500" />
          <p className="text-sm font-medium">Deployment successful</p>
          <p className="text-xs text-muted-foreground text-center">
            Your project is live on{" "}
            {displayProvider ? PROVIDER_LABEL[displayProvider] : "the web"}.
          </p>
          <div className="flex flex-col w-full gap-2">
            <Button size="sm" className="w-full" asChild>
              <a href={liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-4 mr-1" />
                Open live site
              </a>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handleReset}
            >
              Redeploy
            </Button>
          </div>
        </div>
      );
    }

    if (isFailed) {
      return (
        <div className="flex flex-col items-center gap-3">
          <XCircleIcon className="size-6 text-rose-500" />
          <p className="text-sm font-medium">Deployment failed</p>
          <p className="text-xs text-muted-foreground text-center">
            {displayError}
          </p>
          {log && (
            <pre className="text-xs bg-muted rounded p-2 overflow-auto max-h-24 w-full whitespace-pre-wrap break-all">
              {log}
            </pre>
          )}
          <Button
            size="sm"
            className="w-full"
            onClick={handleAddToChat}
            disabled={isSendingToChat}
          >
            {isSendingToChat ? (
              <LoaderIcon className="size-3.5 mr-1.5 animate-spin" />
            ) : null}
            Add to chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleReset}
            disabled={isSendingToChat}
          >
            Retry
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h4 className="font-medium text-sm">Deploy project</h4>
          <p className="text-xs text-muted-foreground">
            Build and deploy your project to a hosting provider.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setProvider("vercel")}
            className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors cursor-pointer ${
              provider === "vercel"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <SiVercel className="size-4" />
            Vercel
          </button>
          <button
            type="button"
            onClick={() => setProvider("netlify")}
            className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors cursor-pointer ${
              provider === "netlify"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            }`}
          >
            <SiNetlify className="size-4" />
            Netlify
          </button>
        </div>

        <Field>
          <FieldLabel htmlFor="deploy-token">
            {PROVIDER_LABEL[provider]} Access Token
          </FieldLabel>
          <Input
            id="deploy-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={
              provider === "vercel" ? "vercel_..." : "netlify_pat_..."
            }
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Stored locally in your browser.{" "}
            <a
              href={
                provider === "vercel"
                  ? "https://vercel.com/account/tokens"
                  : "https://app.netlify.com/user/applications"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Get token
            </a>
          </p>
        </Field>

        <Button
          size="sm"
          className="w-full"
          disabled={!token.trim()}
          onClick={handleDeploy}
        >
          <RocketIcon className="size-3.5 mr-1.5" />
          Deploy to {PROVIDER_LABEL[provider]}
        </Button>
      </div>
    );
  };

  const getTriggerIcon = () => {
    if (isDeploying) {
      return <LoaderIcon className="size-3.5 animate-spin" />;
    }
    if (isCompleted) {
      return <CheckCircle2Icon className="size-3.5 text-emerald-500" />;
    }
    if (isFailed) {
      return <XCircleIcon className="size-3.5 text-red-500" />;
    }
    return <RocketIcon className="size-3.5" />;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1.5 h-full px-3 cursor-pointer text-muted-foreground border-l hover:bg-accent/30">
          {getTriggerIcon()}
          <span className="text-sm">Deploy</span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        {renderContent()}
      </PopoverContent>
    </Popover>
  );
};
