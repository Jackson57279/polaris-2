import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { chromium } from "playwright-core";

interface PreviewCaptureEvent {
  previewCaptureId: Id<"preview_captures">;
  messageId: Id<"messages">;
  projectId: Id<"projects">;
  viewport?: {
    width: number;
    height: number;
  };
  waitForNetworkIdle?: boolean;
  delayMs?: number;
}

// Get preview URL from project
async function getPreviewUrl(projectId: Id<"projects">, internalKey: string): Promise<string | null> {
  const project = await convex.query(api.system.getProjectById, {
    internalKey,
    projectId,
  });

  if (!project) return null;

  // If project has a deployment URL, use that
  if (project.deploymentUrl) {
    return project.deploymentUrl;
  }

  return null;
}

// Capture screenshot using Browserless.io (Railway-friendly)
async function captureWithBrowserless(
  url: string,
  viewport: { width: number; height: number },
  waitForNetworkIdle: boolean,
  delayMs: number,
  token: string
): Promise<Buffer> {
  const browserlessUrl = `wss://production-sfo.browserless.io?token=${token}`;

  const browser = await chromium.connectOverCDP(browserlessUrl);

  try {
    const context = await browser.newContext({
      viewport,
    });

    const page = await context.newPage();

    // Navigate to the URL
    await page.goto(url, {
      waitUntil: waitForNetworkIdle ? "networkidle" : "load",
      timeout: 30000,
    });

    // Additional delay if specified
    if (delayMs > 0) {
      await page.waitForTimeout(delayMs);
    }

    // Wait for any animations to settle
    await page.waitForFunction(() => {
      return document.readyState === "complete";
    }, { timeout: 10000 });

    // Capture screenshot
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    return screenshotBuffer;
  } finally {
    await browser.close();
  }
}

// Capture screenshot using local Playwright (development)
async function captureWithLocalPlaywright(
  url: string,
  viewport: { width: number; height: number },
  waitForNetworkIdle: boolean,
  delayMs: number
): Promise<Buffer> {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    (await chromium.executablePath().catch(() => null));

  if (!executablePath && !process.env.PLAYWRIGHT_BROWSERS_PATH) {
    throw new Error(
      "Playwright Chromium not available. Please install Playwright or set PLAYWRIGHT_CHROMIUM_PATH."
    );
  }

  const browser = await chromium.launch({
    executablePath: executablePath || undefined,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: waitForNetworkIdle ? "networkidle" : "load",
      timeout: 30000,
    });

    if (delayMs > 0) {
      await page.waitForTimeout(delayMs);
    }

    await page.waitForFunction(() => {
      return document.readyState === "complete";
    }, { timeout: 10000 });

    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: false,
    });

    return screenshotBuffer;
  } finally {
    await browser.close();
  }
}

// Capture using external screenshot API (fallback)
async function captureWithExternalAPI(
  url: string,
  viewport: { width: number; height: number }
): Promise<Buffer> {
  // Use screenshotapi.net or similar service
  const apiKey = process.env.SCREENSHOT_API_KEY;

  if (!apiKey) {
    throw new Error("No screenshot API key available");
  }

  const screenshotUrl = new URL("https://api.screenshotapi.net/v1/capture");
  screenshotUrl.searchParams.set("url", url);
  screenshotUrl.searchParams.set("width", viewport.width.toString());
  screenshotUrl.searchParams.set("height", viewport.height.toString());
  screenshotUrl.searchParams.set("format", "png");
  screenshotUrl.searchParams.set("api_key", apiKey);

  const response = await fetch(screenshotUrl.toString());

  if (!response.ok) {
    throw new Error(`Screenshot API failed: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export const capturePreview = inngest.createFunction(
  {
    id: "capture-preview",
    concurrency: {
      key: "event.data.projectId",
      limit: 2,
    },
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
  },
  {
    event: "preview/capture",
  },
  async ({ event, step }) => {
    const {
      previewCaptureId,
      messageId,
      projectId,
      viewport = { width: 1280, height: 800 },
      waitForNetworkIdle = true,
      delayMs = 2000,
    } = event.data as PreviewCaptureEvent;

    const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new Error("POLARIS_CONVEX_INTERNAL_KEY is not configured");
    }

    const startTime = Date.now();

    // Mark as running
    await step.run("mark-running", async () => {
      await convex.mutation(api.system.updatePreviewCaptureStatus, {
        internalKey,
        previewCaptureId,
        status: "running",
      });
    });

    try {
      // Get the preview URL
      const previewUrl = await step.run("get-preview-url", async () => {
        return await getPreviewUrl(projectId, internalKey);
      });

      if (!previewUrl) {
        throw new Error(
          "No preview URL available. Please deploy the project first to enable preview captures."
        );
      }

      // Determine which capture method to use
      const browserlessToken = process.env.BROWSERLESS_TOKEN;
      const screenshotApiKey = process.env.SCREENSHOT_API_KEY;

      let screenshotBuffer: Buffer;

      if (browserlessToken) {
        // Use Browserless.io (Railway-friendly)
        screenshotBuffer = await step.run("capture-browserless", async () => {
          return await captureWithBrowserless(
            previewUrl,
            viewport,
            waitForNetworkIdle,
            delayMs,
            browserlessToken
          );
        });
      } else if (screenshotApiKey) {
        // Use external screenshot API
        screenshotBuffer = await step.run("capture-external-api", async () => {
          return await captureWithExternalAPI(previewUrl, viewport);
        });
      } else {
        // Fallback to local Playwright (development only)
        screenshotBuffer = await step.run("capture-local", async () => {
          return await captureWithLocalPlaywright(
            previewUrl,
            viewport,
            waitForNetworkIdle,
            delayMs
          );
        });
      }

      // Upload screenshot to Convex storage
      const { imageStorageId, imageUrl } = await step.run("upload-screenshot", async () => {
        const storageId = await convex.action(api.files.storeImage, {
          internalKey,
          data: Array.from(screenshotBuffer),
          contentType: "image/png",
        });

        const url = await convex.query(api.files.getImageUrl, {
          internalKey,
          storageId,
        });

        return { imageStorageId: storageId, imageUrl: url };
      });

      const durationMs = Date.now() - startTime;

      // Mark as completed
      await step.run("mark-completed", async () => {
        await convex.mutation(api.system.updatePreviewCaptureStatus, {
          internalKey,
          previewCaptureId,
          status: "completed",
          imageStorageId,
          imageUrl,
          durationMs,
        });
      });

      return {
        success: true,
        imageUrl,
        viewport,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Mark as failed
      await step.run("mark-failed", async () => {
        await convex.mutation(api.system.updatePreviewCaptureStatus, {
          internalKey,
          previewCaptureId,
          status: "failed",
          error: errorMessage,
          durationMs,
        });
      });

      return {
        success: false,
        error: errorMessage,
        durationMs,
      };
    }
  }
);
