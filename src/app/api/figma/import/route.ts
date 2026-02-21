import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { convex } from "@/lib/convex-client";
import { inngest } from "@/inngest/client";

import { api } from "../../../../../convex/_generated/api";

const requestSchema = z.object({
  figFileUrl: z.url(),
  fileName: z.string().min(1),
});

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
  const { figFileUrl, fileName } = requestSchema.parse(body);

  const projectName = fileName.replace(/\.fig$/i, "").replace(/[-_]/g, " ");

  const projectId = await convex.mutation(api.system.createProject, {
    internalKey,
    name: projectName,
    ownerId: userId,
  });

  const event = await inngest.send({
    name: "figma/import.fig",
    data: {
      projectId,
      figFileUrl,
      fileName,
    },
  });

  return NextResponse.json({
    success: true,
    projectId,
    eventId: event.ids[0],
  });
}
