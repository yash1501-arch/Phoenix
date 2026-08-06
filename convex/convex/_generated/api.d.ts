/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adventures from "../adventures.js";
import type * as auditLog from "../auditLog.js";
import type * as blog from "../blog.js";
import type * as bookings from "../bookings.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as newsletter from "../newsletter.js";
import type * as reviews from "../reviews.js";
import type * as settings from "../settings.js";
import type * as users from "../users.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adventures: typeof adventures;
  auditLog: typeof auditLog;
  blog: typeof blog;
  bookings: typeof bookings;
  contact: typeof contact;
  crons: typeof crons;
  newsletter: typeof newsletter;
  reviews: typeof reviews;
  settings: typeof settings;
  users: typeof users;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
