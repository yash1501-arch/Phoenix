/** Canonical checkout destination. Ignore admin settings for pa / payee. */
const MERCHANT_UPI_ID = '9372506447@sbi';
const MERCHANT_PAYEE_NAME = 'PHEONIX ADVENTURES LLP';
/** MCC on the signed SBI merchant QR. Required or SBI declines after UPI PIN. */
const MERCHANT_CATEGORY_CODE = '4722';

function merchantRef(note) {
  const ref = String(note || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 35);
  return ref || 'PHX';
}

/**
 * Generate a UPI deep link for manual payments.
 * pa / pn / mc match the signed SBI merchant QR — not caller-supplied IDs.
 * The QR signature itself is not copied; it only covers an empty amount.
 * @param {{ amount: number, note: string }} params
 */
function generateUpiLink({ amount, note }) {
  const ref = merchantRef(note);
  const params = {
    pa: MERCHANT_UPI_ID,
    pn: MERCHANT_PAYEE_NAME,
    mc: MERCHANT_CATEGORY_CODE,
    tr: ref,
    tn: ref,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    purpose: '00',
  };
  // encodeURIComponent, not URLSearchParams: form-encoding turns spaces into
  // '+' and several UPI apps (notably Google Pay) mis-parse values with '+'.
  const qs = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return `upi://pay?${qs}`;
}

module.exports = {
  MERCHANT_UPI_ID,
  MERCHANT_PAYEE_NAME,
  generateUpiLink,
};
