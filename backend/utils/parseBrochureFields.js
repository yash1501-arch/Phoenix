const logger = require('./logger');

const safeJsonParse = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    logger.warn('Failed to JSON.parse brochure field:', err.message);
    return fallback;
  }
};

const STRING_ARRAY_FIELDS = [
  'things_to_carry',
  'pickup_mumbai',
  'pickup_pune',
  'dos',
  'donts',
  'trek_guidelines',
];

const STRING_FIELDS = ['base_village', 'elevation', 'region', 'price_note', 'endurance_level'];

/**
 * Parse trek brochure fields from multipart/form body into adventureData.
 */
function applyBrochureFields(adventureData) {
  for (const key of STRING_ARRAY_FIELDS) {
    if (adventureData[key] !== undefined) {
      const parsed = safeJsonParse(adventureData[key], []);
      adventureData[key] = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    }
  }

  for (const key of STRING_FIELDS) {
    if (adventureData[key] === '') delete adventureData[key];
  }
}

module.exports = { applyBrochureFields, STRING_ARRAY_FIELDS, STRING_FIELDS };
