/** Date helpers for departure vs event dates and itinerary calendar mapping. */

const ALL_MEAL_OPTIONS = ['veg', 'non_veg', 'jain'];

function normalizeDepartureDate(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  const match = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : s;
}

function todayIsoUtc() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Future departures only (UTC), optionally excluding the booked departure. */
function filterUpcomingDepartures(dates, excludeDate = null) {
  const today = todayIsoUtc();
  const exclude = excludeDate ? normalizeDepartureDate(excludeDate) : null;
  return [...dates]
    .map((d) => normalizeDepartureDate(d))
    .filter(Boolean)
    .filter((d) => d >= today && (!exclude || d !== exclude));
}

function parseISODate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

function addDaysISO(iso, days) {
  const dt = parseISODate(iso);
  if (!dt) return null;
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateIN(iso, options = {}) {
  const dt = parseISODate(iso);
  if (!dt) return iso || '—';
  const localeOptions = {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  };
  if (options.weekday) localeOptions.weekday = 'short';
  if (options.year) localeOptions.year = 'numeric';
  return dt.toLocaleDateString('en-IN', localeOptions);
}

function getEventDayOffset(adventure) {
  const raw = adventure?.event_day_offset;
  if (raw === 0 || raw === '0') return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

function getEventDate(departureDate, adventure) {
  if (!departureDate) return null;
  return addDaysISO(departureDate, getEventDayOffset(adventure));
}

function formatDatePair(departureDate, adventure) {
  const departure = departureDate || null;
  if (!departure) return null;
  const event = getEventDate(departure, adventure);
  const offset = getEventDayOffset(adventure);
  if (offset === 0 || !event || event === departure) {
    return {
      departureLabel: formatDateIN(departure, { weekday: true, year: true }),
      eventLabel: null,
      summary: `Departure: ${formatDateIN(departure, { weekday: true, year: true })}`,
    };
  }
  return {
    departureLabel: formatDateIN(departure, { weekday: true, year: true }),
    eventLabel: formatDateIN(event, { weekday: true, year: true }),
    summary: `Departure: ${formatDateIN(departure, { weekday: true })} · Event: ${formatDateIN(event, { weekday: true, year: true })}`,
  };
}

function dayLabel(day) {
  const n = Number(day?.day ?? day);
  if (n === 0) return 'Day 0 · Pickup';
  if (Number.isFinite(n) && n > 0) return `Day ${n}`;
  return 'Day';
}

function itineraryDayDate(departureDate, dayNum) {
  if (!departureDate) return null;
  const offset = Number(dayNum);
  if (!Number.isFinite(offset)) return null;
  return addDaysISO(departureDate, offset);
}

function mapItineraryWithDates(itinerary, departureDate) {
  const list = Array.isArray(itinerary) ? itinerary : [];
  return [...list]
    .sort((a, b) => Number(a.day) - Number(b.day))
    .map((day) => {
      const calendarDate = itineraryDayDate(departureDate, day.day);
      return {
        ...day,
        calendar_date: calendarDate,
        calendar_label: calendarDate
          ? formatDateIN(calendarDate, { weekday: true, year: true })
          : null,
      };
    });
}

function parseJsonList(value, fallback = []) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : fallback;
    } catch {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return [trimmed];
      }
      return fallback;
    }
  }
  return fallback;
}

function parseItineraryList(adventure) {
  if (!adventure || typeof adventure !== 'object') return [];
  return parseJsonList(adventure.itinerary, []);
}

function parseAvailableDates(adventure) {
  const raw = adventure?.available_dates;
  let list = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }
  }
  return [...new Set(list.map((d) => String(d).trim()).filter(Boolean))].sort();
}

function formatUpcomingDateEntry(departureDate, adventure) {
  const pair = formatDatePair(departureDate, adventure);
  return {
    date: departureDate,
    departureLabel: pair?.departureLabel || departureDate,
    eventLabel: pair?.eventLabel || null,
    summary: pair?.summary || departureDate,
  };
}

/**
 * Build a date-accurate itinerary + confirmation payload for one booking.
 * Booking date is always primary; other departures are listed separately at the end.
 */
