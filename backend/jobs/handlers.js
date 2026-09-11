const {
  sendBookingConfirmation,
  sendPaymentRejectedAlert,
  sendPaymentSubmittedAlert,
  sendParticipantsRoster,
} = require('../services/emailService');
const {
  sendBookingConfirmationWhatsApp,
  sendAdminWhatsAppText,
  sendWhatsAppDocument,
} = require('../services/whatsappService');
const {
  buildParticipantsWorkbook,
  uploadRosterExcel,
} = require('../utils/participantRoster');
const { buildItineraryPdf } = require('../utils/itineraryPdf');
const { uploadRawBuffer } = require('../utils/cloudinaryClient');
const logger = require('../utils/logger');

async function prepareItineraryPdf(confirmationDetails) {
  const adventure = confirmationDetails?.adventure;
  if (!adventure) return {};

  try {
    const generated = await buildItineraryPdf(adventure, { audience: 'customer' });
    const attachment = {
      filename: generated.filename,
      content: generated.buffer,
      contentType: 'application/pdf',
    };

    let itineraryPdfUrl = null;
    try {
      const uploaded = await uploadRawBuffer(generated.buffer, 'application/pdf', {
        folder: 'phoenix_itineraries',
      });
      itineraryPdfUrl = uploaded.secure_url || uploaded.url || null;
    } catch (uploadErr) {
      logger.warn('Could not upload itinerary PDF for WhatsApp:', uploadErr.message);
    }

    return {
      itineraryPdfAttachment: attachment,
      itineraryPdfAttached: true,
      itineraryPdfUrl,
      itineraryPdfFilename: generated.filename,
    };
  } catch (err) {
    logger.warn('Could not build itinerary PDF for confirmation:', err.message);
    return {};
  }
}

async function bookingConfirmation(payload) {
  const {
    customerEmail,
    customerPhone,
    customerName,
    adventureTitle,
    confirmationDetails,
  } = payload;

  const pdfExtras = await prepareItineraryPdf(confirmationDetails);
  const details = { ...confirmationDetails, ...pdfExtras };

  if (customerEmail) {
    try {
      await sendBookingConfirmation(
        customerEmail,
        customerName,
        adventureTitle,
        details
      );
    } catch (err) {
      logger.error('Job email confirmation failed:', err.message);
    }
  }

  if (customerPhone) {
    try {
      const waResult = await sendBookingConfirmationWhatsApp(
        customerPhone,
        customerName,
        adventureTitle,
        details
      );
      if (waResult?.skipped) {
        logger.warn(`WhatsApp skipped: ${waResult.reason || 'unknown'}`);
      } else if (waResult && waResult.ok === false) {
        logger.error('WhatsApp confirmation returned failure:', waResult.error || 'unknown');
      }
    } catch (err) {
      logger.error('Job WhatsApp confirmation failed:', err.message);
    }
  }
}

async function paymentRejected(payload) {
  const { email, name, bookingCode, reason } = payload;
  await sendPaymentRejectedAlert(email, name, bookingCode, reason);
}

async function paymentSubmittedAlert(payload) {
  const { adminEmail, details } = payload;
  if (adminEmail) {
    try {
      await sendPaymentSubmittedAlert(adminEmail, details);
    } catch (err) {
      logger.error('Admin payment email failed:', err.message);
    }
  }

  const waBody = [
    '🔔 New payment received — needs verification',
    '',
    `Booking: ${details.bookingCode || '—'}`,
    `Customer: ${details.customerName || '—'}`,
    `Adventure: ${details.adventureTitle || '—'}`,
    `Amount: ₹${details.amount ?? '—'}`,
    `UTR: ${details.upiReference || '—'}`,
    '',
    'Open Admin → Payments to verify.',
  ].join('\n');

  await sendAdminWhatsAppText(waBody);
}

