/** Normalize itinerary days for the editor and API (Convex-safe shape). */

function normalizeSchedule(schedule) {
  if (!Array.isArray(schedule)) return [ { time: '', activity: '' } ];
  const rows = schedule
    .map((row) => ({
      time: String(row?.time ?? '').trim(),
      activity: String(row?.activity ?? '').trim(),
    }))
    .filter((row) => row.time || row.activity);
  return rows.length ? rows : [{ time: '', activity: '' }];
}

export function normalizeItineraryDays(itinerary) {
  if (!Array.isArray(itinerary)) return [];
  return itinerary.map((day, index) => {
    const parsed = typeof day?.day === 'string' ? parseInt(day.day, 10) : Number(day?.day);
    const dayNum = Number.isFinite(parsed) && parsed >= 0 ? parsed : index + 1;
    const out = {
      day: dayNum,
      title: String(day?.title ?? day?.Title ?? ''),
      description: String(day?.description ?? day?.Description ?? ''),
      schedule: normalizeSchedule(day?.schedule || day?.Schedule),
      accommodation: String(day?.accommodation ?? day?.Accommodation ?? ''),
    };
    return out;
  });
}
