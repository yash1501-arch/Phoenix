import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const HOLD_MINUTES_DEFAULT = 15;
const ACTIVE_HOLD_STATUSES = new Set(["pending_payment", "payment_submitted"]);

function generateBookingCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "PHX-";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function nowIso() {
  return new Date().toISOString();
}

function holdExpiresAt(minutes = HOLD_MINUTES_DEFAULT) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function getSeatHoldMinutes(ctx: any) {
  const row = await ctx.db
    .query("settings")
    .withIndex("key", (q: any) => q.eq("key", "seat_hold_minutes"))
    .first();
  const parsed = parseInt(row?.value || String(HOLD_MINUTES_DEFAULT), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : HOLD_MINUTES_DEFAULT;
}

async function getOrCreateInventory(
  ctx: any,
  adventureId: string,
  adventureDate: string,
  maxParticipants: number
) {
  let inv = await ctx.db
    .query("adventure_seat_inventory")
    .withIndex("adventure_date", (q: any) =>
      q.eq("adventure_id", adventureId).eq("adventure_date", adventureDate)
    )
    .first();

  if (!inv) {
    const currentHeld = await countHeldSeats(ctx, adventureId, adventureDate);
    const id = await ctx.db.insert("adventure_seat_inventory", {
      adventure_id: adventureId,
      adventure_date: adventureDate,
      max_participants: maxParticipants,
      reserved_seats: currentHeld,
      updated_at: nowIso(),
    });
    inv = await ctx.db.get(id);
  } else if (inv.max_participants !== maxParticipants) {
    await ctx.db.patch(inv._id, {
      max_participants: maxParticipants,
      updated_at: nowIso(),
    });
    inv = { ...inv, max_participants: maxParticipants };
  }

  return inv;
}

async function reserveSeats(
  ctx: any,
  adventureId: string,
  adventureDate: string,
  maxParticipants: number,
  seats: number
) {
  const inv = await getOrCreateInventory(ctx, adventureId, adventureDate, maxParticipants);
  if (inv.reserved_seats + seats > inv.max_participants) {
    throw new Error("Not enough seats available for this date");
  }
  await ctx.db.patch(inv._id, {
    reserved_seats: inv.reserved_seats + seats,
    updated_at: nowIso(),
  });
}

async function releaseSeats(
  ctx: any,
  adventureId: string,
  adventureDate: string,
  seats: number
) {
  const inv = await ctx.db
    .query("adventure_seat_inventory")
    .withIndex("adventure_date", (q: any) =>
      q.eq("adventure_id", adventureId).eq("adventure_date", adventureDate)
    )
    .first();
  if (!inv) return;
  await ctx.db.patch(inv._id, {
    reserved_seats: Math.max(0, inv.reserved_seats - seats),
    updated_at: nowIso(),
  });
}

function isHoldExpired(booking: any): boolean {
  if (!ACTIVE_HOLD_STATUSES.has(booking.booking_status)) return false;
  const expires = new Date(booking.seat_hold_expires_at).getTime();
  return expires <= Date.now();
}

/** Read-only: effective booking state without writing to the database. */
function readBookingState(booking: any) {
  if (!booking) return booking;
  if (isHoldExpired(booking)) {
    return { ...booking, booking_status: "expired" };
  }
  return booking;
}

/** Mutation-only: patch expired holds and release seats. */
async function expireBookingIfNeeded(ctx: any, booking: any) {
  if (!isHoldExpired(booking)) return booking;
  if (booking.booking_status === "expired") return booking;

  await releaseSeats(
    ctx,
    booking.adventure_id,
    booking.adventure_date,
    booking.number_of_seats
  );
  await ctx.db.patch(booking._id, {
    booking_status: "expired",
    updated_at: nowIso(),
  });
  const payment = await ctx.db
    .query("payments")
    .withIndex("booking_id", (q: any) => q.eq("booking_id", booking._id))
    .first();
  if (payment && payment.payment_status === "pending") {
    await ctx.db.patch(payment._id, {
      payment_status: "rejected",
      rejection_reason: "Booking hold expired",
      updated_at: nowIso(),
    });
  }
  return { ...booking, booking_status: "expired" };
}

async function expireStaleHoldsForDate(
  ctx: any,
  adventureId: string,
  adventureDate: string
) {
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("adventure_date", (q: any) =>
      q.eq("adventure_id", adventureId).eq("adventure_date", adventureDate)
    )
    .collect();
  for (const b of bookings) {
    if (isHoldExpired(b)) {
      await expireBookingIfNeeded(ctx, b);
    }
  }
}

async function countHeldSeats(
  ctx: any,
  adventureId: string,
  adventureDate: string,
  excludeBookingId?: string
) {
  const bookings = await ctx.db
    .query("bookings")
    .withIndex("adventure_date", (q: any) =>
      q.eq("adventure_id", adventureId).eq("adventure_date", adventureDate)
    )
    .collect();

  let held = 0;
  for (const raw of bookings) {
    const booking = readBookingState(raw);
    if (excludeBookingId && booking._id === excludeBookingId) continue;
    if (booking.booking_status === "confirmed") {
      held += booking.number_of_seats;
    } else if (ACTIVE_HOLD_STATUSES.has(booking.booking_status)) {
      held += booking.number_of_seats;
    }
  }
  return held;
}

export const createManual = internalMutation({
  args: {
    user_id: v.string(),
    adventure_id: v.string(),
    adventure_date: v.string(),
    number_of_seats: v.number(),
    amount: v.number(),
    customer_name: v.optional(v.string()),
    customer_email: v.optional(v.string()),
    customer_phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.number_of_seats < 1) throw new Error("At least 1 seat required");

    const adventure = await ctx.db.get(args.adventure_id as Id<"adventures">);
    if (!adventure || adventure.status !== "active") {
      throw new Error("Adventure not available");
    }

    const dates = adventure.available_dates || [];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.adventure_date)) {
      throw new Error("Invalid date format");
    }
    // If admin listed departure dates, require one of them; otherwise allow any picked date
    if (dates.length > 0 && !dates.includes(args.adventure_date)) {
      throw new Error("Selected date is not available");
    }

    const maxParticipants = adventure.max_participants || 50;
    await expireStaleHoldsForDate(ctx, args.adventure_id, args.adventure_date);
    await reserveSeats(ctx, args.adventure_id, args.adventure_date, maxParticipants, args.number_of_seats);

    const expectedAmount = (Number(adventure.price) || 0) * args.number_of_seats;
    if (expectedAmount <= 0) {
      throw new Error("Adventure price is not set");
    }
    if (Math.abs(args.amount - expectedAmount) > 0.01) {
      throw new Error("Invalid booking amount");
    }

    let bookingCode = generateBookingCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await ctx.db
        .query("bookings")
        .withIndex("booking_code", (q) => q.eq("booking_code", bookingCode))
        .first();
      if (!existing) break;
      bookingCode = generateBookingCode();
    }

    const ts = nowIso();
    const holdMinutes = await getSeatHoldMinutes(ctx);
    const bookingId = await ctx.db.insert("bookings", {
      booking_code: bookingCode,
      user_id: args.user_id,
      adventure_id: args.adventure_id,
      adventure_date: args.adventure_date,
      number_of_seats: args.number_of_seats,
      amount: args.amount,
      booking_status: "pending_payment",
      payment_method: "upi_manual",
      seat_hold_expires_at: holdExpiresAt(holdMinutes),
      customer_name: args.customer_name,
      customer_email: args.customer_email,
      customer_phone: args.customer_phone,
      created_at: ts,
      updated_at: ts,
    });

    await ctx.db.insert("payments", {
      booking_id: bookingId,
      method: "upi_manual",
      amount: args.amount,
      payment_status: "pending",
      created_at: ts,
      updated_at: ts,
    });

    const heldAfter = await countHeldSeats(ctx, args.adventure_id, args.adventure_date);
    if (heldAfter > maxParticipants) {
      throw new Error("Not enough seats available for this date");
    }

    return { id: bookingId, booking_code: bookingCode };
  },
});

