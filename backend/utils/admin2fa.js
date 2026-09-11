/**
 * Admin TOTP / 2FA policy helpers.
 *
 * ADMIN_REQUIRE_2FA=true  → setup is mandatory; login challenges when enabled
 * ADMIN_REQUIRE_2FA=false → optional (default for now); no setup gate / no login challenge
 */
function isAdmin2faRequired() {
  return String(process.env.ADMIN_REQUIRE_2FA || '').toLowerCase() === 'true';
}

function adminHas2fa(user) {
  return Boolean(user?.totp_enabled && user?.totp_secret);
}

/** Opt-in TOTP for any role (user / clerk / admin). */
const userHas2fa = adminHas2fa;

module.exports = { isAdmin2faRequired, adminHas2fa, userHas2fa };
