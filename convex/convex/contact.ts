import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const submit = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Basic length guards
    if (args.message.length < 10) throw new Error("Message too short");
    if (args.message.length > 5000) throw new Error("Message too long");
    return await ctx.db.insert("contact_messages", {
      ...args,
      status: "new",
      created_at: new Date().toISOString(),
    });
  },
});

export const list = internalQuery({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let msgs;
    if (args.status) {
      msgs = await ctx.db
        .query("contact_messages")
        .withIndex("status", (q) => q.eq("status", args.status!))
        .collect();
    } else {
      msgs = await ctx.db.query("contact_messages").collect();
    }
    msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return msgs;
  },
});

export const setStatus = internalMutation({
  args: { id: v.id("contact_messages"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
    return args.id;
  },
});

export const remove = internalMutation({
  args: { id: v.id("contact_messages") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
