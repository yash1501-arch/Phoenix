import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
    args: {
        user_id: v.string(),
        adventure_id: v.string(),
        booking_id: v.optional(v.string()),
        rating: v.number(),
        title: v.optional(v.string()),
        comment: v.optional(v.string()),
        photos: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        if (args.rating < 1 || args.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }
        const id = await ctx.db.insert("reviews", {
            user_id: args.user_id,
            adventure_id: args.adventure_id,
            booking_id: args.booking_id,
            rating: args.rating,
            title: args.title,
            comment: args.comment,
            photos: args.photos,
            approved: false, // moderation required
            created_at: new Date().toISOString(),
        });
        return id;
    },
});

export const getByAdventure = query({
    args: {
        adventure_id: v.string(),
        approved_only: v.optional(v.boolean()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let reviews = await ctx.db
            .query("reviews")
            .withIndex("adventure_id", (q) => q.eq("adventure_id", args.adventure_id))
            .collect();
        if (args.approved_only !== false) {
            reviews = reviews.filter((r) => r.approved);
        }
        reviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const limit = args.limit ?? 50;
        reviews = reviews.slice(0, limit);

        // Enrich with user names
        const enriched = await Promise.all(
            reviews.map(async (r) => {
                let userName = "Anonymous";
                try {
                    const user = await ctx.db.get(r.user_id as any);
                    if (user?.name) userName = user.name;
                } catch { /* keep anonymous */ }
                return { ...r, user_name: userName };
            })
        );
        return enriched;
    },
});

export const getByUser = query({
    args: { user_id: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("reviews")
            .withIndex("user_id", (q) => q.eq("user_id", args.user_id))
            .collect();
    },
});

export const approve = mutation({
    args: { id: v.id("reviews") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { approved: true });
        return args.id;
    },
});

export const remove = mutation({
    args: { id: v.id("reviews") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
        return args.id;
    },
});

export const getRatingSummary = query({
    args: { adventure_id: v.string() },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("adventure_id", (q) => q.eq("adventure_id", args.adventure_id))
            .filter((q) => q.eq(q.field("approved"), true))
            .collect();
        if (reviews.length === 0) {
            return { average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        }
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        for (const r of reviews) {
            const rating = Math.round(r.rating);
            if (rating >= 1 && rating <= 5) breakdown[rating]++;
            sum += r.rating;
        }
        return {
            average: Math.round((sum / reviews.length) * 10) / 10,
            count: reviews.length,
            breakdown,
        };
    },
});
