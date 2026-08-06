import { internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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
  args: {},
  handler: async (ctx) => {
    const today = todayStr();
    const in14Days = addDays(today, 14);
    const weekAgo = addDays(today, -7);
    const monthStart = `${today.slice(0, 7)}-01`;

    const [adventures, bookings, reviews, messages, posts, payments] = await Promise.all([
      ctx.db.query("adventures").collect(),
      ctx.db.query("bookings").collect(),
      ctx.db.query("reviews").collect(),
      ctx.db.query("contact_messages").collect(),
      ctx.db.query("blog_posts").collect(),
      ctx.db.query("payments").collect(),
    ]);

    const activeAdventures = adventures.filter((a) => a.status === "active").length;
    const draftAdventures = adventures.filter((a) => a.status === "draft").length;
    const publishedPosts = posts.filter((p) => p.published).length;
    const newMessages = messages.filter((m) => m.status === "new").length;
    const pendingReviews = reviews.filter((r) => !r.approved);

    const pendingPaymentRows = payments.filter((p) => p.payment_status === "submitted_by_customer");
    let pendingPaymentsCount = 0;
    for (const payment of pendingPaymentRows) {
      const booking = await ctx.db.get(payment.booking_id as Id<"bookings">);
      if (booking?.booking_status === "payment_submitted") pendingPaymentsCount += 1;
    }

    let revenueWeek = 0;
    let revenueMonth = 0;
    let pendingRevenue = 0;
    let confirmedBookingsWeek = 0;

    for (const b of bookings) {
      const amount = Number(b.amount) || 0;
      const day = (b.updated_at || b.created_at).slice(0, 10);
      if (b.booking_status === "confirmed") {
        if (day >= weekAgo) {
          revenueWeek += amount;
          confirmedBookingsWeek += 1;
        }
        if (day >= monthStart) revenueMonth += amount;
      } else if (b.booking_status === "payment_submitted") {
        pendingRevenue += amount;
      }
    }

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

    return {
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
      },
      revenue: {
        week: revenueWeek,
        month: revenueMonth,
        pending: pendingRevenue,
      },
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