export const getById = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.id as Id<"bookings">);
    if (!booking) return null;
    return readBookingState(booking);
  },
});

export const getByCode = internalQuery({
  args: { booking_code: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db
      .query("bookings")
      .withIndex("booking_code", (q) => q.eq("booking_code", args.booking_code))
      .first();
    if (!booking) return null;
    return readBookingState(booking);
  },
});

export const getByUser = internalQuery({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const bookings = await ctx.db
      .query("bookings")
      .withIndex("user_id", (q) => q.eq("user_id", args.user_id))
      .collect();
    const result = [];
    for (const b of bookings) {
      result.push(readBookingState(b));
    }
    result.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return result;
  },
});

export const getPaymentDetails = internalQuery({
  args: { booking_id: v.string() },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) return null;
    const activeBooking = readBookingState(booking);
    const payment = await ctx.db
      .query("payments")
      .withIndex("booking_id", (q) => q.eq("booking_id", args.booking_id))
      .first();
    const adventure = await ctx.db.get(
      activeBooking.adventure_id as Id<"adventures">
    );
    const user = await ctx.db.get(activeBooking.user_id as Id<"users">);
    return {
      booking: activeBooking,
      payment,
      adventure,
      user: user
        ? {
            name: user.name,
            email: user.email,
            phone: user.phone || activeBooking.customer_phone,
          }
        : {
            name: activeBooking.customer_name,
            email: activeBooking.customer_email,
            phone: activeBooking.customer_phone,
          },
    };
  },
});

