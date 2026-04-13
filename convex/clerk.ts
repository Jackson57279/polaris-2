"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Webhook } from "svix";

export const handleClerkWebhook = internalAction({
  args: {
    payloadString: v.string(),
    svixId: v.string(),
    svixTimestamp: v.string(),
    svixSignature: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SIGNING_SECRET is not configured");
    }

    const wh = new Webhook(webhookSecret);
    let evt: { type: string; data: unknown };

    try {
      evt = wh.verify(args.payloadString, {
        "svix-id": args.svixId,
        "svix-timestamp": args.svixTimestamp,
        "svix-signature": args.svixSignature,
      }) as { type: string; data: unknown };
    } catch (err) {
      console.error("Error verifying webhook:", err);
      throw new Error("Invalid webhook signature");
    }

  },
});