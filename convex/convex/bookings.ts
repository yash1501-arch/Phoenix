import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all bookings with optional status filter
export const getAll = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Collect all bookings
    let bookingsList = await ctx.db.query("bookings").collect();

    // Apply status filter if provided
    if (args.status) {
      bookingsList = bookingsList.filter(booking => booking.status === args.status);
    }

    // Sort by creation time (descending)
    bookingsList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Enrich with adventure and user data
    const enrichedBookings = await Promise.all(
      bookingsList.map(async (booking) => {
        try {
          const adventure = await ctx.db.get(booking.adventure_id as any);
          const user = await ctx.db.get(booking.user_id as any);
          return {
            ...booking,
            adventures: adventure ? { title: adventure.title, location: adventure.location, image_url: adventure.image_url } : null,
            user: user ? { name: user.name, email: user.email } : null,
          };
        } catch {
          return { ...booking, adventures: null, user: null };
        }
      })
    );

    return {
      data: enrichedBookings,
    };
  },
});

// Get bookings by user ID
export const getByUser = query({
  args: {
    userId: v.string(), // Assuming user ID is passed as string
  },
  handler: async (ctx, args) => {
    // Use the user_id index instead of scanning the whole table
    let bookingsList = await ctx.db
      .query("bookings")
      .withIndex("user_id", (q) => q.eq("user_id", args.userId))
      .collect();

    // Sort by booking date
    bookingsList.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

    // Enrich with adventure data
    const enrichedBookings = await Promise.all(
      bookingsList.map(async (booking) => {
        try {
          const adventure = await ctx.db.get(booking.adventure_id as any);
          return { ...booking, adventures: adventure };
        } catch {
          return { ...booking, adventures: null };
        }
      })
    );

    return {
      data: enrichedBookings,
    };
  },
});

// Create new booking
export const create = mutation({
  args: {
    user_id: v.string(),
    adventure_id: v.string(),
    booking_date: v.string(), // ISO string
    participants: v.number(),
    total_amount: v.number(),
    advance_paid: v.optional(v.number()),
    status: v.string(), // 'pending', 'confirmed', 'cancelled', 'completed'
    id_type: v.optional(v.string()),
    id_number: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("bookings", {
      ...args,
      created_at: now,
      updated_at: now,
    });
    
    return { id };
  },
});

// Update booking
export const update = mutation({
  args: {
    id: v.id("bookings"),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updateFields,
      updated_at: now,
    });
    
    return { id };
  },
});

// Delete specific booking
export const remove = mutation({
  args: {
    id: v.id("bookings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// Get single booking by ID
export const getById = query({
  args: { id: v.id("bookings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});