const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return secret;
};

const getTokenExpiry = (role) => (role === 'admin' ? '24h' : '7d');

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  session_version: user.session_version ?? 0,
});

const signAuthToken = (user) => {
  const payload = { user: buildUserPayload(user) };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: getTokenExpiry(user.role) });
};

module.exports = {
  getJwtSecret,
  getTokenExpiry,
  buildUserPayload,
  signAuthToken,
};
