import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  adventures: defineTable({
    title: v.string(),
    description: v.string(),
    location: v.string(),
    price: v.number(),
    /** Tour-only: UPI advance per person (falls back to site setting when unset) */
    advance_per_person: v.optional(v.number()),
    duration: v.string(),
    difficulty: v.string(),
    category: v.optional(v.string()), // 'trek', 'camping', 'tour', 'general'
    /** User-facing city filter: 'mumbai' | 'pune' */
    departure_cities: v.optional(v.array(v.string())),
    endurance_level: v.optional(v.string()),
    base_village: v.optional(v.string()),
    elevation: v.optional(v.string()),
    region: v.optional(v.string()),
    price_note: v.optional(v.string()),
    /** Tour train/room (etc.) choices with per-person extras */
    pricing_options: v.optional(v.array(v.object({
      group: v.string(),
      label: v.string(),
      required: v.optional(v.boolean()),
      choices: v.array(v.object({
        id: v.string(),
        label: v.string(),
        extra_per_person: v.number(),
      })),
    }))),
    things_to_carry: v.optional(v.array(v.string())),
    pickup_mumbai: v.optional(v.array(v.string())),
    pickup_pune: v.optional(v.array(v.string())),
    dos: v.optional(v.array(v.string())),
    donts: v.optional(v.array(v.string())),
    trek_guidelines: v.optional(v.array(v.string())),
    confirmation_pdf_url: v.optional(v.string()),
    image_url: v.optional(v.string()),
    status: v.string(), // 'active', 'inactive'
    max_participants: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviews_count: v.optional(v.number()),
    included: v.optional(v.array(v.string())),
    excluded: v.optional(v.array(v.string())),
    itinerary: v.optional(v.array(v.object({
      day: v.number(),
      title: v.string(),
      description: v.string(),
      schedule: v.optional(v.array(v.object({ time: v.string(), activity: v.string() }))),
      activities: v.optional(v.array(v.string())),
      meals: v.optional(v.array(v.string())),
      accommodation: v.optional(v.string()),
    }))),
    images: v.optional(v.array(v.string())),
    start_time: v.optional(v.string()), // HH:mm IST, e.g. "20:30"
    available_dates: v.optional(v.array(v.string())),
    /** Days after departure when the main event happens (default 1 = event is next day) */
    event_day_offset: v.optional(v.number()),
    /** Meal preferences offered for this adventure: veg | non_veg | jain */
    meal_options: v.optional(v.array(v.string())),
    created_at: v.string(), // ISO string
    updated_at: v.string(), // ISO string
  })
    .index("status", ["status"])
    .index("difficulty", ["difficulty"])
    .index("category", ["category"])
    .index("location", ["location"])
    .index("created_at", ["created_at"]),
  
  users: defineTable({
    email: v.string(),
    name: v.string(),
    password: v.string(), // Hashed password
    role: v.union(v.literal('admin'), v.literal('clerk'), v.literal('user')),
    avatar_url: v.optional(v.string()),
    totp_secret: v.optional(v.string()),
    totp_enabled: v.optional(v.boolean()),
    /** bcrypt hashes of one-time recovery codes (plaintext shown once on enable) */
    totp_recovery_hashes: v.optional(v.array(v.string())),
    session_version: v.optional(v.number()),
    login_failed_count: v.optional(v.number()),
    locked_until: v.optional(v.string()),
    created_at: v.string(), // ISO string
    updated_at: v.optional(v.string()), // ISO string
  }).index("email", ["email"]),

  reviews: defineTable({
    user_id: v.string(),
    adventure_id: v.string(),
    booking_id: v.optional(v.string()),
    rating: v.number(), // 1-5
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
    photos: v.optional(v.array(v.string())),
    approved: v.boolean(), // moderation
    created_at: v.string(),
  }).index("adventure_id", ["adventure_id"])
    .index("user_id", ["user_id"])
    .index("booking_id", ["booking_id"]),

  wishlist: defineTable({
    user_id: v.string(),
    adventure_id: v.string(),
    created_at: v.string(),
  }).index("user_id", ["user_id"])
    .index("adventure_id", ["adventure_id"]),

  newsletter: defineTable({
    email: v.string(),
    status: v.string(), // 'subscribed', 'unsubscribed'
    created_at: v.string(),
  }).index("email", ["email"]),

  audit_log: defineTable({
    actor_id: v.optional(v.string()),
    actor_email: v.optional(v.string()),
    action: v.string(), // 'booking.create', 'booking.cancel', 'adventure.update', etc.
    target_type: v.optional(v.string()), // 'booking', 'adventure', 'user'
    target_id: v.optional(v.string()),
    metadata: v.optional(v.any()),
    created_at: v.string(),
  }).index("actor_id", ["actor_id"])
    .index("action", ["action"]),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
    updated_at: v.string(),
  }).index("key", ["key"]),

  blog_posts: defineTable({
    title: v.string(),
    slug: v.string(),
    excerpt: v.string(),
    content: v.string(), // markdown-lite: paragraphs split by \n\n
    category: v.string(), // 'trail-notes', 'guides', 'news'
    cover_image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    author: v.string(),
    read_time: v.optional(v.number()), // minutes
    published: v.boolean(),
    created_at: v.string(),
    updated_at: v.optional(v.string()),
  }).index("slug", ["slug"])
    .index("published", ["published"])
    .index("category", ["category"]),

  contact_messages: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
    status: v.string(), // 'new', 'read', 'replied', 'archived'
    created_at: v.string(),
  }).index("status", ["status"]),

  bookings: defineTable({
    booking_code: v.string(),
    user_id: v.string(),
    adventure_id: v.string(),
    adventure_date: v.string(),
    number_of_seats: v.number(),
    /** Amount due now (UPI) — full for trek/camping; advance for tours */
    amount: v.number(),
    /** Full trip cost including option extras */
    total_amount: v.optional(v.number()),
    balance_due: v.optional(v.number()),
    payment_type: v.optional(v.string()), // 'full' | 'advance'
    selected_options: v.optional(v.array(v.object({
      group: v.string(),
      choice_id: v.string(),
      label: v.string(),
      extra_per_person: v.number(),
    }))),
    booking_status: v.string(), // draft, pending_payment, payment_submitted, confirmed, payment_failed, rejected, expired, cancelled
    payment_method: v.string(),
    seat_hold_expires_at: v.string(),
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
    created_at: v.string(),
    updated_at: v.string(),
    delivery_warnings: v.optional(v.array(v.string())),
    pre_departure_notified_at: v.optional(v.string()),
    review_nudge_sent_at: v.optional(v.string()),
    balance_reminder_sent_at: v.optional(v.string()),
    /** pending | submitted | paid — remaining tour balance after advance */
    balance_status: v.optional(v.string()),
    /** 10% reward code issued after this booking is confirmed */
    reward_discount_code: v.optional(v.string()),
    /** Discount code applied when creating this booking */
    applied_discount_code: v.optional(v.string()),
    discount_percent: v.optional(v.number()),
  })
    .index("booking_code", ["booking_code"])
    .index("user_id", ["user_id"])
    .index("booking_status", ["booking_status"])
    .index("adventure_date", ["adventure_id", "adventure_date"]),

  payments: defineTable({
    booking_id: v.string(),
    method: v.string(),
    amount: v.number(),
    upi_reference: v.optional(v.string()),
    payer_name: v.optional(v.string()),
    payer_upi_id: v.optional(v.string()),
    screenshot_url: v.optional(v.string()),
    screenshot_public_id: v.optional(v.string()),
    payment_status: v.string(), // pending, submitted_by_customer, verified, rejected, refunded, duplicate
    submitted_at: v.optional(v.string()),
    verified_by: v.optional(v.string()),
    verified_at: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
    /** full | advance | balance */
    payment_kind: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })
    .index("booking_id", ["booking_id"])
    .index("payment_status", ["payment_status"])
    .index("upi_reference", ["upi_reference"]),

  adventure_seat_inventory: defineTable({
    adventure_id: v.string(),
    adventure_date: v.string(),
    max_participants: v.number(),
    reserved_seats: v.number(),
    updated_at: v.string(),
  }).index("adventure_date", ["adventure_id", "adventure_date"]),

  /** Daily site traffic aggregates (anonymous pageviews) */
  analytics_daily: defineTable({
    date: v.string(), // YYYY-MM-DD (IST day key from client/server)
    pageviews: v.number(),
    unique_visitors: v.number(),
    path_counts: v.optional(v.any()), // { "/treks": 12, ... }
  }).index("by_date", ["date"]),

  /** One row per visitor per day — used to count unique visitors */
  analytics_visitors: defineTable({
    date: v.string(),
    visitor_id: v.string(),
  }).index("by_date_visitor", ["date", "visitor_id"]),

  discount_codes: defineTable({
    code: v.string(),
    user_id: v.string(),
    source_booking_id: v.string(),
    percent_off: v.number(),
    expires_at: v.string(),
    used_at: v.optional(v.string()),
    used_on_booking_id: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("code", ["code"])
    .index("user_id", ["user_id"]),

  waitlist: defineTable({
    email: v.string(),
    phone: v.optional(v.string()),
    user_id: v.optional(v.string()),
    adventure_id: v.string(),
    adventure_date: v.optional(v.string()),
    status: v.string(), // waiting | notified | cancelled
    notified_at: v.optional(v.string()),
    created_at: v.string(),
  })
    .index("adventure_id", ["adventure_id"])
    .index("email", ["email"])
    .index("status", ["status"]),
});