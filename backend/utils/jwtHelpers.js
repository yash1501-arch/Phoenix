const jwt = require('jsonwebtoken');
const { isStaffRole } = require('./roles');

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return secret;
};

/** Absolute TTL: staff 24h, members 7d. Idle is enforced separately. */
const getTokenExpiry = (role) => (isStaffRole(role) ? '24h' : '7d');

const buildUserPayload = (user) => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  session_version: user.session_version ?? 0,
});

const signAuthToken = (user, options = {}) => {
  const payload = {
    user: buildUserPayload(user),
    act: options.act || Date.now(),
  };
  const expiresIn = options.expiresIn || getTokenExpiry(user.role);
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
};

module.exports = {
  getJwtSecret,
  getTokenExpiry,
  buildUserPayload,
  signAuthToken,
};
