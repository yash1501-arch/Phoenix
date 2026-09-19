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
    // NOTE: `pn` deliberately omitted — see frontend/src/utils/merchantUpi.js.
    // Sending a payee name that doesn't match the name registered on the VPA
    // makes the receiver's bank (SBI) decline with "Transactions to this
    // account not permitted by the receiver's bank".
    am: Number(amount).toFixed(2),
    cu: 'INR',
    tn: String(note || ''),
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
