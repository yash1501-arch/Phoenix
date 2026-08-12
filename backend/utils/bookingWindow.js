/**
 * Booking window helpers (IST / Asia/Kolkata).
 * Bookings close BOOKING_CUTOFF_HOURS before adventure start_time on the selected date.
 */

const BOOKING_CUTOFF_HOURS = Number(process.env.BOOKING_CUTOFF_HOURS || 3);
const DEFAULT_START_TIME = '08:00'; // if admin hasn't set start_time

function normalizeStartTime(raw) {
  if (!raw || typeof raw !== 'string') return DEFAULT_START_TIME;
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return DEFAULT_START_TIME;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return DEFAULT_START_TIME;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * Parse adventure_date (YYYY-MM-DD) + start_time (HH:mm) as IST instant (Date UTC).
 */
function getAdventureStartUtc(adventureDate, startTime) {
  const time = normalizeStartTime(startTime);
  // Interpret as IST by appending +05:30
  return new Date(`${adventureDate}T${time}:00+05:30`);
}

function getBookingCutoffUtc(adventureDate, startTime) {
  const start = getAdventureStartUtc(adventureDate, startTime);
  return new Date(start.getTime() - BOOKING_CUTOFF_HOURS * 60 * 60 * 1000);
}

function isBookingOpen(adventure, adventureDate, now = new Date()) {
  if (!adventureDate || !/^\d{4}-\d{2}-\d{2}$/.test(adventureDate)) {
    return { open: false, reason: 'Invalid adventure date' };
  }
  const cutoff = getBookingCutoffUtc(adventureDate, adventure?.start_time);
  if (Number.isNaN(cutoff.getTime())) {
    return { open: false, reason: 'Invalid start time' };
  }
  if (now.getTime() >= cutoff.getTime()) {
    const start = normalizeStartTime(adventure?.start_time);
    return {
      open: false,
      reason: `Bookings closed ${BOOKING_CUTOFF_HOURS} hours before start (${start} IST).`,
      cutoffIso: cutoff.toISOString(),
      startTime: start,
    };
  }
  return {
    open: true,
    cutoffIso: cutoff.toISOString(),
    startTime: normalizeStartTime(adventure?.start_time),
  };
}

function formatCutoffForDisplay(adventureDate, startTime) {
  const cutoff = getBookingCutoffUtc(adventureDate, startTime);
  return cutoff.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

module.exports = {
  BOOKING_CUTOFF_HOURS,
  DEFAULT_START_TIME,
  normalizeStartTime,
  getAdventureStartUtc,
  getBookingCutoffUtc,
  isBookingOpen,
  formatCutoffForDisplay,
};
