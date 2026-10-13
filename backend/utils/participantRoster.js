const ExcelJS = require('exceljs');
const logger = require('./logger');
const { uploadRawBuffer } = require('./cloudinaryClient');

function mealLabel(value) {
  const text = String(value || '').replace(/_/g, '-').trim();
  return text || '—';
}

function paymentLabel(booking) {
  const amount = booking?.payment_amount != null ? booking.payment_amount : booking?.amount;
  const n = Number(amount);
  const money = Number.isFinite(n) ? `₹${n}` : '—';
  const kind = String(booking?.payment_type || booking?.payment_kind || '').toLowerCase();
  const kindLabel = kind === 'advance' ? 'advance' : 'paid';
  const balance = Number(booking?.balance_due || 0);
  if (balance > 0) return `${money} ${kindLabel} (balance ₹${balance})`;
  return `${money} ${kindLabel}`;
}

function participantList(booking) {
  if (Array.isArray(booking.participants) && booking.participants.length > 0) {
    return booking.participants;
  }
  return [
    {
      name: booking.customer_name || '—',
      phone: booking.customer_phone || '—',
      meal_preference: '—',
      pickup_point: booking.pickup_point || '—',
    },
    ...(booking.additional_travelers || []).map((t) => ({
      name: t.name,
      phone: t.phone,
      meal_preference: t.meal_preference,
      pickup_point: t.pickup_point || booking.pickup_point || '—',
    })),
  ];
}

/**
 * One row per person. Group bookings (2+ seats) name the account that booked them.
 */
function flattenParticipants(bookings, adventure) {
  const rows = [];
  let serial = 1;
  for (const b of bookings || []) {
    const seats = Number(b.number_of_seats) || 0;
    const bookedBy = seats >= 2 ? (b.customer_name || '—') : '';
    const pay = paymentLabel(b);
    for (const p of participantList(b)) {
      rows.push({
        serial: serial++,
        booking_code: b.booking_code,
        adventure: adventure?.title || '',
        date: b.adventure_date,
        name: p.name || '—',
        contact_no: p.phone || b.customer_phone || '—',
        emergency_contact_no: b.emergency_contact || '—',
        pickup_stop: p.pickup_point || b.pickup_point || '—',
        payment: pay,
        meal_preference: mealLabel(p.meal_preference),
        booked_by: bookedBy,
        participant_name: p.name || '—',
        phone: p.phone || b.customer_phone || '—',
        meal: mealLabel(p.meal_preference),
        pickup: p.pickup_point || b.pickup_point || '—',
        emergency_contact: b.emergency_contact || '—',
        booker_name: b.customer_name || '',
        seats_in_booking: seats,
        amount: b.payment_amount != null ? b.payment_amount : b.amount,
        status: b.booking_status,
      });
    }
  }
  return rows;
}

async function buildParticipantsWorkbook(bookings, adventure) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Phoenix Adventures';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Participants');
  const rows = flattenParticipants(bookings, adventure);
  const bookingCount = new Set((bookings || []).map((b) => b.booking_code || b._id)).size;
  const date = bookings?.[0]?.adventure_date || '';
  const title = `${adventure?.title || 'Adventure'}${date ? ` · ${date}` : ''}`;

  sheet.mergeCells('A1:H1');
  sheet.getCell('A1').value = title;
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.mergeCells('A2:H2');
  sheet.getCell('A2').value =
    `${bookingCount} booking${bookingCount === 1 ? '' : 's'} · ${rows.length} participant${rows.length === 1 ? '' : 's'}. Payment is for the whole booking. “Booked by” is filled when one person booked 2 or more seats.`;
  sheet.getCell('A2').alignment = { wrapText: true };

  const header = sheet.addRow([
    '#',
    'Name',
    'Contact no',
    'Emergency contact no',
    'Pickup stop',
    'Payment',
    'Meal preference',
    'Booked by',
  ]);
  header.font = { bold: true };

  rows.forEach((r) => {
    sheet.addRow([
      r.serial,
      r.name,
      r.contact_no,
      r.emergency_contact_no,
      r.pickup_stop,
      r.payment,
      r.meal_preference,
      r.booked_by,
    ]);
  });

  sheet.columns = [
    { width: 6 },
    { width: 24 },
    { width: 16 },
    { width: 22 },
    { width: 28 },
    { width: 28 },
    { width: 16 },
    { width: 24 },
  ];
  sheet.getRow(2).height = 32;

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return {
    buffer,
    rowCount: rows.length,
    bookingCount,
    filename: buildFilename(adventure, date),
  };
}

function buildFilename(adventure, date) {
  const slug = String(adventure?.title || 'adventure')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `participants-${slug}-${date || 'date'}.xlsx`;
}

async function uploadRosterExcel(buffer, filename) {
  try {
    const result = await uploadRawBuffer(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', {
      folder: 'phoenix_adventures/rosters',
      public_id: filename.replace(/\.xlsx$/i, ''),
    });
    return result?.secure_url || null;
  } catch (err) {
    logger.warn('Roster Excel upload failed:', err.message);
    return null;
  }
}

module.exports = {
  flattenParticipants,
  buildParticipantsWorkbook,
  uploadRosterExcel,
};