async function participantsRosterFull(payload) {
  const {
    adminEmail,
    adventure,
    adventureDate,
    bookings,
    maxParticipants,
    reason,
  } = payload;

  const { buffer, rowCount, filename } = await buildParticipantsWorkbook(
    bookings || [],
    adventure
  );

  if (adminEmail) {
    await sendParticipantsRoster(adminEmail, {
      adventureTitle: adventure?.title || 'Adventure',
      adventureDate,
      participantCount: rowCount,
      maxParticipants,
      buffer,
      filename,
      reason: reason || 'fully booked',
    });
  }

  const fileUrl = await uploadRosterExcel(buffer, filename);
  const adminPhone = process.env.ADMIN_WHATSAPP || process.env.ADMIN_PHONE;

  const summary = [
    '📋 Trip is full — participant list ready',
    '',
    `${adventure?.title || 'Adventure'} · ${adventureDate}`,
    `Confirmed participants: ${rowCount} / ${maxParticipants || '—'}`,
    fileUrl ? `Excel: ${fileUrl}` : 'Excel sent to your email.',
  ].join('\n');

  await sendAdminWhatsAppText(summary);

  if (fileUrl && adminPhone) {
    await sendWhatsAppDocument(adminPhone, {
      link: fileUrl,
      filename,
      caption: `Participants — ${adventure?.title || 'Adventure'} (${adventureDate})`,
    });
  }
}

async function seatsExpireHolds() {
  const { getConvexClient } = require('../utils/convexClient');
  const result = await getConvexClient().callFunction('bookings:expireStaleHolds', {});
  logger.info(`Seat-hold sweeper expired ${result?.expired || 0} booking(s)`);
  return result;
}

