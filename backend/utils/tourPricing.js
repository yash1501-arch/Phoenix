/** Tour advance + train/room option pricing (shared by booking API). */

function isTour(adventure) {
  return String(adventure?.category || '').toLowerCase() === 'tour';
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

function money(n) {
  return Math.round(Number(n) * 100) / 100;
}

/** Per-adventure advance (tours) with global settings fallback. */
function resolveAdvancePerPerson(adventure, settingsAdvance = 1000) {
  const raw = adventure?.advance_per_person;
  if (raw !== undefined && raw !== null && raw !== '') {
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) return n;
  }
  const fallback = Number(settingsAdvance);
  return Number.isFinite(fallback) && fallback >= 0 ? fallback : 1000;
}

/**
 * Resolve selected train/room (etc.) choices against adventure.pricing_options.
 * @returns {{ selected_options: object[], extraPerPerson: number }}
 */
function resolveSelectedOptions(adventure, selections) {
  const groups = Array.isArray(adventure?.pricing_options) ? adventure.pricing_options : [];
  const picked = normalizeSelections(selections);
  const byGroup = Object.fromEntries(picked.map((p) => [p.group, p.choice_id]));
  const resolved = [];
  let extraPerPerson = 0;

  for (const g of groups) {
    const groupKey = String(g.group || '').trim();
    if (!groupKey) continue;
    const choices = Array.isArray(g.choices) ? g.choices : [];
    if (choices.length === 0) continue;

    const choiceId = byGroup[groupKey];
    const required = g.required !== false;
    if (!choiceId) {
      if (required) {
        throw new Error(`Please select ${g.label || groupKey}`);
      }
      continue;
    }
    const choice = choices.find((c) => String(c.id) === choiceId);
    if (!choice) {
      throw new Error(`Invalid option for ${g.label || groupKey}`);
    }
    const extra = Math.max(0, Number(choice.extra_per_person) || 0);
    extraPerPerson += extra;
    resolved.push({
      group: groupKey,
      choice_id: String(choice.id),
      label: `${g.label || groupKey}: ${choice.label}`,
      extra_per_person: extra,
    });
  }

  for (const p of picked) {
    if (!groups.some((g) => String(g.group) === p.group)) {
      throw new Error(`Unknown option group: ${p.group}`);
    }
  }

  return { selected_options: resolved, extraPerPerson };
}

/**
 * Compute payable-now amount vs full trip total.
 *
 * payment_preference: 'advance' | 'full' | undefined
 *   - Tours: default to 'advance' when advance_per_person > 0 (existing behaviour).
 *   - Non-tours (treks, camping, etc.): default to 'full'. If payment_preference is
 *     explicitly 'advance' AND advance_per_person > 0, applies the advance amount.
 *   - Passing 'full' always forces full payment regardless of adventure type.
 */
