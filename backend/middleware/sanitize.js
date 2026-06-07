const xss = require('xss');

const whitelist = {
  br: [],
  b: [],
  i: [],
  em: [],
  strong: [],
  a: ['href', 'title', 'target', 'rel'],
  ul: [],
  ol: [],
  li: [],
  p: [],
  span: [],
};

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return xss(value, { whiteList: whitelist, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] });
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = sanitizeObject(req.query);
    // Reassign properties instead of replacing the whole query object
    // to avoid breaking Express internals (it has getters).
    for (const key of Object.keys(req.query)) {
      delete req.query[key];
    }
    Object.assign(req.query, sanitizedQuery);
  }
  if (req.params && typeof req.params === 'object') {
    const sanitizedParams = sanitizeObject(req.params);
    for (const key of Object.keys(req.params)) {
      delete req.params[key];
    }
    Object.assign(req.params, sanitizedParams);
  }
  next();
};

module.exports = sanitizeMiddleware;
