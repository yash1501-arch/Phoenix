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
    .index("location", ["location"])
    .index("created_at", ["created_at"]),
  
  users: defineTable({
    email: v.string(),
    name: v.string(),
    password: v.string(), // Hashed password
    role: v.string(), // 'admin', 'user'
    created_at: v.string(), // ISO string
    updated_at: v.string(), // ISO string
  }).index("email", ["email"]),
  
  bookings: defineTable({
    user_id: v.string(),
    adventure_id: v.string(),
    booking_date: v.string(), // ISO string
    participants: v.number(),
    total_amount: v.number(),
    advance_paid: v.optional(v.number()),
    status: v.string(), // 'pending', 'confirmed', 'cancelled', 'completed'
    id_type: v.optional(v.string()), // 'aadhaar', 'pan', 'driving', 'passport'
    id_number: v.optional(v.string()),
    created_at: v.string(), // ISO string
    updated_at: v.string(), // ISO string
  }).index("user_id", ["user_id"])
    .index("adventure_id", ["adventure_id"]),
  
  payments: defineTable({
    booking_id: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.string(), // 'pending', 'completed', 'failed', 'refunded'
    payment_method: v.string(),
    transaction_id: v.string(),
    created_at: v.string(),
  }).index("booking_id", ["booking_id"]),

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
    .index("user_id", ["user_id"]),

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
});