function computeBookingAmounts({
  adventure,
  seats,
  selections,
  participantTravelCoaches,
  advancePerPerson,
  payment_preference,
}) {
  const base = Number(adventure?.price) || 0;
  if (base <= 0) {
    throw new Error('Adventure price is not set');
  }
  const nSeats = Number(seats) || 0;
  if (nSeats < 1) {
    throw new Error('At least 1 seat required');
  }

  const adv = Math.max(0, Number(advancePerPerson) || 0);
  // Tours default to advance; non-tours default to full unless explicitly requested
  const wantsAdvance = payment_preference === 'advance'
    || (payment_preference !== 'full' && isTour(adventure));

  if (!isTour(adventure)) {
    const full = money(base * nSeats);
    // Apply advance only when the caller explicitly opts in and a rate is configured
    if (wantsAdvance && adv > 0) {
      const amountDue = money(Math.min(adv * nSeats, full));
      return {
        amount: amountDue,
        total_amount: full,
        balance_due: money(full - amountDue),
        payment_type: amountDue < full ? 'advance' : 'full',
        selected_options: [],
        per_person: base,
        extra_per_person: 0,
      };
    }
    return {
      amount: full,
      total_amount: full,
      balance_due: 0,
      payment_type: 'full',
      selected_options: [],
      per_person: base,
      extra_per_person: 0,
    };
  }

  const coaches = Array.isArray(participantTravelCoaches)
    ? participantTravelCoaches.map((c) => String(c || '').trim()).filter(Boolean)
    : [];

  let selected_options;
  let total;

  if (coaches.length === nSeats) {
    const roomSelections = normalizeSelections(selections).filter((s) => s.group !== 'train');
    const { selected_options: roomResolved } = resolveSelectedOptions(adventure, roomSelections);
    let trainExtraSum = 0;
    const train = findPricingGroup(adventure, 'train');
    const trainLines = [];
    for (let i = 0; i < coaches.length; i++) {
      const choiceId = coaches[i];
      const extra = extraForTrainChoice(adventure, choiceId);
      trainExtraSum += extra;
      const choice = (train?.choices || []).find((c) => String(c.id) === choiceId);
      if (choice) {
        trainLines.push(`${choice.label}${extra > 0 ? ` (+₹${extra})` : ''}`);
      }
    }
    const roomExtraPerPerson = roomResolved.reduce(
      (sum, o) => sum + Math.max(0, Number(o.extra_per_person) || 0),
      0
    );
    if (train && trainLines.length) {
      roomResolved.push({
        group: 'train',
        choice_id: 'per_person',
        label: `Train: ${trainLines.join('; ')}`,
        extra_per_person: money(trainExtraSum / nSeats),
      });
    }
    selected_options = roomResolved;
    total = money(nSeats * base + trainExtraSum + roomExtraPerPerson * nSeats);
  } else {
    const { selected_options: resolved, extraPerPerson } = resolveSelectedOptions(adventure, selections);
    selected_options = resolved;
    total = money((base + extraPerPerson) * nSeats);
  }

  const perPerson = money(total / nSeats);
  const extraPerPerson = money(total / nSeats - base);

  if (adv <= 0 || !wantsAdvance) {
    return {
      amount: total,
      total_amount: total,
      balance_due: 0,
      payment_type: 'full',
      selected_options,
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
    selected_options,
    per_person: perPerson,
    extra_per_person: extraPerPerson,
  };
}

/** Sanitize admin-submitted pricing_options before Convex write */
function normalizePricingOptions(input) {
  if (!Array.isArray(input)) return [];
  return input
    .map((g) => {
      const group = String(g.group || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
      const label = String(g.label || g.group || '').trim();
      const choices = (Array.isArray(g.choices) ? g.choices : [])
        .map((c) => ({
          id: String(c.id || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_'),
          label: String(c.label || '').trim(),
          extra_per_person: Math.max(0, Number(c.extra_per_person) || 0),
        }))
        .filter((c) => c.id && c.label);
      return {
        group,
        label,
        required: g.required !== false,
        choices,
      };
    })
    .filter((g) => g.group && g.label && g.choices.length > 0);
}

const DEFAULT_TOUR_PRICING_OPTIONS = [
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

function findPricingGroup(adventure, groupKey) {
  const groups = Array.isArray(adventure?.pricing_options) ? adventure.pricing_options : [];
  return groups.find((g) => String(g.group) === groupKey);
}

function extraForTrainChoice(adventure, choiceId) {
  const train = findPricingGroup(adventure, 'train');
  if (!train || !choiceId) return 0;
  const choice = (train.choices || []).find((c) => String(c.id) === String(choiceId));
  return Math.max(0, Number(choice?.extra_per_person) || 0);
}

module.exports = {
  isTour,
  resolveAdvancePerPerson,
  computeBookingAmounts,
  resolveSelectedOptions,
  normalizePricingOptions,
  DEFAULT_TOUR_PRICING_OPTIONS,
  extraForTrainChoice,
  findPricingGroup,
};
