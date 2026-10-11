/**
 * Canonical merchant destination for checkout.
 * Do not take pa / payee / QR URL from admin settings or the API — those can
 * change if an admin account is abused. Changing the real UPI ID requires a
 * code change, a new QR PNG, and an updated SHA-256 below.
 */
export const MERCHANT_UPI_ID = '9372506447@sbi';
export const MERCHANT_PAYEE_NAME = 'PHEONIX ADVENTURES LLP';
/** MCC on the signed SBI QR (4722 = travel agencies). */
export const MERCHANT_CATEGORY_CODE = '4722';
export const UPI_QR_SRC = '/upi-merchant-qr.png';

/**
 * Query string inside the signed SBI static QR (mode=02), excluding `sign`.
 * SBI rejects website links that put an amount on this VPA
 * ("Receiver's bank does not allow payments to this bank account").
 * The signature covers this exact string, including the empty amount.
 */
const SIGNED_UPI_QUERY_PREFIX =
    'pa=9372506447@sbi&pn=PHEONIX%20ADVENTURES%20LLP&mc=4722&tr=&tn=&am=&cu=INR&url=&mode=02&purpose=00&orgid=159002';
/** Base64 signature from that QR. Do not alter the prefix above. */
const SIGNED_UPI_SIGN =
    'MEUCIQDJuD9woLyf7xFhQNLxBF1lpuk2r0QCWGqJV/h7s9z/BwIgMsp+5Ot1HtK4Kz65LdkeW7J3ry+2YtpPUG3JEDGGMfw=';

/** SHA-256 of frontend/public/upi-merchant-qr.png (bytes as deployed). */
export const UPI_QR_SHA256 =
    '521c14621b629ee19b9c2617b1970c90ca801f46b4fda40f7005f8d15b8df7ce';

function toHex(buffer) {
    return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyMerchantQr(url = UPI_QR_SRC) {
    if (typeof crypto === 'undefined' || !crypto.subtle) return false;
    const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) return false;
    const type = (res.headers.get('content-type') || '').toLowerCase();
    if (type && !type.includes('image/png') && !type.includes('octet-stream') && !type.includes('image')) {
        return false;
    }
    const digest = await crypto.subtle.digest('SHA-256', await res.arrayBuffer());
    return toHex(digest) === UPI_QR_SHA256;
}

/** Exact signed-QR query. Amount stays blank so the UPI app asks the payer to type it. */
function buildUpiQuery() {
    // Encode only the signature. `+` in base64 becomes a space in some UPI apps
    // and then SBI rejects the payment. The prefix must stay byte-for-byte.
    return `${SIGNED_UPI_QUERY_PREFIX}&sign=${encodeURIComponent(SIGNED_UPI_SIGN)}`;
}

export function merchantUpiLink() {
    return `upi://pay?${buildUpiQuery()}`;
}

/**
 * Per-app UPI intent links.
 * Google Pay frequently refuses generic `upi://` intents opened from a browser
 * ("Unable to make the payment at this moment") as an anti-fraud measure,
 * especially to person VPAs. Each app's own scheme is far more reliable;
 * `upi://pay` stays as the generic fallback for other UPI apps.
 */
export function upiAppLinks() {
    const qs = buildUpiQuery();
    return [
        { label: 'Google Pay', href: `tez://upi/pay?${qs}` },
        { label: 'PhonePe', href: `phonepe://pay?${qs}` },
        { label: 'Paytm', href: `paytmmp://pay?${qs}` },
        { label: 'Other UPI app', href: `upi://pay?${qs}` },
    ];
}
