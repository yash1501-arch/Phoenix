export const DEPARTURE_CITY_OPTIONS = [
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'pune', label: 'Pune' },
];

export function normalizeDepartureCities(input) {
  const list = Array.isArray(input) ? input : [];
  return [...new Set(
    list
      .map((c) => String(c || '').trim().toLowerCase())
      .filter((c) => c === 'mumbai' || c === 'pune'),
  )];
}

/** Infer cities from pickup lists (for older adventures without departure_cities). */
export function inferDepartureCities(adventure) {
  const cities = [];
  const mumbai = Array.isArray(adventure?.pickup_mumbai) ? adventure.pickup_mumbai : [];
  const pune = Array.isArray(adventure?.pickup_pune) ? adventure.pickup_pune : [];
  if (mumbai.filter(Boolean).length > 0) cities.push('mumbai');
  if (pune.filter(Boolean).length > 0) cities.push('pune');
  return cities;
}
