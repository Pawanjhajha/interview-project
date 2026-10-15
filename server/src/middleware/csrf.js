const { clientUrl } = require('../config/env');
const AppError = require('../utils/AppError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const allowedOrigin = new URL(clientUrl).origin;

// Defense in depth on top of SameSite=Lax and the CORS allowlist: browsers always send
// Origin on cross-origin state-changing requests, so reject any that isn't our client.
// Requests with no Origin (curl, server-to-server) can't be forged by a victim's browser.
const requireSameOrigin = (req, res, next) => {
  const { origin } = req.headers;
  if (SAFE_METHODS.has(req.method) || !origin || origin === allowedOrigin) return next();
  next(new AppError('Cross-site request blocked', 403));
};

module.exports = { requireSameOrigin };
