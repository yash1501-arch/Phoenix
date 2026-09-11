import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

function normalizePath(raw: string) {
  let path = String(raw || "/").trim().split("?")[0].split("#")[0] || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (path.length > 120) path = path.slice(0, 120);
  // Collapse adventure detail IDs for cleaner top-pages
  path = path.replace(/^\/adventure\/[^/]+/, "/adventure/:id");
  path = path.replace(/^\/booking\/[^/]+/, "/booking/:id");
  path = path.replace(/^\/blog\/[^/]+/, "/blog/:slug");
  return path;
}

function isValidVisitorId(id: string) {
  return /^[a-zA-Z0-9_-]{8,64}$/.test(id);
}

/** Record one anonymous pageview from the public site. */
export const recordVisit = internalMutation({
  args: {
    path: v.string(),
    visitor_id: v.string(),
    date: v.optional(v.string()), // YYYY-MM-DD, defaults to UTC today
  },
  handler: async (ctx, args) => {
    if (!isValidVisitorId(args.visitor_id)) {
      throw new Error("Invalid visitor id");
    }
    const path = normalizePath(args.path);
    const date =
      args.date && /^\d{4}-\d{2}-\d{2}$/.test(args.date)
        ? args.date
        : new Date().toISOString().slice(0, 10);

    let daily = await ctx.db
      .query("analytics_daily")
      .withIndex("by_date", (q) => q.eq("date", date))
      .first();

    if (!daily) {
      const id = await ctx.db.insert("analytics_daily", {
        date,
        pageviews: 0,
        unique_visitors: 0,
        path_counts: {},
      });
      daily = await ctx.db.get(id);
    }
    if (!daily) return { ok: false };

    const existingVisitor = await ctx.db
      .query("analytics_visitors")
      .withIndex("by_date_visitor", (q) =>
        q.eq("date", date).eq("visitor_id", args.visitor_id)
      )
      .first();

    let uniqueDelta = 0;
    if (!existingVisitor) {
      await ctx.db.insert("analytics_visitors", {
        date,
        visitor_id: args.visitor_id,
      });
      uniqueDelta = 1;
    }

    const pathCounts = { ...(daily.path_counts || {}) } as Record<string, number>;
    pathCounts[path] = (pathCounts[path] || 0) + 1;

    await ctx.db.patch(daily._id, {
      pageviews: daily.pageviews + 1,
      unique_visitors: daily.unique_visitors + uniqueDelta,
      path_counts: pathCounts,
    });

    return { ok: true };
  },
});

export const getVisitStats = internalQuery({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = Math.min(Math.max(args.days || 30, 1), 90);
    const all = await ctx.db.query("analytics_daily").collect();
    all.sort((a, b) => a.date.localeCompare(b.date));

    const today = new Date().toISOString().slice(0, 10);
    const start = new Date(`${today}T12:00:00.000Z`);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const startStr = start.toISOString().slice(0, 10);

    const series = all.filter((d) => d.date >= startStr);
    const todayRow = all.find((d) => d.date === today);
    const yDate = new Date(`${today}T12:00:00.000Z`);
    yDate.setUTCDate(yDate.getUTCDate() - 1);
    const yesterday = yDate.toISOString().slice(0, 10);
    const yRow = all.find((d) => d.date === yesterday);

    const weekStart = new Date(`${today}T12:00:00.000Z`);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekRows = all.filter((d) => d.date >= weekStartStr);

    const monthStart = `${today.slice(0, 7)}-01`;
    const monthRows = all.filter((d) => d.date >= monthStart);

    const sum = (rows: typeof all) =>
      rows.reduce(
        (acc, r) => {
          acc.pageviews += r.pageviews;
          acc.unique_visitors += r.unique_visitors;
          return acc;
        },
        { pageviews: 0, unique_visitors: 0 }
      );

    const pathTotals: Record<string, number> = {};
    for (const row of series) {
      const counts = (row.path_counts || {}) as Record<string, number>;
      for (const [p, n] of Object.entries(counts)) {
        pathTotals[p] = (pathTotals[p] || 0) + (Number(n) || 0);
      }
    }
    const top_pages = Object.entries(pathTotals)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    return {
      today: {
        pageviews: todayRow?.pageviews || 0,
        unique_visitors: todayRow?.unique_visitors || 0,
      },
      yesterday: {
        pageviews: yRow?.pageviews || 0,
        unique_visitors: yRow?.unique_visitors || 0,
      },
      week: sum(weekRows),
      month: sum(monthRows),
      series: series.map((d) => ({
        date: d.date,
        pageviews: d.pageviews,
        unique_visitors: d.unique_visitors,
      })),
      top_pages,
    };
  },
});
