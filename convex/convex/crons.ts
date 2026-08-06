import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Release seats when holds expire without a new booking on that date
crons.interval(
  "expire stale booking holds",
  { minutes: 5 },
  internal.bookings.expireStaleHolds
);

export default crons;
