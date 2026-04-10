import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { verifyAuth } from "./auth";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    const conversationId = await ctx.db.insert("conversations", {
      projectId: args.projectId,
      title: args.title,
      updatedAt: Date.now(),
    });

    return conversationId;
  },
});

export const getById = query({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const conversation = await ctx.db.get("conversations", args.id);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const project = await ctx.db.get("projects", conversation.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    return conversation;
  },
});

export const getByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    return await ctx.db
      .query("conversations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();
  },
});

import { paginationOptsValidator } from "convex/server";

export const getBuildValidation = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const message = await ctx.db.get("messages", args.messageId);
    if (!message) {
      return null;
    }

    const conversation = await ctx.db.get("conversations", message.conversationId);
    if (!conversation) {
      return null;
    }

    const project = await ctx.db.get("projects", conversation.projectId);
    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    return await ctx.db
      .query("build_validations")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .first();
  },
});

export const getBuildValidationsByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    return await ctx.db
      .query("build_validations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .take(10);
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const conversation = await ctx.db.get("conversations", args.conversationId);

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const project = await ctx.db.get("projects", conversation.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getPreviewCapture = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const message = await ctx.db.get("messages", args.messageId);
    if (!message) {
      return null;
    }

    const conversation = await ctx.db.get("conversations", message.conversationId);
    if (!conversation) {
      return null;
    }

    const project = await ctx.db.get("projects", conversation.projectId);
    if (!project || project.ownerId !== identity.subject) {
      throw new Error("Unauthorized to access this project");
    }

    return await ctx.db
      .query("preview_captures")
      .withIndex("by_message", (q) => q.eq("messageId", args.messageId))
      .first();
  },
});
