const MEAL_PREFERENCES = ['veg', 'non_veg', 'jain'];
const { isTour, findPricingGroup } = require('./tourPricing');
const { resolveMealOptions } = require('./adventureDates');

function normalizePhone(raw) {
  if (!raw) return '';
  return String(raw).replace(/\D/g, '');
}

function asStringList(val) {
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
}

function buildPickupOptions(adventure) {
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
}

function validateBookingExtras({
  adventure,
  number_of_seats,
  emergency_contact,
  participants,
}) {
  const seats = parseInt(number_of_seats, 10);
  const emergencyDigits = normalizePhone(emergency_contact);
  if (!emergencyDigits || emergencyDigits.length < 10) {
    return { ok: false, message: 'Emergency contact number is required (min 10 digits)' };
  }

  const pickupOptions = buildPickupOptions(adventure);
  if (pickupOptions.length === 0) {
    return { ok: false, message: 'This adventure has no pickup points configured. Contact support.' };
  }

  const list = Array.isArray(participants) ? participants : [];
  if (list.length !== seats) {
    return {
      ok: false,
      message: `Please provide pickup and meal details for all ${seats} participant(s)`,
    };
  }

  const allowedMeals = new Set(resolveMealOptions(adventure));
  const tour = isTour(adventure);
  const trainGroup = tour ? findPricingGroup(adventure, 'train') : null;
  const validTrainIds = new Set(
    (trainGroup?.choices || []).map((c) => String(c.id)),
  );

  const sanitizedParticipants = [];
  const participantTravelCoaches = [];
  for (let i = 0; i < list.length; i++) {
    const p = list[i] || {};
    const name = String(p.name || '').trim();
    const phoneDigits = normalizePhone(p.phone);
    const meal = String(p.meal_preference || '').trim().toLowerCase();
    const pickup = String(p.pickup_point || '').trim();

    if (!name) {
      return { ok: false, message: `Participant ${i + 1}: name is required` };
    }
    if (!phoneDigits || phoneDigits.length < 10) {
      return { ok: false, message: `Participant ${i + 1}: valid contact number is required` };
    }
    if (!MEAL_PREFERENCES.includes(meal) || !allowedMeals.has(meal)) {
      return { ok: false, message: `Participant ${i + 1}: select a valid meal preference for this adventure` };
    }
    if (!pickup || !pickupOptions.includes(pickup)) {
      return { ok: false, message: `Participant ${i + 1}: select a valid pickup point` };
    }

    let travel_coach;
    if (tour && trainGroup && validTrainIds.size > 0) {
      travel_coach = String(p.travel_coach || '').trim();
      if (!travel_coach || !validTrainIds.has(travel_coach)) {
        return {
          ok: false,
          message: `Participant ${i + 1}: select Sleeper coach or 3AC`,
        };
      }
      participantTravelCoaches.push(travel_coach);
    }

    sanitizedParticipants.push({
      name,
      phone: String(p.phone || '').trim(),
      meal_preference: meal,
      pickup_point: pickup,
      ...(travel_coach ? { travel_coach } : {}),
    });
  }

  return {
    ok: true,
    data: {
      emergency_contact: String(emergency_contact).trim(),
      pickup_point: sanitizedParticipants[0].pickup_point,
      participantTravelCoaches: tour ? participantTravelCoaches : undefined,
      participants: sanitizedParticipants,
      additional_travelers: sanitizedParticipants.slice(1).map((p) => ({
        name: p.name,
        phone: p.phone,
        meal_preference: p.meal_preference,
        pickup_point: p.pickup_point,
      })),
    },
  };
}

module.exports = {
  MEAL_PREFERENCES,
  buildPickupOptions,
  validateBookingExtras,
};
