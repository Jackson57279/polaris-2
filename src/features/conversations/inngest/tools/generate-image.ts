import { z } from "zod";
import { createTool } from "@inngest/agent-kit";
import { UTApi, UTFile } from "uploadthing/server";

const utapi = new UTApi();

const IMAGE_GEN_MODEL = "google/gemini-3.1-flash-image-preview";

interface GenerateImageResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
      images?: Array<{
        type?: string;
        image_url?: {
          url?: string;
        };
      }>;
    };
  }>;
}

export const createGenerateImageTool = () => {
  return createTool({
    name: "generateImage",
    description:
      "Generate an AI image using a cheap image model and return a public URL. Use this for hero backgrounds, section images, or any visual asset needed for the UI. Supports aspect ratios like 16:9, 4:3, 1:1, 21:9, 4:1.",
    parameters: z.object({
      prompt: z.string().describe("Detailed prompt describing the image to generate. Be specific about style, colors, mood, and composition."),
      aspect_ratio: z
        .enum(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9", "4:1", "1:4", "1:8", "8:1"])
        .optional()
        .describe("Aspect ratio for the image. Default is 16:9. Use 4:1 or 21:9 for wide hero banners."),
      image_size: z
        .enum(["0.5K", "1K", "2K", "4K"])
        .optional()
        .describe("Resolution size. Default is 1K. Use 0.5K for fast/cheap small assets."),
    }),
    handler: async (params) => {
      const { prompt, aspect_ratio = "16:9", image_size = "1K" } = params;

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return "Error: OPENROUTER_API_KEY is not configured.";
      }

      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: IMAGE_GEN_MODEL,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            modalities: ["image", "text"],
            image_config: {
              aspect_ratio,
              image_size,
            },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return `Error: OpenRouter request failed (${response.status}): ${errorText}`;
        }

        const data = (await response.json()) as GenerateImageResponse;
        const images = data.choices?.[0]?.message?.images;

        if (!images || images.length === 0) {
          return "Error: No image was generated. Try a different prompt.";
        }

        const imageUrl = images[0].image_url?.url;
        if (!imageUrl || !imageUrl.startsWith("data:image")) {
          return "Error: Generated image response was malformed.";
        }

        const base64Data = imageUrl.split(",")[1];
        if (!base64Data) {
          return "Error: Could not extract image data.";
        }

        const buffer = Buffer.from(base64Data, "base64");
        const ext = imageUrl.includes("png") ? "png" : "jpg";
        const fileName = `generated-${Date.now()}.${ext}`;

        const utFile = new UTFile([buffer], fileName, { type: `image/${ext}` });
        const uploadResult = await utapi.uploadFiles([utFile]);

        const uploaded = uploadResult[0];
        if (uploaded.error) {
          return `Error: UploadThing upload failed: ${uploaded.error.message}`;
        }

        return uploaded.data?.ufsUrl ?? uploaded.data?.url ?? "Error: Upload succeeded but no URL was returned.";
      } catch (err) {
        return `Error generating image: ${err instanceof Error ? err.message : "Unknown error"}`;
      }
    },
  });
};