export const submitPayment = internalMutation({
  args: {
    booking_id: v.string(),
    upi_reference: v.string(),
    payer_name: v.string(),
    payer_upi_id: v.optional(v.string()),
    screenshot_url: v.optional(v.string()),
    screenshot_public_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) throw new Error("Booking not found");

    await expireStaleHoldsForDate(ctx, booking.adventure_id, booking.adventure_date);
    await expireBookingIfNeeded(ctx, booking);
    const refreshed = await ctx.db.get(args.booking_id as Id<"bookings">);
    const active = readBookingState(refreshed || booking);
    if (active.booking_status === "expired") {
      throw new Error("Booking has expired. Please create a new booking.");
    }
    if (!["pending_payment", "payment_failed"].includes(active.booking_status)) {
      throw new Error("Payment cannot be submitted for this booking");
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("booking_id", (q) => q.eq("booking_id", args.booking_id))
      .first();
    if (!payment) throw new Error("Payment record not found");

    const upiRef = args.upi_reference.trim();
    if (!upiRef) throw new Error("UPI reference is required");

    const duplicate = await ctx.db
      .query("payments")
      .withIndex("upi_reference", (q) => q.eq("upi_reference", upiRef))
      .first();
    if (duplicate && duplicate.booking_id !== args.booking_id) {
      throw new Error("This UPI reference was already used for another booking");
    }

    const ts = nowIso();
    const holdMinutes = await getSeatHoldMinutes(ctx);
    await ctx.db.patch(payment._id, {
      upi_reference: upiRef,
      payer_name: args.payer_name.trim(),
      payer_upi_id: args.payer_upi_id?.trim(),
      screenshot_url: args.screenshot_url,
      screenshot_public_id: args.screenshot_public_id,
      payment_status: "submitted_by_customer",
      submitted_at: ts,
      updated_at: ts,
    });

    await ctx.db.patch(active._id, {
      booking_status: "payment_submitted",
      seat_hold_expires_at: holdExpiresAt(holdMinutes),
      updated_at: ts,
    });

    return { success: true };
  },
});

export const verifyPayment = internalMutation({
  args: {
    booking_id: v.string(),
    verified_by: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) throw new Error("Booking not found");
    await expireStaleHoldsForDate(ctx, booking.adventure_id, booking.adventure_date);
    await expireBookingIfNeeded(ctx, booking);
    const refreshed = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!refreshed || refreshed.booking_status !== "payment_submitted") {
      throw new Error("Booking is not awaiting verification");
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("booking_id", (q) => q.eq("booking_id", args.booking_id))
      .first();
    if (!payment) throw new Error("Payment record not found");

    const held = await countHeldSeats(
      ctx,
      refreshed.adventure_id,
      refreshed.adventure_date,
      refreshed._id
    );
    const adventure = await ctx.db.get(
      refreshed.adventure_id as Id<"adventures">
    );
    const maxParticipants = adventure?.max_participants || 50;
    if (held + refreshed.number_of_seats > maxParticipants) {
      throw new Error("Not enough seats available to confirm this booking");
    }

    const ts = nowIso();
    await ctx.db.patch(payment._id, {
      payment_status: "verified",
      verified_by: args.verified_by,
      verified_at: ts,
      updated_at: ts,
    });
    await ctx.db.patch(refreshed._id, {
      booking_status: "confirmed",
      updated_at: ts,
    });

    return { success: true };
  },
});

