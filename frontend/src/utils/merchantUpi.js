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

export function merchantUpiLink({ amount, note }) {
    const params = new URLSearchParams({
        pa: MERCHANT_UPI_ID,
        pn: MERCHANT_PAYEE_NAME,
        am: Number(amount).toFixed(2),
        cu: 'INR',
        tn: String(note || ''),
    });
    return `upi://pay?${params.toString()}`;
}
