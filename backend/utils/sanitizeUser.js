/**
 * Strip sensitive fields from user objects before sending to clients.
 */
function sanitizeUser(user) {
  if (!user) return user;
  const {
    password,
    totp_secret,
    ...safe
  } = user;
  return {
    ...safe,
    id: safe._id || safe.id,
  };
}

module.exports = { sanitizeUser };
