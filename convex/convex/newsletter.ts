import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const subscribe = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("newsletter")
            .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
            .first();
        if (existing) {
            if (existing.status === "unsubscribed") {
                await ctx.db.patch(existing._id, { status: "subscribed" });
            }
            return existing._id;
        }
        return await ctx.db.insert("newsletter", {
            email: args.email.toLowerCase(),
            status: "subscribed",
            created_at: new Date().toISOString(),
        });
    },
});

export const unsubscribe = internalMutation({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("newsletter")
            .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, { status: "unsubscribed" });
        }
        return true;
    },
});

export const getAll = internalQuery({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("newsletter").collect();
    },
});
