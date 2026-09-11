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

async function getAdvancePerPerson(ctx: any) {
  const row = await ctx.db
    .query("settings")
    .withIndex("key", (q: any) => q.eq("key", "advance_per_person"))
    .first();
  const parsed = parseFloat(row?.value || "1000");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1000;
}

async function getCancellationWindowDays(ctx: any) {
  const row = await ctx.db
    .query("settings")
    .withIndex("key", (q: any) => q.eq("key", "cancellation_window_days"))
    .first();
  const parsed = parseInt(row?.value || "14", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 14;
}

function resolveAdvancePerPerson(adventure: any, settingsAdvance: number) {
  const raw = adventure?.advance_per_person;
  if (raw !== undefined && raw !== null) {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return settingsAdvance;
}

function daysUntilDeparture(adventureDate: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dep = Date.parse(`${adventureDate}T00:00:00.000Z`);
  if (Number.isNaN(dep)) return 0;
  return Math.floor((dep - today.getTime()) / (24 * 60 * 60 * 1000));
}

function money(n: number) {
  return Math.round(Number(n) * 100) / 100;
}

function isTourAdventure(adventure: any) {
  return String(adventure?.category || "").toLowerCase() === "tour";
}

function paymentKindFromType(paymentType: string | undefined) {
  return paymentType === "advance" ? "advance" : "full";
}

async function listPaymentsForBooking(ctx: any, bookingId: string) {
  return await ctx.db
    .query("payments")
    .withIndex("booking_id", (q: any) => q.eq("booking_id", bookingId))
    .collect();
}

function pickPrimaryPayment(payments: any[]) {
  if (!Array.isArray(payments) || payments.length === 0) return null;
  return (
    payments.find((p) => p.payment_kind !== "balance") ||
    payments[0]
  );
}

function pickBalancePayment(payments: any[]) {
  if (!Array.isArray(payments)) return null;
  return payments.find((p) => p.payment_kind === "balance") || null;
}

/** Resolve train/room selections and compute amount due now vs full total.
 *
 * payment_preference: 'advance' | 'full' | undefined
 *   - Tours:     default to 'advance' when advance_per_person > 0 (existing behaviour).
 *   - Non-tours: default to 'full'. Advance applied only when payment_preference === 'advance'
 *                AND advance_per_person > 0.
 *   - Passing 'full' forces full payment for any adventure type.
 */
function findPricingGroup(adventure: any, groupKey: string) {
  const groups = Array.isArray(adventure?.pricing_options) ? adventure.pricing_options : [];
  return groups.find((g: any) => String(g.group) === groupKey);
}

function extraForTrainChoice(adventure: any, choiceId: string) {
  const train = findPricingGroup(adventure, "train");
  if (!train || !choiceId) return 0;
  const choice = (train.choices || []).find((c: any) => String(c.id) === String(choiceId));
  return Math.max(0, Number(choice?.extra_per_person) || 0);
}

function computeTourAwareAmounts(
  adventure: any,
  seats: number,
  selections: { group: string; choice_id: string }[] | undefined,
  advancePerPerson: number,
  payment_preference?: "advance" | "full",
  participantTravelCoaches?: string[]
) {
  const base = Number(adventure.price) || 0;
  if (base <= 0) throw new Error("Adventure price is not set");

  const adv = Math.max(0, Number(advancePerPerson) || 0);
  // Tours default to advance; non-tours default to full unless explicitly requested
  const wantsAdvance =
    payment_preference === "advance" ||
    (payment_preference !== "full" && isTourAdventure(adventure));

  if (!isTourAdventure(adventure)) {
    const full = money(base * seats);
    if (wantsAdvance && adv > 0) {
      const amountDue = money(Math.min(adv * seats, full));
      return {
        amount: amountDue,
        total_amount: full,
        balance_due: money(full - amountDue),
        payment_type: (amountDue < full ? "advance" : "full") as "advance" | "full",
        selected_options: [] as {
          group: string;
          choice_id: string;
          label: string;
          extra_per_person: number;
        }[],
      };
    }
    return {
      amount: full,
      total_amount: full,
      balance_due: 0,
      payment_type: "full" as const,
      selected_options: [] as {
        group: string;
        choice_id: string;
        label: string;
        extra_per_person: number;
      }[],
    };
  }

  const coaches = Array.isArray(participantTravelCoaches)
    ? participantTravelCoaches.map((c) => String(c || "").trim()).filter(Boolean)
    : [];

  const groups = Array.isArray(adventure.pricing_options)
    ? adventure.pricing_options
    : [];
  const picked = Array.isArray(selections) ? selections : [];
  const byGroup: Record<string, string> = {};
  for (const s of picked) {
    if (s?.group && s?.choice_id) byGroup[s.group] = s.choice_id;
  }

  const selected_options: {
    group: string;
    choice_id: string;
    label: string;
    extra_per_person: number;
  }[] = [];

  let total: number;

  if (coaches.length === seats) {
    let trainExtraSum = 0;
    const train = findPricingGroup(adventure, "train");
    const trainLines: string[] = [];
    for (const choiceId of coaches) {
      const extra = extraForTrainChoice(adventure, choiceId);
      trainExtraSum += extra;
      const choice = (train?.choices || []).find((c: any) => String(c.id) === choiceId);
      if (choice) {
        trainLines.push(`${choice.label}${extra > 0 ? ` (+₹${extra})` : ""}`);
      }
    }

    for (const g of groups) {
      const groupKey = String(g.group || "").trim();
      if (!groupKey || groupKey === "train") continue;
      const choices = Array.isArray(g.choices) ? g.choices : [];
      if (choices.length === 0) continue;
      const choiceId = byGroup[groupKey];
      const required = g.required !== false;
      if (!choiceId) {
        if (required) throw new Error(`Please select ${g.label || groupKey}`);
        continue;
      }
      const choice = choices.find((c: any) => String(c.id) === choiceId);
      if (!choice) throw new Error(`Invalid option for ${g.label || groupKey}`);
      const extra = Math.max(0, Number(choice.extra_per_person) || 0);
      selected_options.push({
        group: groupKey,
        choice_id: String(choice.id),
        label: `${g.label || groupKey}: ${choice.label}`,
        extra_per_person: extra,
      });
    }

    const roomExtraPerPerson = selected_options.reduce(
      (sum, o) => sum + Math.max(0, Number(o.extra_per_person) || 0),
      0
    );

    if (train && trainLines.length) {
      selected_options.push({
        group: "train",
        choice_id: "per_person",
        label: `Train: ${trainLines.join("; ")}`,
        extra_per_person: money(trainExtraSum / seats),
      });
    }

    total = money(seats * base + trainExtraSum + roomExtraPerPerson * seats);
  } else {
    let extraPerPerson = 0;
    for (const g of groups) {
      const groupKey = String(g.group || "").trim();
      if (!groupKey) continue;
      const choices = Array.isArray(g.choices) ? g.choices : [];
      if (choices.length === 0) continue;
      const choiceId = byGroup[groupKey];
      const required = g.required !== false;
      if (!choiceId) {
        if (required) throw new Error(`Please select ${g.label || groupKey}`);
        continue;
      }
      const choice = choices.find((c: any) => String(c.id) === choiceId);
      if (!choice) throw new Error(`Invalid option for ${g.label || groupKey}`);
      const extra = Math.max(0, Number(choice.extra_per_person) || 0);
      extraPerPerson += extra;
      selected_options.push({
        group: groupKey,
        choice_id: String(choice.id),
        label: `${g.label || groupKey}: ${choice.label}`,
        extra_per_person: extra,
      });
    }

    for (const p of picked) {
      if (!groups.some((g: any) => String(g.group) === p.group)) {
        throw new Error(`Unknown option group: ${p.group}`);
      }
    }

    total = money((base + extraPerPerson) * seats);
  }

  if (adv <= 0 || !wantsAdvance) {
    return {
      amount: total,
      total_amount: total,
      balance_due: 0,
      payment_type: "full" as const,
      selected_options,
    };
  }
  const amountDue = money(Math.min(adv * seats, total));
  return {
    amount: amountDue,
    total_amount: total,
    balance_due: money(total - amountDue),
    payment_type: (amountDue < total ? "advance" : "full") as "advance" | "full",
    selected_options,
  };
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

const MEAL_PREFERENCES = new Set(["veg", "non_veg", "jain"]);

function buildPickupOptions(adventure: {
  pickup_mumbai?: string[];
  pickup_pune?: string[];
}) {
  const mumbai = adventure.pickup_mumbai || [];
  const pune = adventure.pickup_pune || [];
  const bothRegions = mumbai.length > 0 && pune.length > 0;
  const options: string[] = [];
  for (const point of mumbai) {
    options.push(bothRegions ? `Mumbai — ${point}` : point);
  }
  for (const point of pune) {
    options.push(bothRegions ? `Pune — ${point}` : point);
  }
  return options;
}

export const createManual = internalMutation({
  args: {
    user_id: v.string(),
    adventure_id: v.string(),
    adventure_date: v.string(),
    number_of_seats: v.number(),
    amount: v.number(),
    /** 'advance' | 'full' — caller's explicit payment preference */
    payment_preference: v.optional(v.string()),
    selected_options: v.optional(v.array(v.object({
      group: v.string(),
      choice_id: v.string(),
    }))),
    customer_name: v.optional(v.string()),
    customer_email: v.optional(v.string()),
    customer_phone: v.optional(v.string()),
    emergency_contact: v.optional(v.string()),
    pickup_point: v.optional(v.string()),
    participants: v.optional(v.array(v.object({
      name: v.string(),
      phone: v.string(),
      meal_preference: v.string(),
      pickup_point: v.string(),
      travel_coach: v.optional(v.string()),
    }))),
    additional_travelers: v.optional(v.array(v.object({
      name: v.string(),
      phone: v.string(),
      meal_preference: v.string(),
      pickup_point: v.optional(v.string()),
    }))),
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

    // Close bookings N hours before start (IST). start_time like "20:30", default 08:00
    const cutoffHours = 3;
    const startTimeRaw = (adventure as { start_time?: string }).start_time || "08:00";
    const timeMatch = String(startTimeRaw).trim().match(/^(\d{1,2}):(\d{2})$/);
    const hh = timeMatch ? String(Number(timeMatch[1])).padStart(2, "0") : "08";
    const mm = timeMatch ? timeMatch[2] : "00";
    const startMs = Date.parse(`${args.adventure_date}T${hh}:${mm}:00+05:30`);
    if (!Number.isNaN(startMs)) {
      const cutoffMs = startMs - cutoffHours * 60 * 60 * 1000;
      if (Date.now() >= cutoffMs) {
        throw new Error(
          `Bookings closed ${cutoffHours} hours before start (${hh}:${mm} IST). No more bookings accepted.`
        );
      }
    }

    const emergencyDigits = (args.emergency_contact || "").replace(/\D/g, "");
    if (!emergencyDigits || emergencyDigits.length < 10) {
      throw new Error("Emergency contact number is required");
    }

    const pickupOptions = buildPickupOptions(adventure);
    if (pickupOptions.length === 0) {
      throw new Error("This adventure has no pickup points configured");
    }

    const participantList = args.participants || [];
    if (participantList.length !== args.number_of_seats) {
      throw new Error(`Details required for all ${args.number_of_seats} participant(s)`);
    }

    const sanitizedParticipants = [];
    for (let i = 0; i < participantList.length; i++) {
      const p = participantList[i];
      if (!p.name?.trim()) {
        throw new Error(`Participant ${i + 1}: name is required`);
      }
      const phoneDigits = (p.phone || "").replace(/\D/g, "");
      if (!phoneDigits || phoneDigits.length < 10) {
        throw new Error(`Participant ${i + 1}: valid contact number is required`);
      }
      const meal = (p.meal_preference || "").trim().toLowerCase();
      if (!MEAL_PREFERENCES.has(meal)) {
        throw new Error(`Participant ${i + 1}: invalid meal preference`);
      }
      const pickup = (p.pickup_point || "").trim();
      if (!pickup || !pickupOptions.includes(pickup)) {
        throw new Error(`Participant ${i + 1}: invalid pickup point`);
      }
      const trainGroup = isTourAdventure(adventure)
        ? findPricingGroup(adventure, "train")
        : null;
      const validTrainIds = new Set(
        (trainGroup?.choices || []).map((c: any) => String(c.id)),
      );
      let travel_coach: string | undefined;
      if (trainGroup && validTrainIds.size > 0) {
        travel_coach = String(p.travel_coach || "").trim();
        if (!travel_coach || !validTrainIds.has(travel_coach)) {
          throw new Error(`Participant ${i + 1}: select Sleeper coach or 3AC`);
        }
      }

      sanitizedParticipants.push({
        name: p.name.trim(),
        phone: p.phone.trim(),
        meal_preference: meal,
        pickup_point: pickup,
        ...(travel_coach ? { travel_coach } : {}),
      });
    }

    const participantTravelCoaches = sanitizedParticipants
      .map((p) => p.travel_coach)
      .filter(Boolean) as string[];

    const pickupPoint = sanitizedParticipants[0].pickup_point;
    const extraTravelers = sanitizedParticipants.slice(1);

    const maxParticipants = adventure.max_participants || 50;
    await expireStaleHoldsForDate(ctx, args.adventure_id, args.adventure_date);
    await reserveSeats(ctx, args.adventure_id, args.adventure_date, maxParticipants, args.number_of_seats);

    const settingsAdvance = await getAdvancePerPerson(ctx);
    const advancePerPerson = resolveAdvancePerPerson(adventure, settingsAdvance);
    const priced = computeTourAwareAmounts(
      adventure,
      args.number_of_seats,
      args.selected_options,
      advancePerPerson,
      args.payment_preference as "advance" | "full" | undefined,
      participantTravelCoaches.length === args.number_of_seats
        ? participantTravelCoaches
        : undefined
    );
    if (priced.amount <= 0) {
      throw new Error("Adventure price is not set");
    }
    if (Math.abs(args.amount - priced.amount) > 0.01) {
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
      amount: priced.amount,
      total_amount: priced.total_amount,
      balance_due: priced.balance_due,
      payment_type: priced.payment_type,
      selected_options: priced.selected_options,
      booking_status: "pending_payment",
      payment_method: "upi_manual",
      seat_hold_expires_at: holdExpiresAt(holdMinutes),
      customer_name: args.customer_name,
      customer_email: args.customer_email,
      customer_phone: args.customer_phone,
      emergency_contact: args.emergency_contact?.trim(),
      pickup_point: pickupPoint,
      participants: sanitizedParticipants,
      additional_travelers: extraTravelers.map((t) => ({
        name: t.name,
        phone: t.phone,
        meal_preference: t.meal_preference,
        pickup_point: t.pickup_point,
      })),
      created_at: ts,
      updated_at: ts,
    });

    await ctx.db.insert("payments", {
      booking_id: bookingId,
      method: "upi_manual",
      amount: priced.amount,
      payment_status: "pending",
      payment_kind: paymentKindFromType(priced.payment_type),
      created_at: ts,
      updated_at: ts,
    });

    const heldAfter = await countHeldSeats(ctx, args.adventure_id, args.adventure_date);
    if (heldAfter > maxParticipants) {
      throw new Error("Not enough seats available for this date");
    }

    return {
      id: bookingId,
      booking_code: bookingCode,
      amount: priced.amount,
      total_amount: priced.total_amount,
      balance_due: priced.balance_due,
      payment_type: priced.payment_type,
    };
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
  args: {
    user_id: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const byUser = await ctx.db
      .query("bookings")
      .withIndex("user_id", (q) => q.eq("user_id", args.user_id))
      .collect();

    const byId = new Map<string, any>();
    for (const b of byUser) {
      byId.set(b._id, b);
    }

    // Legacy / mismatch safety: also include bookings with the same customer email
    const emailNorm = String(args.email || "")
      .trim()
      .toLowerCase();
    if (emailNorm) {
      const all = await ctx.db.query("bookings").collect();
      for (const b of all) {
        if (byId.has(b._id)) continue;
        if (String(b.customer_email || "").trim().toLowerCase() === emailNorm) {
          byId.set(b._id, b);
        }
      }
    }

    const result = [];
    for (const b of byId.values()) {
      const active = readBookingState(b);
      let adventure = null;
      try {
        adventure = await ctx.db.get(active.adventure_id as Id<"adventures">);
      } catch {
        adventure = null;
      }
      const payment = await ctx.db
        .query("payments")
        .withIndex("booking_id", (q) => q.eq("booking_id", b._id))
        .first();
      result.push({
        ...active,
        adventure: adventure
          ? {
              _id: adventure._id,
              title: adventure.title,
              location: adventure.location,
              image_url: adventure.image_url,
              category: adventure.category,
              duration: adventure.duration,
            }
          : null,
        payment: payment || null,
      });
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
    const payments = await listPaymentsForBooking(ctx, args.booking_id);
    const payment = pickPrimaryPayment(payments);
    const balancePayment = pickBalancePayment(payments);
    const adventure = await ctx.db.get(
      activeBooking.adventure_id as Id<"adventures">
    );
    const user = await ctx.db.get(activeBooking.user_id as Id<"users">);
    return {
      booking: activeBooking,
      payment,
      payments,
      balance_payment: balancePayment,
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

    const payment = pickPrimaryPayment(await listPaymentsForBooking(ctx, args.booking_id));
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
      payment_kind: payment.payment_kind || paymentKindFromType(active.payment_type),
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
    if (!refreshed) throw new Error("Booking not found");

    const allPayments = await listPaymentsForBooking(ctx, args.booking_id);
    const balanceSubmitted = allPayments.find(
      (p: any) =>
        p.payment_kind === "balance" && p.payment_status === "submitted_by_customer"
    );

    if (refreshed.booking_status === "confirmed" && balanceSubmitted) {
      const ts = nowIso();
      await ctx.db.patch(balanceSubmitted._id, {
        payment_status: "verified",
        verified_by: args.verified_by,
        verified_at: ts,
        updated_at: ts,
      });
      await ctx.db.patch(refreshed._id, {
        balance_due: 0,
        balance_status: "paid",
        updated_at: ts,
      });
      return { success: true, kind: "balance" };
    }

    if (refreshed.booking_status !== "payment_submitted") {
      throw new Error("Booking is not awaiting verification");
    }

    const payment = pickPrimaryPayment(allPayments);
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
      balance_status:
        Number(refreshed.balance_due || 0) > 0 ? "pending" : "paid",
      updated_at: ts,
    });

    // Count confirmed seats after this verification
    const confirmedBookings = await ctx.db
      .query("bookings")
      .withIndex("adventure_date", (q) =>
        q.eq("adventure_id", refreshed.adventure_id).eq("adventure_date", refreshed.adventure_date)
      )
      .collect();
    let confirmedSeats = 0;
    const confirmedList = [];
    for (const b of confirmedBookings) {
      const status = b._id === refreshed._id ? "confirmed" : b.booking_status;
      if (status === "confirmed") {
        confirmedSeats += b.number_of_seats;
        confirmedList.push({ ...b, booking_status: "confirmed" });
      }
    }

    return {
      success: true,
      adventure_id: refreshed.adventure_id,
      adventure_date: refreshed.adventure_date,
      confirmed_seats: confirmedSeats,
      max_participants: maxParticipants,
      is_full: confirmedSeats >= maxParticipants,
      confirmed_bookings: confirmedList,
      adventure,
      kind: "deposit",
    };
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

export const cancelByUser = internalMutation({
  args: {
    booking_id: v.string(),
    user_id: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) throw new Error("Booking not found");
    if (booking.user_id !== args.user_id) {
      throw new Error("Access denied");
    }
    if (["cancelled", "expired", "rejected"].includes(booking.booking_status)) {
      throw new Error("Booking cannot be cancelled");
    }

    const pendingStates = ["pending_payment", "payment_submitted"];
    const isConfirmed = booking.booking_status === "confirmed";
    if (!pendingStates.includes(booking.booking_status) && !isConfirmed) {
      throw new Error("Booking cannot be cancelled in current state");
    }

    if (isConfirmed) {
      const windowDays = await getCancellationWindowDays(ctx);
      const daysLeft = daysUntilDeparture(booking.adventure_date);
      if (daysLeft < windowDays) {
        throw new Error(
          `Cancellations must be at least ${windowDays} days before departure. Contact support on WhatsApp.`
        );
      }
    }

    const payment = await ctx.db
      .query("payments")
      .withIndex("booking_id", (q) => q.eq("booking_id", args.booking_id))
      .first();

    const ts = nowIso();
    const cancelReason = args.reason?.trim() || "Cancelled by customer";
    if (payment && payment.payment_status !== "verified") {
      await ctx.db.patch(payment._id, {
        payment_status: "rejected",
        rejection_reason: cancelReason,
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
      const isBalance = payment.payment_kind === "balance";
      if (!isBalance && activeBooking.booking_status !== "payment_submitted") {
        continue;
      }
      if (isBalance && activeBooking.booking_status !== "confirmed") {
        continue;
      }

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

export const submitBalancePayment = internalMutation({
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
    if (booking.booking_status !== "confirmed") {
      throw new Error("Balance can only be paid after the booking is confirmed");
    }
    const due = Number(booking.balance_due || 0);
    if (due <= 0) throw new Error("No remaining balance on this booking");
    if (booking.balance_status === "submitted") {
      throw new Error("Balance payment is already under review");
    }

    const upiRef = args.upi_reference.trim();
    if (!upiRef) throw new Error("UPI reference is required");
    const duplicate = await ctx.db
      .query("payments")
      .withIndex("upi_reference", (q) => q.eq("upi_reference", upiRef))
      .first();
    if (duplicate && duplicate.booking_id !== args.booking_id) {
      throw new Error("This UPI reference was already used for another booking");
    }

    const existing = pickBalancePayment(await listPaymentsForBooking(ctx, args.booking_id));
    const ts = nowIso();
    const patch = {
      upi_reference: upiRef,
      payer_name: args.payer_name.trim(),
      payer_upi_id: args.payer_upi_id?.trim(),
      screenshot_url: args.screenshot_url,
      screenshot_public_id: args.screenshot_public_id,
      payment_status: "submitted_by_customer",
      payment_kind: "balance",
      submitted_at: ts,
      updated_at: ts,
    };
    if (existing && existing.payment_status !== "verified") {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("payments", {
        booking_id: args.booking_id,
        method: "upi_manual",
        amount: due,
        ...patch,
        created_at: ts,
      });
    }
    await ctx.db.patch(booking._id, {
      balance_status: "submitted",
      updated_at: ts,
    });
    return { success: true };
  },
});

export const patchDeliveryWarnings = internalMutation({
  args: {
    booking_id: v.string(),
    warnings: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) return null;
    await ctx.db.patch(booking._id, {
      delivery_warnings: args.warnings,
      updated_at: nowIso(),
    });
    return booking._id;
  },
});

export const listDueReminders = internalQuery({
  args: {},
  handler: async (ctx) => {
    const confirmed = await ctx.db
      .query("bookings")
      .withIndex("booking_status", (q) => q.eq("booking_status", "confirmed"))
      .collect();
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);
    const preDeparture: any[] = [];
    const reviewNudge: any[] = [];
    const balanceDue: any[] = [];

    for (const b of confirmed) {
      const adventure = await ctx.db.get(b.adventure_id as Id<"adventures">);
      const date = String(b.adventure_date || "");
      const days = daysUntilDeparture(date);
      if (!b.pre_departure_notified_at && days >= 0 && days <= 1) {
        preDeparture.push({ booking: b, adventure });
      }
      if (!b.review_nudge_sent_at && date < todayKey) {
        const existingReview = await ctx.db
          .query("reviews")
          .withIndex("booking_id", (q) => q.eq("booking_id", String(b._id)))
          .first();
        if (!existingReview) reviewNudge.push({ booking: b, adventure });
      }
      if (
        Number(b.balance_due || 0) > 0 &&
        b.balance_status !== "submitted" &&
        b.balance_status !== "paid" &&
        !b.balance_reminder_sent_at &&
        days >= 0 &&
        days <= 7
      ) {
        balanceDue.push({ booking: b, adventure });
      }
    }
    return { preDeparture, reviewNudge, balanceDue };
  },
});

export const markReminderSent = internalMutation({
  args: {
    booking_id: v.string(),
    field: v.string(),
  },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.booking_id as Id<"bookings">);
    if (!booking) return null;
    const allowed = new Set([
      "pre_departure_notified_at",
      "review_nudge_sent_at",
      "balance_reminder_sent_at",
    ]);
    if (!allowed.has(args.field)) throw new Error("Invalid reminder field");
    await ctx.db.patch(booking._id, {
      [args.field]: nowIso(),
      updated_at: nowIso(),
    });
    return booking._id;
  },
});
