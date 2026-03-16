import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const requestSchema = z.object({
  prompt: z.string().min(1),
});

const ENHANCE_SYSTEM_PROMPT = `You are an elite prompt engineer specializing in web design and development prompts. Your job is to take a user's basic idea or rough prompt and transform it into a comprehensive, highly-detailed, production-ready prompt that will guide an AI coding assistant to build something extraordinary.

When enhancing a prompt, you must:

1. **Expand the Design System**: Define a complete color palette (with hex codes), typography stack (heading fonts, body fonts, monospace fonts with specific weights and tracking), and visual texture rules (border radius systems, noise overlays, glassmorphism, etc.).

2. **Architect Every Component**: Break down the page/app into distinct sections (Navbar, Hero, Features, Philosophy/About, Pricing, Footer, etc.) with specific layout instructions, visual treatments, and interaction behaviors for each.

3. **Specify Animations & Micro-Interactions**: Include GSAP ScrollTrigger behaviors, hover states, staggered reveals, parallax effects, typewriter effects, cursor animations, and spring-bounce transitions where appropriate. Be specific with easing curves and timing.

4. **Inject Creative Concepts**: Give each section a creative name/concept (e.g., "The Floating Island" for a navbar, "Nature is the Algorithm" for a hero). Add thematic consistency and storytelling.

5. **Define Technical Requirements**: Specify the tech stack (React 19, Tailwind CSS, GSAP 3, Lucide React, etc.), animation lifecycle management (gsap.context() in useEffect), and code quality standards.

6. **Use Real Assets**: Suggest real Unsplash image URLs or describe specific imagery. No placeholder content.

7. **Set the Tone**: End with an execution directive that sets the bar high — "build a digital instrument, not a website" energy.

RULES:
- Output ONLY the enhanced prompt. No preamble, no explanation, no meta-commentary.
- The enhanced prompt should be ready to paste directly into an AI coding assistant.
- Keep the user's core idea and intent intact — you are amplifying, not changing direction.
- Make it feel like a creative brief from a world-class design agency.
- If the user's prompt is already detailed, enhance the weak areas and polish the strong ones.
- The prompt should result in something that looks nothing like generic AI output.`;

export const maxDuration = 30;

export async function POST(request: Request) {
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
    model: openrouter("moonshotai/kimi-k2.5"),
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
}
