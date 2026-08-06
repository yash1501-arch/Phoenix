import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const log = internalMutation({
    args: {
        actor_id: v.optional(v.string()),
        actor_email: v.optional(v.string()),
        action: v.string(),
        target_type: v.optional(v.string()),
        target_id: v.optional(v.string()),
        metadata: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("audit_log", {
            ...args,
            created_at: new Date().toISOString(),
        });
    },
});

export const list = internalQuery({
    args: {
        limit: v.optional(v.number()),
        action: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let entries;
        if (args.action) {
            entries = await ctx.db
                .query("audit_log")
                .withIndex("action", (q) => q.eq("action", args.action))
                .collect();
        } else {
            entries = await ctx.db.query("audit_log").collect();
        }
        entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return entries.slice(0, args.limit ?? 200);
    },
});
