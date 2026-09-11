import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function todayStr() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function lastDayOfMonth(year: number, month: number) {
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(dim).padStart(2, "0")}`;
}

function resolvePeriod(yearArg?: number, monthArg?: number) {
  const today = todayStr();
  const cy = Number(today.slice(0, 4));
  const cm = Number(today.slice(5, 7));
  let year = Number.isFinite(yearArg) ? Math.floor(yearArg as number) : cy;
  let month = Number.isFinite(monthArg) ? Math.floor(monthArg as number) : cm;
  if (year < 2020) year = 2020;
  if (year > cy + 1) year = cy;
  if (month < 1 || month > 12) month = cm;
  if (year > cy || (year === cy && month > cm)) {
    year = cy;
    month = cm;
  }
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthLast = lastDayOfMonth(year, month);
  const isCurrent = year === cy && month === cm;
  const monthEnd = isCurrent ? today : monthLast;
  const prevMonthEnd = addDays(monthStart, -1);
  const prevMonthStart = `${prevMonthEnd.slice(0, 7)}-01`;
  return {
    today,
    year,
    month,
    monthStart,
    monthEnd,
    prevMonthStart,
    prevMonthEnd,
    isCurrent,
  };
}

function eachDay(start: string, end: string) {
  const days: string[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
}

function seatsForDeparture(
  bookings: Array<{ adventure_id: string; adventure_date: string; booking_status: string; number_of_seats: number }>,
  adventureId: string,
  date: string
) {
  let seats = 0;
  for (const b of bookings) {
    if (b.adventure_id !== adventureId || b.adventure_date !== date) continue;
    if (
      b.booking_status === "confirmed" ||
      b.booking_status === "payment_submitted" ||
      b.booking_status === "pending_payment"
    ) {
      seats += b.number_of_seats;
    }
  }
  return seats;
}

export const getOverview = internalQuery({
  args: {
    year: v.optional(v.number()),
    month: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const period = resolvePeriod(args.year, args.month);
    const {
      today,
      year,
      month,
      monthStart,
      monthEnd,
      prevMonthStart,
      prevMonthEnd,
      isCurrent,
    } = period;

    const in14Days = addDays(today, 14);
    const weekAgo = addDays(today, -7);
    const periodDays = eachDay(monthStart, monthEnd);

    const [adventures, bookings, reviews, messages, posts, payments, users, analyticsDaily] =
      await Promise.all([
        ctx.db.query("adventures").collect(),
        ctx.db.query("bookings").collect(),
        ctx.db.query("reviews").collect(),
        ctx.db.query("contact_messages").collect(),
        ctx.db.query("blog_posts").collect(),
        ctx.db.query("payments").collect(),
        ctx.db.query("users").collect(),
        ctx.db.query("analytics_daily").collect(),
      ]);

    const activeAdventures = adventures.filter((a) => a.status === "active").length;
    const draftAdventures = adventures.filter((a) => a.status === "draft").length;
    const publishedPosts = posts.filter((p) => p.published).length;
    const newMessages = messages.filter((m) => m.status === "new").length;
    const pendingReviews = reviews.filter((r) => !r.approved);
    const newUsersWeek = users.filter((u) => (u.created_at || "").slice(0, 10) >= weekAgo).length;
    const newUsersPeriod = users.filter((u) => {
      const d = (u.created_at || "").slice(0, 10);
      return d >= monthStart && d <= monthEnd;
    }).length;

    const pendingPaymentRows = payments.filter((p) => p.payment_status === "submitted_by_customer");
    let pendingPaymentsCount = 0;
    for (const payment of pendingPaymentRows) {
      const booking = await ctx.db.get(payment.booking_id as Id<"bookings">);
      if (booking?.booking_status === "payment_submitted") pendingPaymentsCount += 1;
    }

    let revenueWeek = 0;
    let revenueMonth = 0;
    let revenuePrevMonth = 0;
    let pendingRevenue = 0;
    let confirmedBookingsWeek = 0;
    let bookingsMonth = 0;
    let bookingsPrevMonth = 0;
    let seatsSoldMonth = 0;
    let revenueAllTime = 0;
    let confirmedAllTime = 0;

    const funnel = {
      pending_payment: 0,
      payment_submitted: 0,
      confirmed: 0,
      expired: 0,
      cancelled: 0,
    };

    const bookingByDay: Record<string, { count: number; revenue: number }> = {};
    for (const d of periodDays) {
      bookingByDay[d] = { count: 0, revenue: 0 };
    }

    const adventureStats: Record<
      string,
      { title: string; bookings: number; revenue: number; seats: number }
    > = {};

    for (const b of bookings) {
      const amount = Number(b.amount) || 0;
      const day = (b.updated_at || b.created_at).slice(0, 10);
      const createdDay = (b.created_at || "").slice(0, 10);

      if (
        createdDay >= monthStart &&
        createdDay <= monthEnd &&
        b.booking_status in funnel
      ) {
        funnel[b.booking_status as keyof typeof funnel] += 1;
      }

      if (b.booking_status === "confirmed") {
        confirmedAllTime += 1;
        revenueAllTime += amount;
        if (day >= weekAgo) {
          revenueWeek += amount;
          confirmedBookingsWeek += 1;
        }
        if (day >= monthStart && day <= monthEnd) {
          revenueMonth += amount;
          bookingsMonth += 1;
          seatsSoldMonth += b.number_of_seats || 0;

          const advId = b.adventure_id;
          if (!adventureStats[advId]) {
            adventureStats[advId] = { title: "", bookings: 0, revenue: 0, seats: 0 };
          }
          adventureStats[advId].bookings += 1;
          adventureStats[advId].revenue += amount;
          adventureStats[advId].seats += b.number_of_seats || 0;
        }
        if (day >= prevMonthStart && day <= prevMonthEnd) {
          revenuePrevMonth += amount;
          bookingsPrevMonth += 1;
        }
        if (createdDay >= monthStart && createdDay <= monthEnd && bookingByDay[createdDay]) {
          bookingByDay[createdDay].count += 1;
          bookingByDay[createdDay].revenue += amount;
        }
      } else if (b.booking_status === "payment_submitted") {
        pendingRevenue += amount;
      }
    }

    for (const adv of adventures) {
      if (adventureStats[adv._id]) adventureStats[adv._id].title = adv.title;
    }

    const top_adventures = Object.entries(adventureStats)
      .map(([id, s]) => ({
        id,
        title: s.title || "Adventure",
        bookings: s.bookings,
        revenue: s.revenue,
        seats: s.seats,
      }))
      .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
      .slice(0, 5);

    const booking_series = periodDays.map((date) => ({
      date,
      count: bookingByDay[date]?.count || 0,
      revenue: bookingByDay[date]?.revenue || 0,
    }));

    analyticsDaily.sort((a, b) => a.date.localeCompare(b.date));
    const yesterday = addDays(today, -1);
    const todayVisit = analyticsDaily.find((d) => d.date === today);
    const yVisit = analyticsDaily.find((d) => d.date === yesterday);
    const weekVisitRows = analyticsDaily.filter((d) => d.date >= weekAgo);
    const monthVisitRows = analyticsDaily.filter(
      (d) => d.date >= monthStart && d.date <= monthEnd
    );

    const sumVisits = (rows: typeof analyticsDaily) =>
      rows.reduce(
        (acc, r) => {
          acc.pageviews += r.pageviews || 0;
          acc.unique_visitors += r.unique_visitors || 0;
          return acc;
        },
        { pageviews: 0, unique_visitors: 0 }
      );

    const weekVisits = sumVisits(weekVisitRows);
    const monthVisits = sumVisits(monthVisitRows);

    const pathTotals: Record<string, number> = {};
    for (const row of monthVisitRows) {
      const counts = (row.path_counts || {}) as Record<string, number>;
      for (const [p, n] of Object.entries(counts)) {
        pathTotals[p] = (pathTotals[p] || 0) + (Number(n) || 0);
      }
    }
    const top_pages = Object.entries(pathTotals)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);

    const visit_series = periodDays.map((date) => {
      const row = analyticsDaily.find((d) => d.date === date);
      return {
        date,
        pageviews: row?.pageviews || 0,
        unique_visitors: row?.unique_visitors || 0,
      };
    });

    const conversion_period =
      monthVisits.unique_visitors > 0
        ? Math.round((bookingsMonth / monthVisits.unique_visitors) * 1000) / 10
        : 0;

    const upcomingDepartures: Array<{
      adventure_id: string;
      title: string;
      location: string;
      date: string;
      seats_booked: number;
      max_participants: number;
    }> = [];

    for (const adv of adventures) {
      if (adv.status !== "active") continue;
      const dates = (adv.available_dates || []).filter((d) => d >= today && d <= in14Days);
      for (const date of dates) {
        upcomingDepartures.push({
          adventure_id: adv._id,
          title: adv.title,
          location: adv.location,
          date,
          seats_booked: seatsForDeparture(bookings, adv._id, date),
          max_participants: adv.max_participants || 50,
        });
      }
    }
    upcomingDepartures.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));

    const actionPayments: Array<{
      booking_id: string;
      booking_code: string;
      adventure_title: string;
      customer_name: string;
      amount: number;
      submitted_at: string;
    }> = [];

    for (const payment of pendingPaymentRows) {
      const booking = await ctx.db.get(payment.booking_id as Id<"bookings">);
      if (!booking || booking.booking_status !== "payment_submitted") continue;
      const adventure = await ctx.db.get(booking.adventure_id as Id<"adventures">);
      const user = await ctx.db.get(booking.user_id as Id<"users">);
      actionPayments.push({
        booking_id: booking._id,
        booking_code: booking.booking_code,
        adventure_title: adventure?.title || "Adventure",
        customer_name: user?.name || booking.customer_name || "Customer",
        amount: booking.amount,
        submitted_at: payment.submitted_at || payment.created_at,
      });
    }
    actionPayments.sort(
      (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
    );

    const actionMessages = messages
      .filter((m) => m.status === "new")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((m) => ({
        id: m._id,
        name: m.name,
        subject: m.subject,
        created_at: m.created_at,
      }));

    const actionReviews: Array<{
      id: string;
      user_name: string;
      adventure_title: string;
      rating: number;
      created_at: string;
    }> = [];

    const pendingReviewSlice = pendingReviews
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    for (const r of pendingReviewSlice) {
      const adventure = await ctx.db.get(r.adventure_id as Id<"adventures">);
      let userName = "Anonymous";
      try {
        const user = await ctx.db.get(r.user_id as Id<"users">);
        if (user?.name) userName = user.name;
      } catch {
        /* ignore */
      }
      actionReviews.push({
        id: r._id,
        user_name: userName,
        adventure_title: adventure?.title || "Adventure",
        rating: r.rating,
        created_at: r.created_at,
      });
    }

    const adventureAlerts: Array<{
      id: string;
      title: string;
      issues: string[];
    }> = [];

    for (const adv of adventures) {
      if (adv.status === "inactive") continue;
      const issues: string[] = [];
      if (adv.status === "draft") issues.push("draft");
      if (!adv.confirmation_pdf_url) issues.push("no_confirmation_pdf");
      const futureDates = (adv.available_dates || []).filter((d) => d >= today);
      if (futureDates.length === 0) issues.push("no_upcoming_dates");
      if (!adv.image_url) issues.push("no_cover_image");
      if (issues.length > 0) {
        adventureAlerts.push({ id: adv._id, title: adv.title, issues });
      }
    }
    adventureAlerts.sort((a, b) => a.title.localeCompare(b.title));

    const recentBookings: Array<{
      id: string;
      booking_code: string;
      adventure_title: string;
      adventure_date: string;
      customer_name: string;
      amount: number;
      seats: number;
      created_at: string;
    }> = [];

    const sortedBookings = [...bookings]
      .filter((b) => b.booking_status === "confirmed")
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    for (const b of sortedBookings.slice(0, 6)) {
      const adventure = await ctx.db.get(b.adventure_id as Id<"adventures">);
      const user = await ctx.db.get(b.user_id as Id<"users">);
      recentBookings.push({
        id: b._id,
        booking_code: b.booking_code,
        adventure_title: adventure?.title || "Adventure",
        adventure_date: b.adventure_date,
        customer_name: user?.name || b.customer_name || "Customer",
        amount: b.amount,
        seats: b.number_of_seats,
        created_at: b.created_at,
      });
    }

    const recentAdventures = [...adventures]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((a) => ({
        id: a._id,
        title: a.title,
        location: a.location,
        duration: a.duration,
        category: a.category,
        status: a.status,
        image_url: a.image_url,
      }));

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    return {
      period: {
        year,
        month,
        label: `${monthNames[month - 1]} ${year}`,
        start: monthStart,
        end: monthEnd,
        is_current: isCurrent,
      },
      counts: {
        adventures: adventures.length,
        active_adventures: activeAdventures,
        draft_adventures: draftAdventures,
        blog_posts: posts.length,
        published_posts: publishedPosts,
        new_messages: newMessages,
        pending_payments: pendingPaymentsCount,
        pending_reviews: pendingReviews.length,
        confirmed_bookings_week: confirmedBookingsWeek,
        users: users.length,
        new_users_week: newUsersWeek,
        new_users_period: newUsersPeriod,
        confirmed_all_time: confirmedAllTime,
      },
      revenue: {
        week: revenueWeek,
        month: revenueMonth,
        prev_month: revenuePrevMonth,
        pending: pendingRevenue,
        all_time: revenueAllTime,
      },
      growth: {
        revenue_change_pct: pctChange(revenueMonth, revenuePrevMonth),
        bookings_month: bookingsMonth,
        bookings_prev_month: bookingsPrevMonth,
        bookings_change_pct: pctChange(bookingsMonth, bookingsPrevMonth),
        seats_sold_month: seatsSoldMonth,
        conversion_week: conversion_period,
        conversion_period,
      },
      visits: {
        today: {
          pageviews: todayVisit?.pageviews || 0,
          unique_visitors: todayVisit?.unique_visitors || 0,
        },
        yesterday: {
          pageviews: yVisit?.pageviews || 0,
          unique_visitors: yVisit?.unique_visitors || 0,
        },
        week: weekVisits,
        month: monthVisits,
        series: visit_series,
        top_pages,
      },
      funnel,
      booking_series,
      top_adventures,
      action_queue: {
        payments: actionPayments.slice(0, 5),
        messages: actionMessages,
        reviews: actionReviews,
      },
      upcoming_departures: upcomingDepartures.slice(0, 8),
      adventure_alerts: adventureAlerts.slice(0, 6),
      recent_bookings: recentBookings,
      recent_adventures: recentAdventures,
    };
  },
});
