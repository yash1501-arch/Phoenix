const ExcelJS = require('exceljs');
const logger = require('./logger');
const { uploadRawBuffer } = require('./cloudinaryClient');

/**
 * Build rows from confirmed bookings for one adventure date.
 */
function flattenParticipants(bookings, adventure) {
  const rows = [];
  let serial = 1;
  for (const b of bookings) {
    const list =
      Array.isArray(b.participants) && b.participants.length > 0
        ? b.participants
        : [
            {
              name: b.customer_name || '—',
              phone: b.customer_phone || '—',
              meal_preference: '—',
              pickup_point: b.pickup_point || '—',
            },
            ...(b.additional_travelers || []).map((t) => ({
              name: t.name,
              phone: t.phone,
              meal_preference: t.meal_preference,
              pickup_point: t.pickup_point || b.pickup_point || '—',
            })),
          ];

    for (const p of list) {
      rows.push({
        serial: serial++,
        booking_code: b.booking_code,
        adventure: adventure?.title || '',
        date: b.adventure_date,
        participant_name: p.name,
        phone: p.phone,
        meal: String(p.meal_preference || '').replace(/_/g, '-'),
        pickup: p.pickup_point || '',
        emergency_contact: b.emergency_contact || '',
        booker_name: b.customer_name || '',
        booker_email: b.customer_email || '',
        seats_in_booking: b.number_of_seats,
        amount: b.amount,
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
  sheet.columns = [
    { header: '#', key: 'serial', width: 6 },
    { header: 'Booking ID', key: 'booking_code', width: 16 },
    { header: 'Adventure', key: 'adventure', width: 28 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Participant', key: 'participant_name', width: 22 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Meal', key: 'meal', width: 12 },
    { header: 'Pickup', key: 'pickup', width: 24 },
    { header: 'Emergency', key: 'emergency_contact', width: 16 },
    { header: 'Booker', key: 'booker_name', width: 20 },
    { header: 'Booker email', key: 'booker_email', width: 24 },
    { header: 'Seats', key: 'seats_in_booking', width: 8 },
    { header: 'Amount', key: 'amount', width: 10 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  sheet.getRow(1).font = { bold: true };
  const rows = flattenParticipants(bookings, adventure);
  rows.forEach((r) => sheet.addRow(r));

  const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
  return { buffer, rowCount: rows.length, filename: buildFilename(adventure, bookings[0]?.adventure_date) };
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
