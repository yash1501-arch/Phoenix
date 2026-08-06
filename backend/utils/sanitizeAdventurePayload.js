/** Fields accepted by convex/convex/adventures.ts create & update mutations */
const ADVENTURE_FIELDS = new Set([
  'title',
  'description',
  'location',
  'price',
  'duration',
  'difficulty',
  'category',
  'endurance_level',
  'base_village',
  'elevation',
  'region',
  'price_note',
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
]);

function normalizeItinerary(itinerary) {
  if (!Array.isArray(itinerary)) return itinerary;
  return itinerary.map((day) => ({
    ...day,
    day: typeof day.day === 'string' ? parseInt(day.day, 10) : day.day,
  }));
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
  return out;
}

module.exports = { pickAdventureFields, normalizeItinerary };
