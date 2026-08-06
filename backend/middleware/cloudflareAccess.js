const { createRemoteJWKSet, jwtVerify } = require('jose');
const logger = require('../utils/logger');

let jwks;
let jwksTeam;

function getJwks(teamDomain) {
  if (!jwks || jwksTeam !== teamDomain) {
    jwks = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`)
    );
    jwksTeam = teamDomain;
  }
  return jwks;
}

/**
 * Verify Cloudflare Access JWT when API is behind Zero Trust.
 * Set CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD in production.
 */
async function verifyCloudflareAccessToken(token) {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  const audience = process.env.CF_ACCESS_AUD;
  if (!teamDomain || !audience || !token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience,
    });
    return payload;
  } catch (err) {
    logger.warn('Cloudflare Access JWT verification failed:', err.message);
    return null;
  }
}

/**
 * When REQUIRE_CF_ACCESS=true, admin routes need a valid Cf-Access-Jwt-Assertion
 * unless the request is from localhost in development.
 */
const requireCloudflareAccess = async (req, res, next) => {
  if (process.env.REQUIRE_CF_ACCESS !== 'true') {
    return next();
  }

  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const token = req.header('Cf-Access-Jwt-Assertion');
  const payload = await verifyCloudflareAccessToken(token);
  if (!payload) {
    return res.status(403).json({
      success: false,
      message: 'Cloudflare Access authentication required',
    });
  }

  req.cfAccess = {
    email: payload.email,
    sub: payload.sub,
  };
  return next();
};

module.exports = {
  verifyCloudflareAccessToken,
  requireCloudflareAccess,
};
