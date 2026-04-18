import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { convex } from "@/lib/convex-client";
import { inngest } from "@/inngest/client";
import { DEFAULT_CONVERSATION_TITLE } from "@/features/conversations/constants";

import { api } from "../../../../convex/_generated/api";

const requestSchema = z.object({
  pdfUrl: z.string().url(),
  fileName: z.string().min(1),
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
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { pdfUrl, fileName } = requestSchema.parse(body);

  const projectName = fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

  const { projectId, conversationId } = await convex.mutation(
    api.system.createProjectWithConversation,
    {
      internalKey,
      projectName,
      conversationTitle: DEFAULT_CONVERSATION_TITLE,
      ownerId: userId,
    }
  );

  await convex.mutation(api.system.updateImportStatus, {
    internalKey,
    projectId,
    status: "importing",
  });

  const event = await inngest.send({
    name: "pdf/import.document",
    data: {
      projectId,
      conversationId,
      pdfUrl,
      fileName,
    },
  });

  return NextResponse.json({
    success: true,
    projectId,
    eventId: event.ids[0],
  });
}
