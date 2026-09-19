/**
 * Canonical merchant destination for checkout.
 * Do not take pa / payee / QR URL from admin settings or the API — those can
 * change if an admin account is abused. Changing the real UPI ID requires a
 * code change, a new QR PNG, and an updated SHA-256 below.
 */
export const MERCHANT_UPI_ID = '9372506447@sbi';
export const MERCHANT_PAYEE_NAME = 'PHEONIX ADVENTURES LLP';
export const UPI_QR_SRC = '/upi-merchant-qr.png';

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

/** Encoded upi:// query string shared by all app schemes. */
function buildUpiQuery({ amount, note }) {
    const params = {
        pa: MERCHANT_UPI_ID,
        // NOTE: `pn` is deliberately omitted. It is optional per the NPCI UPI
        // Link spec; when sent, the receiver's bank cross-checks it against the
        // name actually registered on the VPA. Our business name does not match
        // the personal name registered on this SBI VPA, and SBI declines such
        // payments with "Transactions to this account not permitted by the
        // receiver's bank". Omitting pn makes the payer's app resolve and show
        // the true registered name instead.
        am: Number(amount).toFixed(2),
        cu: 'INR',
        tn: String(note || ''),
    };
    // encodeURIComponent, not URLSearchParams: form-encoding turns spaces into
    // '+' and several UPI apps (notably Google Pay) mis-parse values with '+'.
    return Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join('&');
}

export function merchantUpiLink(options) {
    return `upi://pay?${buildUpiQuery(options)}`;
}

/**
 * Per-app UPI intent links.
 * Google Pay frequently refuses generic `upi://` intents opened from a browser
 * ("Unable to make the payment at this moment") as an anti-fraud measure,
 * especially to person VPAs. Each app's own scheme is far more reliable;
 * `upi://pay` stays as the generic fallback for other UPI apps.
 */
export function upiAppLinks(options) {
    const qs = buildUpiQuery(options);
    return [
        { label: 'Google Pay', href: `tez://upi/pay?${qs}` },
        { label: 'PhonePe', href: `phonepe://pay?${qs}` },
        { label: 'Paytm', href: `paytmmp://pay?${qs}` },
        { label: 'Other UPI app', href: `upi://pay?${qs}` },
    ];
}