function buildBookingItineraryPackage(adventure, bookingDate) {
  const departureDate = normalizeDepartureDate(bookingDate);
  const datePair = departureDate ? formatDatePair(departureDate, adventure) : null;
  const itinerary = departureDate
    ? mapItineraryWithDates(parseItineraryList(adventure), departureDate)
    : [];

  const allDates = parseAvailableDates(adventure);
  const futureDates = filterUpcomingDepartures(allDates, departureDate);
  const upcomingDates = futureDates.map((d) => formatUpcomingDateEntry(d, adventure));

  const bookingHeadline = departureDate
    ? [
        `Departure: ${datePair?.departureLabel || departureDate}`,
        datePair?.eventLabel ? `Event: ${datePair.eventLabel}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  const confirmationLines = [
    '✅ BOOKING CONFIRMED',
    '',
    bookingHeadline ? `📅 ${bookingHeadline}` : null,
    departureDate && datePair?.eventLabel && datePair.eventLabel !== datePair.departureLabel
      ? `This confirmation is for departure on ${datePair.departureLabel} — not any other date.`
      : departureDate
        ? `This confirmation is for ${datePair?.departureLabel || departureDate} — not any other date.`
        : null,
  ].filter(Boolean);

  const confirmationIntro = confirmationLines.join('\n');

  return {
    bookingDate: departureDate,
    departureDate,
    departureLabel: datePair?.departureLabel || departureDate,
    eventDate: departureDate ? getEventDate(departureDate, adventure) : null,
    eventLabel: datePair?.eventLabel || null,
    dateSummary: datePair?.summary || null,
    bookingHeadline,
    itinerary,
    upcomingDates,
    confirmationIntro,
  };
}

function buildBookingConfirmationText(userName, adventureTitle, details = {}) {
  const lines = [
    details.confirmationIntro || '✅ BOOKING CONFIRMED',
    '',
    `Hi ${userName || 'Adventurer'},`,
    `Your payment is verified and your seats are confirmed.`,
    '',
    `🏔 ${adventureTitle}`,
    details.bookingCode ? `Booking ID: ${details.bookingCode}` : null,
    details.bookingHeadline ? `📅 ${details.bookingHeadline}` : (
      details.departureLabel || details.date
        ? `Your departure: ${details.departureLabel || details.date}`
        : null
    ),
    details.eventLabel ? `Event day: ${details.eventLabel}` : null,
    details.participants ? `Seats: ${details.participants}` : null,
    details.amountPaid != null ? `Amount paid: ₹${details.amountPaid}` : null,
    details.totalAmount != null && Number(details.totalAmount) !== Number(details.amountPaid)
      ? `Trip total: ₹${details.totalAmount}`
      : null,
    details.balanceDue != null && Number(details.balanceDue) > 0
      ? `Balance due: ₹${details.balanceDue}`
      : null,
    details.location ? `Location: ${details.location}` : null,
    details.meetingPoint ? `Pickup: ${details.meetingPoint}` : null,
    details.travelCoachSummary ? `Train (per person): ${details.travelCoachSummary}` : null,
    details.stayNote ? `Stay: ${details.stayNote}` : null,
    '',
    Array.isArray(details.itinerary) && details.itinerary.length
      ? '— Day plan (your dates) —'
      : null,
    ...(Array.isArray(details.itinerary)
      ? details.itinerary.map((day) => {
          const heading = dayLabel(day);
          const title = day.title ? `: ${day.title}` : '';
          const when = day.calendar_label ? ` (${day.calendar_label})` : '';
          return `• ${heading}${title}${when}`;
        })
      : []),
    '',
    Array.isArray(details.upcomingDates) && details.upcomingDates.length
      ? '— This trip runs again on —'
      : null,
    ...(Array.isArray(details.upcomingDates)
      ? details.upcomingDates.map((row) => `• ${row.summary || row.departureLabel}`)
      : []),
    '',
    details.rewardDiscountCode
      ? `🎁 Next trip: use ${details.rewardDiscountCode} for 10% off (valid 30 days).`
      : null,
    `Bring a valid government ID. We'll share the exact reporting time on WhatsApp before departure.`,
    '',
    `Questions? Call +91 93725 06447 / +91 77580 79726`,
    `— Team Phoenix Adventures`,
  ];
  return lines.filter((l) => l !== null).join('\n');
}

function resolveMealOptions(adventure) {
  const raw = adventure?.meal_options;
  let allowed = [];
  if (Array.isArray(raw)) {
    allowed = raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        allowed = parsed.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      allowed = [];
    }
  }
  if (!allowed.length) return ALL_MEAL_OPTIONS;
  const set = new Set(allowed);
  const filtered = ALL_MEAL_OPTIONS.filter((v) => set.has(v));
  return filtered.length ? filtered : ALL_MEAL_OPTIONS;
}

module.exports = {
  ALL_MEAL_OPTIONS,
  normalizeDepartureDate,
  filterUpcomingDepartures,
  addDaysISO,
  formatDateIN,
  formatDatePair,
  getEventDate,
  getEventDayOffset,
  dayLabel,
  itineraryDayDate,
  mapItineraryWithDates,
  parseAvailableDates,
  formatUpcomingDateEntry,
  buildBookingItineraryPackage,
  buildBookingConfirmationText,
  resolveMealOptions,
};
