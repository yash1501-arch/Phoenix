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

export function getRazorpayKeyId() {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key) {
        throw new Error(
            'VITE_RAZORPAY_KEY_ID is not set. Add it to frontend/.env — ' +
            'get your key from https://dashboard.razorpay.com/app/keys'
        );
    }
    if (isPlaceholder(key)) {
        throw new Error(
            `VITE_RAZORPAY_KEY_ID looks like a placeholder ("${key}"). ` +
            'Replace it with a real key from https://dashboard.razorpay.com/app/keys'
        );
    }
    return key;
}

export const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};
