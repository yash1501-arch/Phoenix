export const DEPARTURE_CITIES = [
  { id: 'all', label: 'All cities' },
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'pune', label: 'Pune' },
];

export const asStringList = (val) => {
  if (Array.isArray(val)) return val.filter(Boolean).map(String);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
      return val.trim() ? [val.trim()] : [];
    }
  }
  return [];
};

export const hasDepartureCity = (adventure, city) => {
  if (!city || city === 'all') return true;
  const mumbai = asStringList(adventure?.pickup_mumbai);
  const pune = asStringList(adventure?.pickup_pune);
  if (city === 'mumbai') return mumbai.length > 0;
  if (city === 'pune') return pune.length > 0;
  return true;
};

export const filterByDepartureCity = (adventures, city) =>
  (adventures || []).filter((adv) => hasDepartureCity(adv, city));

export const buildPickupOptions = (adventure) => {
  const mumbai = asStringList(adventure?.pickup_mumbai);
  const pune = asStringList(adventure?.pickup_pune);
  const bothRegions = mumbai.length > 0 && pune.length > 0;
  const options = [];
  mumbai.forEach((point) => {
    options.push(bothRegions ? `Mumbai — ${point}` : point);
  });
  pune.forEach((point) => {
    options.push(bothRegions ? `Pune — ${point}` : point);
  });
  return options;
};
