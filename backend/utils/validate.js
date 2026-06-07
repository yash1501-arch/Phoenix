// Lightweight request validation helper (no external deps)

const isString = (v) => typeof v === 'string';
const isNonEmpty = (v) => isString(v) && v.trim().length > 0;
const isEmail = (v) => isString(v) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isPositiveNumber = (v) => isNumber(v) && v >= 0;
const isInt = (v) => Number.isInteger(v);
const isIn = (v, list) => list.includes(v);
const isDate = (v) => isString(v) && !Number.isNaN(new Date(v).getTime());

const check = (field, value, validators) => {
    for (const v of validators) {
        const r = v(value);
        if (r !== true) {
            return { field, message: typeof r === 'string' ? r : `Invalid ${field}` };
        }
    }
    return null;
};

const validate = (rules, data) => {
    const errors = [];
    for (const [field, validators] of Object.entries(rules)) {
        if (validators.optional && (data[field] === undefined || data[field] === null || data[field] === '')) {
            continue;
        }
        const err = check(field, data[field], validators.checks || [validators]);
        if (err) errors.push(err);
    }
    return errors;
};

// Common validators
const v = {
    required: (msg) => (val) => isNonEmpty(val) ? true : (msg || 'Required'),
    email: (msg) => (val) => isEmail(val) ? true : (msg || 'Invalid email'),
    number: (msg) => (val) => isNumber(val) ? true : (msg || 'Must be a number'),
    positiveNumber: (msg) => (val) => isPositiveNumber(val) ? true : (msg || 'Must be ≥ 0'),
    int: (msg) => (val) => isInt(val) ? true : (msg || 'Must be an integer'),
    minLength: (n, msg) => (val) => isString(val) && val.length >= n ? true : (msg || `Min length ${n}`),
    maxLength: (n, msg) => (val) => isString(val) && val.length <= n ? true : (msg || `Max length ${n}`),
    inList: (list, msg) => (val) => isIn(val, list) ? true : (msg || `Must be one of: ${list.join(', ')}`),
    date: (msg) => (val) => isDate(val) ? true : (msg || 'Invalid date'),
    futureDate: (msg) => (val) => isDate(val) && new Date(val) >= new Date(new Date().toDateString()) ? true : (msg || 'Must be future date'),
    isIn: isIn,
    isString,
};

// Express middleware factory
const validateBody = (rules) => (req, res, next) => {
    const errors = validate(rules, req.body || {});
    if (errors.length > 0) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    next();
};

module.exports = { validate, validateBody, v };
