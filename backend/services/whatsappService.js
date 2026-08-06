const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Normalize Indian / international phone to WhatsApp digits (E.164 without +).
 * Examples: "9372506447" → "919372506447", "+91 93725 06447" → "919372506447"
 */
function toWhatsAppNumber(raw) {
  if (!raw) return null;
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return null;

  // Strip leading 0s from local numbers
  digits = digits.replace(/^0+/, '');

  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  // WhatsApp expects country code + number, typically 11–15 digits
  if (digits.length < 11 || digits.length > 15) {
    logger.warn(`WhatsApp: invalid phone length after normalize (${digits.length}): ${digits}`);
    return null;
  }
  return digits;
}

function buildConfirmationText(userName, adventureTitle, details = {}) {
  const lines = [
    `✅ Adventure booked successfully`,
    ``,
    `Hi ${userName || 'Adventurer'},`,
    `Your payment is verified and your seats are confirmed.`,
    ``,
    `🏔 ${adventureTitle}`,
    details.bookingCode ? `Booking ID: ${details.bookingCode}` : null,
    details.date ? `Date: ${details.date}` : null,
    details.participants ? `Seats: ${details.participants}` : null,
    details.amountPaid != null ? `Amount paid: ₹${details.amountPaid}` : null,
    details.location ? `Location: ${details.location}` : null,
    details.meetingPoint ? `Meeting point: ${details.meetingPoint}` : null,
    ``,
    `Bring a valid government ID. We'll share the exact reporting time on WhatsApp before departure.`,
    ``,
    `Questions? Call +91 93725 06447 / +91 77580 79726`,
    `— Team Phoenix Adventures`,
  ];
  return lines.filter((l) => l !== null).join('\n');
}

/**
 * Send booking confirmation via WhatsApp Cloud API (Meta).
 *
 * Env:
 *   WHATSAPP_TOKEN           — permanent / system user access token
 *   WHATSAPP_PHONE_NUMBER_ID — Phone number ID from Meta Business
 *   WHATSAPP_API_VERSION     — optional, default v21.0
 *   WHATSAPP_TEMPLATE_NAME   — optional approved template (recommended for production)
 *   WHATSAPP_TEMPLATE_LANG   — optional, default en
 *   WHATSAPP_USE_TEXT        — "true" to send free-form text (only works in 24h customer window / test)
 */
async function sendBookingConfirmationWhatsApp(phone, userName, adventureTitle, bookingDetails = {}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    logger.warn('WhatsApp not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID) — skipping WA confirmation');
    return { skipped: true, reason: 'not_configured' };
  }

  const to = toWhatsAppNumber(phone);
  if (!to) {
    logger.warn('WhatsApp: no valid customer phone — skipping WA confirmation');
    return { skipped: true, reason: 'no_phone' };
  }

  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const useText = process.env.WHATSAPP_USE_TEXT === 'true' || !templateName;

  let payload;
  if (useText) {
    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: buildConfirmationText(userName, adventureTitle, bookingDetails),
      },
    };
  } else {
    // Template body params: {{1}} name, {{2}} adventure, {{3}} date, {{4}} booking id, {{5}} seats, {{6}} amount
    const params = [
      userName || 'Adventurer',
      adventureTitle || 'Adventure',
      bookingDetails.date || '—',
      bookingDetails.bookingCode || '—',
      String(bookingDetails.participants ?? '—'),
      bookingDetails.amountPaid != null ? String(bookingDetails.amountPaid) : '—',
    ].map((text) => ({ type: 'text', text: String(text).slice(0, 1024) }));

    payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
        components: [
          {
            type: 'body',
            parameters: params,
          },
        ],
      },
    };
  }

  try {
    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    const messageId = res.data?.messages?.[0]?.id;
    logger.info(`WhatsApp booking confirmation sent to ${to}${messageId ? ` (${messageId})` : ''}`);
    return { ok: true, to, messageId };
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error('WhatsApp booking confirmation failed:', detail);
    return { ok: false, error: detail };
  }
}

module.exports = {
  sendBookingConfirmationWhatsApp,
  toWhatsAppNumber,
  buildConfirmationText,
};
