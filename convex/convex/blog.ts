import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

export const create = internalMutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    excerpt: v.string(),
    content: v.string(),
    category: v.string(),
    cover_image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    author: v.string(),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const slug = args.slug ? slugify(args.slug) : slugify(args.title);
    // Ensure unique slug
    const existing = await ctx.db
      .query("blog_posts")
      .withIndex("slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error(`Slug "${slug}" already exists`);

    const readTime = Math.max(1, Math.round(args.content.split(/\s+/).length / 200));
    return await ctx.db.insert("blog_posts", {
      ...args,
      slug,
      read_time: readTime,
      published: args.published ?? false,
      created_at: new Date().toISOString(),
    });
  },
});

export const update = internalMutation({
  args: {
    id: v.id("blog_posts"),
    title: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    category: v.optional(v.string()),
    cover_image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    author: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, content, ...rest } = args;
    const patch: Record<string, any> = { ...rest, updated_at: new Date().toISOString() };
    if (content !== undefined) {
      patch.content = content;
      patch.read_time = Math.max(1, Math.round(content.split(/\s+/).length / 200));
    }
    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = internalMutation({
  args: { id: v.id("blog_posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Public: published posts only
export const getPublished = internalQuery({
  args: { category: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let posts = await ctx.db
      .query("blog_posts")
      .withIndex("published", (q) => q.eq("published", true))
      .collect();
    if (args.category) posts = posts.filter((p) => p.category === args.category);
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (args.limit) posts = posts.slice(0, args.limit);
    return posts;
  },
});

// Public: single post by slug (published only)
export const getBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("blog_posts")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post || !post.published) return null;
    return post;
  },
});

// Admin: all posts including drafts
export const getAll = internalQuery({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("blog_posts").collect();
    posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return posts;
  },
});

export const getById = internalQuery({
  args: { id: v.id("blog_posts") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});
