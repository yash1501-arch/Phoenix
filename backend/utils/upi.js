/** Canonical checkout destination. Ignore admin settings for pa / payee. */
const MERCHANT_UPI_ID = '9372506447@sbi';
const MERCHANT_PAYEE_NAME = 'PHEONIX ADVENTURES LLP';

/** Signed SBI static QR payload. Amount is intentionally empty. */
const SIGNED_UPI_QUERY_PREFIX =
  'pa=9372506447@sbi&pn=PHEONIX%20ADVENTURES%20LLP&mc=4722&tr=&tn=&am=&cu=INR&url=&mode=02&purpose=00&orgid=159002';
const SIGNED_UPI_SIGN =
  'MEUCIQDJuD9woLyf7xFhQNLxBF1lpuk2r0QCWGqJV/h7s9z/BwIgMsp+5Ot1HtK4Kz65LdkeW7J3ry+2YtpPUG3JEDGGMfw=';

/**
 * UPI link for the signed SBI merchant QR.
 * Do not append an amount: SBI declines those credits after the UPI PIN.
 * Amount and note stay on the website; this link cannot carry them.
 */
function generateUpiLink() {
  const qs = `${SIGNED_UPI_QUERY_PREFIX}&sign=${encodeURIComponent(SIGNED_UPI_SIGN)}`;
  return `upi://pay?${qs}`;
}

module.exports = {
  MERCHANT_UPI_ID,
  MERCHANT_PAYEE_NAME,
  generateUpiLink,
};
