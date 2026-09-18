/** Fields accepted by convex/convex/adventures.ts create & update mutations */
const ADVENTURE_FIELDS = new Set([
  'title',
  'description',
  'location',
  'price',
  'advance_per_person',
  'duration',
  'difficulty',
  'category',
  'departure_cities',
  'endurance_level',
  'base_village',
  'elevation',
  'region',
  'price_note',
  'pricing_options',
  'things_to_carry',
  'pickup_mumbai',
  'pickup_pune',
  'dos',
  'donts',
  'trek_guidelines',
  'confirmation_pdf_url',
  'image_url',
  'status',
  'max_participants',
  'rating',
  'reviews_count',
  'included',
  'excluded',
  'itinerary',
  'images',
  'available_dates',
  'start_time',
  'event_day_offset',
  'meal_options',
  'contact_phones',
]);

function asStringList(value) {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => String(item ?? '').trim()).filter(Boolean);
}

function normalizeSchedule(schedule) {
  if (!Array.isArray(schedule)) return undefined;
  const rows = schedule
    .map((row) => ({
      time: String(row?.time ?? row?.Time ?? '').trim(),
      activity: String(row?.activity ?? row?.Activity ?? '').trim(),
    }))
    .filter((row) => row.time || row.activity);
  return rows.length ? rows : undefined;
}

function normalizeItinerary(itinerary) {
  if (!Array.isArray(itinerary)) return [];
  return itinerary.map((day, index) => {
    const parsed = typeof day?.day === 'string' ? parseInt(day.day, 10) : Number(day?.day ?? day?.Day);
    const dayNum = Number.isFinite(parsed) && parsed >= 0 ? parsed : index + 1;
    const out = {
      day: dayNum,
      title: String(day?.title ?? day?.Title ?? ''),
      description: String(day?.description ?? day?.Description ?? ''),
    };
    const schedule = normalizeSchedule(day?.schedule);
    if (schedule) out.schedule = schedule;
    if (day?.accommodation != null && String(day.accommodation).trim() !== '') {
      out.accommodation = String(day.accommodation).trim();
    }
    return out;
  });
}

function pickAdventureFields(data) {
  const out = {};
  for (const key of ADVENTURE_FIELDS) {
    if (data[key] !== undefined) {
      out[key] = data[key];
    }
  }
  if (out.itinerary !== undefined) {
    out.itinerary = normalizeItinerary(out.itinerary);
  }
  if (out.meal_options !== undefined) {
    const allowed = new Set(['veg', 'non_veg', 'jain']);
    const list = asStringList(out.meal_options)
      .map((v) => v.toLowerCase())
      .filter((v) => allowed.has(v));
    out.meal_options = list.length ? list : undefined;
  }
  if (out.event_day_offset !== undefined) {
    const n = Number(out.event_day_offset);
    out.event_day_offset = Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
  }
  return out;
}

module.exports = { pickAdventureFields, normalizeItinerary };
