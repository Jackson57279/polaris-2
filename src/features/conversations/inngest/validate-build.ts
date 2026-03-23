import { WebContainer } from "@webcontainer/api";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { buildFileTree } from "@/features/preview/utils/file-tree";

interface BuildValidationEvent {
  messageId: Id<"messages">;
  projectId: Id<"projects">;
  conversationId: Id<"conversations">;
  buildCommand?: string;
}

type FileDoc = Doc<"files">;

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

const getValidationWebContainer = async (): Promise<WebContainer> => {
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (!bootPromise) {
    bootPromise = WebContainer.boot({ coep: "credentialless" });
  }

  webcontainerInstance = await bootPromise;
  return webcontainerInstance;
};

const detectBuildCommand = (files: FileDoc[]): string | null => {
  const packageJsonFile = files.find(
    (f) => f.name === "package.json" && f.type === "file" && f.content
  );

  if (!packageJsonFile?.content) {
    return null;
  }

  try {
    const pkg = JSON.parse(packageJsonFile.content);
    const scripts = pkg.scripts || {};

    if (scripts.build) {
      return "npm run build";
    }

    if (scripts["lint"]) {
      return "npm run lint";
    }

    const hasTypeScript = files.some(
      (f) => f.type === "file" && (f.name.endsWith(".ts") || f.name.endsWith(".tsx"))
    );

    if (hasTypeScript && pkg.devDependencies?.typescript) {
      return "npx tsc --noEmit";
    }

    return null;
  } catch {
    return null;
  }
};

export const validateBuild = inngest.createFunction(
  {
    id: "validate-build",
    concurrency: {
      key: "event.data.projectId",
      limit: 1,
    },
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
  },
  {
    event: "build/validate",
  },
  async ({ event, step }) => {
    const { messageId, projectId, buildCommand } = event.data as BuildValidationEvent;
    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new Error("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    const buildValidationId = await step.run("create-build-validation", async () => {
      return await convex.mutation(api.system.createBuildValidation, {
        internalKey,
        messageId,
        projectId,
        command: buildCommand,
      });
    });

    const project = await step.run("get-project", async () => {
      return await convex.query(api.system.getProjectById, {
        internalKey,
        projectId,
      });
    });

    if (!project) {
      await step.run("mark-not-found", async () => {
        await convex.mutation(api.system.updateBuildValidationStatus, {
          internalKey,
          buildValidationId,
          status: "skipped",
        });
      });
      return { success: false, error: "Project not found" };
    }

    const settings = project.settings || {};
    const files = await step.run("get-files", async () => {
      return await convex.query(api.system.getProjectFiles, {
        internalKey,
        projectId,
      });
    });

    const shouldSkip = !files.some(
      (f: FileDoc) =>
        f.type === "file" &&
        (f.name.endsWith(".ts") ||
          f.name.endsWith(".tsx") ||
          f.name.endsWith(".js") ||
          f.name.endsWith(".jsx") ||
          f.name === "package.json")
    );

    if (shouldSkip) {
      await step.run("mark-skipped", async () => {
        await convex.mutation(api.system.updateBuildValidationStatus, {
          internalKey,
          buildValidationId,
          status: "skipped",
        });
      });
      return { success: true, skipped: true, reason: "No buildable files" };
    }

    const detectedCommand = buildCommand || settings.buildCommand || detectBuildCommand(files);

    if (!detectedCommand) {
      await step.run("mark-skipped-no-command", async () => {
        await convex.mutation(api.system.updateBuildValidationStatus, {
          internalKey,
          buildValidationId,
          status: "skipped",
        });
      });
      return { success: true, skipped: true, reason: "No build command detected" };
    }

    await step.run("mark-running", async () => {
      await convex.mutation(api.system.updateBuildValidationStatus, {
        internalKey,
        buildValidationId,
        status: "running",
      });
    });

    const startTime = Date.now();
    let output = "";
    let errorOutput = "";
    let exitCode: number | null = null;

    try {
      const container = await getValidationWebContainer();

      const fileTree = buildFileTree(files);
      await container.mount(fileTree);

      const installCmd = settings.installCommand || "npm install";
      const [installBin, ...installArgs] = installCmd.split(" ");

      output += `$ ${installCmd}\n`;

      const installProcess = await container.spawn(installBin, installArgs);

      const installWriter = new WritableStream({
        write(data) {
          output += data;
        },
      });

      installProcess.output.pipeTo(installWriter);
      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        exitCode = installExitCode;
        throw new Error(`Install failed with code ${installExitCode}`);
      }

      const [buildBin, ...buildArgs] = detectedCommand.split(" ");
      output += `\n$ ${detectedCommand}\n`;

      const buildProcess = await container.spawn(buildBin, buildArgs);

      const buildWriter = new WritableStream({
        write(data) {
          output += data;
          if (data.toLowerCase().includes("error")) {
            errorOutput += data;
          }
        },
      });

      buildProcess.output.pipeTo(buildWriter);

      const timeoutPromise = new Promise<number>((_, reject) => {
        setTimeout(() => reject(new Error("Build timeout after 120s")), 120000);
      });

      exitCode = await Promise.race([buildProcess.exit, timeoutPromise]);

      const durationMs = Date.now() - startTime;

      if (exitCode === 0) {
        await step.run("mark-passed", async () => {
          await convex.mutation(api.system.updateBuildValidationStatus, {
            internalKey,
            buildValidationId,
            status: "passed",
            exitCode: exitCode ?? undefined,
            output: output.slice(-50000),
            durationMs,
          });
        });

        return {
          success: true,
          status: "passed",
          command: detectedCommand,
          durationMs,
        };
      } else {
        await step.run("mark-failed", async () => {
          await convex.mutation(api.system.updateBuildValidationStatus, {
            internalKey,
            buildValidationId,
            status: "failed",
            exitCode: exitCode ?? undefined,
            output: output.slice(-50000),
            errorOutput: errorOutput.slice(-10000),
            durationMs,
          });
        });

        return {
          success: false,
          status: "failed",
          command: detectedCommand,
          exitCode,
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      await step.run("mark-failed-error", async () => {
        await convex.mutation(api.system.updateBuildValidationStatus, {
          internalKey,
          buildValidationId,
          status: "failed",
          exitCode: exitCode ?? -1,
          output: output.slice(-50000),
          errorOutput: `${errorOutput}\n${errorMessage}`.slice(-10000),
          durationMs,
        });
      });

      return {
        success: false,
        status: "failed",
        command: detectedCommand,
        error: errorMessage,
        durationMs,
      };
    }
  }
);
