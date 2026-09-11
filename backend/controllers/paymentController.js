const { getConvexClient } = require('../utils/convexClient');
const { getSignedScreenshotUrl } = require('../utils/cloudinaryClient');
const { enqueue, JOBS } = require('../utils/jobQueue');
const logger = require('../utils/logger');

function withSignedScreenshot(payment) {
  if (!payment) return payment;
  const publicId = payment.screenshot_public_id;
  if (publicId) {
    return {
      ...payment,
      screenshot_url: getSignedScreenshotUrl(publicId),
    };
  }
  return payment;
}

exports.submitManual = async (req, res) => {
  try {
    const { booking_id, upi_reference, payer_name, payer_upi_id, amount_paid } = req.body;
    const screenshot_public_id = req.file?.public_id;
    const screenshot_url = screenshot_public_id ? undefined : (req.file?.secure_url || req.file?.path || req.file?.url);

    if (!booking_id || !upi_reference || !payer_name) {
      return res.status(400).json({
        success: false,
        message: 'booking_id, upi_reference, and payer_name are required',
      });
    }
    if (!screenshot_public_id && !screenshot_url) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required',
      });
    }

    const details = await getConvexClient().getBookingPaymentDetails(booking_id);
    if (!details?.booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (details.booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (amount_paid == null || amount_paid === '') {
      return res.status(400).json({
        success: false,
        message: 'amount_paid is required',
      });
    }
    const claimed = Number(amount_paid);
    const isBalance = String(req.body.payment_kind || req.query.kind || '') === 'balance'
      || details.booking.booking_status === 'confirmed';
    const expected = isBalance
      ? Number(details.booking.balance_due || 0)
      : Number(details.booking.amount);
    if (!claimed || Math.abs(claimed - expected) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Amount must match ${isBalance ? 'remaining balance' : 'booking due'} of ₹${expected}`,
      });
    }

    if (isBalance) {
      await getConvexClient().submitBalancePayment({
        booking_id,
        upi_reference: String(upi_reference).trim(),
        payer_name: String(payer_name).trim(),
        payer_upi_id: payer_upi_id ? String(payer_upi_id).trim() : undefined,
        screenshot_url,
        screenshot_public_id,
      });
    } else {
      await getConvexClient().submitManualPayment({
        booking_id,
        upi_reference: String(upi_reference).trim(),
        payer_name: String(payer_name).trim(),
        payer_upi_id: payer_upi_id ? String(payer_upi_id).trim() : undefined,
        screenshot_url,
        screenshot_public_id,
      });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    enqueue(JOBS.PAYMENT_SUBMITTED_ALERT, {
      adminEmail,
      details: {
        bookingCode: details.booking.booking_code,
        customerName: req.user.name,
        adventureTitle: details.adventure?.title || 'Adventure',
        amount: isBalance ? details.booking.balance_due : details.booking.amount,
        upiReference: upi_reference,
        kind: isBalance ? 'balance' : (details.booking.payment_type || 'full'),
      },
    }).catch((err) => logger.error('Failed to enqueue payment alert:', err.message));

    return res.json({
      success: true,
      message: 'Payment details submitted. We will verify and confirm your booking shortly.',
    });
  } catch (error) {
    logger.error('submitManual payment error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to submit payment',
    });
  }
};

exports.listPending = async (req, res) => {
  try {
    const data = await getConvexClient().listPendingPayments();
    const signed = Array.isArray(data)
      ? data.map((row) => ({
          ...row,
          payment: withSignedScreenshot(row.payment),
        }))
      : data;
    return res.json({ success: true, data: signed });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list pending payments' });
  }
};

exports.verify = async (req, res) => {
  try {
    const { booking_id } = req.body;
    if (!booking_id) {
      return res.status(400).json({ success: false, message: 'booking_id is required' });
    }

    const verifyResult = await getConvexClient().verifyPayment(booking_id, req.user.id);

    const details = await getConvexClient().getBookingPaymentDetails(booking_id);
    const adv = details?.adventure || {};

    if (verifyResult?.kind === 'balance') {
      getConvexClient().logAudit({
        actor_id: req.user.id,
        actor_email: req.user.email,
        action: 'payment.verified',
        target_type: 'booking',
        target_id: booking_id,
        metadata: {
          booking_code: details?.booking?.booking_code,
          kind: 'balance',
        },
      }).catch((err) => logger.error('Audit log failed:', err.message));
      return res.json({ success: true, message: 'Balance payment verified' });
    }

    if (verifyResult?.is_full) {
      enqueue(JOBS.PARTICIPANTS_ROSTER_FULL, {
        adminEmail: process.env.ADMIN_EMAIL,
        adventure: {
          title: adv.title,
          _id: adv._id || adv.id,
        },
        adventureDate: verifyResult.adventure_date || details?.booking?.adventure_date,
        bookings: verifyResult.confirmed_bookings || [],
        maxParticipants: verifyResult.max_participants,
        reason: 'fully booked',
      }).catch((err) => logger.error('Failed to enqueue roster:', err.message));
    }

    const parseList = (val) => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      }
      return [];
    };

    const participants = details?.booking?.participants || [];
    const pickupSummary = participants.length
      ? [...new Set(participants.map((p) => p.pickup_point).filter(Boolean))].join('; ')
      : details?.booking?.pickup_point || adv.meeting_point || adv.pickup_point;

    const coachLabel = (id) => {
      const s = String(id || '').toLowerCase();
      if (s === '3ac') return '3AC';
      if (s === 'sleeper') return 'Sleeper coach';
      return id ? String(id) : '';
    };
    const travelCoachSummary = participants
      .filter((p) => p.travel_coach)
      .map((p) => `${p.name || 'Guest'}: ${coachLabel(p.travel_coach)}`)
      .join('; ');
    const isTour = String(adv.category || '').toLowerCase() === 'tour';

    const confirmationDetails = {
      date: details?.booking?.adventure_date,
      participants: details?.booking?.number_of_seats,
      amountPaid: details?.booking?.amount,
      totalAmount: details?.booking?.total_amount,
      balanceDue: details?.booking?.balance_due,
      paymentType: details?.booking?.payment_type,
      bookingCode: details?.booking?.booking_code,
      location: adv.location,
      duration: adv.duration,
      difficulty: adv.difficulty,
      category: adv.category,
      meetingPoint: pickupSummary,
      itinerary: parseList(adv.itinerary),
      included: parseList(adv.included),
      excluded: parseList(adv.excluded),
      confirmationPdfUrl: adv.confirmation_pdf_url || null,
      travelCoachSummary: travelCoachSummary || null,
      stayNote: isTour ? 'Group stay — three people share a room (twin/private not offered)' : null,
      selectedOptions: details?.booking?.selected_options || [],
      adventure: adv,
    };

    const customerName =
      details?.user?.name || details?.booking?.customer_name || 'Adventurer';
    const adventureTitle = adv.title || 'Adventure';
    const customerEmail = details?.user?.email || details?.booking?.customer_email;
    const customerPhone =
      details?.user?.phone || details?.booking?.customer_phone;

    const deliveryWarnings = [];

    if (!customerEmail) deliveryWarnings.push('no_customer_email');
    if (!customerPhone) {
      logger.warn(`No phone on booking ${booking_id} — skipped WhatsApp confirmation`);
      deliveryWarnings.push('no_customer_phone');
    }

    // Off the request path — Redis queue or inline async
    if (customerEmail || customerPhone) {
      try {
        await enqueue(JOBS.BOOKING_CONFIRMATION, {
          customerEmail,
          customerPhone,
          customerName,
          adventureTitle,
          confirmationDetails,
        });
      } catch (err) {
        logger.error('Failed to enqueue booking confirmation:', err.message);
        deliveryWarnings.push('confirmation_queue_failed');
      }
    }

    getConvexClient().patchDeliveryWarnings(booking_id, deliveryWarnings).catch((err) =>
      logger.warn('Could not persist delivery warnings:', err.message)
    );
    if (deliveryWarnings.length) {
      logger.warn(`Booking ${booking_id} delivery warnings: ${deliveryWarnings.join(', ')}`);
    }

    getConvexClient().logAudit({
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: 'payment.verified',
      target_type: 'booking',
      target_id: booking_id,
      metadata: {
        booking_code: details?.booking?.booking_code,
        customer_email: customerEmail,
      },
    }).catch((err) => logger.error('Audit log failed:', err.message));

    return res.json({
      success: true,
      message: 'Payment verified and booking confirmed',
      warnings: deliveryWarnings.length ? deliveryWarnings : undefined,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify payment',
    });
  }
};

exports.reject = async (req, res) => {
  try {
    const { booking_id, rejection_reason } = req.body;
    if (!booking_id || !rejection_reason) {
      return res.status(400).json({
        success: false,
        message: 'booking_id and rejection_reason are required',
      });
    }

    const details = await getConvexClient().getBookingPaymentDetails(booking_id);
    await getConvexClient().rejectPayment(
      booking_id,
      req.user.id,
      rejection_reason
    );

    if (details?.user?.email) {
      enqueue(JOBS.PAYMENT_REJECTED, {
        email: details.user.email,
        name: details.user.name || 'Adventurer',
        bookingCode: details.booking?.booking_code,
        reason: rejection_reason,
      }).catch((err) => logger.error('Failed to enqueue rejection email:', err.message));
    }

    getConvexClient().logAudit({
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: 'payment.rejected',
      target_type: 'booking',
      target_id: booking_id,
      metadata: {
        booking_code: details?.booking?.booking_code,
        reason: rejection_reason,
      },
    }).catch((err) => logger.error('Audit log failed:', err.message));

    return res.json({ success: true, message: 'Payment rejected and seats released' });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject payment',
    });
  }
};
