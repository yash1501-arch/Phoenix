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
        actor: v.optional(v.string()),
        booking_code: v.optional(v.string()),
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
        const actorQ = args.actor ? String(args.actor).trim().toLowerCase() : "";
        const codeQ = args.booking_code ? String(args.booking_code).trim().toLowerCase() : "";
        if (actorQ) {
            entries = entries.filter((e) => {
                const email = String(e.actor_email || "").toLowerCase();
                const id = String(e.actor_id || "").toLowerCase();
                return email.includes(actorQ) || id.includes(actorQ);
            });
        }
        if (codeQ) {
            entries = entries.filter((e) => {
                const meta = e.metadata && typeof e.metadata === "object" ? e.metadata : {};
                const fromMeta = String((meta as { booking_code?: string }).booking_code || "").toLowerCase();
                const target = String(e.target_id || "").toLowerCase();
                return fromMeta.includes(codeQ) || target.includes(codeQ);
            });
        }
        entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return entries.slice(0, args.limit ?? 200);
    },
});
