import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const add = internalMutation({
    args: {
        user_id: v.string(),
        adventure_id: v.string(),
    },
    handler: async (ctx, args) => {
        // Prevent duplicates
        const existing = await ctx.db
            .query("wishlist")
            .withIndex("user_id", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("adventure_id"), args.adventure_id))
            .first();
        if (existing) return existing._id;
        const id = await ctx.db.insert("wishlist", {
            user_id: args.user_id,
            adventure_id: args.adventure_id,
            created_at: new Date().toISOString(),
        });
        return id;
    },
});

export const remove = internalMutation({
    args: {
        user_id: v.string(),
        adventure_id: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("wishlist")
            .withIndex("user_id", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("adventure_id"), args.adventure_id))
            .first();
        if (existing) await ctx.db.delete(existing._id);
        return true;
    },
});

export const getByUser = internalQuery({
    args: { user_id: v.string() },
    handler: async (ctx, args) => {
        const items = await ctx.db
            .query("wishlist")
            .withIndex("user_id", (q) => q.eq("user_id", args.user_id))
            .collect();
        // Enrich with adventure
        const enriched = await Promise.all(
            items.map(async (item) => {
                let adventure = null;
                try {
                    adventure = await ctx.db.get(item.adventure_id as any);
                } catch { /* keep null */ }
                return { ...item, adventure };
            })
        );
        // Sort newest first
        enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return enriched;
    },
});

export const isWishlisted = internalQuery({
    args: {
        user_id: v.string(),
        adventure_id: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("wishlist")
            .withIndex("user_id", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("adventure_id"), args.adventure_id))
            .first();
        return !!existing;
    },
});
