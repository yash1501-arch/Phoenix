import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get all adventures with optional filters
export const getAll = internalQuery({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1;
    const limit = args.limit ?? 10;
    const offset = (page - 1) * limit;

    // Use an index when only one equality filter is provided; fall back to a full scan otherwise.
    let adventuresList;
    const filterCount = [args.status, args.difficulty, args.location, args.category].filter(Boolean).length;
    if (filterCount === 1) {
      if (args.status) {
        adventuresList = await ctx.db.query("adventures").withIndex("status", (q) => q.eq("status", args.status)).collect();
      } else if (args.difficulty) {
        adventuresList = await ctx.db.query("adventures").withIndex("difficulty", (q) => q.eq("difficulty", args.difficulty)).collect();
      } else if (args.category) {
        adventuresList = await ctx.db.query("adventures").withIndex("category", (q) => q.eq("category", args.category)).collect();
      } else if (args.location) {
        const needle = args.location.toLowerCase();
        adventuresList = (await ctx.db.query("adventures").withIndex("location", (q) => q.eq("location", args.location)).collect())
          .filter((a) => a.location.toLowerCase().includes(needle));
      }
    } else {
      adventuresList = await ctx.db.query("adventures").collect();
      if (args.status) adventuresList = adventuresList.filter((a) => a.status === args.status);
      if (args.difficulty) adventuresList = adventuresList.filter((a) => a.difficulty === args.difficulty);
      if (args.category) adventuresList = adventuresList.filter((a) => a.category === args.category);
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
export const getById = internalQuery({
  args: { id: v.id("adventures") },
  handler: async (ctx, args) => {
    const adventure = await ctx.db.get(args.id);
    return adventure;
  },
});

// Create new adventure
export const create = internalMutation({
  args: {
    title: v.string(),
    description: v.string(),
    location: v.string(),
    price: v.number(),
    duration: v.string(),
    difficulty: v.string(),
    category: v.optional(v.string()),
    endurance_level: v.optional(v.string()),
    base_village: v.optional(v.string()),
    elevation: v.optional(v.string()),
    region: v.optional(v.string()),
    price_note: v.optional(v.string()),
    things_to_carry: v.optional(v.array(v.string())),
    pickup_mumbai: v.optional(v.array(v.string())),
    pickup_pune: v.optional(v.array(v.string())),
    dos: v.optional(v.array(v.string())),
    donts: v.optional(v.array(v.string())),
    trek_guidelines: v.optional(v.array(v.string())),
    confirmation_pdf_url: v.optional(v.string()),
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
    start_time: v.optional(v.string()),
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
export const update = internalMutation({
  args: {
    id: v.id("adventures"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    price: v.optional(v.number()),
    duration: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    category: v.optional(v.string()),
    endurance_level: v.optional(v.string()),
    base_village: v.optional(v.string()),
    elevation: v.optional(v.string()),
    region: v.optional(v.string()),
    price_note: v.optional(v.string()),
    things_to_carry: v.optional(v.array(v.string())),
    pickup_mumbai: v.optional(v.array(v.string())),
    pickup_pune: v.optional(v.array(v.string())),
    dos: v.optional(v.array(v.string())),
    donts: v.optional(v.array(v.string())),
    trek_guidelines: v.optional(v.array(v.string())),
    confirmation_pdf_url: v.optional(v.union(v.string(), v.null())),
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
    start_time: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;
    const now = new Date().toISOString();

    const patch: Record<string, unknown> = { ...updateFields, updated_at: now };
    if (patch.confirmation_pdf_url === null) {
      patch.confirmation_pdf_url = undefined;
    }

    await ctx.db.patch(id, patch);

    return id;
  },
});

// Delete adventure
export const remove = internalMutation({
  args: { id: v.id("adventures") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get dashboard stats
export const getDashboardStats = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    // Get all adventures
    const adventures = await ctx.db.query("adventures").collect();

    // Calculate stats
    const totalAdventures = adventures.length;
    const activeAdventures = adventures.filter(a => a.status === 'active').length;

    return {
      totalAdventures,
      activeAdventures,
    };
  },
});