/** Date helpers for departure vs event dates and itinerary calendar mapping. */

const ALL_MEAL_OPTIONS = [
    { value: 'veg', label: 'Vegetarian' },
    { value: 'non_veg', label: 'Non-vegetarian' },
    { value: 'jain', label: 'Jain' },
];

export { ALL_MEAL_OPTIONS };

/** Safely parse JSON array fields (images, itinerary, dates) from API responses. */
export function parseJsonList(value, fallback = []) {
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

export function parseItineraryList(adventure) {
    if (!adventure || typeof adventure !== 'object') return [];
    return parseJsonList(adventure.itinerary, []);
}

export function parseISODate(iso) {
    if (!iso || typeof iso !== 'string') return null;
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(Date.UTC(y, m - 1, d));
}

export function addDaysISO(iso, days) {
    const dt = parseISODate(iso);
    if (!dt) return null;
    dt.setUTCDate(dt.getUTCDate() + days);
    const y = dt.getUTCFullYear();
    const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dt.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function formatDateIN(iso, options = {}) {
    const dt = parseISODate(iso);
    if (!dt) return iso || '—';
    return dt.toLocaleDateString('en-IN', {
        weekday: options.weekday ? 'short' : undefined,
        day: 'numeric',
        month: 'short',
        year: options.year ? 'numeric' : undefined,
        timeZone: 'UTC',
        ...options,
    });
}

export function getEventDayOffset(adventure) {
    const raw = adventure?.event_day_offset;
    if (raw === 0 || raw === '0') return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 1;
}

export function getEventDate(departureDate, adventure) {
    if (!departureDate) return null;
    return addDaysISO(departureDate, getEventDayOffset(adventure));
}

export function getDatePair(departureDate, adventure) {
    const departure = departureDate || null;
    const event = departure ? getEventDate(departure, adventure) : null;
    return { departure, event };
}

export function formatDatePair(departureDate, adventure) {
    const { departure, event } = getDatePair(departureDate, adventure);
    if (!departure) return null;
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

export function dayLabel(day) {
    const n = Number(day?.day ?? day);
    if (n === 0) return 'Day 0 · Pickup';
    if (Number.isFinite(n) && n > 0) return `Day ${n}`;
    return 'Day';
}

export function itineraryDayDate(departureDate, dayNum) {
    if (!departureDate) return null;
    const offset = Number(dayNum);
    if (!Number.isFinite(offset)) return null;
    return addDaysISO(departureDate, offset);
}

export function mapItineraryWithDates(itinerary, departureDate) {
    const list = Array.isArray(itinerary) ? itinerary : [];
    return [...list]
        .sort((a, b) => Number(a.day) - Number(b.day))
        .map((day) => ({
            ...day,
            calendar_date: itineraryDayDate(departureDate, day.day),
            calendar_label: (() => {
                const d = itineraryDayDate(departureDate, day.day);
                return d ? formatDateIN(d, { weekday: true, year: true }) : null;
            })(),
        }));
}

export function parseAvailableDates(adventure) {
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

export function formatUpcomingDateEntry(departureDate, adventure) {
    const pair = formatDatePair(departureDate, adventure);
    return {
        date: departureDate,
        departureLabel: pair?.departureLabel || departureDate,
        eventLabel: pair?.eventLabel || null,
        summary: pair?.summary || departureDate,
    };
}

/**
 * Date-accurate itinerary + confirmation payload for one booking.
 * Booking date stays primary; other departures are listed separately at the end.
 */
export function buildBookingItineraryPackage(adventure, bookingDate) {
    const departureDate = String(bookingDate || '').trim() || null;
    const datePair = departureDate ? formatDatePair(departureDate, adventure) : null;
    const itinerary = departureDate
        ? mapItineraryWithDates(parseItineraryList(adventure), departureDate)
        : [];

    const allDates = parseAvailableDates(adventure);
    const upcomingDates = departureDate
        ? allDates.filter((d) => d !== departureDate).map((d) => formatUpcomingDateEntry(d, adventure))
        : allDates.map((d) => formatUpcomingDateEntry(d, adventure));

    const bookingHeadline = departureDate
        ? `Your booking: ${datePair?.departureLabel || departureDate}${
            datePair?.eventLabel ? ` · Event ${datePair.eventLabel}` : ''
        }`
        : null;

    const confirmationIntro = [
        '✅ BOOKING CONFIRMED',
        '',
        bookingHeadline ? `📅 ${bookingHeadline}` : null,
        departureDate
            ? `This confirmation is for ${datePair?.departureLabel || departureDate} — not any other date.`
            : null,
    ].filter(Boolean).join('\n');

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

export function resolveMealOptions(adventure) {
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
    const filtered = ALL_MEAL_OPTIONS.filter((o) => set.has(o.value));
    return filtered.length ? filtered : ALL_MEAL_OPTIONS;
}
