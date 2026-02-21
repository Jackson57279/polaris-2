"use client";

import { useCallback, useState } from "react";

import { getWebContainer } from "@/features/preview/hooks/use-webcontainer";

import { Id } from "../../../../convex/_generated/dataModel";

export type DeployProvider = "vercel" | "netlify";

export type DeployStatus =
  | "idle"
  | "building"
  | "uploading"
  | "deploying"
  | "completed"
  | "failed";

interface DeploySettings {
  installCommand?: string;
  buildCommand?: string;
  outputDir?: string;
}

interface DeployOptions {
  projectId: Id<"projects">;
  provider: DeployProvider;
  token: string;
  settings?: DeploySettings;
  existingDeployId?: string;
}

const DEFAULT_OUTPUT_DIRS = ["dist", "build", "out", ".next", "public"];

async function collectBuildFiles(
  container: Awaited<ReturnType<typeof getWebContainer>>,
  outputDir: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  async function walk(dirPath: string) {
    try {
      const entries = await container.fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = `${dirPath}/${entry.name}`;
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else {
          try {
            const content = await container.fs.readFile(fullPath, "utf-8");
            const relativePath = fullPath.replace(`/${outputDir}/`, "").replace(`${outputDir}/`, "");
            result[relativePath] = content;
          } catch {
            // skip unreadable files
          }
        }
      }
    } catch {
      // directory doesn't exist or unreadable
    }
  }

  await walk(outputDir.startsWith("/") ? outputDir : `/${outputDir}`);
  return result;
}

export function useDeploy() {
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [log, setLog] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [providerDeployId, setProviderDeployId] = useState<string | null>(null);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => prev + line);
  }, []);

  const deploy = useCallback(
    async ({ projectId, provider, token, settings, existingDeployId }: DeployOptions) => {
      setStatus("building");
      setLog("");
      setError(null);
      setDeployedUrl(null);

      try {
        const container = await getWebContainer();

        const installCmd = settings?.installCommand ?? "npm install";
        const buildCmd = settings?.buildCommand ?? "npm run build";

        appendLog(`$ ${installCmd}\n`);
        const [installBin, ...installArgs] = installCmd.split(" ");
        const installProcess = await container.spawn(installBin, installArgs);
        installProcess.output.pipeTo(
          new WritableStream({ write: (data) => appendLog(data) })
        );
        const installCode = await installProcess.exit;
        if (installCode !== 0) {
          throw new Error(`Install failed with code ${installCode}`);
        }

        appendLog(`\n$ ${buildCmd}\n`);
        const [buildBin, ...buildArgs] = buildCmd.split(" ");
        const buildProcess = await container.spawn(buildBin, buildArgs);
        buildProcess.output.pipeTo(
          new WritableStream({ write: (data) => appendLog(data) })
        );
        const buildCode = await buildProcess.exit;
        if (buildCode !== 0) {
          throw new Error(`Build failed with code ${buildCode}`);
        }

        setStatus("uploading");
        appendLog("\nCollecting build output...\n");

        let files: Record<string, string> = {};
        let found = false;

        if (settings?.outputDir) {
          files = await collectBuildFiles(container, settings.outputDir);
          found = Object.keys(files).length > 0;
        }

        if (!found) {
          for (const dir of DEFAULT_OUTPUT_DIRS) {
            files = await collectBuildFiles(container, dir);
            if (Object.keys(files).length > 0) {
              found = true;
              break;
            }
          }
        }

        if (!found || Object.keys(files).length === 0) {
          throw new Error(
            "No build output found. Check your build command and output directory settings."
          );
        }

        appendLog(`Found ${Object.keys(files).length} files in build output.\n`);

        setStatus("deploying");
        appendLog(`\nDeploying to ${provider}...\n`);

        const endpoint = `/api/deploy/${provider}`;
        const body: Record<string, unknown> = {
          projectId,
          token,
          files,
        };

        if (provider === "vercel" && existingDeployId) {
          body.existingVercelProjectId = existingDeployId;
        } else if (provider === "netlify" && existingDeployId) {
          body.existingNetlifySiteId = existingDeployId;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json() as {
          success?: boolean;
          url?: string;
          vercelProjectId?: string;
          netlifySiteId?: string;
          error?: string;
        };

        if (!res.ok || !data.success) {
          throw new Error(data.error ?? "Deployment failed");
        }

        const newDeployId =
          provider === "vercel" ? data.vercelProjectId : data.netlifySiteId;

        setDeployedUrl(data.url ?? null);
        setProviderDeployId(newDeployId ?? null);
        setStatus("completed");
        appendLog(`\nDeployed: ${data.url}\n`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        setStatus("failed");
        appendLog(`\nError: ${message}\n`);
      }
    },
    [appendLog]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setLog("");
    setError(null);
    setDeployedUrl(null);
  }, []);

  return {
    status,
    log,
    error,
    deployedUrl,
    providerDeployId,
    deploy,
    reset,
  };
}
