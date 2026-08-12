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
const logger = require('../utils/logger');

async function bookingConfirmation(payload) {
  const {
    customerEmail,
    customerPhone,
    customerName,
    adventureTitle,
    confirmationDetails,
  } = payload;

  if (customerEmail) {
    try {
      await sendBookingConfirmation(
        customerEmail,
        customerName,
        adventureTitle,
        confirmationDetails
      );
    } catch (err) {
      logger.error('Job email confirmation failed:', err.message);
      throw err;
    }
  }

  if (customerPhone) {
    try {
      const waResult = await sendBookingConfirmationWhatsApp(
        customerPhone,
        customerName,
        adventureTitle,
        confirmationDetails
      );
      if (waResult?.skipped) {
        logger.warn(`WhatsApp skipped: ${waResult.reason || 'unknown'}`);
      }
    } catch (err) {
      logger.error('Job WhatsApp confirmation failed:', err.message);
      throw err;
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

module.exports = {
  'booking.confirmation': bookingConfirmation,
  'payment.rejected': paymentRejected,
  'payment.submitted_alert': paymentSubmittedAlert,
  'participants.roster_full': participantsRosterFull,
};
