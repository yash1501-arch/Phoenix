/** Client-side mirror of backend/utils/tourPricing.js for booking UI totals. */



export function isTour(adventure) {

  return String(adventure?.category || '').toLowerCase() === 'tour';

}



export const DEFAULT_TOUR_PRICING_OPTIONS = [

  {

    group: 'train',

    label: 'Train travel (per person)',

    required: true,

    choices: [

      { id: 'sleeper', label: 'Sleeper coach', extra_per_person: 0 },

      { id: '3ac', label: '3AC', extra_per_person: 1500 },

    ],

  },

  {

    group: 'room',

    label: 'Stay',

    required: true,

    choices: [

      { id: 'triple', label: 'Group stay (3 people per room)', extra_per_person: 0 },

    ],

  },

];



function money(n) {

  return Math.round(Number(n) * 100) / 100;

}



function normalizeSelections(selections) {

  if (!selections) return [];

  if (Array.isArray(selections)) {

    return selections

      .map((s) => ({

        group: String(s.group || '').trim(),

        choice_id: String(s.choice_id || s.id || '').trim(),

      }))

      .filter((s) => s.group && s.choice_id);

  }

  if (typeof selections === 'object') {

    return Object.entries(selections)

      .map(([group, choice_id]) => ({

        group: String(group).trim(),

        choice_id: String(choice_id).trim(),

      }))

      .filter((s) => s.group && s.choice_id);

  }

  return [];

}



export function findPricingGroup(adventure, groupKey) {

  const groups = getPricingOptions(adventure);

  return groups.find((g) => String(g.group) === groupKey);

}



function extraForTrainChoice(adventure, choiceId) {

  const train = findPricingGroup(adventure, 'train');

  if (!train || !choiceId) return 0;

  const choice = (train.choices || []).find((c) => String(c.id) === String(choiceId));

  return Math.max(0, Number(choice?.extra_per_person) || 0);

}



export function resolveAdvancePerPerson(adventure, settingsAdvance = 1000) {

  const raw = adventure?.advance_per_person;

  if (raw !== undefined && raw !== null && raw !== '') {

    const n = Number(raw);

    if (Number.isFinite(n) && n >= 0) return n;

  }

  const fallback = Number(settingsAdvance);

  return Number.isFinite(fallback) && fallback >= 0 ? fallback : 1000;

}



export function getPricingOptions(adventure) {

  const opts = adventure?.pricing_options;

  return Array.isArray(opts) && opts.length > 0 ? opts : [];

}



function resolveRoomSelections(adventure, selections) {

  const groups = getPricingOptions(adventure);

  const picked = normalizeSelections(selections).filter((s) => s.group !== 'train');

  const byGroup = Object.fromEntries(picked.map((p) => [p.group, p.choice_id]));

  let extraPerPerson = 0;

  for (const g of groups) {

    const groupKey = String(g.group || '').trim();

    if (!groupKey || groupKey === 'train') continue;

    const choiceId = byGroup[groupKey];

    if (!choiceId) continue;

    const choice = (g.choices || []).find((c) => String(c.id) === choiceId);

    if (choice) extraPerPerson += Math.max(0, Number(choice.extra_per_person) || 0);

  }

  return extraPerPerson;

}



export function computeBookingAmounts({

  adventure,

  seats,

  selections,

  participantTravelCoaches,

  advancePerPerson,

  payment_preference,

}) {

  const base = Number(adventure?.price) || 0;

  const nSeats = Number(seats) || 0;

  if (base <= 0 || nSeats < 1) {

    return {

      amount: 0,

      total_amount: 0,

      balance_due: 0,

      payment_type: 'full',

      per_person: base,

      extra_per_person: 0,

    };

  }



  const adv = Math.max(0, Number(advancePerPerson) || 0);

  const wantsAdvance =

    payment_preference === 'advance' ||

    (payment_preference !== 'full' && isTour(adventure));



  if (!isTour(adventure)) {

    const full = money(base * nSeats);

    if (wantsAdvance && adv > 0) {

      const amountDue = money(Math.min(adv * nSeats, full));

      return {

        amount: amountDue,

        total_amount: full,

        balance_due: money(full - amountDue),

        payment_type: amountDue < full ? 'advance' : 'full',

        per_person: base,

        extra_per_person: 0,

      };

    }

    return {

      amount: full,

      total_amount: full,

      balance_due: 0,

      payment_type: 'full',

      per_person: base,

      extra_per_person: 0,

    };

  }



  const coaches = Array.isArray(participantTravelCoaches)

    ? participantTravelCoaches.map((c) => String(c || '').trim()).filter(Boolean)

    : [];



  let total;

  let extraPerPerson;



  if (coaches.length === nSeats) {

    const roomExtra = resolveRoomSelections(adventure, selections);

    let trainExtraSum = 0;

    for (const choiceId of coaches) {

      trainExtraSum += extraForTrainChoice(adventure, choiceId);

    }

    total = money(nSeats * base + trainExtraSum + roomExtra * nSeats);

    extraPerPerson = money((total / nSeats) - base);

  } else {

    const groups = getPricingOptions(adventure);

    const byGroup = Object.fromEntries(

      normalizeSelections(selections).map((p) => [p.group, p.choice_id]),

    );

    extraPerPerson = 0;

    for (const g of groups) {

      const choiceId = byGroup[g.group];

      if (!choiceId) continue;

      const choice = (g.choices || []).find((c) => String(c.id) === choiceId);

      if (choice) extraPerPerson += Math.max(0, Number(choice.extra_per_person) || 0);

    }

    total = money((base + extraPerPerson) * nSeats);

  }



  const perPerson = money(total / nSeats);



  if (adv <= 0 || !wantsAdvance) {

    return {

      amount: total,

      total_amount: total,

      balance_due: 0,

      payment_type: 'full',

      per_person: perPerson,

      extra_per_person: extraPerPerson,

    };

  }



  const amountDue = money(Math.min(adv * nSeats, total));

  return {

    amount: amountDue,

    total_amount: total,

    balance_due: money(total - amountDue),

    payment_type: amountDue < total ? 'advance' : 'full',

    per_person: perPerson,

    extra_per_person: extraPerPerson,

  };

}



export function defaultRoomSelection(adventure) {

  const room = findPricingGroup(adventure, 'room');

  const first = room?.choices?.[0]?.id;

  return first ? { room: first } : {};

}



export function defaultTrainCoach(adventure) {

  const train = findPricingGroup(adventure, 'train');

  return train?.choices?.[0]?.id || 'sleeper';

}


