/** Frontend mirror of booking cutoff (IST). Keep in sync with backend/utils/bookingWindow.js */

export const BOOKING_CUTOFF_HOURS = 3;
export const DEFAULT_START_TIME = '08:00';

export function normalizeStartTime(raw) {
  if (!raw || typeof raw !== 'string') return DEFAULT_START_TIME;
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return DEFAULT_START_TIME;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return DEFAULT_START_TIME;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function getBookingCutoffDate(adventureDate, startTime) {
  const time = normalizeStartTime(startTime);
  const start = new Date(`${adventureDate}T${time}:00+05:30`);
  return new Date(start.getTime() - BOOKING_CUTOFF_HOURS * 60 * 60 * 1000);
}

export function isBookingOpen(adventure, adventureDate, now = new Date()) {
  if (!adventureDate) return { open: false, reason: 'Select a date' };
  const cutoff = getBookingCutoffDate(adventureDate, adventure?.start_time);
  if (Number.isNaN(cutoff.getTime())) return { open: false, reason: 'Invalid start time' };
  if (now.getTime() >= cutoff.getTime()) {
    return {
      open: false,
      reason: `No more bookings accepted. Closed ${BOOKING_CUTOFF_HOURS} hours before start (${normalizeStartTime(adventure?.start_time)} IST).`,
      cutoff,
    };
  }
  return { open: true, cutoff };
}

export function formatCutoffLabel(adventureDate, startTime) {
  const cutoff = getBookingCutoffDate(adventureDate, startTime);
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
