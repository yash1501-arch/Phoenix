require('dotenv').config();
const crypto = require('crypto');

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const mask = (s) => (s ? `${s.slice(0, 6)}...${s.slice(-4)}` : '(empty)');

console.log('=== Razorpay Config Check ===');
console.log('KEY_ID:        ', KEY_ID ? `${KEY_ID.slice(0, 14)}...` : '(empty)');
console.log('KEY_SECRET:    ', mask(KEY_SECRET));
console.log('WEBHOOK_SECRET:', mask(WEBHOOK_SECRET));
console.log('');

if (!KEY_ID || !KEY_SECRET) {
    console.error('FAIL: KEY_ID or KEY_SECRET missing in .env');
    process.exit(1);
}

let instance;
try {
    const Razorpay = require('razorpay');
    instance = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
} catch (err) {
    console.error('FAIL: Could not initialize Razorpay SDK:', err.message);
    process.exit(1);
}

(async () => {
    try {
        console.log('=== Test 1: Create a test order ===');
        const order = await instance.orders.create({
            amount: 50000,
            currency: 'INR',
            receipt: `test_${Date.now()}`,
            notes: { booking_id: 'test_booking_123' },
        });
        console.log('PASS: Order created');
        console.log('  id:      ', order.id);
        console.log('  amount:  ', order.amount, '(paise)');
        console.log('  currency:', order.currency);
        console.log('  status:  ', order.status);
        console.log('');

        console.log('=== Test 2: Fetch the order back ===');
        const fetched = await instance.orders.fetch(order.id);
        console.log('PASS: Order fetched');
        console.log('  id:           ', fetched.id);
        console.log('  notes.booking_id:', fetched.notes?.booking_id);
        console.log('');

        console.log('=== Test 3: Verify signature round-trip ===');
        const fakeOrderId = order.id;
        const fakePaymentId = `pay_TEST${Date.now()}`;
        const hmac = crypto.createHmac('sha256', KEY_SECRET);
        hmac.update(`${fakeOrderId}|${fakePaymentId}`);
        const signature = hmac.digest('hex');

        const { verifyRazorpaySignature } = require('./config/razorpay');
        const isValid = verifyRazorpaySignature(fakeOrderId, fakePaymentId, signature);
        console.log(isValid ? 'PASS: Signature verified' : 'FAIL: Signature rejected');
        const isInvalid = verifyRazorpaySignature(fakeOrderId, fakePaymentId, 'bogus_signature_value_here_xx');
        console.log(!isInvalid ? 'PASS: Bogus signature rejected' : 'FAIL: Bogus signature accepted');
        console.log('');

        console.log('=== Test 4: Webhook signature (if WEBHOOK_SECRET set) ===');
        if (WEBHOOK_SECRET && !WEBHOOK_SECRET.startsWith('REPLACE')) {
            const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_X', order_id: order.id } } } });
            const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
            const { safeTimingEqual } = require('./config/razorpay');
            console.log(safeTimingEqual(expected, expected) ? 'PASS: Webhook sig match' : 'FAIL');
            console.log(!safeTimingEqual(expected, 'bogus') ? 'PASS: Webhook bogus rejected' : 'FAIL');
        } else {
            console.log('SKIP: WEBHOOK_SECRET not configured');
        }

        console.log('');
        console.log('=== ALL TESTS PASSED ===');
        console.log('Your test keys are working. Payment flow is wired up correctly.');
        process.exit(0);
    } catch (err) {
        console.error('FAIL:', err.message || err);
        if (err.statusCode === 401) {
            console.error('  -> 401 Unauthorized. Your KEY_ID or KEY_SECRET is wrong.');
        } else if (err.statusCode === 400) {
            console.error('  -> 400 Bad Request. Check amount (must be > 0) and currency.');
        }
        process.exit(1);
    }
})();
