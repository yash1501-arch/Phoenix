export function daysUntilDeparture(adventureDate) {
  if (!adventureDate || !/^\d{4}-\d{2}-\d{2}$/.test(adventureDate)) return 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dep = Date.parse(`${adventureDate}T00:00:00.000Z`);
  if (Number.isNaN(dep)) return 0;
  return Math.floor((dep - today.getTime()) / (24 * 60 * 60 * 1000));
}

/** Whether the user may self-cancel (matches Convex cancelByUser rules). */
export function canUserCancelBooking(booking, cancellationWindowDays = 14) {
  if (!booking) return false;
  const status = booking.booking_status;
  if (['cancelled', 'expired', 'rejected'].includes(status)) return false;
  if (['pending_payment', 'payment_submitted'].includes(status)) return true;
  if (status === 'confirmed') {
    const windowDays = Number(cancellationWindowDays);
    const minDays = Number.isFinite(windowDays) && windowDays >= 0 ? windowDays : 14;
    return daysUntilDeparture(booking.adventure_date) >= minDays;
  }
  return false;
}
