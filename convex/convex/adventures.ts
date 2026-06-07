import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all adventures with optional filters
export const getAll = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1;
    const limit = args.limit ?? 10;
    const offset = (page - 1) * limit;

    // Use an index when only one equality filter is provided; fall back to a full scan otherwise.
    let adventuresList;
    const filterCount = [args.status, args.difficulty, args.location].filter(Boolean).length;
    if (filterCount === 1) {
      if (args.status) {
        adventuresList = await ctx.db.query("adventures").withIndex("status", (q) => q.eq("status", args.status)).collect();
      } else if (args.difficulty) {
        adventuresList = await ctx.db.query("adventures").withIndex("difficulty", (q) => q.eq("difficulty", args.difficulty)).collect();
      } else if (args.location) {
        const needle = args.location.toLowerCase();
        adventuresList = (await ctx.db.query("adventures").withIndex("location", (q) => q.eq("location", args.location)).collect())
          .filter((a) => a.location.toLowerCase().includes(needle));
      }
    } else {
      adventuresList = await ctx.db.query("adventures").collect();
      if (args.status) adventuresList = adventuresList.filter((a) => a.status === args.status);
      if (args.difficulty) adventuresList = adventuresList.filter((a) => a.difficulty === args.difficulty);
      if (args.location) {
        const needle = args.location.toLowerCase();
        adventuresList = adventuresList.filter((a) => a.location.toLowerCase().includes(needle));
      }
    }

    // Sort by creation time (descending)
    adventuresList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const totalCount = adventuresList.length;
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, totalCount);
    const paginatedAdventures = adventuresList.slice(startIndex, endIndex);

    const adventures = {
      page: paginatedAdventures,
      continueCursor: endIndex < totalCount ? endIndex.toString() : null,
    };

    return {
      data: adventures.page,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: adventures.continueCursor !== null,
      }
    };
  },
});

// Get adventure by ID
export const getById = query({
  args: { id: v.id("adventures") },
  handler: async (ctx, args) => {
    const adventure = await ctx.db.get(args.id);
    return adventure;
  },
});

// Create new adventure
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    location: v.string(),
    price: v.number(),
    duration: v.string(),
    difficulty: v.string(),
    endurance_level: v.optional(v.string()),
    image_url: v.optional(v.string()),
    status: v.string(),
    max_participants: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviews_count: v.optional(v.number()),
    included: v.optional(v.array(v.string())),
    excluded: v.optional(v.array(v.string())),
    itinerary: v.optional(v.array(v.object({
      day: v.number(),
      title: v.string(),
      description: v.string(),
      activities: v.optional(v.array(v.string())),
      meals: v.optional(v.array(v.string())),
      accommodation: v.optional(v.string()),
    }))),
    images: v.optional(v.array(v.string())),
    available_dates: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("adventures", {
      ...args,
      created_at: now,
      updated_at: now,
    });

    return id;
  },
});

// Update adventure
export const update = mutation({
  args: {
    id: v.id("adventures"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    price: v.optional(v.number()),
    duration: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    endurance_level: v.optional(v.string()),
    image_url: v.optional(v.string()),
    status: v.optional(v.string()),
    max_participants: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviews_count: v.optional(v.number()),
    included: v.optional(v.array(v.string())),
    excluded: v.optional(v.array(v.string())),
    itinerary: v.optional(v.array(v.object({
      day: v.number(),
      title: v.string(),
      description: v.string(),
      activities: v.optional(v.array(v.string())),
      meals: v.optional(v.array(v.string())),
      accommodation: v.optional(v.string()),
    }))),
    images: v.optional(v.array(v.string())),
    available_dates: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(id, {
      ...updateFields,
      updated_at: now,
    });

    return id;
  },
});

// Delete adventure
export const remove = mutation({
  args: { id: v.id("adventures") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get dashboard stats
export const getDashboardStats = query({
  args: {},
  handler: async (ctx, args) => {
    // Get all adventures
    const adventures = await ctx.db.query("adventures").collect();
    
    // Get all bookings
    const bookings = await ctx.db.query("bookings").collect();
    
    // Calculate stats
    const totalAdventures = adventures.length;
    const activeAdventures = adventures.filter(a => a.status === 'active').length;
    const totalBookings = bookings.length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    
    // Calculate total revenue
    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, booking) => sum + (parseFloat(booking.total_amount?.toString() || '0') || 0), 0);
    
    // Get recent bookings (last 5), enriched with adventure and user info
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const recentBookings = await Promise.all(
      sortedBookings.slice(0, 5).map(async (booking) => {
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
      totalAdventures,
      activeAdventures,
      totalBookings,
      pendingBookings,
      totalRevenue,
      recentBookings
    };
  },
});