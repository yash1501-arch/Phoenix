import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByBookingId = query({
  args: { booking_id: v.string() },
  handler: async (ctx, args) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("booking_id", (q) => q.eq("booking_id", args.booking_id))
      .collect();
    return payments;
  },
});

export const create = mutation({
  args: {
    booking_id: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(),
    payment_method: v.string(),
    transaction_id: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("payments", {
      ...args,
      created_at: now,
    });
    return id;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("payments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, status } = args;
    await ctx.db.patch(id, { status });
    return { success: true };
  },
});
