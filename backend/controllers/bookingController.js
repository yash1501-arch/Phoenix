const { getConvexClient } = require('../utils/convexClient');
const { generateUpiLink, MERCHANT_UPI_ID, MERCHANT_PAYEE_NAME } = require('../utils/upi');
const { validateBookingExtras } = require('../utils/bookingFields');
const { isBookingOpen } = require('../utils/bookingWindow');
const { computeBookingAmounts, resolveAdvancePerPerson } = require('../utils/tourPricing');
const { isDbStaff } = require('../middleware/auth');
const logger = require('../utils/logger');

async function getUpiSettings() {
  const settings = await getConvexClient().getSettings();
  return {
    upiId: MERCHANT_UPI_ID,
    payeeName: MERCHANT_PAYEE_NAME,
    holdMinutes: parseInt(settings.seat_hold_minutes || '15', 10),
  };
}

exports.createManual = async (req, res) => {
  try {
    const {
      adventure_id,
      adventure_date,
      number_of_seats,
      customer_phone,
      emergency_contact,
      participants,
      selected_options,
      payment_preference,
    } = req.body;

    // Validate payment_preference if supplied
    if (payment_preference !== undefined && !['advance', 'full'].includes(payment_preference)) {
      return res.status(400).json({
        success: false,
        message: "payment_preference must be 'advance' or 'full'",
      });
    }

    if (!adventure_id || !adventure_date || !number_of_seats) {
      return res.status(400).json({
        success: false,
        message: 'adventure_id, adventure_date, and number_of_seats are required',
      });
    }

    const seats = parseInt(number_of_seats, 10);
    if (!seats || seats < 1) {
      return res.status(400).json({ success: false, message: 'Invalid number of seats' });
    }

    const adventure = await getConvexClient().getAdventureById(adventure_id);
    if (!adventure) {
      return res.status(404).json({ success: false, message: 'Adventure not found' });
    }

    const windowCheck = isBookingOpen(adventure, adventure_date);
    if (!windowCheck.open) {
      return res.status(400).json({
        success: false,
        message: windowCheck.reason || 'Bookings are closed for this departure',
      });
    }

    const extras = validateBookingExtras({
      adventure,
      number_of_seats: seats,
      emergency_contact,
      participants,
    });
    if (!extras.ok) {
      return res.status(400).json({ success: false, message: extras.message });
    }

    const settings = await getConvexClient().getSettings();
    const settingsAdvance = parseFloat(settings.advance_per_person || '1000') || 1000;
    const advancePerPerson = resolveAdvancePerPerson(adventure, settingsAdvance);

    let priced;
    try {
      priced = computeBookingAmounts({
        adventure,
        seats,
        selections: selected_options,
        participantTravelCoaches: extras.data.participantTravelCoaches,
        advancePerPerson,
        payment_preference,
      });
    } catch (priceErr) {
      return res.status(400).json({
        success: false,
        message: priceErr.message || 'Invalid pricing options',
      });
    }

    if (priced.amount <= 0) {
      return res.status(400).json({ success: false, message: 'Adventure price is not set' });
    }

    const phone = customer_phone || req.user.phone;
    if (!phone || String(phone).replace(/\D/g, '').length < 10) {
      return res.status(400).json({
        success: false,
        message: 'A valid WhatsApp phone number is required for booking confirmation',
      });
    }

    const result = await getConvexClient().createManualBooking({
      user_id: req.user.id,
      adventure_id,
      adventure_date,
      number_of_seats: seats,
      amount: priced.amount,
      payment_preference: priced.payment_type, // pass the resolved type, not the raw preference
      selected_options: priced.selected_options.map((o) => ({
        group: o.group,
        choice_id: o.choice_id,
      })),
      customer_name: req.user.name,
      customer_email: req.user.email,
      customer_phone: String(phone).trim(),
      emergency_contact: extras.data.emergency_contact,
      pickup_point: extras.data.pickup_point,
      participants: extras.data.participants,
      additional_travelers: extras.data.additional_travelers,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: result.id,
        booking_code: result.booking_code,
        amount: result.amount ?? priced.amount,
        total_amount: result.total_amount ?? priced.total_amount,
        balance_due: result.balance_due ?? priced.balance_due,
        payment_type: result.payment_type ?? priced.payment_type,
      },
    });
  } catch (error) {
    logger.error('createManual booking error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const details = await getConvexClient().getBookingPaymentDetails(bookingId);

    if (!details || !details.booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const isOwner = details.booking.user_id === req.user.id;
    const isStaff = await isDbStaff(req.user.id);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const upiSettings = await getUpiSettings();
    const kind = String(req.query.kind || '').toLowerCase();
    const payBalance = kind === 'balance'
      && details.booking.booking_status === 'confirmed'
      && Number(details.booking.balance_due || 0) > 0;
    const upiAmount = payBalance ? details.booking.balance_due : details.booking.amount;
    const upiLink = generateUpiLink({
      amount: upiAmount,
      note: payBalance
        ? `${details.booking.booking_code}-BAL`
        : details.booking.booking_code,
    });

    return res.json({
      success: true,
      data: {
        ...details,
        pay_balance: payBalance,
        upi_amount: upiAmount,
        upi: {
          id: upiSettings.upiId,
          payee_name: upiSettings.payeeName,
          link: upiLink,
          hold_minutes: upiSettings.holdMinutes,
        },
      },
    });
  } catch (error) {
    logger.error('getPaymentDetails error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment details' });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const userId = String(req.params.userId || req.user.id || '');
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User id required' });
    }
    if (userId !== String(req.user.id) && !(await isDbStaff(req.user.id))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const dbUser = await getConvexClient().getUserById(req.user.id);
    const bookings = await getConvexClient().getBookingsByUser(userId, dbUser?.email);

    // Already enriched in Convex; keep a resilient fallback for older clients
    const enriched = [];
    for (const booking of bookings) {
      if (booking.adventure !== undefined) {
        enriched.push(booking);
        continue;
      }
      let adventure = null;
      let payment = null;
      try {
        adventure = await getConvexClient().getAdventureById(booking.adventure_id);
      } catch (err) {
        logger.warn('getUserBookings adventure lookup failed:', err.message);
      }
      try {
        payment = await getConvexClient().getPaymentByBookingId(booking._id);
      } catch (err) {
        logger.warn('getUserBookings payment lookup failed:', err.message);
      }
      enriched.push({ ...booking, adventure, payment });
    }

    return res.json({ success: true, data: enriched });
  } catch (error) {
    logger.error('getUserBookings error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

exports.getById = async (req, res) => {
  try {
    const booking = await getConvexClient().getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id && !(await isDbStaff(req.user.id))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const adventure = await getConvexClient().getAdventureById(booking.adventure_id);
    const payment = await getConvexClient().getPaymentByBookingId(booking._id);
    return res.json({ success: true, data: { ...booking, adventure, payment } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
};

exports.adminRelease = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const booking = await getConvexClient().getBookingById(bookingId);
    await getConvexClient().releaseBooking(bookingId, reason);
    getConvexClient().logAudit({
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: 'booking.release',
      target_type: 'booking',
      target_id: bookingId,
      metadata: { booking_code: booking?.booking_code, reason },
    }).catch((err) => logger.error('Audit log failed:', err.message));
    return res.json({ success: true, message: 'Booking released and seats freed' });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to release booking',
    });
  }
};

exports.cancelByUser = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body || {};
    const booking = await getConvexClient().getBookingById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    await getConvexClient().cancelBookingByUser(bookingId, req.user.id, reason);
    getConvexClient().logAudit({
      actor_id: req.user.id,
      actor_email: req.user.email,
      action: 'booking.cancel',
      target_type: 'booking',
      target_id: bookingId,
      metadata: { booking_code: booking.booking_code, reason },
    }).catch((err) => logger.error('Audit log failed:', err.message));
    return res.json({ success: true, message: 'Booking cancelled. Refunds follow our refund policy.' });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
    });
  }
};

exports.adminListAll = async (req, res) => {
  try {
    const { status } = req.query;
    const data = await getConvexClient().listAllBookings(status || undefined);
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to list bookings' });
  }
};

exports.downloadCustomerItinerary = async (req, res) => {
  try {
    const booking = await getConvexClient().getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    const isOwner = booking.user_id === req.user.id;
    if (!isOwner && !(await isDbStaff(req.user.id))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (booking.booking_status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Itinerary is available after confirmation' });
    }
    const adventure = await getConvexClient().getAdventureById(booking.adventure_id);
    if (!adventure) {
      return res.status(404).json({ success: false, message: 'Adventure not found' });
    }
    const { buildItineraryPdf } = require('../utils/itineraryPdf');
    const { buffer, filename } = await buildItineraryPdf(adventure, { audience: 'customer' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (error) {
    logger.error('downloadCustomerItinerary error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to generate itinerary' });
  }
};
