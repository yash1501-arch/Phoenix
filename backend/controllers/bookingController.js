const { getConvexClient } = require('../utils/convexClient');
const { generateUpiLink } = require('../utils/upi');
const logger = require('../utils/logger');

async function isDbAdmin(userId) {
  const dbUser = await getConvexClient().getUserById(userId);
  return dbUser?.role === 'admin';
}
async function getUpiSettings() {
  const settings = await getConvexClient().getSettings();
  return {
    upiId: settings.upi_id || '9372506447@sbi',
    payeeName: settings.upi_payee_name || 'PHEONIX ADVENTURES LLP',
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
    } = req.body;

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

    const perPerson = Number(adventure.price) || 0;
    if (perPerson <= 0) {
      return res.status(400).json({ success: false, message: 'Adventure price is not set' });
    }
    const amount = perPerson * seats;

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
      amount,
      customer_name: req.user.name,
      customer_email: req.user.email,
      customer_phone: String(phone).trim(),
    });

    return res.status(201).json({
      success: true,
      data: {
        id: result.id,
        booking_code: result.booking_code,
        amount,
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
    const isAdmin = await isDbAdmin(req.user.id);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const upiSettings = await getUpiSettings();
    const upiLink = generateUpiLink({
      upiId: upiSettings.upiId,
      payeeName: upiSettings.payeeName,
      amount: details.booking.amount,
      note: details.booking.booking_code,
    });

    return res.json({
      success: true,
      data: {
        ...details,
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
    const userId = req.params.userId || req.user.id;
    if (userId !== req.user.id && !(await isDbAdmin(req.user.id))) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const bookings = await getConvexClient().getBookingsByUser(userId);
    const enriched = [];

    for (const booking of bookings) {
      const adventure = await getConvexClient().getAdventureById(booking.adventure_id);
      const payment = await getConvexClient().getPaymentByBookingId(booking._id);
      enriched.push({ ...booking, adventure, payment });
    }

    return res.json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
};

exports.getById = async (req, res) => {
  try {
    const booking = await getConvexClient().getBookingById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id && !(await isDbAdmin(req.user.id))) {
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
    await getConvexClient().releaseBooking(bookingId, reason);
    return res.json({ success: true, message: 'Booking released and seats freed' });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to release booking',
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