export const rejectPayment = internalMutation({
  args: {
    booking_id: v.string(),
    verified_by: v.string(),
    rejection_reason: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) throw new Error("Booking not found");
    if (!["payment_submitted", "pending_payment"].includes(booking.booking_status)) {
      throw new Error("Booking cannot be rejected in current state");
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("booking_id", (q) => q.eq("booking_id", args.booking_id))
      .first();
    if (!payment) throw new Error("Payment record not found");

    const ts = nowIso();
    await ctx.db.patch(payment._id, {
      payment_status: "rejected",
      verified_by: args.verified_by,
      verified_at: ts,
      rejection_reason: args.rejection_reason,
      updated_at: ts,
    });
    await ctx.db.patch(booking._id, {
      booking_status: "rejected",
      updated_at: ts,
    });
    await releaseSeats(ctx, booking.adventure_id, booking.adventure_date, booking.number_of_seats);

    return { success: true };
  },
});

export const releaseBooking = internalMutation({
  args: {
    booking_id: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) throw new Error("Booking not found");
    if (["confirmed", "cancelled", "expired"].includes(booking.booking_status)) {
      throw new Error("Booking cannot be released in current state");
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("booking_id", (q) => q.eq("booking_id", args.booking_id))
      .first();

    const ts = nowIso();
    if (payment && payment.payment_status !== "verified") {
      await ctx.db.patch(payment._id, {
        payment_status: "rejected",
        rejection_reason: args.reason || "Booking cancelled by admin",
        updated_at: ts,
      });
    }
    await ctx.db.patch(booking._id, {
      booking_status: "cancelled",
      updated_at: ts,
    });
    await releaseSeats(ctx, booking.adventure_id, booking.adventure_date, booking.number_of_seats);

    return { success: true };
  },
});

export const listPendingPayments = internalQuery({
  args: {},
  handler: async (ctx) => {
    const payments = await ctx.db
      .query("payments")
      .withIndex("payment_status", (q) =>
        q.eq("payment_status", "submitted_by_customer")
      )
      .collect();

    const results = [];
    for (const payment of payments) {
      const booking = await ctx.db.get(payment.booking_id as Id<"bookings">);
      if (!booking) continue;
      const activeBooking = readBookingState(booking);
      if (activeBooking.booking_status !== "payment_submitted") continue;

      const adventure = await ctx.db.get(
        activeBooking.adventure_id as Id<"adventures">
      );
      const user = await ctx.db.get(activeBooking.user_id as Id<"users">);

      results.push({
        payment,
        booking: activeBooking,
        adventure,
        user: user
          ? { name: user.name, email: user.email }
          : {
              name: activeBooking.customer_name,
              email: activeBooking.customer_email,
            },
      });
    }

    results.sort(
      (a, b) =>
        new Date(b.payment.submitted_at || b.payment.created_at).getTime() -
        new Date(a.payment.submitted_at || a.payment.created_at).getTime()
    );
    return results;
  },
});

export const listAll = internalQuery({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let bookings;
    if (args.status) {
      bookings = await ctx.db
        .query("bookings")
        .withIndex("booking_status", (q) =>
          q.eq("booking_status", args.status!)
        )
        .collect();
    } else {
      bookings = await ctx.db.query("bookings").collect();
    }

    const results = [];
    for (const b of bookings) {
      const active = readBookingState(b);
      const payment = await ctx.db
        .query("payments")
        .withIndex("booking_id", (q) => q.eq("booking_id", b._id))
        .first();
      const adventure = await ctx.db.get(
        active.adventure_id as Id<"adventures">
      );
      const user = await ctx.db.get(active.user_id as Id<"users">);
      results.push({
        booking: active,
        payment,
        adventure,
        user: user
          ? { name: user.name, email: user.email }
          : {
              name: active.customer_name,
              email: active.customer_email,
            },
      });
    }

    results.sort(
      (a, b) =>
        new Date(b.booking.created_at).getTime() -
        new Date(a.booking.created_at).getTime()
    );
    return results;
  },
});

/** Cron-callable: expire all stale seat holds across the system. */
export const expireStaleHolds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const bookings = await ctx.db.query("bookings").collect();
    let expired = 0;
    for (const booking of bookings) {
      if (isHoldExpired(booking)) {
        await expireBookingIfNeeded(ctx, booking);
        expired += 1;
      }
    }
    return { expired };
  },
});