async function tripReminders() {
  const { getConvexClient } = require('../utils/convexClient');
  const { sendSimpleMail } = require('../services/emailService');
  const { sendCustomerWhatsApp } = require('../services/whatsappService');
  const data = await getConvexClient().callFunction('bookings:listDueReminders', {});
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

  for (const row of data.preDeparture || []) {
    const b = row.booking;
    const adv = row.adventure || {};
    const isTour = String(adv.category || '').toLowerCase() === 'tour';
    const stayNote = isTour
      ? 'Group stay — three people share a room.'
      : 'Trek overnight notes are in your itinerary PDF.';
    const reporting = adv.start_time ? `${adv.start_time} IST` : 'as shared on the itinerary';
    const pickup = b.pickup_point || 'see itinerary';
    const text = [
      `Hi ${b.customer_name || 'Adventurer'},`,
      `Reminder: ${adv.title || 'your trip'} on ${b.adventure_date}.`,
      `Pickup: ${pickup}`,
      `Reporting time: ${reporting}`,
      stayNote,
      `Booking ${b.booking_code}`,
      '— Phoenix Adventures',
    ].join('\n');
    if (b.customer_phone) {
      await sendCustomerWhatsApp({
        phone: b.customer_phone,
        textBody: text,
        templateName: process.env.WHATSAPP_TEMPLATE_PREDEPARTURE,
        templateParams: [
          b.customer_name || 'Adventurer',
          adv.title || 'Adventure',
          b.adventure_date,
          pickup,
          reporting,
        ],
      });
    }
    await getConvexClient().callFunction('bookings:markReminderSent', {
      booking_id: b._id,
      field: 'pre_departure_notified_at',
    });
  }

  for (const row of data.reviewNudge || []) {
    const b = row.booking;
    const adv = row.adventure || {};
    const reviewUrl = `${frontend}/adventure/${adv._id || b.adventure_id}`;
    const text = `Hope you enjoyed ${adv.title || 'the trip'}! Leave a short review: ${reviewUrl}`;
    if (b.customer_email) {
      await sendSimpleMail({
        to: b.customer_email,
        subject: `How was ${adv.title || 'your trip'}?`,
        html: `<p>Hi ${escapeHtml(b.customer_name || 'Adventurer')},</p>
          <p>We hope ${escapeHtml(adv.title || 'your adventure')} was memorable. Please leave a review so other travellers can plan with confidence.</p>
          <p><a href="${reviewUrl}">Write a review</a></p>`,
      });
    }
    if (b.customer_phone) {
      await sendCustomerWhatsApp({
        phone: b.customer_phone,
        textBody: text,
        templateName: process.env.WHATSAPP_TEMPLATE_REVIEW,
        templateParams: [b.customer_name || 'Adventurer', adv.title || 'Adventure', reviewUrl],
      });
    }
    await getConvexClient().callFunction('bookings:markReminderSent', {
      booking_id: b._id,
      field: 'review_nudge_sent_at',
    });
  }

  for (const row of data.balanceDue || []) {
    const b = row.booking;
    const adv = row.adventure || {};
    const payUrl = `${frontend}/booking/${b._id}/payment?kind=balance`;
    const due = Number(b.balance_due || 0);
    if (b.customer_email) {
      await sendSimpleMail({
        to: b.customer_email,
        subject: `Balance due for ${adv.title || 'your trip'}`,
        html: `<p>Hi ${escapeHtml(b.customer_name || 'Adventurer')},</p>
          <p>₹${due.toLocaleString('en-IN')} is still due for <strong>${escapeHtml(adv.title || 'your trip')}</strong> (${escapeHtml(b.adventure_date)}).</p>
          <p><a href="${payUrl}">Pay remaining balance via UPI</a></p>`,
      });
    }
    await getConvexClient().callFunction('bookings:markReminderSent', {
      booking_id: b._id,
      field: 'balance_reminder_sent_at',
    });
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function newsletterBlast(payload) {
  const { sendSimpleMail } = require('../services/emailService');
  const { getConvexClient } = require('../utils/convexClient');
  const subject = payload.subject || 'New dates from Phoenix Adventures';
  const body = payload.body || '';
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
    ${body}
    <p style="margin-top:24px"><a href="${frontend}">Browse adventures</a></p>
  </div>`;
  const subs = await getConvexClient().getNewsletterSubscribers();
  const active = (subs || []).filter((s) => s.status === 'subscribed');
  for (const sub of active) {
    try {
      await sendSimpleMail({ to: sub.email, subject, html });
    } catch (err) {
      logger.error(`Newsletter to ${sub.email} failed:`, err.message);
    }
  }
  logger.info(`Newsletter blast sent to ${active.length} subscriber(s)`);
}

async function waitlistNotify(payload) {
  const { sendSimpleMail } = require('../services/emailService');
  const { sendCustomerWhatsApp } = require('../services/whatsappService');
  const { getConvexClient } = require('../utils/convexClient');
  const { entries = [], adventureTitle, datesText, adventureId } = payload;
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const url = `${frontend}/adventure/${adventureId}`;
  const ids = [];
  for (const row of entries) {
    const text = `Good news — new dates/seats for ${adventureTitle}: ${datesText}. Book here: ${url}`;
    if (row.email) {
      await sendSimpleMail({
        to: row.email,
        subject: `New dates: ${adventureTitle}`,
        html: `<p>${text}</p>`,
      });
    }
    if (row.phone) {
      await sendCustomerWhatsApp({
        phone: row.phone,
        textBody: text,
        templateName: process.env.WHATSAPP_TEMPLATE_WAITLIST,
        templateParams: [adventureTitle, datesText, url],
      });
    }
    if (row._id) ids.push(row._id);
  }
  if (ids.length) {
    await getConvexClient().callFunction('waitlist:markNotified', { ids });
  }
}

async function wishlistDates(payload) {
  const { sendSimpleMail } = require('../services/emailService');
  const { entries = [], adventureTitle, datesText, adventureId } = payload;
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const url = `${frontend}/adventure/${adventureId}`;
  for (const row of entries) {
    if (!row.email) continue;
    try {
      await sendSimpleMail({
        to: row.email,
        subject: `${adventureTitle} now has dates`,
        html: `<p>Hi ${escapeHtml(row.name || '')},</p>
          <p>A trip on your wishlist has new departures: ${escapeHtml(datesText)}.</p>
          <p><a href="${url}">View ${escapeHtml(adventureTitle)}</a></p>`,
      });
    } catch (err) {
      logger.error(`Wishlist alert to ${row.email} failed:`, err.message);
    }
  }
}

module.exports = {
  'booking.confirmation': bookingConfirmation,
  'payment.rejected': paymentRejected,
  'payment.submitted_alert': paymentSubmittedAlert,
  'participants.roster_full': participantsRosterFull,
  'seats.expire_holds': seatsExpireHolds,
  'trip.reminders': tripReminders,
  'newsletter.blast': newsletterBlast,
  'waitlist.notify': waitlistNotify,
  'wishlist.dates': wishlistDates,
};
