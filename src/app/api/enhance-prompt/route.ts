import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { ENHANCE_SYSTEM_PROMPT } from "@/features/conversations/inngest/constants";

const requestSchema = z.object({
  prompt: z.string().min(1),
});

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt } = requestSchema.parse(body);

    const openrouter = createOpenAICompatible({
      name: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });

    const result = await generateText({
      model: openrouter("moonshotai/kimi-k2.5:nitro"),
      system: ENHANCE_SYSTEM_PROMPT,
      prompt: `Here is the user's prompt to enhance:\n\n${prompt}`,
      temperature: 0.7,
    });

    const enhanced = result.text.trim();

    if (!enhanced) {
      return NextResponse.json(
        { error: "Failed to enhance prompt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enhancedPrompt: enhanced,
    });
  } catch (error) {
    console.error("Enhance prompt error:", error);
    return NextResponse.json(
      { error: "Failed to enhance prompt" },
      { status: 500 }
    );
  }
}
