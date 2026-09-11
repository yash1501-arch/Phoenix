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

export function cloneDefaultTourPricingOptions() {
  return JSON.parse(JSON.stringify(DEFAULT_TOUR_PRICING_OPTIONS));
}
