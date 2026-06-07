import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get all users with optional search
export const getAll = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const page = args.page ?? 1;
    const limit = args.limit ?? 10;
    const offset = (page - 1) * limit;

    // Collect all users
    let usersList = await ctx.db.query("users").collect();

    // Apply search filter if provided
    if (args.search) {
      usersList = usersList.filter(user =>
        user.email.toLowerCase().includes((args.search || '').toLowerCase()) ||
        user.name.toLowerCase().includes((args.search || '').toLowerCase())
      );
    }

    // Sort by creation time (descending)
    usersList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const totalCount = usersList.length;
    const startIndex = offset;
    const endIndex = Math.min(startIndex + limit, totalCount);
    const paginatedUsers = usersList.slice(startIndex, endIndex);

    return {
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: endIndex < totalCount,
      }
    };
  },
});

// Get user by ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return user;
  },
});

// Create new user
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.string(),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("users", {
      ...args,
      email: args.email.toLowerCase(),
      updated_at: now,
    });
    return { _id: id, ...args, email: args.email.toLowerCase() };
  },
});

// Update user
export const update = mutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.string()),
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

// Get user by email (useful for auth)
export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

// Delete user by id
export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});