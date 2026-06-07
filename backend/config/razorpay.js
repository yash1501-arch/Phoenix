const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const PLACEHOLDER_PATTERNS = [
    /^your[_-]/i,
    /^rzp_test_your/i,
    /^rzp_test_default/i,
    /^replace[_-]/i,
    /xxx+/i,
    /placeholder/i,
];

function isPlaceholder(value) {
    if (typeof value !== 'string') return true;
    if (value.trim().length < 8) return true;
    return PLACEHOLDER_PATTERNS.some((re) => re.test(value));
}

let razorpay = null;

if (!KEY_ID || !KEY_SECRET) {
    console.error('[razorpay] FATAL: RAZORPAY_KEY_ID and/or RAZORPAY_KEY_SECRET are not set in backend/.env. Payment endpoints will return 503.');
} else if (isPlaceholder(KEY_ID) || isPlaceholder(KEY_SECRET)) {
    console.error('[razorpay] FATAL: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET look like placeholders (e.g. "your_razorpay_key_id"). Replace them with real values from https://dashboard.razorpay.com/app/keys. Payment endpoints will return 503 until you do.');
} else {
    razorpay = new Razorpay({
        key_id: KEY_ID,
        key_secret: KEY_SECRET,
    });
    console.log(`[razorpay] initialized successfully (key_id: ${KEY_ID.slice(0, 12)}...)`);
}

function safeTimingEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    } catch {
        return false;
    }
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
    if (!KEY_SECRET || isPlaceholder(KEY_SECRET)) return false;
    const expected = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return safeTimingEqual(expected, signature);
}

function isRazorpayConfigured() {
    return Boolean(razorpay);
}

module.exports = razorpay;
module.exports.verifyRazorpaySignature = verifyRazorpaySignature;
module.exports.safeTimingEqual = safeTimingEqual;
module.exports.isRazorpayConfigured = isRazorpayConfigured;
module.exports.isPlaceholder = isPlaceholder;
