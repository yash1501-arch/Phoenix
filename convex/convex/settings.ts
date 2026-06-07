import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULTS = {
    site_name: "Phoenix Adventures",
    site_tagline: "Premium Indian Trekking & Camping",
    contact_email: "hello@phoenixadventures.in",
    contact_phone: "+91 98765 43210",
    whatsapp: "+919999999999",
    instagram: "https://www.instagram.com/phoenix_adventures__/",
    maps_url: "https://maps.app.goo.gl/A3ZQYPCJWLCtgyB58",
    advance_per_person: "1000",
    cancellation_window_days: "14",
    maintenance_mode: "false",
};

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("settings").collect();
        const map = {};
        for (const s of settings) map[s.key] = s.value;
        return { ...DEFAULTS, ...map };
    },
});

export const set = mutation({
    args: { key: v.string(), value: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("settings")
            .withIndex("key", (q) => q.eq("key", args.key))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                value: args.value,
                updated_at: new Date().toISOString(),
            });
        } else {
            await ctx.db.insert("settings", {
                key: args.key,
                value: args.value,
                updated_at: new Date().toISOString(),
            });
        }
        return true;
    },
});
