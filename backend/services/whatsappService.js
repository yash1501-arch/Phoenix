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

function useTextMessages() {
  return process.env.WHATSAPP_USE_TEXT === 'true' || !process.env.WHATSAPP_TEMPLATE_NAME;
}

/**
 * Send a customer WhatsApp: template in production when WHATSAPP_USE_TEXT is not true,
 * otherwise free-form text (local / 24h window).
 */
async function sendCustomerWhatsApp({
  phone,
  textBody,
  templateName,
  templateParams = [],
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { skipped: true, reason: 'not_configured' };
  }
  const to = toWhatsAppNumber(phone);
  if (!to) return { skipped: true, reason: 'no_phone' };

  const name = templateName || process.env.WHATSAPP_TEMPLATE_NAME;
  const preferText = useTextMessages() || !name;

  try {
    if (preferText) {
      return await postWhatsAppMessage({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { preview_url: false, body: String(textBody).slice(0, 4000) },
      });
    }
    const params = templateParams.map((text) => ({
      type: 'text',
      text: String(text ?? '—').slice(0, 1024),
    }));
    return await postWhatsAppMessage({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
        components: [{ type: 'body', parameters: params }],
      },
    });
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error('WhatsApp send failed:', detail);
    if (!preferText && textBody) {
      try {
        logger.warn('Template send failed — falling back to text (may fail outside 24h window)');
        return await postWhatsAppMessage({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { preview_url: false, body: String(textBody).slice(0, 4000) },
        });
      } catch (fallbackErr) {
        return { ok: false, error: fallbackErr.response?.data || fallbackErr.message };
      }
    }
    return { ok: false, error: detail };
  }
}

function buildConfirmationText(userName, adventureTitle, details = {}) {
  const lines = [
    `✅ Booking confirmed`,
    ``,
    `Hi ${userName || 'Adventurer'},`,
    `Your payment is verified and your seats are confirmed.`,
    ``,
    `🏔 ${adventureTitle}`,
    details.bookingCode ? `Booking ID: ${details.bookingCode}` : null,
    details.date ? `Date: ${details.date}` : null,
    details.participants ? `Seats: ${details.participants}` : null,
    details.amountPaid != null ? `Amount paid: ₹${details.amountPaid}` : null,
    details.totalAmount != null && Number(details.totalAmount) !== Number(details.amountPaid)
      ? `Trip total: ₹${details.totalAmount}`
      : null,
    details.balanceDue != null && Number(details.balanceDue) > 0
      ? `Balance due: ₹${details.balanceDue}`
      : null,
    details.location ? `Location: ${details.location}` : null,
    details.meetingPoint ? `Pickup: ${details.meetingPoint}` : null,
    details.travelCoachSummary ? `Train (per person): ${details.travelCoachSummary}` : null,
    details.stayNote ? `Stay: ${details.stayNote}` : null,
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

    const docs = [];
    if (bookingDetails.itineraryPdfUrl) {
      docs.push({
        link: bookingDetails.itineraryPdfUrl,
        filename: bookingDetails.itineraryPdfFilename || 'Phoenix-Itinerary.pdf',
        caption: `Your trip itinerary for ${adventureTitle || 'your adventure'} — day plan, packing & pickups.`,
      });
    }
    if (bookingDetails.confirmationPdfUrl) {
      docs.push({
        link: bookingDetails.confirmationPdfUrl,
        filename: 'Phoenix-Trek-Brochure.pdf',
        caption: `Brochure for ${adventureTitle || 'your adventure'}.`,
      });
    }

    const failedLinks = [];
    for (const doc of docs) {
      const sent = await sendWhatsAppDocument(to, {
        link: doc.link,
        filename: doc.filename,
        caption: doc.caption,
      });
      if (!sent?.ok) {
        logger.error(`WhatsApp document failed (${doc.filename}):`, sent?.error || sent?.reason);
        failedLinks.push(doc);
      }
    }

    if (failedLinks.length) {
      const fallbackBody = [
        `We could not attach the PDF on WhatsApp. Download your itinerary here:`,
        ...failedLinks.map((d) => d.link),
      ].join('\n');
      try {
        await postWhatsAppMessage({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { preview_url: true, body: fallbackBody.slice(0, 4000) },
        });
      } catch (fallbackErr) {
        logger.error('WhatsApp PDF download-link fallback failed:', fallbackErr.response?.data || fallbackErr.message);
      }
    }

    return { ok: true, to, messageId };
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error('WhatsApp booking confirmation failed:', detail);

    const link = bookingDetails.itineraryPdfUrl || bookingDetails.confirmationPdfUrl;
    if (link) {
      try {
        await postWhatsAppMessage({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: {
            preview_url: true,
            body: `Your booking is confirmed. Download your itinerary PDF:\n${link}`.slice(0, 4000),
          },
        });
        return { ok: true, to, fallback: 'download_link' };
      } catch (fallbackErr) {
        logger.error('WhatsApp confirmation fallback failed:', fallbackErr.response?.data || fallbackErr.message);
      }
    }

    return { ok: false, error: detail };
  }
}

async function postWhatsAppMessage(payload) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { skipped: true, reason: 'not_configured' };
  }
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });
  return { ok: true, messageId: res.data?.messages?.[0]?.id, data: res.data };
}

/**
 * Free-form text to admin phone (ADMIN_WHATSAPP). Requires WHATSAPP_USE_TEXT or open session.
 */
async function sendAdminWhatsAppText(body) {
  const phone = process.env.ADMIN_WHATSAPP || process.env.ADMIN_PHONE;
  if (!phone) {
    logger.warn('ADMIN_WHATSAPP not set — skipping admin WhatsApp');
    return { skipped: true, reason: 'no_admin_phone' };
  }
  const to = toWhatsAppNumber(phone);
  if (!to) return { skipped: true, reason: 'invalid_admin_phone' };

  try {
    const result = await postWhatsAppMessage({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: true, body: String(body).slice(0, 4000) },
    });
    if (result.skipped) return result;
    logger.info(`Admin WhatsApp sent to ${to}`);
    return result;
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error('Admin WhatsApp failed:', detail);
    return { ok: false, error: detail };
  }
}

async function sendWhatsAppDocument(phone, { link, filename, caption }) {
  const to = toWhatsAppNumber(phone);
  if (!to) return { skipped: true, reason: 'invalid_phone' };
  if (!link) return { skipped: true, reason: 'no_link' };

  try {
    const result = await postWhatsAppMessage({
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: {
        link,
        filename: filename || 'participants.xlsx',
        caption: caption || 'Participant list',
      },
    });
    return result;
  } catch (error) {
    const detail = error.response?.data || error.message;
    logger.error('WhatsApp document failed:', detail);
    return { ok: false, error: detail };
  }
}

module.exports = {
  sendBookingConfirmationWhatsApp,
  sendAdminWhatsAppText,
  sendWhatsAppDocument,
  sendCustomerWhatsApp,
  toWhatsAppNumber,
  buildConfirmationText,
};
