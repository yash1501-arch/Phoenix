import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const join = internalMutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    user_id: v.optional(v.string()),
    adventure_id: v.string(),
    adventure_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    const date = args.adventure_date?.trim() || undefined;
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("adventure_id", (q) => q.eq("adventure_id", args.adventure_id))
      .collect();
    const dup = existing.find(
      (row) =>
        row.email === email &&
        (row.adventure_date || "") === (date || "") &&
        row.status === "waiting"
    );
    if (dup) return dup._id;

    return await ctx.db.insert("waitlist", {
      email,
      phone: args.phone?.trim() || undefined,
      user_id: args.user_id,
      adventure_id: args.adventure_id,
      adventure_date: date,
      status: "waiting",
      created_at: new Date().toISOString(),
    });
  },
});

export const listWaitingForAdventure = internalQuery({
  args: { adventure_id: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("waitlist")
      .withIndex("adventure_id", (q) => q.eq("adventure_id", args.adventure_id))
      .collect();
    return rows.filter((r) => r.status === "waiting");
  },
});

export const markNotified = internalMutation({
  args: { ids: v.array(v.id("waitlist")) },
  handler: async (ctx, args) => {
    const ts = new Date().toISOString();
    for (const id of args.ids) {
      await ctx.db.patch(id, { status: "notified", notified_at: ts });
    }
    return { updated: args.ids.length };
  },
});
