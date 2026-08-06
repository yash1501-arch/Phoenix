import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  adventures: defineTable({
    title: v.string(),
    description: v.string(),
    location: v.string(),
    price: v.number(),
    duration: v.string(),
    difficulty: v.string(),
    category: v.optional(v.string()), // 'trek', 'camping', 'tour', 'general'
    endurance_level: v.optional(v.string()),
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
      activities: v.optional(v.array(v.string())),
      meals: v.optional(v.array(v.string())),
      accommodation: v.optional(v.string()),
    }))),
    images: v.optional(v.array(v.string())),
    available_dates: v.optional(v.array(v.string())),
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
    role: v.string(), // 'admin', 'user'
    avatar_url: v.optional(v.string()),
    totp_secret: v.optional(v.string()),
    totp_enabled: v.optional(v.boolean()),
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
    amount: v.number(),
    booking_status: v.string(), // draft, pending_payment, payment_submitted, confirmed, payment_failed, rejected, expired, cancelled
    payment_method: v.string(),
    seat_hold_expires_at: v.string(),
    customer_name: v.optional(v.string()),
    customer_email: v.optional(v.string()),
    customer_phone: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
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
});