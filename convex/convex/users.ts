import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Get all users with optional search
export const getAll = internalQuery({
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
export const getById = internalQuery({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    return user;
  },
});

// Create new user
export const create = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    role: v.union(v.literal("admin"), v.literal("clerk"), v.literal("user")),
    created_at: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const id = await ctx.db.insert("users", {
      ...args,
      email: args.email.toLowerCase(),
      session_version: 0,
      updated_at: now,
    });
    return { _id: id, ...args, email: args.email.toLowerCase() };
  },
});

// Update user
export const update = internalMutation({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("clerk"), v.literal("user"))),
    totp_secret: v.optional(v.string()),
    totp_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updateFields } = args;
    const now = new Date().toISOString();

    const patch: Record<string, unknown> = { ...updateFields, updated_at: now };

    if (updateFields.password || updateFields.role) {
      const existing = await ctx.db.get(id);
      patch.session_version = (existing?.session_version ?? 0) + 1;
    }

    await ctx.db.patch(id, patch);

    return id;
  },
});

// Get user by email (useful for auth)
export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

// Delete user by id
export const remove = internalMutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const setTotp = internalMutation({
  args: {
    id: v.id("users"),
    totp_secret: v.string(),
    totp_enabled: v.boolean(),
    totp_recovery_hashes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, {
      totp_secret: args.totp_secret,
      totp_enabled: args.totp_enabled,
      totp_recovery_hashes: args.totp_recovery_hashes ?? [],
      session_version: (existing?.session_version ?? 0) + 1,
      updated_at: new Date().toISOString(),
    });
    return args.id;
  },
});

export const recordLoginFailure = internalMutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return { locked: false, failed: 0 };
    const max = 5;
    const lockMinutes = 15;
    const failed = (user.login_failed_count || 0) + 1;
    const patch: Record<string, unknown> = {
      login_failed_count: failed,
      updated_at: new Date().toISOString(),
    };
    let locked = false;
    if (failed >= max) {
      patch.locked_until = new Date(Date.now() + lockMinutes * 60 * 1000).toISOString();
      locked = true;
    }
    await ctx.db.patch(args.id, patch);
    return { locked, failed, locked_until: patch.locked_until as string | undefined };
  },
});

export const clearLoginLock = internalMutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      login_failed_count: 0,
      locked_until: undefined,
      updated_at: new Date().toISOString(),
    });
    return args.id;
  },
});

export const clearTotp = internalMutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, {
      totp_secret: undefined,
      totp_enabled: false,
      totp_recovery_hashes: [],
      session_version: (existing?.session_version ?? 0) + 1,
      updated_at: new Date().toISOString(),
    });
    return args.id;
  },
});

export const replaceRecoveryHashes = internalMutation({
  args: {
    id: v.id("users"),
    totp_recovery_hashes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      totp_recovery_hashes: args.totp_recovery_hashes,
      updated_at: new Date().toISOString(),
    });
    return args.id;
  },
});