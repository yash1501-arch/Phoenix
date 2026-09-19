/** Canonical checkout destination. Ignore admin settings for pa / payee. */
const MERCHANT_UPI_ID = '9372506447@sbi';
const MERCHANT_PAYEE_NAME = 'PHEONIX ADVENTURES LLP';

/**
 * Generate a UPI deep link for manual payments.
 * pa / pn are always the merchant constants — not caller-supplied IDs.
 * @param {{ amount: number, note: string }} params
 */
function generateUpiLink({ amount, note }) {
  const params = {
    pa: MERCHANT_UPI_ID,
    pn: MERCHANT_PAYEE_NAME,
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: String(note || ''),
  };
  // encodeURIComponent, not URLSearchParams: form-encoding turns spaces into
  // '+' and several UPI apps (notably Google Pay) mis-parse pn/tn with '+'.
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
