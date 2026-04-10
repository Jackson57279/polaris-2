import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { getPostHogClient } from "@/lib/posthog-server";
import { E2B_CONFIG } from "@/lib/e2b";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
  imageUrls: z.array(z.string()).optional().default([]),
  iterationMode: z.boolean().optional().default(false),
  language: z.enum(["javascript", "typescript", "python"]).optional().default("typescript"),
  testCommand: z.string().optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const internalKey = process.env.POLARIS_CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Internal key not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { conversationId, message, imageUrls, iterationMode, language, testCommand } = requestSchema.parse(body);

  // Call convex mutation, query
  const conversation = await convex.query(api.system.getConversationById, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const projectId = conversation.projectId;

  // Find all processing messages in this project
  const processingMessages = await convex.query(
    api.system.getProcessingMessages,
    {
      internalKey,
      projectId,
    }
  );

  if (processingMessages.length > 0) {
    // Cancel all processing messages
    await Promise.all(
      processingMessages.map(async (msg) => {
        await inngest.send({
          name: "message/cancel",
          data: {
            messageId: msg._id,
          },
        });

        await convex.mutation(api.system.updateMessageStatus, {
          internalKey,
          messageId: msg._id,
          status: "cancelled",
        });
      })
    );
  }

  // Create user message
  await convex.mutation(api.system.createMessage, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
    projectId,
    role: "user",
    content: message,
  });

  // Create assistant message placeholder with processing status
  const assistantMessageId = await convex.mutation(
    api.system.createMessage,
    {
      internalKey,
      conversationId: conversationId as Id<"conversations">,
      projectId,
      role: "assistant",
      content: "",
      status: "processing",
      ...(iterationMode && {
        iterationMode: true,
        iterationData: {
          iterations: [],
          status: "running" as const,
          maxIterations: E2B_CONFIG.maxIterations,
          currentIteration: 0,
          language,
          testCommand,
        },
      }),
    }
  );

  // Trigger Inngest to process the message (regular or iteration mode)
  const event = iterationMode
    ? await inngest.send({
        name: "message/iteration",
        data: {
          messageId: assistantMessageId,
          conversationId,
          projectId,
          message,
          imageUrls,
          maxIterations: E2B_CONFIG.maxIterations,
          language,
          testCommand,
        },
      })
    : await inngest.send({
        name: "message/sent",
        data: {
          messageId: assistantMessageId,
          conversationId,
          projectId,
          message,
          imageUrls,
        },
      });

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: userId,
    event: "ai_message_sent",
    properties: {
      project_id: projectId,
      conversation_id: conversationId,
      has_images: imageUrls.length > 0,
      iteration_mode: iterationMode,
      language: language,
    },
  });
  await posthog.shutdown();

  return NextResponse.json({
    success: true,
    eventId: event.ids[0],
    messageId: assistantMessageId,
  });
};
